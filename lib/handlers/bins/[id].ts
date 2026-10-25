import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredBin } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Bin ID is required" });
    }

    let bin: any = null;
    try {
      bin = await prisma.bin.findUnique({
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
    } catch {}

    if (!bin) {
      bin = memoryDb.bins.find((b: StoredBin) => b.id === id || b.binCode === id);
      if (bin) {
        bin = {
          ...bin,
          ward: memoryDb.wards.find((w: any) => w.id === bin.wardId),
          alerts: memoryDb.alerts.filter((a: any) => a.binId === bin.id && !a.resolved),
        };
      }
    }

    if (!bin) {
      return res.status(404).json({ error: "Bin not found" });
    }

    if (req.method === "GET") {
      return res.status(200).json(bin);
    }

    if (req.method === "PUT") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId === bin.wardId;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && (!currentUser?.cityCorpId || bin.ward?.cityCorpId === currentUser.cityCorpId);
      const isDriver = currentUser?.role === "DRIVER";

      if (currentUser && !isSuper && !isWardAdmin && !isCityAdmin && !isDriver) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to update this bin" });
      }

      const {
        binCode,
        location,
        capacity,
        capacityKg,
        fill,
        fillLevel,
        weight,
        temp,
        gas,
        fire,
        status,
        lat,
        lng,
        lastCollected,
        forecastFull90At,
      } = req.body || {};

      let computedStatus = status;
      if (!computedStatus) {
        if (fire) {
          computedStatus = "fire";
        } else if (fill !== undefined || fillLevel !== undefined) {
          const effectiveFill = fillLevel !== undefined ? Number(fillLevel) : Number(fill);
          if (effectiveFill >= 90) computedStatus = "critical";
          else if (effectiveFill >= 70) computedStatus = "warning";
          else computedStatus = "normal";
        }
      }

      const parsedFill = fillLevel !== undefined ? Number(fillLevel) : (fill !== undefined ? Number(fill) : undefined);
      const parsedCapacityKg = capacityKg !== undefined ? Number(capacityKg) : undefined;

      if (binCode) bin.binCode = binCode;
      if (location) bin.location = location;
      if (capacity) bin.capacity = capacity;
      if (parsedCapacityKg !== undefined) bin.capacityKg = parsedCapacityKg;
      if (parsedFill !== undefined) {
        bin.fill = parsedFill;
        bin.fillLevel = parsedFill;
      }
      if (weight !== undefined) bin.weight = Number(weight);
      if (temp) bin.temp = temp;
      if (gas) bin.gas = gas;
      if (fire !== undefined) bin.fire = Boolean(fire);
      if (computedStatus) bin.status = computedStatus;
      if (lat !== undefined) bin.lat = Number(lat);
      if (lng !== undefined) bin.lng = Number(lng);
      if (lastCollected) bin.lastCollected = lastCollected;

      try {
        await prisma.bin.update({
          where: { id },
          data: {
            ...(binCode && { binCode }),
            ...(location && { location }),
            ...(capacity && { capacity }),
            ...(parsedCapacityKg !== undefined && { capacityKg: parsedCapacityKg }),
            ...(parsedFill !== undefined && { fill: Math.round(parsedFill), fillLevel: parsedFill }),
            ...(weight !== undefined && { weight: Number(weight) }),
            ...(temp && { temp }),
            ...(gas && { gas }),
            ...(fire !== undefined && { fire: Boolean(fire) }),
            ...(computedStatus && { status: computedStatus }),
            ...(lat !== undefined && { lat: Number(lat) }),
            ...(lng !== undefined && { lng: Number(lng) }),
            ...(lastCollected && { lastCollected: new Date(lastCollected) }),
            ...(forecastFull90At !== undefined && {
              forecastFull90At: forecastFull90At ? new Date(forecastFull90At) : null,
            }),
          },
        }).catch(() => null);
      } catch {}

      return res.status(200).json(bin);
    }

    if (req.method === "DELETE") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId === bin.wardId;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && (!currentUser?.cityCorpId || bin.ward?.cityCorpId === currentUser.cityCorpId);

      if (!isSuper && !isWardAdmin && !isCityAdmin) {
        return res.status(403).json({ error: "Forbidden: Only Ward Admin or City/Super Admin can delete bins" });
      }

      try {
        await prisma.bin.delete({ where: { id } }).catch(() => null);
      } catch {}

      memoryDb.bins = memoryDb.bins.filter((b: StoredBin) => b.id !== id);
      return res.status(200).json({ message: "Bin deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
