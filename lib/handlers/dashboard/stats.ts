import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    let cityCorpId = req.query.cityCorpId as string | undefined;
    let wardId = req.query.wardId as string | undefined;

    if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
      cityCorpId = currentUser.cityCorpId;
    } else if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
      wardId = currentUser.wardId;
    }

    // Build filter objects
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

    // Fetch counts and aggregations in parallel
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

    // Average fill level
    const binFills = await prisma.bin.aggregate({
      where: binFilter,
      _avg: { fill: true },
    });

    const averageFill = Math.round(binFills._avg.fill || 0);
    const efficiency = totalBins > 0 ? Math.round(((totalBins - criticalBins - fireBins) / totalBins) * 100) : 94;

    return res.status(200).json({
      overview: {
        totalCityCorps,
        totalWards,
        totalBins,
        totalTracks,
        activeTrucks: activeTracks,
        unresolvedAlerts,
        totalUsers,
        averageFill,
        collectionEfficiency: efficiency,
        wasteCollectedToday: `${Math.round(totalBins * 0.12 * 10) / 10} Tons`,
      },
      bins: {
        total: totalBins,
        normal: normalBins,
        warning: warningBins,
        critical: criticalBins,
        fire: fireBins,
      },
      trucks: {
        total: totalTracks,
        active: activeTracks,
        idle: idleTracks,
        maintenance: totalTracks - activeTracks - idleTracks,
      },
      pickups: {
        total: totalPickups,
        open: openPickups,
      },
    });
  },
  { allowedMethods: ["GET"] }
);
