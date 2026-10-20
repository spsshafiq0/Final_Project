import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword } from "../../auth";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredUser } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id },
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
          cityCorp: true,
          ward: true,
          createdAt: true,
        },
      });
    } catch {}

    if (!user) {
      user = memoryDb.users.find((u: StoredUser) => u.id === id || u.username === id);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.method === "GET") {
      return res.status(200).json(user);
    }

    if (req.method === "PUT") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isSelf = currentUser?.userId === id || currentUser?.username === user.username;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && currentUser?.cityCorpId && user.cityCorpId === currentUser.cityCorpId;
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId && user.wardId === currentUser.wardId;

      if (!isSuper && !isSelf && !isCityAdmin && !isWardAdmin) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to modify this user account" });
      }

      const {
        fullName,
        email,
        phone,
        password,
        active,
        role,
        cityCorpId,
        wardId,
      } = req.body || {};

      // Privilege escalation protection: Only Super Admin can assign/change admin roles
      if (role && role !== user.role && !isSuper) {
        return res.status(403).json({ error: "Forbidden: Only Super Admin can change account roles" });
      }

      let hashedPassword: string | undefined;
      if (password) {
        if (typeof password !== "string" || password.length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }
        hashedPassword = await hashPassword(password);
      }

      if (fullName) user.fullName = fullName;
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (hashedPassword) user.password = hashedPassword;
      if (active !== undefined && (isSuper || isCityAdmin)) user.active = Boolean(active);
      if (role && isSuper) user.role = role;
      if (cityCorpId !== undefined && isSuper) user.cityCorpId = cityCorpId;
      if (wardId !== undefined && (isSuper || isCityAdmin)) user.wardId = wardId;

      // Update in memory store
      const memUserIdx = memoryDb.users.findIndex((u: StoredUser) => u.id === id || u.username === id);
      if (memUserIdx >= 0) {
        if (fullName) memoryDb.users[memUserIdx].fullName = fullName;
        if (email !== undefined) memoryDb.users[memUserIdx].email = email;
        if (phone !== undefined) memoryDb.users[memUserIdx].phone = phone;
        if (hashedPassword) memoryDb.users[memUserIdx].password = hashedPassword;
        if (active !== undefined && (isSuper || isCityAdmin)) memoryDb.users[memUserIdx].active = Boolean(active);
        if (role && isSuper) memoryDb.users[memUserIdx].role = role;
        if (cityCorpId !== undefined && isSuper) memoryDb.users[memUserIdx].cityCorpId = cityCorpId;
        if (wardId !== undefined && (isSuper || isCityAdmin)) memoryDb.users[memUserIdx].wardId = wardId;
      }

      try {
        await prisma.user.update({
          where: { id },
          data: {
            ...(fullName && { fullName }),
            ...(email !== undefined && { email }),
            ...(phone !== undefined && { phone }),
            ...(hashedPassword && { password: hashedPassword }),
            ...(active !== undefined && (isSuper || isCityAdmin) && { active: Boolean(active) }),
            ...(role && isSuper && { role }),
            ...(cityCorpId !== undefined && isSuper && { cityCorpId }),
            ...(wardId !== undefined && (isSuper || isCityAdmin) && { wardId }),
          },
        }).catch(() => null);
      } catch {}

      return res.status(200).json(user);
    }

    if (req.method === "DELETE") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && currentUser?.cityCorpId && user.cityCorpId === currentUser.cityCorpId;

      if (!isSuper && !isCityAdmin) {
        return res.status(403).json({ error: "Forbidden: Only administrators can delete users" });
      }

      if (user.role === "SUPER_ADMIN") {
        return res.status(403).json({ error: "Forbidden: Super Admin accounts cannot be deleted" });
      }

      try {
        await prisma.user.delete({ where: { id } }).catch(() => null);
      } catch {}

      memoryDb.users = memoryDb.users.filter((u: StoredUser) => u.id !== id);
      return res.status(200).json({ message: "User deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { requireAuth: true, allowedMethods: ["GET", "PUT", "DELETE"] }
);
