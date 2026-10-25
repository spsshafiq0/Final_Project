import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredBin, StoredRoute } from "../../store";
import { getDriverBinScope } from "../../driverScope";
// @ts-ignore
import {
  optimizeRouteForScope,
  compareRouteStrategies,
} from "../../../services/routeOptimizer.js";
// @ts-ignore
import { ROUTE_CONFIG } from "../../../config/routeConfig.js";

// Rate-limiting / debouncing map for driver reoptimization requests
const lastReoptMap = new Map<string, number>();

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const driverId = currentUser?.userId || currentUser?.id;
    if (!driverId) {
      return res.status(401).json({ error: "Unauthorized: Driver identification required" });
    }

    // Determine Driver's Scope (Strictly enforced server-side)
    let driverScope: any = null;
    try {
      driverScope = getDriverBinScope(currentUser);
    } catch (err: any) {
      return res.status(403).json({ error: err.message || "Driver scope assignment invalid" });
    }

    const segments = Array.isArray(req.query?.path)
      ? req.query.path
      : typeof req.query?.path === "string"
      ? (req.query.path as string).split("/").filter(Boolean)
      : [];

    const cleanUrl = (req.url || "").split("?")[0].replace(/^\/api\/?/, "").replace(/^\//, "");
    const urlSegs = cleanUrl.split("/").filter(Boolean);
    const action = segments[1] || urlSegs[1] || (req.query?.action as string) || "current";

    // ── Helper: Fetch all bins in driver's scope (Lean query) ──────────
    async function getBinsInScope(filterWardId?: string) {
      const targetWardId = filterWardId || driverScope.wardId;
      const targetCityCorpId = driverScope.cityCorpId;

      // 1. Try Prisma DB with lean projection
      try {
        const whereClause: any = {};
        if (targetWardId) {
          whereClause.wardId = targetWardId;
        } else if (targetCityCorpId) {
          whereClause.OR = [
            { cityCorpId: targetCityCorpId },
            { ward: { cityCorpId: targetCityCorpId } },
          ];
        }

        const dbBins = await prisma.bin.findMany({
          where: whereClause,
          select: {
            id: true,
            binCode: true,
            location: true,
            capacity: true,
            capacityKg: true,
            fill: true,
            fillLevel: true,
            temp: true,
            gas: true,
            fire: true,
            status: true,
            lat: true,
            lng: true,
            wardId: true,
            cityCorpId: true,
            forecastFull90At: true,
            alerts: {
              where: { resolved: false },
              select: { id: true, type: true, message: true, priority: true },
            },
            ward: {
              select: { id: true, name: true, area: true, cityCorpId: true },
            },
          },
        });

        if (dbBins && dbBins.length > 0) {
          return dbBins.map((b: any) => ({
            ...b,
            lon: b.lng,
            capacityKg: b.capacityKg || 120,
            fillLevel: b.fillLevel || b.fill || 0,
          }));
        }
      } catch (err: any) {
        console.warn("[Route DB Notice] Fallback to memory store:", err.message);
      }

      // 2. Fallback to resilient in-memory store
      let memBins = [...memoryDb.bins];
      if (targetWardId) {
        memBins = memBins.filter((b: StoredBin) => b.wardId === targetWardId);
      } else if (targetCityCorpId) {
        memBins = memBins.filter((b: StoredBin) => {
          if (b.cityCorpId === targetCityCorpId) return true;
          const ward = memoryDb.wards.find((w: any) => w.id === b.wardId);
          return ward && ward.cityCorpId === targetCityCorpId;
        });
      }

      return memBins.map((b: StoredBin) => {
        const ward = memoryDb.wards.find((w: any) => w.id === b.wardId);
        const activeAlerts = memoryDb.alerts.filter((a: any) => a.binId === b.id && !a.resolved);
        return {
          ...b,
          lon: b.lng,
          capacityKg: b.capacityKg || 120,
          fillLevel: b.fillLevel || b.fill || 0,
          ward: ward ? { id: ward.id, name: ward.name, area: ward.area, cityCorpId: ward.cityCorpId } : null,
          alerts: activeAlerts,
        };
      });
    }

    // ── 1. GET /api/routes/bins: Lightweight Bins for Leaflet Map ───────
    if (req.method === "GET" && (action === "bins" || req.query.view === "bins")) {
      const filterWard = (req.query.ward as string) || undefined;
      const allBins = await getBinsInScope(filterWard);

      // Support Bbox filtering: [west, south, east, north]
      const west = req.query.west ? Number(req.query.west) : null;
      const south = req.query.south ? Number(req.query.south) : null;
      const east = req.query.east ? Number(req.query.east) : null;
      const north = req.query.north ? Number(req.query.north) : null;

      let filtered = allBins;
      if (west !== null && south !== null && east !== null && north !== null) {
        filtered = allBins.filter((b: any) => {
          const lat = b.lat;
          const lon = b.lon !== undefined ? b.lon : b.lng;
          return lat >= south && lat <= north && lon >= west && lon <= east;
        });
      }

      // Optional pagination
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5000;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const sliced = filtered.slice(offset, offset + limit);

      const lightweight = sliced.map((b: any) => ({
        id: b.id,
        binCode: b.binCode,
        location: b.location,
        lat: b.lat,
        lon: b.lon !== undefined ? b.lon : b.lng,
        lng: b.lon !== undefined ? b.lon : b.lng,
        fill: b.fillLevel || b.fill || 0,
        fillLevel: b.fillLevel || b.fill || 0,
        status: b.status || "normal",
        temp: b.temp,
        gas: b.gas,
        fire: b.fire,
        capacityKg: b.capacityKg || 120,
        wardId: b.wardId,
        wardName: b.ward?.name || b.ward?.area || `Ward ${b.wardId}`,
        forecastFull90At: b.forecastFull90At,
        hasActiveAlert: Array.isArray(b.alerts) && b.alerts.length > 0,
      }));

      return res.status(200).json({
        total: filtered.length,
        scope: driverScope,
        bins: lightweight,
      });
    }

    // ── 2. GET /api/routes/compare: 3-Strategy Benchmark Comparison ────
    if (req.method === "GET" && action === "compare") {
      const allBins = await getBinsInScope();
      const comparison = await compareRouteStrategies(allBins, ROUTE_CONFIG.DEPOT_LOCATION);
      return res.status(200).json({
        scope: driverScope,
        totalBinsInScope: allBins.length,
        ...comparison,
      });
    }

    // ── 3. GET /api/routes/optimize: Compute & Persist Route ────────────
    if (req.method === "GET" && (action === "optimize" || action === "current")) {
      // Check if driver has an existing active persisted route (if action is 'current')
      if (action === "current") {
        try {
          const existingDbRoute = await prisma.route.findFirst({
            where: { driverId, status: "active" },
            orderBy: { createdAt: "desc" },
          });

          if (existingDbRoute) {
            const parsed = {
              id: existingDbRoute.id,
              driverId: existingDbRoute.driverId,
              scope: JSON.parse(existingDbRoute.scope || "{}"),
              trips: JSON.parse(existingDbRoute.trips || "[]"),
              totalDistanceKm: existingDbRoute.totalDistanceKm,
              totalDurationMin: existingDbRoute.totalDurationMin,
              status: existingDbRoute.status,
              createdAt: existingDbRoute.createdAt,
            };
            return res.status(200).json(parsed);
          }
        } catch {}

        const memRoute = (memoryDb.routes || []).find((r: StoredRoute) => r.driverId === driverId && r.status === "active");
        if (memRoute) {
          return res.status(200).json(memRoute);
        }
      }

      // Compute fresh optimized route
      const binsInScope = await getBinsInScope();
      const optResult = await optimizeRouteForScope({
        binsInScope,
        depot: ROUTE_CONFIG.DEPOT_LOCATION,
        dumpSite: ROUTE_CONFIG.DUMP_SITE_LOCATION,
        truckCapacityKg: ROUTE_CONFIG.TRUCK_CAPACITY_KG,
      });

      const routeRecord = {
        id: `route-${Date.now()}`,
        driverId,
        scope: driverScope,
        trips: optResult.trips,
        totalDistanceKm: optResult.totalDistanceKm,
        totalDurationMin: optResult.totalDurationMin,
        totalLoadKg: optResult.totalLoadKg,
        candidateCount: optResult.candidateCount,
        totalBinsInScope: optResult.totalBinsInScope,
        skippedBins: optResult.skippedBins,
        status: "active" as const,
        depot: optResult.depot,
        dumpSite: optResult.dumpSite,
        createdAt: new Date().toISOString(),
      };

      // Persist in memory store
      if (!memoryDb.routes) memoryDb.routes = [];
      memoryDb.routes = memoryDb.routes.filter((r: StoredRoute) => r.driverId !== driverId);
      memoryDb.routes.push(routeRecord as any);

      // Persist in Prisma
      try {
        await prisma.route.deleteMany({ where: { driverId } });
        await prisma.route.create({
          data: {
            id: routeRecord.id,
            driverId,
            scope: JSON.stringify(driverScope),
            trips: JSON.stringify(optResult.trips),
            totalDistanceKm: optResult.totalDistanceKm,
            totalDurationMin: optResult.totalDurationMin,
            status: "active",
          },
        });
      } catch {}

      return res.status(200).json(routeRecord);
    }

    // ── 4. POST /api/routes/reoptimize: Dynamic Re-Route From Current GPS ──
    if (req.method === "POST" && (action === "reoptimize" || req.body?.action === "reoptimize")) {
      // Debounce rate-limiting per driver (max once per 1.5 seconds)
      const now = Date.now();
      const lastCall = lastReoptMap.get(driverId) || 0;
      if (now - lastCall < 1500) {
        return res.status(429).json({ error: "Re-optimization rate limit exceeded. Please wait a moment." });
      }
      lastReoptMap.set(driverId, now);

      const { currentLat, currentLon, currentLng, completedBinIds = [] } = req.body || {};
      const lat = Number(currentLat);
      const lon = Number(currentLon !== undefined ? currentLon : currentLng);

      const allBins = await getBinsInScope();

      // Filter out completed bins
      const completedSet = new Set(completedBinIds.map(String));
      const remainingBins = allBins.filter((b: any) => !completedSet.has(String(b.id)) && !completedSet.has(String(b.binCode)));

      // Re-solve starting from current GPS location
      const startLocation = (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0)
        ? { lat, lon, name: "Live Truck Position" }
        : null;

      const optResult = await optimizeRouteForScope({
        binsInScope: remainingBins,
        depot: ROUTE_CONFIG.DEPOT_LOCATION,
        dumpSite: ROUTE_CONFIG.DUMP_SITE_LOCATION,
        truckCapacityKg: ROUTE_CONFIG.TRUCK_CAPACITY_KG,
        startLocation,
      });

      const updatedRoute = {
        id: `route-${Date.now()}`,
        driverId,
        scope: driverScope,
        trips: optResult.trips,
        totalDistanceKm: optResult.totalDistanceKm,
        totalDurationMin: optResult.totalDurationMin,
        totalLoadKg: optResult.totalLoadKg,
        candidateCount: optResult.candidateCount,
        totalBinsInScope: allBins.length,
        skippedBins: optResult.skippedBins,
        status: "active" as const,
        depot: optResult.depot,
        dumpSite: optResult.dumpSite,
        createdAt: new Date().toISOString(),
      };

      // Persist updated route
      if (!memoryDb.routes) memoryDb.routes = [];
      memoryDb.routes = memoryDb.routes.filter((r: StoredRoute) => r.driverId !== driverId);
      memoryDb.routes.push(updatedRoute as any);

      try {
        await prisma.route.deleteMany({ where: { driverId } });
        await prisma.route.create({
          data: {
            id: updatedRoute.id,
            driverId,
            scope: JSON.stringify(driverScope),
            trips: JSON.stringify(optResult.trips),
            totalDistanceKm: optResult.totalDistanceKm,
            totalDurationMin: optResult.totalDurationMin,
            status: "active",
          },
        });
      } catch {}

      return res.status(200).json(updatedRoute);
    }

    return res.status(405).json({ error: "Method not allowed on routes endpoint" });
  },
  { allowedMethods: ["GET", "POST"] }
);
