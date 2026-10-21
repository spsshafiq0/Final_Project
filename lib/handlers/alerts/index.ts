import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredAlert } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List Alerts ───────────────────────────────────────────────
    if (req.method === "GET") {
      let wardId = req.query.wardId as string | undefined;
      const resolved = req.query.resolved !== undefined ? req.query.resolved === "true" : undefined;

      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        wardId = currentUser.wardId;
      }

      const whereClause: any = {};
      if (wardId) whereClause.wardId = wardId;
      if (resolved !== undefined) whereClause.resolved = resolved;
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.ward = { cityCorpId: currentUser.cityCorpId };
      }

      try {
        const alerts = await prisma.alert.findMany({
          where: whereClause,
          include: {
            bin: true,
            ward: { select: { id: true, name: true, area: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });

        if (alerts && alerts.length > 0) {
          return res.status(200).json(alerts);
        }
      } catch (e: any) {
        console.warn("[Alerts GET Notice] Fallback to memory store:", e.message);
      }

      // Memory store fallback
      let memAlerts = [...memoryDb.alerts];
      if (wardId) memAlerts = memAlerts.filter((a: StoredAlert) => a.wardId === wardId);
      if (resolved !== undefined) memAlerts = memAlerts.filter((a: StoredAlert) => a.resolved === resolved);

      const enriched = memAlerts.map((a: StoredAlert) => {
        const ward = memoryDb.wards.find((w: any) => w.id === a.wardId);
        const bin = memoryDb.bins.find((b: any) => b.id === a.binId);
        return {
          ...a,
          ward: ward ? { id: ward.id, name: ward.name, area: ward.area } : null,
          bin: bin || null,
        };
      });

      return res.status(200).json(enriched);
    }

    // ── POST: Create Alert ─────────────────────────────────────────────
    if (req.method === "POST") {
      const { type, message, priority = "medium", wardId, binId } = req.body || {};

      if (!type || !message) {
        return res.status(400).json({ error: "Type and message are required" });
      }

      let createdAlert: any = null;

      try {
        createdAlert = await prisma.alert.create({
          data: {
            type,
            message,
            priority,
            wardId: wardId || null,
            binId: binId || null,
          },
        });
      } catch (dbErr: any) {
        console.warn("[Alert Create Notice] Fallback to memory store:", dbErr.message);
      }

      const memAlert: StoredAlert = {
        id: createdAlert?.id || `alt-${Date.now()}`,
        type,
        message,
        priority: priority as any,
        resolved: false,
        wardId: wardId || null,
        binId: binId || null,
        createdAt: new Date().toISOString(),
      };

      memoryDb.alerts.unshift(memAlert);

      return res.status(201).json(createdAlert || memAlert);
    }

    // ── PATCH / PUT: Resolve Alert ───────────────────────────────────────
    if (req.method === "PATCH" || req.method === "PUT") {
      const id = ((req.query?.id as string) || req.body?.id) as string;
      if (!id) {
        return res.status(400).json({ error: "Alert ID is required" });
      }

      try {
        await prisma.alert.update({
          where: { id },
          data: { resolved: true },
        });
      } catch (dbErr: any) {}

      const idx = memoryDb.alerts.findIndex((a: StoredAlert) => a.id === id);
      if (idx >= 0) memoryDb.alerts[idx].resolved = true;

      return res.status(200).json({ success: true, message: "Alert resolved" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PATCH", "PUT"] }
);
