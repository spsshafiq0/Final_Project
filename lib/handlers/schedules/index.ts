import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredPickupSchedule } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List Pickup Schedules ─────────────────────────────────────
    if (req.method === "GET") {
      const wardId = req.query.wardId as string | undefined;
      const cityCorpId = req.query.cityCorpId as string | undefined;
      const status = req.query.status as string | undefined;
      const isPublic = req.query.public === "true" || currentUser?.role === "CITIZEN";

      const whereClause: any = {};
      if (wardId) whereClause.wardId = wardId;
      if (cityCorpId) whereClause.cityCorpId = cityCorpId;
      if (isPublic) {
        whereClause.status = "CONFIRMED";
      } else if (status) {
        whereClause.status = status;
      }

      try {
        const schedules = await prisma.pickupSchedule.findMany({
          where: whereClause,
          include: {
            ward: { select: { id: true, name: true, area: true } },
            cityCorp: { select: { id: true, name: true, code: true } },
          },
          orderBy: { date: "asc" },
        });

        if (schedules && schedules.length > 0) {
          return res.status(200).json(schedules);
        }
      } catch (e: any) {
        console.warn("[Schedules GET Notice] Fallback to memory store:", e.message);
      }

      // Memory store fallback
      let list = memoryDb.schedules || [];
      if (isPublic) {
        list = list.filter((s: StoredPickupSchedule) => s.status === "CONFIRMED");
      } else if (status) {
        list = list.filter((s: StoredPickupSchedule) => s.status === status);
      }
      if (wardId) {
        list = list.filter((s: StoredPickupSchedule) => s.wardId === wardId);
      }

      // Default sample slots if list is empty
      if (list.length === 0) {
        list = [
          { id: "sch-1", date: "Tue, Sep 12", time: "8:00 – 11:00 AM", wasteType: "Organic", zone: "Mohammadpur", status: "CONFIRMED", available: true, createdAt: new Date().toISOString() },
          { id: "sch-2", date: "Thu, Sep 14", time: "9:00 – 12:00 PM", wasteType: "Recyclable", zone: "Mohammadpur", status: "CONFIRMED", available: true, createdAt: new Date().toISOString() },
          { id: "sch-3", date: "Sat, Sep 16", time: "7:00 – 10:00 AM", wasteType: "General", zone: "Mohammadpur", status: "CONFIRMED", available: true, createdAt: new Date().toISOString() },
          { id: "sch-4", date: "Mon, Sep 18", time: "10:00 – 1:00 PM", wasteType: "Hazardous", zone: "Mohammadpur", status: "CONFIRMED", available: true, createdAt: new Date().toISOString() },
        ];
        memoryDb.schedules = list;
      }

      return res.status(200).json(list);
    }

    // ── POST: Create Schedule ──────────────────────────────────────────
    if (req.method === "POST") {
      const {
        date,
        time,
        wasteType = "General",
        zone = "City Zone",
        wardId,
        cityCorpId,
      } = req.body || {};

      if (!date || !time) {
        return res.status(400).json({ error: "Date and time slot are required" });
      }

      // If created by Ward Admin, it requires City Admin confirmation:
      // If created by City Admin or Super Admin, it is instantly CONFIRMED
      const isWardAdmin = currentUser?.role === "WARD_ADMIN";
      const initialStatus = isWardAdmin ? "PENDING_APPROVAL" : "CONFIRMED";

      const finalWardId = wardId || currentUser?.wardId || null;
      const finalCityCorpId = cityCorpId || currentUser?.cityCorpId || null;

      let createdSchedule: any = null;

      try {
        createdSchedule = await prisma.pickupSchedule.create({
          data: {
            date,
            time,
            wasteType,
            zone,
            status: initialStatus,
            available: true,
            wardId: finalWardId,
            cityCorpId: finalCityCorpId,
            createdById: currentUser?.userId || null,
            createdByRole: currentUser?.role || (isWardAdmin ? "WARD_ADMIN" : "CITY_ADMIN"),
          },
          include: {
            ward: { select: { id: true, name: true, area: true } },
          },
        });
      } catch (e: any) {
        console.warn("[Schedules POST Notice] Fallback to memory store:", e.message);
      }

      const memSchedule: StoredPickupSchedule = {
        id: createdSchedule?.id || `sch-${Date.now()}`,
        date,
        time,
        wasteType,
        zone,
        status: initialStatus,
        available: true,
        wardId: finalWardId,
        cityCorpId: finalCityCorpId,
        createdById: currentUser?.userId || null,
        createdByRole: currentUser?.role || (isWardAdmin ? "WARD_ADMIN" : "CITY_ADMIN"),
        createdAt: new Date().toISOString(),
      };

      if (!memoryDb.schedules) memoryDb.schedules = [];
      memoryDb.schedules.unshift(memSchedule);

      return res.status(201).json(createdSchedule || memSchedule);
    }

    // ── PUT: Approve / Confirm / Reject / Update Schedule ──────────────
    if (req.method === "PUT" || req.method === "PATCH") {
      const { id, scheduleId, status, available } = req.body || {};
      const targetId = String(scheduleId || id || req.query.id);

      if (!targetId) {
        return res.status(400).json({ error: "Schedule ID is required" });
      }

      let updatedSchedule: any = null;

      try {
        const updateData: any = {};
        if (status) updateData.status = status; // "CONFIRMED" | "REJECTED" | "PENDING_APPROVAL"
        if (available !== undefined) updateData.available = Boolean(available);

        updatedSchedule = await prisma.pickupSchedule.update({
          where: { id: targetId },
          data: updateData,
        });
      } catch (e: any) {
        console.warn("[Schedule Update Notice] Fallback to memory store:", e.message);
      }

      const memSchedule = (memoryDb.schedules || []).find((s: StoredPickupSchedule) => s.id === targetId);
      if (memSchedule) {
        if (status) memSchedule.status = status;
        if (available !== undefined) memSchedule.available = Boolean(available);
      }

      return res.status(200).json(updatedSchedule || memSchedule || { success: true });
    }

    // ── DELETE: Remove Schedule ─────────────────────────────────────────
    if (req.method === "DELETE") {
      const targetId = String(req.query.id || req.body?.id);
      if (!targetId) {
        return res.status(400).json({ error: "Schedule ID is required" });
      }

      try {
        await prisma.pickupSchedule.delete({ where: { id: targetId } });
      } catch {}

      if (memoryDb.schedules) {
        memoryDb.schedules = memoryDb.schedules.filter((s: StoredPickupSchedule) => s.id !== targetId);
      }

      return res.status(200).json({ success: true, message: "Schedule removed" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }
);
