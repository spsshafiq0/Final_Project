import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredReward, StoredVoucherCode, StoredUser } from "../../store";
import { logAudit } from "../../audit";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // Ensure memoryDb.rewards array exists
    if (!memoryDb.rewards) {
      memoryDb.rewards = [];
    }

    // Helper to generate unique voucher codes
    const generateUniqueCode = (prefix: string = "IW") => {
      const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "IW";
      const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${cleanPrefix}-${p1}-${p2}`;
    };

    // ── GET: List Rewards ─────────────────────────────────────────────────
    if (req.method === "GET") {
      const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "CITY_ADMIN";
      const citizenId = currentUser?.id || (req.query?.citizenId as string);

      if (req.query?.type === "policy" || req.query?.policy === "true") {
        return res.status(200).json({
          couponsGloballyEnabled: memoryDb.couponsGloballyEnabled !== false,
          withdrawGloballyEnabled: memoryDb.withdrawGloballyEnabled !== false,
        });
      }

      if (!isAdmin && memoryDb.couponsGloballyEnabled === false) {
        return res.status(200).json([]);
      }

      if (isAdmin) {
        // Admins see full data including voucher codes and redemption history
        const enriched = memoryDb.rewards.map((r: StoredReward) => {
          const totalCodes = r.codes?.length || 0;
          const availableCodes = r.codes?.filter((c: StoredVoucherCode) => !c.isRedeemed).length || 0;
          const redeemedCodes = totalCodes - availableCodes;
          return {
            ...r,
            totalCodes,
            availableCodes,
            redeemedCodes,
            stockCount: availableCodes,
            available: availableCodes > 0 && r.active,
          };
        });
        return res.status(200).json(enriched);
      }

      // Citizens only see available stock count, without revealing unredeemed codes
      const publicRewards = memoryDb.rewards
        .filter((r: StoredReward) => r.active)
        .map((r: StoredReward) => {
          const availableCodes = r.codes?.filter((c: StoredVoucherCode) => !c.isRedeemed).length || 0;
          // Also find any vouchers this citizen has already redeemed
          const myVouchers = citizenId
            ? (r.codes || [])
                .filter((c: StoredVoucherCode) => c.isRedeemed && c.redeemedByUserId === citizenId)
                .map((c: StoredVoucherCode) => ({
                  id: c.id,
                  code: c.code,
                  rewardName: r.name,
                  partner: r.partner,
                  redeemedAt: c.redeemedAt,
                }))
            : [];

          return {
            id: r.id,
            name: r.name,
            partner: r.partner,
            points: r.points,
            icon: r.icon,
            category: r.category,
            description: r.description,
            stockCount: availableCodes,
            available: availableCodes > 0,
            myRedeemedCodes: myVouchers,
          };
        });

      return res.status(200).json(publicRewards);
    }

    // ── POST: Either Citizen Redemption OR Super Admin Creation ───────────
    if (req.method === "POST") {
      const isRedeemAction = req.body?.action === "redeem" || req.query?.action === "redeem";

      // ── ACTION A: REDEEM VOUCHER (FOR CITIZEN) ──────────────────────────
      if (isRedeemAction) {
        const rewardId = req.body?.rewardId as string;
        if (!rewardId) {
          return res.status(400).json({ error: "Reward ID is required for redemption" });
        }

        const reward = memoryDb.rewards.find((r: StoredReward) => r.id === rewardId);
        if (!reward || !reward.active) {
          return res.status(404).json({ error: "Reward item not found or currently inactive" });
        }

        const citizenId = currentUser?.id || req.body?.citizenId;
        if (!citizenId) {
          return res.status(401).json({ error: "Authentication required to redeem vouchers" });
        }

        // Get fresh user points from DB or memory
        let currentPoints = 0;
        let dbUser: any = null;
        try {
          dbUser = await prisma.user.findUnique({ where: { id: citizenId } });
          if (dbUser) currentPoints = dbUser.points || 0;
        } catch {}

        if (!dbUser) {
          const memU = memoryDb.users.find((u: StoredUser) => u.id === citizenId);
          if (memU) currentPoints = memU.points || 0;
        }

        if (currentPoints < reward.points) {
          return res.status(400).json({
            error: `Insufficient points. You have ${currentPoints} pts, but this reward requires ${reward.points} pts.`,
          });
        }

        // ATOMIC UNIQUE VOUCHER ALLOCATION: Find first unredeemed code
        const unusedCodeIdx = reward.codes.findIndex((c: StoredVoucherCode) => !c.isRedeemed);
        if (unusedCodeIdx === -1) {
          return res.status(400).json({
            error: "Sorry, this voucher is out of stock! No unused codes are available.",
          });
        }

        const assignedCode = reward.codes[unusedCodeIdx];
        const now = new Date().toISOString();

        // Mark this voucher code as REDEEMED for this user immediately
        assignedCode.isRedeemed = true;
        assignedCode.redeemedByUserId = citizenId;
        assignedCode.redeemedByUserName = currentUser?.fullName || currentUser?.username || "Citizen";
        assignedCode.redeemedAt = now;

        // Deduct points from user
        const newPoints = currentPoints - reward.points;
        try {
          await prisma.user.update({
            where: { id: citizenId },
            data: { points: { decrement: reward.points } },
          });
        } catch {}

        const memUserIdx = memoryDb.users.findIndex((u: StoredUser) => u.id === citizenId);
        if (memUserIdx !== -1) {
          memoryDb.users[memUserIdx].points = newPoints;
        }

        logAudit({
          userId: citizenId,
          action: "REDEEM_VOUCHER",
          resource: "rewards",
          details: `Redeemed ${reward.name} (${reward.points} pts). Unique Voucher: ${assignedCode.code}`,
          ipAddress: req.headers["x-forwarded-for"] as string,
        });

        return res.status(200).json({
          success: true,
          voucherCode: assignedCode.code,
          rewardName: reward.name,
          partner: reward.partner,
          pointsDeducted: reward.points,
          remainingPoints: newPoints,
          redeemedAt: now,
          message: `Successfully redeemed! Your unique code is ${assignedCode.code}.`,
        });
      }

      // ── ACTION B: CREATE REWARD ITEM (ADMIN ONLY) ────────────────────────
      if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN") {
        return res.status(403).json({ error: "Only administrators can create reward vouchers" });
      }

      const {
        name,
        partner,
        points,
        icon = "🎁",
        category = "Gift",
        description = "",
        codes: rawCodes,
        generateCount,
        codePrefix,
      } = req.body || {};

      if (!name || !partner || points === undefined) {
        return res.status(400).json({ error: "Name, Partner, and Points are required" });
      }

      const voucherCodes: StoredVoucherCode[] = [];

      // Add codes provided manually
      if (rawCodes) {
        const codeList = Array.isArray(rawCodes)
          ? rawCodes
          : String(rawCodes)
              .split(/[\n,]+/)
              .map((s) => s.trim())
              .filter(Boolean);

        for (const codeStr of codeList) {
          voucherCodes.push({
            id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            code: codeStr.toUpperCase(),
            isRedeemed: false,
          });
        }
      }

      // Auto-generate unique codes if requested
      const countToGen = Number(generateCount) || 0;
      if (countToGen > 0) {
        const prefix = codePrefix || partner.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
        for (let i = 0; i < countToGen; i++) {
          voucherCodes.push({
            id: `c-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            code: generateUniqueCode(prefix),
            isRedeemed: false,
          });
        }
      }

      const newReward: StoredReward = {
        id: `rew-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: String(name).trim(),
        partner: String(partner).trim(),
        points: Math.max(1, Number(points) || 100),
        icon: icon || "🎁",
        category: category || "General",
        description: description || "",
        active: true,
        codes: voucherCodes,
        createdAt: new Date().toISOString(),
      };

      memoryDb.rewards.push(newReward);

      return res.status(201).json({
        ...newReward,
        totalCodes: newReward.codes.length,
        availableCodes: newReward.codes.length,
        stockCount: newReward.codes.length,
      });
    }

    // ── PUT: Update Reward / Restock Codes (ADMIN ONLY) ───────────────────
    if (req.method === "PUT") {
      if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN") {
        return res.status(403).json({ error: "Only administrators can modify rewards" });
      }

      if (req.body?.toggleCouponsGlobal !== undefined) {
        memoryDb.couponsGloballyEnabled = Boolean(req.body.toggleCouponsGlobal);
        try {
          await prisma.systemSetting.upsert({
            where: { key: "couponsGloballyEnabled" },
            update: { value: String(memoryDb.couponsGloballyEnabled) },
            create: { key: "couponsGloballyEnabled", value: String(memoryDb.couponsGloballyEnabled) },
          });
        } catch {}
        return res.status(200).json({ couponsGloballyEnabled: memoryDb.couponsGloballyEnabled });
      }

      if (req.body?.toggleWithdrawGlobal !== undefined) {
        memoryDb.withdrawGloballyEnabled = Boolean(req.body.toggleWithdrawGlobal);
        try {
          await prisma.systemSetting.upsert({
            where: { key: "withdrawGloballyEnabled" },
            update: { value: String(memoryDb.withdrawGloballyEnabled) },
            create: { key: "withdrawGloballyEnabled", value: String(memoryDb.withdrawGloballyEnabled) },
          });
        } catch {}
        return res.status(200).json({ withdrawGloballyEnabled: memoryDb.withdrawGloballyEnabled });
      }

      const id = ((req.query?.id as string) || req.body?.id) as string;
      if (!id) {
        return res.status(400).json({ error: "Reward ID is required" });
      }

      const idx = memoryDb.rewards.findIndex((r: StoredReward) => r.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Reward item not found" });
      }

      const {
        name,
        partner,
        points,
        icon,
        category,
        description,
        active,
        addCodes,
        generateCount,
        codePrefix,
      } = req.body || {};

      if (name !== undefined) memoryDb.rewards[idx].name = String(name).trim();
      if (partner !== undefined) memoryDb.rewards[idx].partner = String(partner).trim();
      if (points !== undefined) memoryDb.rewards[idx].points = Math.max(1, Number(points) || 100);
      if (icon !== undefined) memoryDb.rewards[idx].icon = icon;
      if (category !== undefined) memoryDb.rewards[idx].category = category;
      if (description !== undefined) memoryDb.rewards[idx].description = description;
      if (active !== undefined) memoryDb.rewards[idx].active = Boolean(active);

      // Restock: add more unique codes if provided
      if (addCodes) {
        const codeList = Array.isArray(addCodes)
          ? addCodes
          : String(addCodes)
              .split(/[\n,]+/)
              .map((s) => s.trim())
              .filter(Boolean);

        for (const codeStr of codeList) {
          // Avoid duplicate codes within the same reward
          const exists = memoryDb.rewards[idx].codes.some(
            (c: StoredVoucherCode) => c.code.toUpperCase() === codeStr.toUpperCase()
          );
          if (!exists) {
            memoryDb.rewards[idx].codes.push({
              id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              code: codeStr.toUpperCase(),
              isRedeemed: false,
            });
          }
        }
      }

      const countToGen = Number(generateCount) || 0;
      if (countToGen > 0) {
        const prefix =
          codePrefix ||
          memoryDb.rewards[idx].partner.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
        for (let i = 0; i < countToGen; i++) {
          memoryDb.rewards[idx].codes.push({
            id: `c-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            code: generateUniqueCode(prefix),
            isRedeemed: false,
          });
        }
      }

      const available = memoryDb.rewards[idx].codes.filter((c: StoredVoucherCode) => !c.isRedeemed).length;
      return res.status(200).json({
        ...memoryDb.rewards[idx],
        totalCodes: memoryDb.rewards[idx].codes.length,
        availableCodes: available,
        stockCount: available,
      });
    }

    // ── DELETE: Delete Reward Item (ADMIN ONLY) ───────────────────────────
    if (req.method === "DELETE") {
      if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN") {
        return res.status(403).json({ error: "Only administrators can delete rewards" });
      }

      const id = ((req.query?.id as string) || req.body?.id) as string;
      if (!id) {
        return res.status(400).json({ error: "Reward ID is required" });
      }

      memoryDb.rewards = memoryDb.rewards.filter((r: StoredReward) => r.id !== id);
      return res.status(200).json({ success: true, message: "Reward deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "DELETE"] }
);
