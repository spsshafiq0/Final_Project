import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Pickup request ID is required" });
    }

    let pickup: any = null;
    try {
      pickup = await prisma.pickupRequest.findUnique({
        where: { id },
        include: {
          requester: {
            select: { id: true, fullName: true, phone: true, username: true },
          },
          driver: {
            select: { id: true, fullName: true, phone: true },
          },
        },
      });
    } catch {}

    if (!pickup) {
      pickup = (memoryDb.pickups || []).find((p: any) => p.id === id);
    }

    if (!pickup) {
      return res.status(404).json({ error: "Pickup request not found" });
    }

    if (req.method === "GET") {
      return res.status(200).json(pickup);
    }

    if (req.method === "PUT") {
      const { status, driverId } = req.body || {};

      if (status) pickup.status = status;
      if (driverId) pickup.driverId = driverId;

      try {
        await prisma.pickupRequest.update({
          where: { id },
          data: {
            ...(status ? { status } : {}),
            ...(driverId ? { driverId } : {}),
          },
        }).catch(() => null);
      } catch {}

      return res.status(200).json({
        message: "Pickup updated successfully",
        pickup,
      });
    }

    if (req.method === "DELETE") {
      try {
        await prisma.pickupRequest.delete({ where: { id } }).catch(() => null);
      } catch {}

      memoryDb.pickups = (memoryDb.pickups || []).filter((p: any) => p.id !== id);
      return res.status(200).json({ message: "Pickup request deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
