import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Track ID is required" });
    }

    if (req.method === "GET") {
      const track = await prisma.track.findUnique({
        where: { id },
        include: {
          ward: {
            include: {
              cityCorp: true,
            },
          },
          driver: {
            select: { id: true, username: true, fullName: true, phone: true },
          },
        },
      });

      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }

      return res.status(200).json(track);
    }

    if (req.method === "PUT") {
      const {
        truckId,
        route,
        stops,
        status,
        progress,
        load,
        fuel,
        startTime,
        gpsLat,
        gpsLng,
        mapsRouteUrl,
        driverId,
      } = req.body || {};

      const updated = await prisma.track.update({
        where: { id },
        data: {
          ...(truckId && { truckId }),
          ...(route && { route }),
          ...(stops !== undefined && { stops: Number(stops) }),
          ...(status && { status }),
          ...(progress !== undefined && { progress: Number(progress) }),
          ...(load && { load }),
          ...(fuel !== undefined && { fuel: Number(fuel) }),
          ...(startTime && { startTime }),
          ...(gpsLat !== undefined && { gpsLat: parseFloat(gpsLat) }),
          ...(gpsLng !== undefined && { gpsLng: parseFloat(gpsLng) }),
          ...(mapsRouteUrl !== undefined && { mapsRouteUrl }),
          ...(driverId !== undefined && { driverId: driverId || null }),
        },
        include: {
          ward: true,
          driver: true,
        },
      });

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      if (
        !currentUser ||
        !["SUPER_ADMIN", "CITY_ADMIN", "WARD_ADMIN"].includes(currentUser.role)
      ) {
        return res.status(403).json({ error: "Unauthorized to delete collection track" });
      }

      await prisma.track.delete({
        where: { id },
      });

      return res.status(200).json({ message: "Track deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
