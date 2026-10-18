import type { VercelResponse } from "@vercel/node";
import prisma from "../../lib/prisma";
import { apiHandler, AuthenticatedRequest } from "../../lib/middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser) => {
    if (req.method === "GET") {
      let wardId = req.query.wardId as string | undefined;
      const driverId = req.query.driverId as string | undefined;
      const status = req.query.status as any;

      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        wardId = currentUser.wardId;
      }

      const whereClause: any = {};
      if (wardId) whereClause.wardId = wardId;
      if (driverId) whereClause.driverId = driverId;
      if (status) whereClause.status = status;
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.ward = { cityCorpId: currentUser.cityCorpId };
      }

      const tracks = await prisma.track.findMany({
        where: whereClause,
        include: {
          ward: {
            include: {
              cityCorp: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          driver: {
            select: { id: true, username: true, fullName: true, phone: true },
          },
        },
        orderBy: { truckId: "asc" },
      });

      return res.status(200).json(tracks);
    }

    if (req.method === "POST") {
      if (
        !currentUser ||
        !["SUPER_ADMIN", "CITY_ADMIN", "WARD_ADMIN"].includes(currentUser.role)
      ) {
        return res.status(403).json({ error: "Unauthorized to add collection tracks" });
      }

      const {
        truckId,
        route,
        stops,
        wardId,
        driverId,
        mapsRouteUrl,
        gpsLat,
        gpsLng,
      } = req.body || {};

      if (!truckId || !route || !wardId) {
        return res.status(400).json({ error: "truckId, route, and wardId are required" });
      }

      const track = await prisma.track.create({
        data: {
          truckId,
          route,
          stops: stops ? Number(stops) : 0,
          wardId,
          driverId: driverId || null,
          mapsRouteUrl: mapsRouteUrl || null,
          gpsLat: gpsLat ? parseFloat(gpsLat) : 0,
          gpsLng: gpsLng ? parseFloat(gpsLng) : 0,
        },
        include: {
          ward: true,
          driver: true,
        },
      });

      return res.status(201).json(track);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
