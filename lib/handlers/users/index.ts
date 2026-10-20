import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword } from "../../auth";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { sendWelcomeCredentialsEmail } from "../../email";
import { memoryDb, StoredUser } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List Users ────────────────────────────────────────────────
    if (req.method === "GET") {
      const role = req.query.role as any;
      let cityCorpId = req.query.cityCorpId as string | undefined;
      let wardId = req.query.wardId as string | undefined;

      const whereClause: any = {};
      if (role) whereClause.role = role;

      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.OR = [
          { cityCorpId: currentUser.cityCorpId },
          { ward: { cityCorpId: currentUser.cityCorpId } },
        ];
      } else if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.wardId = currentUser.wardId;
      } else {
        if (cityCorpId) whereClause.cityCorpId = cityCorpId;
        if (wardId) whereClause.wardId = wardId;
      }

      try {
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
            cityCorp: { select: { id: true, name: true, code: true } },
            wardId: true,
            ward: { select: { id: true, name: true, area: true } },
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        if (users && users.length > 0) {
          return res.status(200).json(users);
        }
      } catch (e: any) {
        console.warn("[Users GET Notice] Fallback to memory store:", e.message);
      }

      // Fallback to memory store
      let memUsers = [...memoryDb.users];
      if (role) memUsers = memUsers.filter((u: StoredUser) => u.role === role);
      if (cityCorpId) memUsers = memUsers.filter((u: StoredUser) => u.cityCorpId === cityCorpId);
      if (wardId) memUsers = memUsers.filter((u: StoredUser) => u.wardId === wardId);

      const sanitized = memUsers.map((u: StoredUser) => {
        const city = memoryDb.cities.find((c: any) => c.id === u.cityCorpId);
        const ward = memoryDb.wards.find((w: any) => w.id === u.wardId);
        return {
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          nid: u.nid,
          address: u.address,
          role: u.role,
          active: u.active,
          cityCorpId: u.cityCorpId,
          cityCorp: city ? { id: city.id, name: city.name, code: city.code } : null,
          wardId: u.wardId,
          ward: ward ? { id: ward.id, name: ward.name, area: ward.area } : null,
          createdAt: u.createdAt,
        };
      });

      return res.status(200).json(sanitized);
    }

    // ── POST: Create User (Sub-Admin, Driver, Citizen, etc.) ────────────
    if (req.method === "POST") {
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

      const cleanUsername = String(username).toLowerCase().trim();
      const hashedPassword = await hashPassword(password);
      const assignedCityCorpId = cityCorpId || (currentUser?.cityCorpId || null);
      const assignedWardId = wardId || (currentUser?.wardId || null);

      let createdUser: any = null;

      // 1. Try Prisma DB
      try {
        const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
        if (existing) {
          return res.status(409).json({ error: "Username already exists" });
        }

        createdUser = await prisma.user.create({
          data: {
            username: cleanUsername,
            password: hashedPassword,
            fullName,
            email: email || null,
            phone: phone || null,
            nid: nid || null,
            address: address || null,
            role,
            cityCorpId: assignedCityCorpId,
            wardId: assignedWardId,
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
      } catch (dbErr: any) {
        console.warn("[User Create Notice] Fallback to memory store:", dbErr.message);
      }

      // 2. Also save to resilient memory store
      const userId = createdUser?.id || `usr-${Date.now()}`;
      const memUser: StoredUser = {
        id: userId,
        username: cleanUsername,
        password: hashedPassword,
        fullName,
        email: email || null,
        phone: phone || null,
        nid: nid || null,
        address: address || null,
        role,
        cityCorpId: assignedCityCorpId,
        wardId: assignedWardId,
        active: true,
        points: 0,
        createdAt: new Date().toISOString(),
      };

      if (!memoryDb.users.some((u: StoredUser) => u.username === cleanUsername)) {
        memoryDb.users.push(memUser);
      }

      // 3. Send automated welcome email with credentials via Brevo
      if (email && email.includes("@")) {
        sendWelcomeCredentialsEmail({
          email,
          fullName,
          username: cleanUsername,
          password,
          role,
        }).catch((err) => console.error("[Brevo Welcome Email Error]", err.message));
      }

      return res.status(201).json(createdUser || {
        id: memUser.id,
        username: memUser.username,
        fullName: memUser.fullName,
        email: memUser.email,
        phone: memUser.phone,
        role: memUser.role,
        active: memUser.active,
        cityCorpId: memUser.cityCorpId,
        wardId: memUser.wardId,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
