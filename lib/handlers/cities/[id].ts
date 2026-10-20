import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredCity } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "City Corporation ID is required" });
    }

    if (req.method === "GET") {
      try {
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

        if (city) return res.status(200).json(city);
      } catch (e: any) {
        console.warn("[City ID GET Notice] Fallback to memory store:", e.message);
      }

      const memCity = memoryDb.cities.find((c: StoredCity) => c.id === id || c.code === id);
      if (!memCity) {
        return res.status(404).json({ error: "City Corporation not found" });
      }

      return res.status(200).json({
        ...memCity,
        wards: memoryDb.wards.filter((w: any) => w.cityCorpId === memCity.id),
        admins: memoryDb.users.filter((u: any) => u.cityCorpId === memCity.id),
      });
    }

    if (req.method === "PUT") {
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

      let updatedCity: any = null;

      // 1. Try Prisma DB update
      try {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code.toUpperCase();
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (active !== undefined) updateData.active = Boolean(active);
        if (pointRate !== undefined) updateData.pointRate = Number(pointRate);
        if (minWithdrawPoints !== undefined) updateData.minWithdrawPoints = Number(minWithdrawPoints);
        if (rewardActive !== undefined) updateData.rewardActive = Boolean(rewardActive);

        updatedCity = await prisma.cityCorporation.update({
          where: { id },
          data: updateData,
        });
      } catch (dbErr: any) {
        console.warn("[City Update Notice] Fallback to memory store:", dbErr.message);
      }

      // 2. Update memory store
      const idx = memoryDb.cities.findIndex((c: StoredCity) => c.id === id || c.code === id);
      if (idx >= 0) {
        memoryDb.cities[idx] = {
          ...memoryDb.cities[idx],
          ...(name !== undefined ? { name } : {}),
          ...(code !== undefined ? { code: code.toUpperCase() } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(active !== undefined ? { active: Boolean(active) } : {}),
          ...(pointRate !== undefined ? { pointRate: Number(pointRate) } : {}),
          ...(minWithdrawPoints !== undefined ? { minWithdrawPoints: Number(minWithdrawPoints) } : {}),
          ...(rewardActive !== undefined ? { rewardActive: Boolean(rewardActive) } : {}),
        };
        updatedCity = memoryDb.cities[idx];
      }

      return res.status(200).json(updatedCity || { success: true });
    }

    if (req.method === "DELETE") {
      try {
        await prisma.cityCorporation.delete({ where: { id } });
      } catch (dbErr: any) {}

      memoryDb.cities = memoryDb.cities.filter((c: StoredCity) => c.id !== id);
      return res.status(200).json({ message: "City Corporation deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
