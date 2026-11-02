import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredWalletTransaction } from "../../store";
import { logAudit } from "../../audit";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const targetUserId = currentUser?.userId || (req.query.userId as string) || req.body?.userId;

    if (!currentUser && !targetUserId) {
      return res.status(401).json({ error: "Authentication required for wallet operations" });
    }

    const isWardAdmin = currentUser?.role === "WARD_ADMIN";
    const isCityAdmin = currentUser?.role === "CITY_ADMIN";
    const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

    // ── GET: Wallet Balance, Citizen Transactions, or Admin Cash In Queue ──────
    if (req.method === "GET") {
      const { wardId, status, scamOnly, limit = 50 } = req.query as any;

      // 1. If Ward Admin / City Admin / Super Admin requests the Cash In queue
      if ((isWardAdmin || isCityAdmin || isSuperAdmin) && req.query.adminView === "true") {
        const whereClause: any = {};

        if (isWardAdmin && currentUser.wardId) {
          whereClause.wardId = currentUser.wardId;
        } else if (isCityAdmin && currentUser.cityCorpId) {
          whereClause.user = { cityCorpId: currentUser.cityCorpId };
          if (wardId) whereClause.wardId = wardId;
        } else if (wardId) {
          whereClause.wardId = wardId;
        }

        if (scamOnly === "true") {
          whereClause.isScam = true;
        } else if (status && status !== "ALL") {
          whereClause.status = status;
        }

        try {
          const transactions = await prisma.walletTransaction.findMany({
            where: whereClause,
            include: {
              user: {
                select: { id: true, fullName: true, username: true, phone: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: Number(limit),
          });

          const pendingCount = await prisma.walletTransaction.count({
            where: { ...(whereClause.wardId ? { wardId: whereClause.wardId } : {}), status: "PENDING" },
          });
          const scamCount = await prisma.walletTransaction.count({
            where: { ...(whereClause.wardId ? { wardId: whereClause.wardId } : {}), isScam: true },
          });

          return res.status(200).json({
            transactions: transactions || [],
            stats: { pendingCount, scamCount },
          });
        } catch (e: any) {
          console.warn("[Wallet Admin GET Warning] Falling back to memory:", e.message);
        }

        // Memory store fallback for Admin
        let list = memoryDb.walletTransactions || [];
        const activeWard = isWardAdmin ? currentUser.wardId : wardId;
        if (activeWard) list = list.filter((t: any) => t.wardId === activeWard);
        if (scamOnly === "true") {
          list = list.filter((t: any) => t.isScam);
        } else if (status && status !== "ALL") {
          list = list.filter((t: any) => t.status === status);
        }

        const pendingCount = (memoryDb.walletTransactions || []).filter((t: any) => t.status === "PENDING" && (!activeWard || t.wardId === activeWard)).length;
        const scamCount = (memoryDb.walletTransactions || []).filter((t: any) => t.isScam && (!activeWard || t.wardId === activeWard)).length;

        return res.status(200).json({
          transactions: list.slice().reverse(),
          stats: { pendingCount, scamCount },
        });
      }

      // 2. Citizen / Standard User Personal Wallet View
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

    // ── POST: Citizen Initiates Cash In (Deposit Request) ───────────────
    if (req.method === "POST") {
      const {
        amount,
        paymentMethod = "bKash",
        trxId,
        senderNumber,
        accountNumber,
        wardId,
        description,
      } = req.body || {};

      const depositAmount = Number(amount);
      if (isNaN(depositAmount) || depositAmount < 50) {
        return res.status(400).json({ error: "Minimum deposit amount is ৳50." });
      }

      const cleanTrxId = String(trxId || "").trim().toUpperCase();
      const cleanSender = String(senderNumber || accountNumber || "").trim();

      if (!cleanTrxId) {
        return res.status(400).json({ error: "Transaction ID (TrxID) is required." });
      }

      // ── Anti-Scam / Duplicate Check ──────────────────────────────────
      let isDuplicate = false;
      let scamReason = "";

      try {
        const existingTx = await prisma.walletTransaction.findFirst({
          where: {
            trxId: cleanTrxId,
          },
          include: {
            user: { select: { username: true, fullName: true } },
          },
        });

        if (existingTx) {
          isDuplicate = true;
          scamReason = `Duplicate Transaction ID (${cleanTrxId}) previously submitted by user @${existingTx.user?.username || "unknown"}`;
        }
      } catch (e: any) {
        // Check memoryDb for duplicate
        const memExisting = (memoryDb.walletTransactions || []).find(
          (t: any) => t.trxId && t.trxId.toUpperCase() === cleanTrxId
        );
        if (memExisting) {
          isDuplicate = true;
          scamReason = `Duplicate Transaction ID (${cleanTrxId}) already recorded in system.`;
        }
      }

      // Target Ward Determination
      const targetWardId = wardId || currentUser?.wardId || null;

      // If duplicate/scam attempt detected:
      if (isDuplicate) {
        try {
          const scamTx = await prisma.walletTransaction.create({
            data: {
              userId: targetUserId,
              type: "DEPOSIT",
              amount: depositAmount,
              paymentMethod,
              trxId: cleanTrxId,
              senderNumber: cleanSender,
              wardId: targetWardId,
              status: "SCAM_FLAGGED",
              isScam: true,
              scamReason,
              description: `[SCAM ATTEMPT] ${description || scamReason}`,
            },
          });

          await logAudit({
            userId: targetUserId,
            action: "WALLET_SCAM_FLAGGED",
            resource: "wallet",
            details: `Fraud attempt flagged for user ${currentUser?.username || targetUserId}. Reason: ${scamReason}`,
            ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
          });

          return res.status(400).json({
            error: "Security Alert: This Transaction ID has already been submitted. This attempt has been logged into the Security Fraud Watchlist.",
            isScam: true,
            transaction: scamTx,
          });
        } catch (err: any) {
          const memScamTx: StoredWalletTransaction = {
            id: `trx-${Date.now()}`,
            userId: targetUserId,
            type: "DEPOSIT",
            amount: depositAmount,
            paymentMethod,
            trxId: cleanTrxId,
            senderNumber: cleanSender,
            wardId: targetWardId,
            status: "SCAM_FLAGGED",
            isScam: true,
            scamReason,
            description: `[SCAM ATTEMPT] ${description || scamReason}`,
            createdAt: new Date().toISOString(),
          };
          if (!memoryDb.walletTransactions) memoryDb.walletTransactions = [];
          memoryDb.walletTransactions.push(memScamTx);

          return res.status(400).json({
            error: "Security Alert: Duplicate Transaction ID detected and flagged for administrative inspection.",
            isScam: true,
            transaction: memScamTx,
          });
        }
      }

      // Valid, Clean Deposit Request -> Create as PENDING for Ward Admin confirmation
      const note = description || `Deposit via ${paymentMethod} (${cleanSender ? `Sender: ${cleanSender}` : "Manual Payment"})`;

      try {
        const transaction = await prisma.walletTransaction.create({
          data: {
            userId: targetUserId,
            type: "DEPOSIT",
            amount: depositAmount,
            paymentMethod,
            trxId: cleanTrxId,
            senderNumber: cleanSender,
            wardId: targetWardId,
            status: "PENDING",
            isScam: false,
            description: note,
          },
        });

        await logAudit({
          userId: targetUserId,
          action: "WALLET_DEPOSIT_REQUEST",
          resource: "wallet",
          details: `User ${currentUser?.username || targetUserId} requested deposit of ৳${depositAmount} via ${paymentMethod} (TrxID: ${cleanTrxId})`,
          ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
        });

        return res.status(200).json({
          success: true,
          message: `Deposit request for ৳${depositAmount.toFixed(2)} submitted successfully! Please wait for Ward Admin verification.`,
          transaction,
        });
      } catch (e: any) {
        console.warn("[Wallet POST Notice] Falling back to memory store:", e.message);
      }

      // Memory store fallback
      const memTrx: StoredWalletTransaction = {
        id: `trx-${Date.now()}`,
        userId: targetUserId,
        type: "DEPOSIT",
        amount: depositAmount,
        paymentMethod,
        trxId: cleanTrxId,
        senderNumber: cleanSender,
        wardId: targetWardId,
        status: "PENDING",
        isScam: false,
        description: note,
        createdAt: new Date().toISOString(),
      };

      if (!memoryDb.walletTransactions) memoryDb.walletTransactions = [];
      memoryDb.walletTransactions.push(memTrx);

      return res.status(200).json({
        success: true,
        message: `Deposit request for ৳${depositAmount.toFixed(2)} submitted successfully! Please wait for Ward Admin verification.`,
        transaction: memTrx,
      });
    }

    // ── PUT: Ward Admin / City Admin Approves or Rejects Deposit ─────────
    if (req.method === "PUT") {
      if (!isWardAdmin && !isCityAdmin && !isSuperAdmin) {
        return res.status(403).json({ error: "Forbidden: Only authorized Ward Administrators can verify cash-in deposits." });
      }

      const { transactionId, action, rejectReason } = req.body || {};

      if (!transactionId) {
        return res.status(400).json({ error: "Transaction ID is required." });
      }

      if (action !== "approve" && action !== "reject") {
        return res.status(400).json({ error: "Action must be either 'approve' or 'reject'." });
      }

      let tx: any = null;
      try {
        tx = await prisma.walletTransaction.findUnique({
          where: { id: transactionId },
          include: { user: true },
        });
      } catch (e: any) {}

      if (!tx) {
        tx = (memoryDb.walletTransactions || []).find((t: any) => t.id === transactionId);
      }

      if (!tx) {
        return res.status(404).json({ error: "Transaction record not found." });
      }

      if (tx.status === "COMPLETED") {
        return res.status(400).json({ error: "This deposit has already been approved and credited." });
      }

      // Ward restriction check for Ward Admin
      if (isWardAdmin && currentUser.wardId && tx.wardId && tx.wardId !== currentUser.wardId) {
        return res.status(403).json({ error: "Forbidden: You can only verify transactions belonging to your assigned Ward." });
      }

      // If Approved:
      if (action === "approve") {
        try {
          // Increment citizen balance
          const updatedUser = await prisma.user.update({
            where: { id: tx.userId },
            data: { walletBalance: { increment: tx.amount } },
            select: { id: true, username: true, walletBalance: true },
          });

          // Mark transaction as COMPLETED
          const updatedTx = await prisma.walletTransaction.update({
            where: { id: transactionId },
            data: {
              status: "COMPLETED",
              processedById: currentUser.userId,
            },
          });

          await logAudit({
            userId: currentUser.userId,
            action: "WALLET_DEPOSIT_CONFIRMED",
            resource: "wallet",
            details: `Ward Admin confirmed deposit of ৳${tx.amount} (TrxID: ${tx.trxId}) for user ${tx.user?.username || tx.userId}.`,
            ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
          });

          return res.status(200).json({
            success: true,
            message: `Deposit of ৳${tx.amount.toFixed(2)} confirmed and credited to citizen's wallet!`,
            walletBalance: updatedUser.walletBalance,
            transaction: updatedTx,
          });
        } catch (e: any) {
          console.warn("[Wallet PUT Approve DB Warning]:", e.message);
        }

        // Memory store approve fallback
        tx.status = "COMPLETED";
        tx.processedById = currentUser.userId;
        const memCitizen = (memoryDb.users || []).find((u: any) => u.id === tx.userId);
        if (memCitizen) {
          memCitizen.walletBalance = (memCitizen.walletBalance || 0) + tx.amount;
        }

        return res.status(200).json({
          success: true,
          message: `Deposit of ৳${tx.amount.toFixed(2)} confirmed and credited to citizen's wallet!`,
          walletBalance: memCitizen?.walletBalance || tx.amount,
          transaction: tx,
        });
      }

      // If Rejected:
      if (action === "reject") {
        const reason = rejectReason || "Transaction ID could not be verified on mobile banking statement.";

        try {
          const updatedTx = await prisma.walletTransaction.update({
            where: { id: transactionId },
            data: {
              status: "REJECTED",
              rejectReason: reason,
              processedById: currentUser.userId,
            },
          });

          await logAudit({
            userId: currentUser.userId,
            action: "WALLET_DEPOSIT_REJECTED",
            resource: "wallet",
            details: `Deposit of ৳${tx.amount} (TrxID: ${tx.trxId}) rejected. Reason: ${reason}`,
            ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
          });

          return res.status(200).json({
            success: true,
            message: "Deposit request has been rejected.",
            transaction: updatedTx,
          });
        } catch (e: any) {
          console.warn("[Wallet PUT Reject DB Warning]:", e.message);
        }

        tx.status = "REJECTED";
        tx.rejectReason = reason;
        tx.processedById = currentUser.userId;

        return res.status(200).json({
          success: true,
          message: "Deposit request has been rejected.",
          transaction: tx,
        });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT"] }
);
