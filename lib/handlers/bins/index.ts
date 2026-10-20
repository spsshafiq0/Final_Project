import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredBin } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List Bins ─────────────────────────────────────────────────
    if (req.method === "GET") {
      let wardId = req.query.wardId as string | undefined;
      let cityCorpId = req.query.cityCorpId as string | undefined;
      const status = req.query.status as any;

      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        wardId = currentUser.wardId;
      } else if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        cityCorpId = currentUser.cityCorpId;
      }

      const whereClause: any = {};
      if (wardId) whereClause.wardId = wardId;
      if (cityCorpId) whereClause.ward = { cityCorpId };
      if (status) whereClause.status = status;

      try {
        const bins = await prisma.bin.findMany({
          where: whereClause,
          include: {
            ward: {
              include: {
                cityCorp: { select: { id: true, name: true, code: true } },
              },
            },
          },
          orderBy: { binCode: "asc" },
        });

        if (bins && bins.length > 0) {
          return res.status(200).json(bins);
        }
      } catch (e: any) {
        console.warn("[Bins GET Notice] Fallback to memory store:", e.message);
      }

      // Memory store fallback
      let memBins = [...memoryDb.bins];
      if (wardId) memBins = memBins.filter((b: StoredBin) => b.wardId === wardId);

      const enriched = memBins.map((b: StoredBin) => {
        const ward = memoryDb.wards.find((w: any) => w.id === b.wardId);
        const city = ward ? memoryDb.cities.find((c: any) => c.id === ward.cityCorpId) : null;
        return {
          ...b,
          ward: ward ? { ...ward, cityCorp: city ? { id: city.id, name: city.name, code: city.code } : null } : null,
        };
      });

      return res.status(200).json(enriched);
    }

    // ── POST: Create Bin ───────────────────────────────────────────────
    if (req.method === "POST") {
      const { binCode, location, capacity, wardId, lat, lng, temp, gas, fill, status, fire } = req.body || {};

      if (!binCode || !location) {
        return res.status(400).json({ error: "binCode and location are required" });
      }

      const assignedWardId = String(wardId || currentUser?.wardId || memoryDb.wards[0]?.id || "1");

      let createdBin: any = null;

      try {
        createdBin = await prisma.bin.create({
          data: {
            binCode,
            location,
            capacity: capacity || "120L",
            fill: fill ? Number(fill) : 0,
            temp: temp || "Normal",
            gas: gas || "Normal",
            fire: Boolean(fire),
            status: status || "normal",
            wardId: assignedWardId,
            lat: lat ? Number(lat) : 23.78,
            lng: lng ? Number(lng) : 90.40,
          },
        });
      } catch (dbErr: any) {
        console.warn("[Bin Create Notice] Fallback to memory store:", dbErr.message);
      }

      const memBin: StoredBin = {
        id: createdBin?.id || `bin-${Date.now()}`,
        binCode,
        location,
        capacity: capacity || "120L",
        fill: fill ? Number(fill) : 0,
        weight: 15,
        temp: temp || "28°C",
        gas: gas || "12 ppm",
        fire: Boolean(fire),
        status: status || "normal",
        lat: lat ? Number(lat) : 23.78,
        lng: lng ? Number(lng) : 90.40,
        wardId: assignedWardId,
        createdAt: new Date().toISOString(),
      };

      memoryDb.bins.push(memBin);

      return res.status(201).json(createdBin || memBin);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
