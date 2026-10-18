import type { VercelResponse } from "@vercel/node";
import prisma from "../../lib/prisma";
import { apiHandler, AuthenticatedRequest } from "../../lib/middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser) => {
    if (req.method === "GET") {
      const status = req.query.status as any;
      const requesterType = req.query.requesterType as string;
      const driverId = req.query.driverId as string;

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (requesterType) whereClause.requesterType = requesterType;
      if (driverId) whereClause.driverId = driverId;

      // If user is regular citizen/business, show only their requests
      if (currentUser && ["CITIZEN", "BUSINESS"].includes(currentUser.role)) {
        whereClause.requesterId = currentUser.userId;
      }

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

      return res.status(200).json(pickups);
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
      } = req.body || {};

      if (!area || !address || !wasteType || !date) {
        return res.status(400).json({ error: "Area, address, wasteType, and date are required" });
      }

      // Determine requester user ID
      let finalRequesterId = currentUser?.userId || requesterId;

      // If anonymous / guest citizen creates request, find or create guest user
      if (!finalRequesterId) {
        const guestUsername = contactPhone ? `citizen_${contactPhone}` : `citizen_${Date.now()}`;
        let guestUser = await prisma.user.findUnique({ where: { username: guestUsername } });

        if (!guestUser) {
          guestUser = await prisma.user.create({
            data: {
              username: guestUsername,
              password: "nopassword",
              fullName: contactName || "Citizen User",
              phone: contactPhone || null,
              role: requesterType === "business" ? "BUSINESS" : "CITIZEN",
            },
          });
        }
        finalRequesterId = guestUser.id;
      }

      const randomCode = Math.floor(1000 + Math.random() * 9000).toString();

      const pickup = await prisma.pickupRequest.create({
        data: {
          requesterType,
          area,
          address,
          wasteType,
          date,
          amount: Number(amount),
          securityCode: randomCode,
          requesterId: finalRequesterId,
        },
        include: {
          requester: true,
        },
      });

      return res.status(201).json(pickup);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
