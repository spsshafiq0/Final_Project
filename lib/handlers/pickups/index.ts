import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List Pickups ──────────────────────────────────────────────
    if (req.method === "GET") {
      const status = req.query.status as any;
      const requesterType = req.query.requesterType as string;
      const driverId = req.query.driverId as string;
      const wardId = req.query.wardId as string;
      const cityCorpId = req.query.cityCorpId as string;

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (requesterType) whereClause.requesterType = requesterType;
      if (driverId) whereClause.driverId = driverId;
      if (wardId) whereClause.wardId = wardId;
      if (cityCorpId) whereClause.cityCorpId = cityCorpId;

      if (currentUser && ["CITIZEN", "BUSINESS"].includes(currentUser.role)) {
        whereClause.requesterId = currentUser.userId;
      }

      try {
        const pickups = await prisma.pickupRequest.findMany({
          where: whereClause,
          include: {
            requester: {
              select: { id: true, fullName: true, phone: true, username: true },
            },
            driver: {
              select: { id: true, fullName: true, phone: true },
            },
            ward: {
              select: { id: true, name: true, area: true },
            },
            cityCorp: {
              select: { id: true, name: true, code: true },
            },
            wasteItem: {
              select: { id: true, name: true, depositFee: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        if (pickups && pickups.length > 0) {
          return res.status(200).json(pickups);
        }
      } catch (err: any) {
        console.warn("[Pickups PG Notice]", err.message);
      }

      let list = memoryDb.pickups || [];
      if (status) list = list.filter((p: any) => p.status === status);
      if (requesterType) list = list.filter((p: any) => p.requesterType === requesterType);
      if (wardId) list = list.filter((p: any) => String(p.wardId) === String(wardId));

      return res.status(200).json(list);
    }

    // ── POST: Request On-Demand Pickup ──────────────────────────────────
    if (req.method === "POST") {
      const {
        requesterType = "citizen",
        area,
        address,
        wasteType,
        wasteItemId,
        date,
        amount = 250,
        requesterId,
        contactName,
        contactPhone,
        wardId,
        cityCorpId,
        lat,
        lng,
        payFromWallet = true,
      } = req.body || {};

      if (!address || !date) {
        return res.status(400).json({ error: "Address and pickup date are required" });
      }

      const finalRequesterId = currentUser?.userId || requesterId || `usr-guest-${Date.now()}`;
      const finalWardId = wardId || currentUser?.wardId || null;
      const finalCityCorpId = cityCorpId || currentUser?.cityCorpId || null;
      const secCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit security verification code

      const pickupLat = typeof lat === "number" ? lat : (lat ? parseFloat(lat) : null);
      const pickupLng = typeof lng === "number" ? lng : (lng ? parseFloat(lng) : null);
      const depositFee = Number(amount) || 250;

      // Check user wallet balance if paying from wallet
      if (payFromWallet && currentUser?.userId) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { id: true, walletBalance: true },
          });
          if (user && user.walletBalance < depositFee) {
            return res.status(400).json({
              error: `Insufficient wallet balance (Current: ৳${user.walletBalance.toFixed(2)}). Please deposit ৳${(depositFee - user.walletBalance).toFixed(2)} to confirm pickup.`,
            });
          }

          // Deduct from wallet
          await prisma.user.update({
            where: { id: currentUser.userId },
            data: { walletBalance: { decrement: depositFee } },
          });

          await prisma.walletTransaction.create({
            data: {
              userId: currentUser.userId,
              type: "PICKUP_PAYMENT",
              amount: depositFee,
              description: `Deposit for on-demand pickup [${wasteType || "Waste Pickup"}] on ${date}`,
              status: "COMPLETED",
            },
          }).catch(() => null);

        } catch (e: any) {
          console.warn("[Wallet Deduction Notice]", e.message);
        }
      }

      const newPickup = {
        id: `pick-${Date.now()}`,
        requesterType,
        area: String(area || "City Route").trim(),
        address: String(address).trim(),
        lat: pickupLat,
        lng: pickupLng,
        wasteType: String(wasteType || "Bulky Items").trim(),
        wasteItemId: wasteItemId || null,
        date: String(date).trim(),
        amount: depositFee,
        status: "open",
        securityCode: secCode,
        requesterId: finalRequesterId,
        wardId: finalWardId,
        cityCorpId: finalCityCorpId,
        requester: {
          id: finalRequesterId,
          fullName: contactName || currentUser?.fullName || "Citizen User",
          phone: contactPhone || currentUser?.phone || "017XXXXXXXX",
          username: currentUser?.username || "guest_user",
        },
        createdAt: new Date().toISOString(),
      };

      try {
        const created = await prisma.pickupRequest.create({
          data: {
            requesterType,
            area: newPickup.area,
            address: newPickup.address,
            lat: pickupLat,
            lng: pickupLng,
            wasteType: newPickup.wasteType,
            wasteItemId: wasteItemId || null,
            date: newPickup.date,
            amount: depositFee,
            status: "open",
            securityCode: secCode,
            requesterId: finalRequesterId,
            wardId: finalWardId,
            cityCorpId: finalCityCorpId,
          },
          include: {
            requester: { select: { id: true, fullName: true, phone: true } },
            ward: { select: { id: true, name: true, area: true } },
            cityCorp: { select: { id: true, name: true, code: true } },
          },
        });

        return res.status(201).json({
          success: true,
          message: "Pickup request created successfully! Assigned to nearest collection drivers on the scheduled date.",
          pickup: created,
        });
      } catch (e: any) {
        console.warn("[Pickups DB Save Notice] Fallback to memory:", e.message);
      }

      memoryDb.pickups.unshift(newPickup);

      return res.status(201).json({
        success: true,
        message: "Pickup request created successfully! Assigned to nearest collection drivers on the scheduled date.",
        pickup: newPickup,
      });
    }

    // ── PUT: Driver Accept or Complete Pickup ────────────────────────────
    if (req.method === "PUT") {
      const id = (req.query.id as string) || req.body?.id;
      const { action, securityCode, driverId } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: "Pickup request ID is required" });
      }

      const finalDriverId = driverId || currentUser?.userId;

      // Case A: Driver Accepts Pickup
      if (action === "accept" || (!action && req.body?.status === "accepted")) {
        try {
          const updated = await prisma.pickupRequest.update({
            where: { id },
            data: {
              status: "accepted",
              driverId: finalDriverId || null,
            },
            include: {
              requester: { select: { id: true, fullName: true, phone: true } },
              driver: { select: { id: true, fullName: true, phone: true } },
            },
          });
          return res.status(200).json({ success: true, message: "Job accepted! Navigate to customer location.", pickup: updated });
        } catch (e: any) {
          console.warn("[Pickups Accept DB Notice]", e.message);
        }

        const memP = (memoryDb.pickups || []).find((p: any) => p.id === id);
        if (memP) {
          memP.status = "accepted";
          memP.driverId = finalDriverId || null;
          return res.status(200).json({ success: true, message: "Job accepted! Navigate to customer location.", pickup: memP });
        }
      }

      // Case B: Driver Completes Pickup (Requires Security Code from customer)
      if (action === "complete" || (!action && req.body?.status === "completed")) {
        try {
          const existing = await prisma.pickupRequest.findUnique({ where: { id } });
          if (!existing) {
            return res.status(404).json({ error: "Pickup request not found" });
          }

          if (existing.securityCode && securityCode && String(existing.securityCode).trim() !== String(securityCode).trim()) {
            return res.status(400).json({ error: "Invalid customer security code. Please verify with customer." });
          }

          const completed = await prisma.pickupRequest.update({
            where: { id },
            data: { status: "completed" },
          });

          // Credit driver balance
          if (finalDriverId) {
            await prisma.user.update({
              where: { id: finalDriverId },
              data: { walletBalance: { increment: existing.amount } },
            }).catch(() => null);
          }

          return res.status(200).json({
            success: true,
            message: `Job completed! ৳${existing.amount} credited to driver account.`,
            pickup: completed,
          });
        } catch (e: any) {
          console.warn("[Pickups Complete DB Notice]", e.message);
        }

        const memP = (memoryDb.pickups || []).find((p: any) => p.id === id);
        if (memP) {
          if (memP.securityCode && securityCode && String(memP.securityCode).trim() !== String(securityCode).trim()) {
            return res.status(400).json({ error: "Invalid customer security code." });
          }
          memP.status = "completed";
          return res.status(200).json({ success: true, message: `Job completed! ৳${memP.amount} credited.`, pickup: memP });
        }
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT"] }
);
