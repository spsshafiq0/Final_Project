import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    let cityCorpId = req.query.cityCorpId as string | undefined;
    let wardId = req.query.wardId as string | undefined;

    if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
      cityCorpId = currentUser.cityCorpId;
    } else if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
      wardId = currentUser.wardId;
    }

    // 1. Try Prisma DB
    try {
      const binFilter: any = {};
      const trackFilter: any = {};
      const wardFilter: any = {};
      const alertFilter: any = { resolved: false };

      if (wardId) {
        binFilter.wardId = wardId;
        trackFilter.wardId = wardId;
        wardFilter.id = wardId;
        alertFilter.wardId = wardId;
      } else if (cityCorpId) {
        binFilter.ward = { cityCorpId };
        trackFilter.ward = { cityCorpId };
        wardFilter.cityCorpId = cityCorpId;
        alertFilter.ward = { cityCorpId };
      }

      const [
        totalCityCorps,
        totalWards,
        totalBins,
        normalBins,
        warningBins,
        criticalBins,
        fireBins,
        totalTracks,
        activeTracks,
        idleTracks,
        unresolvedAlerts,
        totalPickups,
        openPickups,
        totalUsers,
      ] = await Promise.all([
        prisma.cityCorporation.count({ where: { active: true } }),
        prisma.ward.count({ where: wardFilter }),
        prisma.bin.count({ where: binFilter }),
        prisma.bin.count({ where: { ...binFilter, status: "normal" } }),
        prisma.bin.count({ where: { ...binFilter, status: "warning" } }),
        prisma.bin.count({ where: { ...binFilter, status: "critical" } }),
        prisma.bin.count({ where: { ...binFilter, status: "fire" } }),
        prisma.track.count({ where: trackFilter }),
        prisma.track.count({ where: { ...trackFilter, status: "active" } }),
        prisma.track.count({ where: { ...trackFilter, status: "idle" } }),
        prisma.alert.count({ where: alertFilter }),
        prisma.pickupRequest.count(),
        prisma.pickupRequest.count({ where: { status: "open" } }),
        prisma.user.count({ where: { active: true } }),
      ]);

      if (totalCityCorps > 0 || totalWards > 0) {
        return res.status(200).json({
          cityCorps: { total: totalCityCorps },
          wards: { total: totalWards },
          bins: {
            total: totalBins,
            normal: normalBins,
            warning: warningBins,
            critical: criticalBins,
            fire: fireBins,
            needAttention: criticalBins + fireBins,
          },
          tracks: {
            total: totalTracks,
            active: activeTracks,
            idle: idleTracks,
          },
          alerts: {
            unresolved: unresolvedAlerts,
          },
          pickups: {
            total: totalPickups,
            open: openPickups,
          },
          users: {
            total: totalUsers,
          },
        });
      }
    } catch (e: any) {
      console.warn("[Dashboard Stats Notice] Fallback to memory store:", e.message);
    }

    // 2. Memory store fallback
    let bins = memoryDb.bins;
    let tracks = memoryDb.tracks;
    let wards = memoryDb.wards;
    let alerts = memoryDb.alerts;

    if (wardId) {
      bins = bins.filter((b: any) => b.wardId === wardId);
      tracks = tracks.filter((t: any) => t.wardId === wardId);
      wards = wards.filter((w: any) => w.id === wardId);
      alerts = alerts.filter((a: any) => a.wardId === wardId);
    } else if (cityCorpId) {
      const wardIds = memoryDb.wards.filter((w: any) => w.cityCorpId === cityCorpId).map((w: any) => w.id);
      bins = bins.filter((b: any) => wardIds.includes(b.wardId));
      tracks = tracks.filter((t: any) => wardIds.includes(t.wardId));
      wards = wards.filter((w: any) => w.cityCorpId === cityCorpId);
      alerts = alerts.filter((a: any) => wardIds.includes(a.wardId));
    }

    const criticalBins = bins.filter((b: any) => b.status === "critical").length;
    const fireBins = bins.filter((b: any) => b.status === "fire").length;

    return res.status(200).json({
      cityCorps: { total: memoryDb.cities.length },
      wards: { total: wards.length },
      bins: {
        total: bins.length,
        normal: bins.filter((b: any) => b.status === "normal").length,
        warning: bins.filter((b: any) => b.status === "warning").length,
        critical: criticalBins,
        fire: fireBins,
        needAttention: criticalBins + fireBins,
      },
      tracks: {
        total: tracks.length,
        active: tracks.filter((t: any) => t.status === "active").length,
        idle: tracks.filter((t: any) => t.status === "idle").length,
      },
      alerts: {
        unresolved: alerts.filter((a: any) => !a.resolved).length,
      },
      pickups: {
        total: 8,
        open: 3,
      },
      users: {
        total: memoryDb.users.length,
      },
    });
  },
  { allowedMethods: ["GET"] }
);
