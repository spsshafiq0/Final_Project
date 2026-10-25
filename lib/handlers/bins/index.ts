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
      if (cityCorpId) {
        whereClause.OR = [
          { cityCorpId },
          { ward: { cityCorpId } },
        ];
      }
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
      const {
        binCode,
        location,
        capacity,
        capacityKg,
        wardId,
        ward,
        cityCorpId,
        cityCorporation,
        lat,
        lng,
        lon,
        temp,
        gas,
        fill,
        fillLevel,
        status,
        fire,
        forecastFull90At,
      } = req.body || {};

      if (!binCode || !location) {
        return res.status(400).json({ error: "binCode and location are required" });
      }

      // Resolve City Corporation ID
      let assignedCityCorpId = String(
        cityCorpId || cityCorporation || currentUser?.cityCorpId || ""
      ).trim();

      // Resolve Ward ID
      let assignedWardId = String(
        wardId || ward || currentUser?.wardId || ""
      ).trim();

      // If user is City Admin, cityCorpId must match their scope
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        assignedCityCorpId = currentUser.cityCorpId;
      }
      // If user is Ward Admin, wardId must match their scope
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        assignedWardId = currentUser.wardId;
        if (!assignedCityCorpId && currentUser.cityCorpId) {
          assignedCityCorpId = currentUser.cityCorpId;
        }
      }

      if (!assignedCityCorpId && memoryDb.cities[0]?.id) {
        assignedCityCorpId = memoryDb.cities[0].id;
      }

      if (!assignedWardId) {
        return res.status(400).json({ error: "Ward is required" });
      }

      // VALIDATOR: Ensure the chosen ward belongs to the chosen city corporation
      let wardRecord: any = null;
      try {
        wardRecord = await prisma.ward.findUnique({
          where: { id: assignedWardId },
          include: { cityCorp: true },
        });
      } catch {}

      if (!wardRecord) {
        wardRecord = memoryDb.wards.find((w: any) => w.id === assignedWardId);
      }

      if (!wardRecord) {
        return res.status(400).json({ error: `Selected Ward '${assignedWardId}' was not found.` });
      }

      if (assignedCityCorpId && wardRecord.cityCorpId !== assignedCityCorpId) {
        return res.status(400).json({
          error: `Validation failed: Ward '${wardRecord.name || assignedWardId}' does not belong to the selected City Corporation '${assignedCityCorpId}'.`,
        });
      }

      // If assignedCityCorpId was empty, inherit from ward
      if (!assignedCityCorpId) {
        assignedCityCorpId = wardRecord.cityCorpId;
      }

      const parsedLat = Number(lat !== undefined ? lat : 23.78);
      const parsedLng = Number(lng !== undefined ? lng : (lon !== undefined ? lon : 90.40));
      const parsedFill = Number(fillLevel !== undefined ? fillLevel : (fill || 0));
      const parsedCapacityKg = Number(capacityKg || (typeof capacity === "string" ? parseInt(capacity, 10) : 120) || 120);

      let createdBin: any = null;

      try {
        createdBin = await prisma.bin.create({
          data: {
            binCode,
            location,
            capacity: capacity || `${parsedCapacityKg}L`,
            capacityKg: parsedCapacityKg,
            fill: parsedFill,
            fillLevel: parsedFill,
            temp: temp || "Normal",
            gas: gas || "Normal",
            fire: Boolean(fire),
            status: status || "normal",
            wardId: assignedWardId,
            cityCorpId: assignedCityCorpId,
            lat: parsedLat,
            lng: parsedLng,
            forecastFull90At: forecastFull90At ? new Date(forecastFull90At) : null,
          },
        });
      } catch (dbErr: any) {
        console.warn("[Bin Create Notice] Fallback to memory store:", dbErr.message);
      }

      const memBin: StoredBin = {
        id: createdBin?.id || `bin-${Date.now()}`,
        binCode,
        location,
        capacity: capacity || `${parsedCapacityKg}L`,
        capacityKg: parsedCapacityKg,
        fill: parsedFill,
        fillLevel: parsedFill,
        weight: 15,
        temp: temp || "28°C",
        gas: gas || "12 ppm",
        fire: Boolean(fire),
        status: status || "normal",
        lat: parsedLat,
        lng: parsedLng,
        lon: parsedLng,
        wardId: assignedWardId,
        ward: assignedWardId,
        cityCorpId: assignedCityCorpId,
        cityCorporation: assignedCityCorpId,
        forecastFull90At: forecastFull90At || null,
        createdAt: new Date().toISOString(),
      };

      memoryDb.bins.push(memBin);

      return res.status(201).json(createdBin || memBin);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
