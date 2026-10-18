import type { VercelResponse } from "@vercel/node";
import prisma from "../../lib/prisma";
import { apiHandler, AuthenticatedRequest } from "../../lib/middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Bin ID is required" });
    }

    if (req.method === "GET") {
      const bin = await prisma.bin.findUnique({
        where: { id },
        include: {
          ward: {
            include: {
              cityCorp: true,
            },
          },
          alerts: {
            where: { resolved: false },
          },
        },
      });

      if (!bin) {
        return res.status(404).json({ error: "Bin not found" });
      }

      return res.status(200).json(bin);
    }

    if (req.method === "PUT") {
      const {
        binCode,
        location,
        capacity,
        fill,
        weight,
        temp,
        gas,
        fire,
        status,
        lat,
        lng,
        lastCollected,
      } = req.body || {};

      // Calculate status automatically based on fill and fire if status not manually forced
      let computedStatus = status;
      if (!computedStatus) {
        if (fire) {
          computedStatus = "fire";
        } else if (fill !== undefined) {
          if (fill >= 90) computedStatus = "critical";
          else if (fill >= 70) computedStatus = "warning";
          else computedStatus = "normal";
        }
      }

      const updated = await prisma.bin.update({
        where: { id },
        data: {
          ...(binCode && { binCode }),
          ...(location && { location }),
          ...(capacity && { capacity }),
          ...(fill !== undefined && { fill: Number(fill) }),
          ...(weight !== undefined && { weight: Number(weight) }),
          ...(temp && { temp }),
          ...(gas && { gas }),
          ...(fire !== undefined && { fire: Boolean(fire) }),
          ...(computedStatus && { status: computedStatus }),
          ...(lat !== undefined && { lat: parseFloat(lat) }),
          ...(lng !== undefined && { lng: parseFloat(lng) }),
          ...(lastCollected && { lastCollected: new Date(lastCollected) }),
        },
      });

      // If fire or critical fill, automatically generate an Alert in database
      if (fire || (fill !== undefined && fill >= 95)) {
        await prisma.alert.create({
          data: {
            type: fire ? "fire" : "overflow",
            message: fire
              ? `Fire detected in bin ${updated.binCode} at ${updated.location}`
              : `Bin ${updated.binCode} at ${updated.location} is at ${updated.fill}% capacity`,
            priority: fire ? "critical" : "high",
            binId: updated.id,
            wardId: updated.wardId,
          },
        });
      }

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      if (
        !currentUser ||
        !["SUPER_ADMIN", "CITY_ADMIN", "WARD_ADMIN"].includes(currentUser.role)
      ) {
        return res.status(403).json({ error: "Unauthorized to delete smart bin" });
      }

      await prisma.bin.delete({
        where: { id },
      });

      return res.status(200).json({ message: "Bin deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
