import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Only Super Admin can view system audit logs" });
    }

    if (req.method === "GET") {
      try {
        const logs = await prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        });

        if (logs && logs.length > 0) {
          return res.status(200).json(logs);
        }
      } catch (err: any) {
        console.warn("[Audit Logs DB Notice]", err.message);
      }

      return res.status(200).json(memoryDb.auditLogs || []);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { requireAuth: true, allowedMethods: ["GET"] }
);
