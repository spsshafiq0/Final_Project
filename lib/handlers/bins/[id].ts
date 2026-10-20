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

      if (binCode) bin.binCode = binCode;
      if (location) bin.location = location;
      if (capacity) bin.capacity = capacity;
      if (fill !== undefined) bin.fill = Number(fill);
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
            ...(fill !== undefined && { fill: Number(fill) }),
            ...(weight !== undefined && { weight: Number(weight) }),
            ...(temp && { temp }),
            ...(gas && { gas }),
            ...(fire !== undefined && { fire: Boolean(fire) }),
            ...(computedStatus && { status: computedStatus }),
            ...(lat !== undefined && { lat: Number(lat) }),
            ...(lng !== undefined && { lng: Number(lng) }),
            ...(lastCollected && { lastCollected: new Date(lastCollected) }),
          },
        }).catch(() => null);
      } catch {}

      return res.status(200).json(bin);
    }

    if (req.method === "DELETE") {
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
