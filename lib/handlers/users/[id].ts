import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword } from "../../auth";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (req.method === "GET") {
      const user = await prisma.user.findUnique({
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

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json(user);
    }

    if (req.method === "PUT") {
      if (!currentUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Can update self or must be SUPER_ADMIN / CITY_ADMIN
      const isSelf = currentUser.userId === id;
      const isAdmin = ["SUPER_ADMIN", "CITY_ADMIN"].includes(currentUser.role);

      if (!isSelf && !isAdmin) {
        return res.status(403).json({ error: "Forbidden: You cannot modify this user" });
      }

      const {
        fullName,
        email,
        phone,
        nid,
        address,
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

      const updateData: any = {
        ...(fullName && { fullName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(nid !== undefined && { nid }),
        ...(address !== undefined && { address }),
        ...(hashedPassword && { password: hashedPassword }),
      };

      // Only admins can change role, active status, cityCorpId, wardId
      if (isAdmin) {
        if (active !== undefined) updateData.active = Boolean(active);
        if (role && currentUser.role === "SUPER_ADMIN") updateData.role = role;
        if (cityCorpId !== undefined && currentUser.role === "SUPER_ADMIN") updateData.cityCorpId = cityCorpId;
        if (wardId !== undefined) updateData.wardId = wardId;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
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

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin can delete users" });
      }

      await prisma.user.delete({
        where: { id },
      });

      return res.status(200).json({ message: "User deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { requireAuth: true, allowedMethods: ["GET", "PUT", "DELETE"] }
);
