import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredWalletTransaction } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const targetUserId = currentUser?.userId || (req.query.userId as string) || req.body?.userId;

    if (!targetUserId) {
      return res.status(401).json({ error: "Authentication required for wallet operations" });
    }

    // ── GET: Wallet Balance and Transaction History ─────────────────────
    if (req.method === "GET") {
      try {
        const user = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, fullName: true, username: true, walletBalance: true },
        });

        const transactions = await prisma.walletTransaction.findMany({
          where: { userId: targetUserId },
          orderBy: { createdAt: "desc" },
          take: 30,
        });

        return res.status(200).json({
          walletBalance: user?.walletBalance ?? 0,
          transactions: transactions || [],
        });
      } catch (e: any) {
        console.warn("[Wallet GET Notice] Falling back to memory store:", e.message);
      }

      const memUser = (memoryDb.users || []).find((u: any) => u.id === targetUserId);
      const memTransactions = (memoryDb.walletTransactions || [])
        .filter((t: StoredWalletTransaction) => t.userId === targetUserId)
        .reverse();

      return res.status(200).json({
        walletBalance: memUser?.walletBalance ?? 0,
        transactions: memTransactions,
      });
    }

    // ── POST: Add Money / Deposit ───────────────────────────────────────
    if (req.method === "POST") {
      const { amount, paymentMethod = "bKash", trxId, accountNumber, description } = req.body || {};

      const depositAmount = Number(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ error: "Please enter a valid deposit amount greater than 0" });
      }

      const generatedTrxId = trxId || `TRX-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const note = description || `Deposit via ${paymentMethod} (${accountNumber ? `A/C: ${accountNumber}` : "Instant Gateway"})`;

      try {
        // Update DB user wallet balance
        const updatedUser = await prisma.user.update({
          where: { id: targetUserId },
          data: { walletBalance: { increment: depositAmount } },
          select: { id: true, fullName: true, username: true, walletBalance: true },
        });

        const transaction = await prisma.walletTransaction.create({
          data: {
            userId: targetUserId,
            type: "DEPOSIT",
            amount: depositAmount,
            paymentMethod,
            trxId: generatedTrxId,
            status: "COMPLETED",
            description: note,
          },
        });

        return res.status(200).json({
          success: true,
          message: `Successfully deposited ৳${depositAmount.toFixed(2)} to your wallet!`,
          walletBalance: updatedUser.walletBalance,
          transaction,
        });
      } catch (e: any) {
        console.warn("[Wallet POST Notice] Falling back to memory store:", e.message);
      }

      // Memory store fallback
      const memUser = (memoryDb.users || []).find((u: any) => u.id === targetUserId);
      const newBalance = ((memUser?.walletBalance || 0) + depositAmount);
      if (memUser) {
        memUser.walletBalance = newBalance;
      }

      const memTrx: StoredWalletTransaction = {
        id: `trx-${Date.now()}`,
        userId: targetUserId,
        type: "DEPOSIT",
        amount: depositAmount,
        paymentMethod,
        trxId: generatedTrxId,
        status: "COMPLETED",
        description: note,
        createdAt: new Date().toISOString(),
      };

      if (!memoryDb.walletTransactions) memoryDb.walletTransactions = [];
      memoryDb.walletTransactions.push(memTrx);

      return res.status(200).json({
        success: true,
        message: `Successfully deposited ৳${depositAmount.toFixed(2)} to your wallet!`,
        walletBalance: newBalance,
        transaction: memTrx,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
