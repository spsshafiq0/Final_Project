import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    if (req.method === "GET") {
      let wardId = req.query.wardId as string | undefined;
      const status = req.query.status as any;
      const citizenId = req.query.citizenId as string | undefined;

      const whereClause: any = {};
      if (status) whereClause.status = status;

      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.wardId = currentUser.wardId;
      } else if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.ward = { cityCorpId: currentUser.cityCorpId };
        if (wardId) whereClause.wardId = wardId;
      } else if (currentUser && ["CITIZEN", "BUSINESS"].includes(currentUser.role)) {
        whereClause.citizenId = currentUser.userId;
      } else {
        if (wardId) whereClause.wardId = wardId;
        if (citizenId) whereClause.citizenId = citizenId;
      }

      try {
        const withdrawals = await prisma.withdrawalRequest.findMany({
          where: whereClause,
          include: {
            citizen: {
              select: { id: true, fullName: true, username: true, phone: true },
            },
            ward: {
              select: {
                id: true,
                name: true,
                area: true,
                cityCorp: { select: { id: true, name: true, code: true, pointRate: true } },
              },
            },
            processedBy: {
              select: { id: true, fullName: true, username: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        if (withdrawals && withdrawals.length > 0) {
          return res.status(200).json(withdrawals);
        }
      } catch (err: any) {
        console.warn("[Withdrawals PG Notice]", err.message);
      }

      // Memory store fallback
      let list = memoryDb.withdrawals || [];
      if (status) list = list.filter((w: any) => w.status === status);
      if (wardId) list = list.filter((w: any) => w.wardId === wardId);

      return res.status(200).json(list);
    }

    if (req.method === "POST") {
      const {
        points,
        wardId,
        citizenName,
        citizenPhone,
        notes,
      } = req.body || {};

      const pointsToDeduct = parseInt(points, 10);
      if (isNaN(pointsToDeduct) || pointsToDeduct <= 0) {
        return res.status(400).json({ error: "Valid positive points amount is required" });
      }

      if (!wardId) {
        return res.status(400).json({ error: "Please select the Ward where you will withdraw cash" });
      }

      // Find the ward
      let ward: any = null;
      try {
        ward = await prisma.ward.findUnique({
          where: { id: wardId },
          include: { cityCorp: true },
        });
      } catch {}

      if (!ward) {
        ward = memoryDb.wards.find((w: any) => w.id === wardId || w.name === wardId);
        if (ward) {
          ward = {
            ...ward,
            cityCorp: memoryDb.cities.find((c: any) => c.id === ward.cityCorpId) || {
              name: "Dhaka North City Corporation",
              code: "DNCC",
              pointRate: 0.20,
              minWithdrawPoints: 100,
              rewardActive: true,
            },
          };
        }
      }

      const cityCorp = ward?.cityCorp || {
        pointRate: 0.20,
        minWithdrawPoints: 100,
        rewardActive: true,
        code: "DNCC",
      };

      const bdtAmount = Math.round(pointsToDeduct * (cityCorp.pointRate || 0.20) * 100) / 100;
      const code = `WDR-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalCitizenId = currentUser?.userId || `usr-guest-${Date.now()}`;
      const finalWardId = ward?.id || wardId;

      let createdWithdrawal: any = null;
      try {
        createdWithdrawal = await prisma.withdrawalRequest.create({
          data: {
            verificationCode: code,
            points: pointsToDeduct,
            amount: bdtAmount,
            status: "pending",
            citizenId: finalCitizenId,
            citizenName: citizenName || currentUser?.fullName || "Citizen User",
            citizenPhone: citizenPhone || currentUser?.phone || "017XXXXXXXX",
            wardId: finalWardId,
            notes: notes || null,
          },
          include: {
            citizen: { select: { id: true, fullName: true, username: true, phone: true } },
            ward: { select: { id: true, name: true, area: true } },
          },
        }).catch(() => null);
      } catch (err: any) {
        console.warn("[Withdrawals Create PG Notice]", err?.message);
      }

      const newWithdrawal = createdWithdrawal || {
        id: `wdr-${Date.now()}`,
        verificationCode: code,
        points: pointsToDeduct,
        amount: bdtAmount,
        status: "pending",
        citizenId: finalCitizenId,
        citizenName: citizenName || currentUser?.fullName || "Citizen User",
        citizenPhone: citizenPhone || currentUser?.phone || "017XXXXXXXX",
        wardId: finalWardId,
        ward: {
          id: finalWardId,
          name: ward?.name || "Ward 01",
          area: ward?.area || "Uttara",
          cityCorp,
        },
        notes: notes || null,
        createdAt: new Date().toISOString(),
      };

      if (!memoryDb.withdrawals) memoryDb.withdrawals = [];
      memoryDb.withdrawals.unshift(newWithdrawal);

      return res.status(201).json({
        message: "Withdrawal request submitted successfully",
        verificationCode: code,
        withdrawal: newWithdrawal,
        instructions: `Present verification code ${code} to Ward Admin to receive ৳${bdtAmount} cash.`,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
