import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    if (req.method === "GET") {
      const status = req.query.status as any;
      const requesterType = req.query.requesterType as string;
      const driverId = req.query.driverId as string;

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (requesterType) whereClause.requesterType = requesterType;
      if (driverId) whereClause.driverId = driverId;

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

      return res.status(200).json(list);
    }

    if (req.method === "POST") {
      const {
        requesterType = "citizen",
        area,
        address,
        wasteType,
        date,
        amount = 0,
        requesterId,
        contactName,
        contactPhone,
        wardId,
      } = req.body || {};

      if (!area || !address || !wasteType || !date) {
        return res.status(400).json({ error: "Area, address, wasteType, and date are required" });
      }

      const finalRequesterId = currentUser?.userId || requesterId || `usr-guest-${Date.now()}`;
      const finalWardId = wardId || currentUser?.wardId || null;
      const secCode = Math.floor(1000 + Math.random() * 9000).toString();

      const newPickup = {
        id: `pick-${Date.now()}`,
        requesterType,
        area: String(area).trim(),
        address: String(address).trim(),
        wasteType: String(wasteType).trim(),
        date: String(date).trim(),
        amount: Number(amount) || 0,
        status: "open",
        securityCode: secCode,
        requesterId: finalRequesterId,
        wardId: finalWardId,
        requester: {
          id: finalRequesterId,
          fullName: contactName || currentUser?.fullName || "Citizen User",
          phone: contactPhone || currentUser?.phone || "017XXXXXXXX",
          username: currentUser?.username || "guest_user",
        },
        createdAt: new Date().toISOString(),
      };

      try {
        await prisma.pickupRequest.create({
          data: {
            requesterType,
            area: newPickup.area,
            address: newPickup.address,
            wasteType: newPickup.wasteType,
            date: newPickup.date,
            amount: newPickup.amount,
            status: "open",
            securityCode: secCode,
            requesterId: finalRequesterId,
            wardId: finalWardId,
          },
        }).catch(() => null);
      } catch {}

      memoryDb.pickups.unshift(newPickup);

      return res.status(201).json({
        message: "Pickup request created successfully",
        pickup: newPickup,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
