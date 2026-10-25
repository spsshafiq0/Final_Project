import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredTrack } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Track ID is required" });
    }

    let track: any = null;
    try {
      track = await prisma.track.findUnique({
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
    } catch {}

    if (!track) {
      track = memoryDb.tracks.find((t: StoredTrack) => t.id === id || t.truckId === id);
      if (track) {
        track = {
          ...track,
          ward: memoryDb.wards.find((w: any) => w.id === track.wardId),
          driver: memoryDb.users.find((u: any) => u.id === track.driverId) || {
            id: track.driverId || "usr-driver-1",
            fullName: track.driver || "Driver",
            phone: track.phone || "017XXXXXXXX",
          },
        };
      }
    }

    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    if (req.method === "GET") {
      return res.status(200).json(track);
    }

    if (req.method === "PUT") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId === track.wardId;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && (!currentUser?.cityCorpId || track.ward?.cityCorpId === currentUser.cityCorpId);
      const isAssignedDriver = currentUser?.role === "DRIVER" && (currentUser?.userId === track.driverId || currentUser?.username === track.driver?.username);

      if (currentUser && !isSuper && !isWardAdmin && !isCityAdmin && !isAssignedDriver) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to update this track" });
      }

      const {
        truckId,
        truckType,
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

      if (truckId) track.truckId = truckId;
      if (truckType) track.truckType = truckType;
      if (route) track.route = route;
      if (stops !== undefined) track.stops = Number(stops);
      if (status) track.status = status;
      if (progress !== undefined) track.progress = Number(progress);
      if (load) track.load = load;
      if (fuel !== undefined) track.fuel = Number(fuel);
      if (startTime) track.startTime = startTime;
      if (gpsLat !== undefined) track.gpsLat = Number(gpsLat);
      if (gpsLng !== undefined) track.gpsLng = Number(gpsLng);
      if (mapsRouteUrl !== undefined) track.mapsRouteUrl = mapsRouteUrl;
      if (driverId !== undefined) track.driverId = driverId;

      try {
        await prisma.track.update({
          where: { id },
          data: {
            ...(truckId && { truckId }),
            ...(truckType && { truckType }),
            ...(route && { route }),
            ...(stops !== undefined && { stops: Number(stops) }),
            ...(status && { status }),
            ...(progress !== undefined && { progress: Number(progress) }),
            ...(load && { load }),
            ...(fuel !== undefined && { fuel: Number(fuel) }),
            ...(startTime && { startTime }),
            ...(gpsLat !== undefined && { gpsLat: Number(gpsLat) }),
            ...(gpsLng !== undefined && { gpsLng: Number(gpsLng) }),
            ...(mapsRouteUrl !== undefined && { mapsRouteUrl }),
            ...(driverId !== undefined && { driverId }),
          },
        }).catch(() => null);
      } catch {}


      return res.status(200).json(track);
    }

    if (req.method === "DELETE") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId === track.wardId;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && (!currentUser?.cityCorpId || track.ward?.cityCorpId === currentUser.cityCorpId);

      if (!isSuper && !isWardAdmin && !isCityAdmin) {
        return res.status(403).json({ error: "Forbidden: Only Ward Admin or City/Super Admin can delete collection tracks" });
      }

      try {
        await prisma.track.delete({ where: { id } }).catch(() => null);
      } catch {}

      memoryDb.tracks = memoryDb.tracks.filter((t: StoredTrack) => t.id !== id);
      return res.status(200).json({ message: "Track deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
