import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Pickup Request ID is required" });
    }

    if (req.method === "GET") {
      const pickup = await prisma.pickupRequest.findUnique({
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

      if (!pickup) {
        return res.status(404).json({ error: "Pickup request not found" });
      }

      return res.status(200).json(pickup);
    }

    if (req.method === "PUT") {
      const { status, driverId, securityCode } = req.body || {};

      const currentPickup = await prisma.pickupRequest.findUnique({ where: { id } });
      if (!currentPickup) {
        return res.status(404).json({ error: "Pickup request not found" });
      }

      // If completing, check security code if specified
      if (status === "completed" && securityCode && currentPickup.securityCode) {
        if (securityCode.trim() !== currentPickup.securityCode.trim()) {
          return res.status(400).json({ error: "Invalid security code verification" });
        }
      }

      const assignedDriver = driverId || (status === "accepted" && currentUser ? currentUser.userId : undefined);

      const updated = await prisma.pickupRequest.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(assignedDriver !== undefined && { driverId: assignedDriver }),
        },
        include: {
          requester: true,
          driver: true,
        },
      });

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      await prisma.pickupRequest.delete({ where: { id } });
      return res.status(200).json({ message: "Pickup request deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
