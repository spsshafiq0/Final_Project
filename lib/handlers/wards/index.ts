import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredWard } from "../../store";
import { logAudit } from "../../audit";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List Wards ────────────────────────────────────────────────
    if (req.method === "GET") {
      let cityCorpId = req.query.cityCorpId as string | undefined;

      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        cityCorpId = currentUser.cityCorpId;
      }

      const whereClause: any = {};
      if (cityCorpId) whereClause.cityCorpId = cityCorpId;
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.id = currentUser.wardId;
      }

      try {
        const wards = await prisma.ward.findMany({
          where: whereClause,
          include: {
            cityCorp: {
              select: { id: true, name: true, code: true },
            },
            admins: {
              select: { id: true, username: true, fullName: true, phone: true },
            },
            _count: {
              select: { bins: true, tracks: true, alerts: true },
            },
          },
          orderBy: { name: "asc" },
        });

        if (wards && wards.length > 0) {
          return res.status(200).json(wards);
        }
      } catch (e: any) {
        console.warn("[Wards GET Notice] Fallback to memory store:", e.message);
      }

      // Memory store fallback
      let memWards = [...memoryDb.wards];
      if (cityCorpId) {
        memWards = memWards.filter((w: StoredWard) => w.cityCorpId === cityCorpId);
      }
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        memWards = memWards.filter((w: StoredWard) => w.id === currentUser.wardId);
      }

      const enriched = memWards.map((w: StoredWard) => {
        const corp = memoryDb.cities.find((c: any) => c.id === w.cityCorpId);
        const wardAdmins = memoryDb.users.filter((u: any) => u.wardId === w.id);
        const wardBins = memoryDb.bins.filter((b: any) => b.wardId === w.id);
        const wardTracks = memoryDb.tracks.filter((t: any) => t.wardId === w.id);
        const wardAlerts = memoryDb.alerts.filter((a: any) => a.wardId === w.id);

        return {
          ...w,
          cityCorp: corp ? { id: corp.id, name: corp.name, code: corp.code } : null,
          admins: wardAdmins.map((a: any) => ({ id: a.id, username: a.username, fullName: a.fullName, phone: a.phone })),
          _count: {
            bins: wardBins.length,
            tracks: wardTracks.length,
            alerts: wardAlerts.length,
          },
        };
      });

      return res.status(200).json(enriched);
    }

    // ── POST: Create Ward ──────────────────────────────────────────────
    if (req.method === "POST") {
      let { name, area, population, councilor, cityCorpId } = req.body || {};

      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        cityCorpId = currentUser.cityCorpId;
      }

      if (!cityCorpId && memoryDb.cities[0]?.id) {
        cityCorpId = memoryDb.cities[0].id;
      }

      if (!name || !area) {
        return res.status(400).json({ error: "Name and area are required" });
      }

      let createdWard: any = null;

      try {
        createdWard = await prisma.ward.create({
          data: {
            name,
            area,
            population: population ? Number(population) : 0,
            councilor: councilor || "",
            cityCorpId: cityCorpId || "",
          },
          include: {
            cityCorp: { select: { id: true, name: true, code: true } },
          },
        });
      } catch (dbErr: any) {
        console.warn("[Ward Create Notice] Fallback to memory store:", dbErr.message);
      }

      const wardId = createdWard?.id || `ward-${Date.now()}`;
      const memWard: StoredWard = {
        id: wardId,
        name,
        area,
        population: population ? Number(population) : 0,
        councilor: councilor || "",
        cityCorpId: cityCorpId || "",
        createdAt: new Date().toISOString(),
      };

      memoryDb.wards.push(memWard);

      await logAudit({
        userId: currentUser?.userId || null,
        action: "CREATE_WARD",
        resource: "wards",
        details: `Created Ward ${name} (${area}) under City Corp ${cityCorpId}`,
        ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
      });

      return res.status(201).json(createdWard || memWard);
    }

    // ── PUT: Update Ward (Toggles for reportEnabled, withdrawEnabled, etc.) ─
    if (req.method === "PUT" || req.method === "PATCH") {
      const { id, wardId, reportEnabled, withdrawEnabled, name, area, population, councilor } = req.body || {};
      const targetId = String(wardId || id || req.query.id);

      if (!targetId) {
        return res.status(400).json({ error: "Ward ID is required" });
      }

      let updatedWard: any = null;

      try {
        const updateData: any = {};
        if (reportEnabled !== undefined) updateData.reportEnabled = Boolean(reportEnabled);
        if (withdrawEnabled !== undefined) updateData.withdrawEnabled = Boolean(withdrawEnabled);
        if (name) updateData.name = name;
        if (area) updateData.area = area;
        if (population !== undefined) updateData.population = Number(population);
        if (councilor !== undefined) updateData.councilor = councilor;

        updatedWard = await prisma.ward.update({
          where: { id: targetId },
          data: updateData,
          include: {
            cityCorp: { select: { id: true, name: true, code: true } },
          },
        });
      } catch (e: any) {
        console.warn("[Ward Update Notice] Fallback to memory store:", e.message);
      }

      // Memory store fallback
      const memWard = memoryDb.wards.find((w: StoredWard) => w.id === targetId);
      if (memWard) {
        if (reportEnabled !== undefined) memWard.reportEnabled = Boolean(reportEnabled);
        if (withdrawEnabled !== undefined) memWard.withdrawEnabled = Boolean(withdrawEnabled);
        if (name) memWard.name = name;
        if (area) memWard.area = area;
        if (population !== undefined) memWard.population = Number(population);
        if (councilor !== undefined) memWard.councilor = councilor;
      }

      return res.status(200).json(updatedWard || memWard || { success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "PATCH"] }
);

