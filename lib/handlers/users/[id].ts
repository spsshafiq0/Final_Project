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

      let hashedPassword: string | undefined;
      if (password) {
        hashedPassword = await hashPassword(password);
      }

      if (fullName) user.fullName = fullName;
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (hashedPassword) user.password = hashedPassword;
      if (active !== undefined) user.active = Boolean(active);
      if (role) user.role = role;
      if (cityCorpId !== undefined) user.cityCorpId = cityCorpId;
      if (wardId !== undefined) user.wardId = wardId;

      // Update in memory store
      const memUserIdx = memoryDb.users.findIndex((u: StoredUser) => u.id === id || u.username === id);
      if (memUserIdx >= 0) {
        if (fullName) memoryDb.users[memUserIdx].fullName = fullName;
        if (email !== undefined) memoryDb.users[memUserIdx].email = email;
        if (phone !== undefined) memoryDb.users[memUserIdx].phone = phone;
        if (hashedPassword) memoryDb.users[memUserIdx].password = hashedPassword;
        if (active !== undefined) memoryDb.users[memUserIdx].active = Boolean(active);
        if (role) memoryDb.users[memUserIdx].role = role;
        if (cityCorpId !== undefined) memoryDb.users[memUserIdx].cityCorpId = cityCorpId;
        if (wardId !== undefined) memoryDb.users[memUserIdx].wardId = wardId;
      }

      try {
        await prisma.user.update({
          where: { id },
          data: {
            ...(fullName && { fullName }),
            ...(email !== undefined && { email }),
            ...(phone !== undefined && { phone }),
            ...(hashedPassword && { password: hashedPassword }),
            ...(active !== undefined && { active: Boolean(active) }),
            ...(role && { role }),
            ...(cityCorpId !== undefined && { cityCorpId }),
            ...(wardId !== undefined && { wardId }),
          },
        }).catch(() => null);
      } catch {}

      return res.status(200).json(user);
    }

    if (req.method === "DELETE") {
      try {
        await prisma.user.delete({ where: { id } }).catch(() => null);
      } catch {}

      memoryDb.users = memoryDb.users.filter((u: StoredUser) => u.id !== id);
      return res.status(200).json({ message: "User deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { requireAuth: false, allowedMethods: ["GET", "PUT", "DELETE"] }
);
