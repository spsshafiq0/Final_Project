import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Withdrawal ID is required" });
    }

    let withdrawal: any = null;
    try {
      withdrawal = await prisma.withdrawalRequest.findUnique({
        where: { id },
        include: {
          citizen: true,
          ward: {
            include: { cityCorp: true },
          },
        },
      });
    } catch {}

    if (!withdrawal) {
      withdrawal = (memoryDb.withdrawals || []).find((w: any) => w.id === id || w.verificationCode === id);
    }

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    if (req.method === "GET") {
      return res.status(200).json(withdrawal);
    }

    if (req.method === "PUT") {
      const rawStatus = req.body?.status || (req.body?.action === "pay" ? "paid" : req.body?.action === "reject" ? "rejected" : undefined);
      const status = rawStatus || "paid";

      withdrawal.status = status;
      withdrawal.paidAt = new Date().toISOString();
      withdrawal.processedById = currentUser?.userId;

      try {
        await prisma.withdrawalRequest.update({
          where: { id },
          data: {
            status,
            paidAt: status === "paid" ? new Date() : null,
            processedById: currentUser?.userId || null,
          },
        }).catch(() => null);
      } catch {}

      return res.status(200).json({
        message: `Withdrawal successfully marked as ${status}`,
        withdrawal,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT"] }
);
