import type { VercelResponse } from "@vercel/node";
import prisma from "../../lib/prisma";
import { apiHandler, AuthenticatedRequest } from "../../lib/middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser) => {
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

      return res.status(200).json(withdrawals);
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

      // Find the ward and its city corporation policy
      const ward = await prisma.ward.findUnique({
        where: { id: wardId },
        include: { cityCorp: true },
      });

      if (!ward) {
        return res.status(404).json({ error: "Selected Ward not found" });
      }

      const cityCorp = ward.cityCorp;
      if (!cityCorp.rewardActive) {
        return res.status(400).json({ error: "The cash reward program is currently inactive in this City Corporation" });
      }

      if (pointsToDeduct < cityCorp.minWithdrawPoints) {
        return res.status(400).json({
          error: `Minimum withdrawal for ${cityCorp.code} is ${cityCorp.minWithdrawPoints} points`,
        });
      }

      // Determine citizen
      let citizenUserId = currentUser?.userId;

      if (!citizenUserId) {
        // Guest citizen by phone
        const guestUsername = citizenPhone ? `citizen_${citizenPhone}` : `citizen_${Date.now()}`;
        let guestUser = await prisma.user.findUnique({ where: { username: guestUsername } });
        if (!guestUser) {
          guestUser = await prisma.user.create({
            data: {
              username: guestUsername,
              password: "nopassword",
              fullName: citizenName || "Citizen User",
              phone: citizenPhone || null,
              role: "CITIZEN",
              points: 3000, // Demo starting balance for new guests
            },
          });
        }
        citizenUserId = guestUser.id;
      }

      // Check balance
      const citizenUser = await prisma.user.findUnique({ where: { id: citizenUserId } });
      if (!citizenUser || citizenUser.points < pointsToDeduct) {
        return res.status(400).json({
          error: `Insufficient points balance. Available: ${citizenUser?.points || 0} points`,
        });
      }

      // Calculate BDT amount
      const bdtAmount = Math.round(pointsToDeduct * cityCorp.pointRate * 100) / 100;

      // Unique verification code
      const code = `WDR-${Math.floor(1000 + Math.random() * 9000)}`;

      // Deduct points from user
      await prisma.user.update({
        where: { id: citizenUserId },
        data: { points: { decrement: pointsToDeduct } },
      });

      // Create withdrawal request
      const withdrawal = await prisma.withdrawalRequest.create({
        data: {
          verificationCode: code,
          points: pointsToDeduct,
          amount: bdtAmount,
          status: "pending",
          citizenId: citizenUserId,
          citizenName: citizenName || citizenUser.fullName,
          citizenPhone: citizenPhone || citizenUser.phone,
          wardId: ward.id,
          notes: notes || null,
        },
        include: {
          ward: {
            include: { cityCorp: true },
          },
        },
      });

      return res.status(201).json({
        message: "Withdrawal request submitted successfully",
        withdrawal,
        instructions: `Present verification code ${code} to Ward Admin at ${ward.name} (${ward.area}) to receive ৳${bdtAmount} cash.`,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
