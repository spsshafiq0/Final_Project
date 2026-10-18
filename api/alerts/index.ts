import type { VercelResponse } from "@vercel/node";
import prisma from "../../lib/prisma";
import { apiHandler, AuthenticatedRequest } from "../../lib/middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser) => {
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

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        include: {
          bin: true,
          ward: {
            select: { id: true, name: true, area: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return res.status(200).json(alerts);
    }

    if (req.method === "POST") {
      const { type, message, priority = "medium", wardId, binId } = req.body || {};

      if (!type || !message) {
        return res.status(400).json({ error: "Type and message are required" });
      }

      const alert = await prisma.alert.create({
        data: {
          type,
          message,
          priority,
          wardId: wardId || null,
          binId: binId || null,
        },
        include: {
          bin: true,
          ward: true,
        },
      });

      return res.status(201).json(alert);
    }

    if (req.method === "PUT") {
      const { id, resolved = true } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: "Alert ID is required" });
      }

      const updated = await prisma.alert.update({
        where: { id },
        data: { resolved: Boolean(resolved) },
      });

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT"] }
);
