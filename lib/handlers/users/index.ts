import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword } from "../../auth";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    if (req.method === "GET") {
      if (!currentUser || !["SUPER_ADMIN", "CITY_ADMIN", "WARD_ADMIN"].includes(currentUser.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const role = req.query.role as any;
      let cityCorpId = req.query.cityCorpId as string | undefined;
      let wardId = req.query.wardId as string | undefined;

      const whereClause: any = {};
      if (role) whereClause.role = role;

      if (currentUser.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.OR = [
          { cityCorpId: currentUser.cityCorpId },
          { ward: { cityCorpId: currentUser.cityCorpId } },
        ];
      } else if (currentUser.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.wardId = currentUser.wardId;
      } else {
        if (cityCorpId) whereClause.cityCorpId = cityCorpId;
        if (wardId) whereClause.wardId = wardId;
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          nid: true,
          address: true,
          role: true,
          active: true,
          cityCorpId: true,
          cityCorp: {
            select: { id: true, name: true, code: true },
          },
          wardId: true,
          ward: {
            select: { id: true, name: true, area: true },
          },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(users);
    }

    if (req.method === "POST") {
      if (!currentUser || !["SUPER_ADMIN", "CITY_ADMIN"].includes(currentUser.role)) {
        return res.status(403).json({ error: "Only Super Admin or City Corp Admin can create staff/admin accounts" });
      }

      const {
        username,
        password,
        fullName,
        email,
        phone,
        nid,
        address,
        role,
        cityCorpId,
        wardId,
      } = req.body || {};

      if (!username || !password || !fullName || !role) {
        return res.status(400).json({ error: "Username, password, full name, and role are required" });
      }

      // Hierarchy validation:
      if (role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin can create another Super Admin" });
      }

      if (role === "CITY_ADMIN") {
        if (currentUser.role !== "SUPER_ADMIN") {
          return res.status(403).json({ error: "Only Super Admin can create City Admins" });
        }
        if (!cityCorpId) {
          return res.status(400).json({ error: "cityCorpId is required for City Admin" });
        }
      }

      if (role === "WARD_ADMIN") {
        if (currentUser.role === "CITY_ADMIN") {
          // Verify ward belongs to City Admin's city
          if (!wardId) {
            return res.status(400).json({ error: "wardId is required for Ward Admin" });
          }
          const ward = await prisma.ward.findUnique({ where: { id: wardId } });
          if (!ward || ward.cityCorpId !== currentUser.cityCorpId) {
            return res.status(403).json({ error: "You can only assign admins to wards in your City Corporation" });
          }
        }
      }

      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          fullName,
          email: email || null,
          phone: phone || null,
          nid: nid || null,
          address: address || null,
          role,
          cityCorpId: cityCorpId || null,
          wardId: wardId || null,
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          active: true,
          cityCorpId: true,
          wardId: true,
        },
      });

      return res.status(201).json(user);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { requireAuth: true, allowedMethods: ["GET", "POST"] }
);
