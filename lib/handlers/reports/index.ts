import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredWasteReport } from "../../store";
import { sanitizeString } from "../../security";

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
            citizen: { select: { id: true, fullName: true, phone: true, email: true } },
            ward: { select: { id: true, name: true, area: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
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
          citizen: citizen ? { id: citizen.id, fullName: citizen.fullName, phone: citizen.phone, email: citizen.email } : null,
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

      // Duplicate Check (Anti-Spam / Anti-Farming): Prevent multiple reports from same location
      try {
        const existingReport = await prisma.wasteReport.findFirst({
          where: {
            location: { equals: cleanLocation, mode: "insensitive" },
            status: { in: ["pending", "investigating"] },
          },
        });
        if (existingReport) {
          return res.status(409).json({
            error: `An active issue has already been reported at this location [${existingReport.reportCode}]. Our collection team is already on it. Thank you!`,
          });
        }
      } catch {
        const memDup = (memoryDb.wasteReports || []).find(
          (r: StoredWasteReport) =>
            r.location.toLowerCase().trim() === cleanLocation.toLowerCase().trim() &&
            (r.status === "pending" || r.status === "investigating")
        );
        if (memDup) {
          return res.status(409).json({
            error: `An active issue has already been reported at this location [${memDup.reportCode}]. Our collection team is already on it. Thank you!`,
          });
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
            wardId: wardId || undefined,
            truckType: targetTruckType,
            driverId: { not: null },
          },
          include: { driver: true },
        }).catch(() => null);

        const driverNotice = assignedTrack?.driver?.fullName
          ? `Dispatched to Driver ${assignedTrack.driver.fullName} (${assignedTrack.truckId} - ${targetTruckType} Waste)`
          : `Dispatched to nearest ${targetTruckType} Waste truck`;

        await prisma.alert.create({
          data: {
            type: isHazardous ? "hazardous_pickup" : "waste_pickup",
            message: `[${targetTruckType} TRUCK NOTICE] ${wasteType} reported at ${cleanLocation} (${reportCode}). ${driverNotice}.`,
            priority: isHazardous ? "critical" : "high",
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

      // If critical, create alert in memory
      if (priority === "critical" || priority === "urgent") {
        memoryDb.alerts.unshift({
          id: `alt-${Date.now()}`,
          type: "overflow",
          message: `Citizen Report [${reportCode}]: ${description.slice(0, 80)} at ${location}`,
          priority: priority === "critical" ? "critical" : "high",
          resolved: false,
          wardId: wardId || null,
          createdAt: new Date().toISOString(),
        });
      }

      return res.status(201).json({
        success: true,
        message: "Report submitted successfully! 150 reward points credited.",
        report: createdReport || memReport,
        pointsAwarded: pointsEarned,
      });
    }

    // ── PUT: Update Report Status ───────────────────────────────────────
    if (req.method === "PUT") {
      const { id, status } = req.body || {};
      if (!id || !status) {
        return res.status(400).json({ error: "Report ID and new status are required" });
      }

      try {
        const updated = await prisma.wasteReport.update({
          where: { id },
          data: { status },
        });
        return res.status(200).json({ success: true, report: updated });
      } catch (e: any) {
        console.warn("[Reports PUT Notice] Falling back to memory store:", e.message);
      }

      const memIndex = (memoryDb.wasteReports || []).findIndex((r: any) => r.id === id);
      if (memIndex >= 0) {
        memoryDb.wasteReports[memIndex].status = status;
        return res.status(200).json({ success: true, report: memoryDb.wasteReports[memIndex] });
      }

      return res.status(404).json({ error: "Report not found" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT"] }
);
