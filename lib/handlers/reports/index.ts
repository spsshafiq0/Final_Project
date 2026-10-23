import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredWasteReport } from "../../store";
import { sanitizeString } from "../../security";

// Haversine distance calculator in Kilometers
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List Waste Issue Reports ───────────────────────────────────
    if (req.method === "GET") {
      const wardId = req.query.wardId as string | undefined;
      const citizenId = req.query.citizenId as string | undefined;
      const status = req.query.status as string | undefined;

      const whereClause: any = {};
      if (wardId) whereClause.wardId = wardId;
      if (citizenId) whereClause.citizenId = citizenId;
      if (status) whereClause.status = status;

      if (currentUser?.role === "CITIZEN") {
        whereClause.citizenId = currentUser.userId;
      } else if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.wardId = currentUser.wardId;
      }

      try {
        const reports = await prisma.wasteReport.findMany({
          where: whereClause,
          include: {
            citizen: { select: { id: true, fullName: true, phone: true, email: true, points: true } },
            ward: { select: { id: true, name: true, area: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 60,
        });

        if (reports && reports.length > 0) {
          return res.status(200).json(reports);
        }
      } catch (e: any) {
        console.warn("[Reports GET Notice] Operating on resilient store:", e.message);
      }

      // In-memory store fallback
      let memReports = [...(memoryDb.wasteReports || [])];
      if (wardId) memReports = memReports.filter((r: StoredWasteReport) => r.wardId === wardId);
      if (citizenId) memReports = memReports.filter((r: StoredWasteReport) => r.citizenId === citizenId);
      if (status) memReports = memReports.filter((r: StoredWasteReport) => r.status === status);

      const enriched = memReports.map((r: StoredWasteReport) => {
        const citizen = memoryDb.users.find((u: any) => u.id === r.citizenId);
        const ward = memoryDb.wards.find((w: any) => w.id === r.wardId);
        return {
          ...r,
          citizen: citizen ? { id: citizen.id, fullName: citizen.fullName, phone: citizen.phone, email: citizen.email, points: citizen.points } : null,
          ward: ward ? { id: ward.id, name: ward.name, area: ward.area } : null,
        };
      });

      return res.status(200).json(enriched);
    }

    // ── POST: Submit Citizen Waste Report ──────────────────────────────
    if (req.method === "POST") {
      const {
        location,
        description,
        imageUrl,
        wasteType = "Mixed",
        priority = "normal",
        wardId,
        citizenId,
        lat,
        lng,
      } = req.body || {};

      const cleanLocation = sanitizeString(location, 150);
      const cleanDescription = sanitizeString(description, 1000);

      if (!cleanLocation || !cleanDescription) {
        return res.status(400).json({ error: "Location and description are required" });
      }

      // Mandatory Photo validation
      if (!imageUrl || String(imageUrl).trim() === "") {
        return res.status(400).json({
          error: "Photo upload is mandatory. Please capture or upload a clear photo of the waste issue.",
        });
      }

      // Check if Ward Admin disabled reporting for this ward
      if (wardId) {
        try {
          const targetWard = await prisma.ward.findUnique({ where: { id: wardId } });
          if (targetWard && targetWard.reportEnabled === false) {
            return res.status(403).json({
              error: "Issue reporting is temporarily disabled for this Ward by the local administration.",
            });
          }
        } catch {
          const memWard = memoryDb.wards.find((w: any) => w.id === wardId);
          if (memWard && memWard.reportEnabled === false) {
            return res.status(403).json({
              error: "Issue reporting is temporarily disabled for this Ward by the local administration.",
            });
          }
        }
      }

      // ── Precise Coordinate-Based Anti-Duplicate Check ────────────────
      // Allows multiple reports across the same neighborhood/area, but blocks duplicates at the exact same coordinates (within ~30 meters)
      const reportLat = typeof lat === "number" ? lat : parseFloat(lat);
      const reportLng = typeof lng === "number" ? lng : parseFloat(lng);

      if (!isNaN(reportLat) && !isNaN(reportLng) && reportLat !== 0 && reportLng !== 0) {
        try {
          const activeReports = await prisma.wasteReport.findMany({
            where: {
              status: { in: ["pending", "investigating"] },
              lat: { not: null },
              lng: { not: null },
            },
            select: { id: true, reportCode: true, lat: true, lng: true },
          });

          const duplicate = activeReports.find((r: { id: string; reportCode: string; lat: number | null; lng: number | null }) => {
            if (r.lat && r.lng) {
              const dKm = haversineDistanceKm(reportLat, reportLng, r.lat, r.lng);
              return dKm < 0.03; // Within ~30 meters
            }
            return false;
          });

          if (duplicate) {
            return res.status(409).json({
              error: `An active issue has already been reported at this exact coordinate [${duplicate.reportCode}]. Our collection team is already dispatched. Thank you!`,
            });
          }
        } catch {
          const memDup = (memoryDb.wasteReports || []).find((r: StoredWasteReport) => {
            if ((r.status === "pending" || r.status === "investigating") && r.lat && r.lng) {
              const dKm = haversineDistanceKm(reportLat, reportLng, r.lat, r.lng);
              return dKm < 0.03;
            }
            return false;
          });
          if (memDup) {
            return res.status(409).json({
              error: `An active issue has already been reported at this exact coordinate [${memDup.reportCode}]. Our collection team is already dispatched. Thank you!`,
            });
          }
        }
      }

      const finalCitizenId = currentUser?.userId || citizenId;
      if (!finalCitizenId) {
        return res.status(400).json({ error: "Citizen ID is required to submit a report" });
      }

      const reportCode = `RPT-${Date.now().toString().slice(-6)}`;
      
      // Determine points & truck type
      const isHazardous =
        String(wasteType).toLowerCase().includes("hazard") ||
        String(wasteType).toLowerCase().includes("chemical") ||
        String(wasteType).toLowerCase().includes("bio");
      
      const targetTruckType = isHazardous ? "HAZARDOUS" : "NORMAL";
      const pointsEarned = isHazardous ? 200 : 150;

      let createdReport: any = null;

      try {
        createdReport = await prisma.wasteReport.create({
          data: {
            reportCode,
            location: cleanLocation,
            description: cleanDescription,
            imageUrl: imageUrl || null,
            wasteType,
            status: "pending",
            priority: isHazardous ? "critical" : priority,
            pointsEarned,
            citizenId: finalCitizenId,
            wardId: wardId || null,
            lat: !isNaN(reportLat) && reportLat !== 0 ? reportLat : null,
            lng: !isNaN(reportLng) && reportLng !== 0 ? reportLng : null,
          },
          include: {
            citizen: { select: { id: true, fullName: true, phone: true } },
            ward: { select: { id: true, name: true, area: true } },
          },
        });

        // Credit points to citizen
        await prisma.user.update({
          where: { id: finalCitizenId },
          data: { points: { increment: pointsEarned } },
        }).catch(() => null);

        // Dispatch alert to assigned driver matching truckType
        const assignedTrack = await prisma.track.findFirst({
          where: {
            ...(wardId ? { wardId } : {}),
            truckType: targetTruckType,
          },
        });

        const alertMessage = isHazardous
          ? `☣️ HAZARDOUS WASTE DETECTED: [${reportCode}] at ${cleanLocation}. Immediate dispatch assigned to ${assignedTrack?.truckId || "Hazardous Unit"}.`
          : `🚛 New Waste Issue [${reportCode}]: ${cleanLocation}. Assigned to ${assignedTrack?.truckId || "Area Truck"}.`;

        await prisma.alert.create({
          data: {
            type: isHazardous ? "fire" : "overflow",
            message: alertMessage,
            priority: isHazardous ? "critical" : priority,
            wardId: wardId || null,
          },
        }).catch(() => null);

      } catch (e: any) {
        console.warn("[Reports POST Notice] Operating on resilient store:", e.message);
      }

      // Persist to in-memory store
      const memReport: StoredWasteReport = {
        id: createdReport?.id || `rpt-${Date.now()}`,
        reportCode,
        location: cleanLocation,
        description: cleanDescription,
        imageUrl: imageUrl || null,
        lat: !isNaN(reportLat) && reportLat !== 0 ? reportLat : null,
        lng: !isNaN(reportLng) && reportLng !== 0 ? reportLng : null,
        wasteType,
        status: "pending",
        priority: (priority as any) || "normal",
        pointsEarned,
        citizenId: finalCitizenId,
        wardId: wardId || null,
        createdAt: new Date().toISOString(),
      };

      if (!memoryDb.wasteReports) memoryDb.wasteReports = [];
      memoryDb.wasteReports.unshift(memReport);

      // Award points in memory
      const memUser = memoryDb.users.find((u: any) => u.id === finalCitizenId);
      if (memUser) {
        memUser.points = (memUser.points || 0) + pointsEarned;
      }

      return res.status(201).json({
        success: true,
        message: `Report submitted successfully! ${pointsEarned} reward points credited.`,
        report: createdReport || memReport,
        pointsAwarded: pointsEarned,
      });
    }

    // ── PUT: Update Report Status / Flag Fake Dumping ────────────────────
    if (req.method === "PUT") {
      const { id, status, isFakeReport, fakeReason, reportedFakeByDriverId } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: "Report ID is required" });
      }

      const shouldFlagFake = isFakeReport === true || status === "FAKE_REPORT";

      try {
        const existing = await prisma.wasteReport.findUnique({
          where: { id },
          include: { citizen: true },
        });

        if (!existing) {
          return res.status(404).json({ error: "Report not found" });
        }

        let pointsDeducted = 0;
        let pointsRevoked = existing.pointsRevoked;

        // If flagged as fake and points have not yet been revoked:
        if (shouldFlagFake && !existing.pointsRevoked && existing.citizenId) {
          pointsDeducted = existing.pointsEarned || 150;
          const newPoints = Math.max(0, (existing.citizen?.points || 0) - pointsDeducted);

          await prisma.user.update({
            where: { id: existing.citizenId },
            data: { points: newPoints },
          }).catch(() => null);

          pointsRevoked = true;
        }

        const updated = await prisma.wasteReport.update({
          where: { id },
          data: {
            status: shouldFlagFake ? "FAKE_REPORT" : (status || existing.status),
            isFakeReport: shouldFlagFake ? true : existing.isFakeReport,
            fakeReason: fakeReason || existing.fakeReason,
            reportedFakeByDriverId: reportedFakeByDriverId || currentUser?.userId || existing.reportedFakeByDriverId,
            pointsRevoked,
          },
          include: {
            citizen: { select: { id: true, fullName: true, phone: true, points: true } },
          },
        });

        return res.status(200).json({
          success: true,
          report: updated,
          pointsDeducted: pointsDeducted > 0 ? pointsDeducted : undefined,
          message: shouldFlagFake
            ? `Report flagged as fraudulent. ${pointsDeducted} reward points deducted from citizen account.`
            : "Report status updated successfully.",
        });
      } catch (e: any) {
        console.warn("[Reports PUT Notice] Falling back to memory store:", e.message);
      }

      // Memory store fallback
      const memIndex = (memoryDb.wasteReports || []).findIndex((r: any) => r.id === id);
      if (memIndex >= 0) {
        const memRep = memoryDb.wasteReports[memIndex];
        let pointsDeducted = 0;

        if (shouldFlagFake && !memRep.pointsRevoked && memRep.citizenId) {
          pointsDeducted = memRep.pointsEarned || 150;
          const memUser = memoryDb.users.find((u: any) => u.id === memRep.citizenId);
          if (memUser) {
            memUser.points = Math.max(0, (memUser.points || 0) - pointsDeducted);
          }
          memRep.pointsRevoked = true;
        }

        memRep.status = shouldFlagFake ? "FAKE_REPORT" : (status || memRep.status);
        memRep.isFakeReport = shouldFlagFake;
        memRep.fakeReason = fakeReason || memRep.fakeReason;

        return res.status(200).json({
          success: true,
          report: memRep,
          pointsDeducted: pointsDeducted > 0 ? pointsDeducted : undefined,
          message: shouldFlagFake
            ? `Report flagged as fraudulent. ${pointsDeducted} reward points deducted from citizen account.`
            : "Report status updated successfully.",
        });
      }

      return res.status(404).json({ error: "Report not found" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT"] }
);
