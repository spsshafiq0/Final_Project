import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";
import { logAudit } from "../../audit";

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
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isCityAdmin = currentUser?.role === "CITY_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN";

      if (!isSuper && !isCityAdmin && !isWardAdmin) {
        return res.status(403).json({ error: "Forbidden: Only Ward Administrators or authorized staff can process cash disbursements" });
      }

      if (isWardAdmin && currentUser.wardId && withdrawal.wardId && withdrawal.wardId !== currentUser.wardId) {
        return res.status(403).json({ error: "Forbidden: You are only authorized to process cash withdrawals within your assigned Ward" });
      }

      const rawStatus = req.body?.status || (req.body?.action === "pay" ? "paid" : req.body?.action === "reject" ? "rejected" : undefined);
      const status = rawStatus || "paid";

      // If already paid, prevent double payout
      if (withdrawal.status === "paid" && status === "paid") {
        return res.status(400).json({ error: "This cash withdrawal request has already been paid out and settled" });
      }

      withdrawal.status = status;
      withdrawal.paidAt = status === "paid" ? new Date().toISOString() : null;
      withdrawal.processedById = currentUser?.userId || null;

      try {
        await prisma.withdrawalRequest.update({
          where: { id },
          data: {
            status,
            paidAt: status === "paid" ? new Date() : null,
            processedById: currentUser?.userId || null,
          },
        }).catch(() => null);

        // Deduct citizen points upon payout if citizenId is valid
        if (status === "paid" && withdrawal.citizenId && withdrawal.points > 0) {
          await prisma.user.update({
            where: { id: withdrawal.citizenId },
            data: { points: { decrement: withdrawal.points } },
          }).catch(() => null);

          // Update memoryDb citizen points
          const memCitizen = memoryDb.users.find((u: any) => u.id === withdrawal.citizenId);
          if (memCitizen) {
            memCitizen.points = Math.max(0, (memCitizen.points || 0) - withdrawal.points);
          }
        }
      } catch (err: any) {
        console.warn("[Withdrawal Process DB Warning]", err.message);
      }

      await logAudit({
        userId: currentUser?.userId || null,
        action: `WITHDRAWAL_${status.toUpperCase()}`,
        resource: "withdrawals",
        details: `Withdrawal code ${withdrawal.verificationCode} (${withdrawal.points} pts = ৳${withdrawal.amount}) marked as ${status} by ${currentUser?.username || "admin"}`,
        ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
      });

      return res.status(200).json({
        message: `Withdrawal successfully marked as ${status}`,
        withdrawal,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT"] }
);
