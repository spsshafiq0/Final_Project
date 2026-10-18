import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "City Corporation ID is required" });
    }

    if (req.method === "GET") {
      const city = await prisma.cityCorporation.findUnique({
        where: { id },
        include: {
          wards: {
            include: {
              _count: {
                select: { bins: true, tracks: true, admins: true, withdrawals: true },
              },
            },
          },
          admins: {
            select: { id: true, username: true, fullName: true, role: true, email: true, phone: true },
          },
        },
      });

      if (!city) {
        return res.status(404).json({ error: "City Corporation not found" });
      }

      return res.status(200).json(city);
    }

    if (req.method === "PUT") {
      if (!currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const isSuper = currentUser.role === "SUPER_ADMIN";
      const isCityAdminForThis = currentUser.role === "CITY_ADMIN" && currentUser.cityCorpId === id;

      if (!isSuper && !isCityAdminForThis) {
        return res.status(403).json({ error: "You can only manage your own City Corporation settings" });
      }

      const {
        name,
        code,
        address,
        phone,
        email,
        active,
        pointRate,
        minWithdrawPoints,
        rewardActive,
      } = req.body || {};

      const updateData: any = {};

      // Only Super Admin can change name, code, or active status
      if (isSuper) {
        if (name) updateData.name = name;
        if (code) updateData.code = code.toUpperCase();
        if (active !== undefined) updateData.active = Boolean(active);
      }

      // Both Super Admin & City Admin can update contact info and Point-to-Money conversion policy
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (pointRate !== undefined) updateData.pointRate = parseFloat(pointRate);
      if (minWithdrawPoints !== undefined) updateData.minWithdrawPoints = parseInt(minWithdrawPoints, 10);
      if (rewardActive !== undefined) updateData.rewardActive = Boolean(rewardActive);

      const updated = await prisma.cityCorporation.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin can delete City Corporations" });
      }

      await prisma.cityCorporation.delete({
        where: { id },
      });

      return res.status(200).json({ message: "City Corporation deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
