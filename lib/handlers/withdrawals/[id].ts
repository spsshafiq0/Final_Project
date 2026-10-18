import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Withdrawal ID is required" });
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        citizen: true,
        ward: {
          include: { cityCorp: true },
        },
      },
    });

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    if (req.method === "GET") {
      return res.status(200).json(withdrawal);
    }

    if (req.method === "PUT") {
      if (!currentUser || !["WARD_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
        return res.status(403).json({ error: "Only authorized Ward or City Admins can disburse cash withdrawals" });
      }

      // Check ward jurisdiction for Ward Admin
      if (currentUser.role === "WARD_ADMIN" && currentUser.wardId && currentUser.wardId !== withdrawal.wardId) {
        return res.status(403).json({ error: "You can only process withdrawals registered for your assigned ward" });
      }

      const rawStatus = req.body?.status || (req.body?.action === "pay" ? "paid" : req.body?.action === "reject" ? "rejected" : undefined);
      const status = rawStatus;
      const { verificationCode, notes } = req.body || {};

      if (!status || !["approved", "paid", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Valid status (approved, paid, rejected) is required" });
      }

      // If paying cash, verify code if passed
      if (status === "paid") {
        if (verificationCode && verificationCode.trim().toUpperCase() !== withdrawal.verificationCode.trim().toUpperCase()) {
          return res.status(400).json({ error: "Verification code does not match the voucher code" });
        }
      }

      // If already paid, prevent double payout
      if (withdrawal.status === "paid") {
        return res.status(400).json({ error: "This withdrawal voucher has already been paid out" });
      }

      // If rejecting, refund points to citizen!
      if (status === "rejected" && withdrawal.status !== "rejected") {
        await prisma.user.update({
          where: { id: withdrawal.citizenId },
          data: { points: { increment: withdrawal.points } },
        });
      }

      const updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status,
          processedById: currentUser.userId,
          paidAt: status === "paid" ? new Date() : undefined,
          notes: notes !== undefined ? notes : withdrawal.notes,
        },
        include: {
          citizen: { select: { id: true, fullName: true, phone: true } },
          ward: true,
          processedBy: { select: { id: true, fullName: true, username: true } },
        },
      });

      return res.status(200).json({
        message: status === "paid" ? `৳${withdrawal.amount} cash successfully disbursed to citizen` : "Withdrawal request updated",
        withdrawal: updated,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT"] }
);
