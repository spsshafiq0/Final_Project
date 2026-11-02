import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredWardPaymentConfig } from "../../store";
import { logAudit } from "../../audit";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const isWardAdmin = currentUser?.role === "WARD_ADMIN";
    const isCityAdmin = currentUser?.role === "CITY_ADMIN";
    const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

    // ── GET: Fetch Ward Payment Configuration ──────────────────────────────
    if (req.method === "GET") {
      const { wardId, cityCorpId, status } = req.query as any;

      // 1. City Admin / Super Admin listing all ward payment configs (CityPayment view)
      if ((isCityAdmin || isSuperAdmin) && req.query.listAll === "true") {
        try {
          const whereClause: any = {};
          if (isCityAdmin && currentUser.cityCorpId) {
            whereClause.ward = { cityCorpId: currentUser.cityCorpId };
          } else if (cityCorpId) {
            whereClause.ward = { cityCorpId };
          }

          if (status && status !== "ALL") {
            whereClause.status = status;
          }

          const configs = await prisma.wardPaymentConfig.findMany({
            where: whereClause,
            include: {
              ward: {
                select: {
                  id: true,
                  name: true,
                  area: true,
                  cityCorpId: true,
                  cityCorp: { select: { id: true, name: true, code: true } },
                },
              },
            },
            orderBy: { updatedAt: "desc" },
          });

          return res.status(200).json(configs || []);
        } catch (e: any) {
          console.warn("[Ward Payment listAll DB Warning]:", e.message);
        }

        // Memory fallback
        let list = memoryDb.wardPaymentConfigs || [];
        if (status && status !== "ALL") {
          list = list.filter((c: any) => c.status === status);
        }
        return res.status(200).json(list);
      }

      // 2. Fetch config for a specific Ward
      const targetWardId = (wardId as string) || (isWardAdmin ? currentUser?.wardId : undefined);

      if (!targetWardId) {
        return res.status(400).json({ error: "Ward ID is required to fetch payment details." });
      }

      let config: any = null;
      try {
        config = await prisma.wardPaymentConfig.findUnique({
          where: { wardId: targetWardId },
          include: {
            ward: {
              select: {
                id: true,
                name: true,
                area: true,
                cityCorp: { select: { id: true, name: true, code: true } },
              },
            },
          },
        });
      } catch (e: any) {
        console.warn("[Ward Payment GET DB Warning]:", e.message);
      }

      if (!config) {
        config = (memoryDb.wardPaymentConfigs || []).find((c: any) => c.wardId === targetWardId);
      }

      // If citizen/guest requests, return public approved details only
      if (!isWardAdmin && !isCityAdmin && !isSuperAdmin) {
        if (!config || config.status !== "APPROVED") {
          return res.status(200).json({
            wardId: targetWardId,
            configured: false,
            bkashNumber: null,
            nagadNumber: null,
            rocketNumber: null,
            bankDetails: null,
            otherDetails: null,
          });
        }
        return res.status(200).json({
          wardId: targetWardId,
          configured: true,
          bkashNumber: config.bkashNumber,
          nagadNumber: config.nagadNumber,
          rocketNumber: config.rocketNumber,
          bankDetails: config.bankDetails,
          otherDetails: config.otherDetails,
        });
      }

      // If Ward Admin or City Admin, return full config
      if (!config) {
        return res.status(200).json({
          wardId: targetWardId,
          status: "NOT_CONFIGURED",
          bkashNumber: "",
          nagadNumber: "",
          rocketNumber: "",
          bankDetails: "",
          otherDetails: "",
          pendingBkash: "",
          pendingNagad: "",
          pendingRocket: "",
          pendingBank: "",
          pendingOther: "",
        });
      }

      return res.status(200).json(config);
    }

    // ── POST: Ward Admin Submits Payment Details for Approval ───────────────
    if (req.method === "POST") {
      if (!isWardAdmin && !isSuperAdmin) {
        return res.status(403).json({ error: "Forbidden: Only Ward Administrators can configure payment receiving details." });
      }

      const {
        wardId,
        bkashNumber,
        nagadNumber,
        rocketNumber,
        bankDetails,
        otherDetails,
      } = req.body || {};

      const targetWardId = isWardAdmin ? currentUser?.wardId : (wardId || currentUser?.wardId);

      if (!targetWardId) {
        return res.status(400).json({ error: "Ward ID is required to configure payment details." });
      }

      try {
        const updatedConfig = await prisma.wardPaymentConfig.upsert({
          where: { wardId: targetWardId },
          create: {
            wardId: targetWardId,
            status: "PENDING_APPROVAL",
            pendingBkash: bkashNumber || null,
            pendingNagad: nagadNumber || null,
            pendingRocket: rocketNumber || null,
            pendingBank: bankDetails || null,
            pendingOther: otherDetails || null,
            rejectReason: null,
          },
          update: {
            status: "PENDING_APPROVAL",
            pendingBkash: bkashNumber || null,
            pendingNagad: nagadNumber || null,
            pendingRocket: rocketNumber || null,
            pendingBank: bankDetails || null,
            pendingOther: otherDetails || null,
            rejectReason: null,
          },
          include: {
            ward: {
              select: { id: true, name: true, area: true },
            },
          },
        });

        await logAudit({
          userId: currentUser.userId,
          action: "WARD_PAYMENT_CONFIG_SUBMITTED",
          resource: "ward_payment",
          details: `Ward Admin for Ward ${targetWardId} submitted payment details update for City Corporation approval.`,
          ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
        });

        return res.status(200).json({
          success: true,
          message: "Payment details submitted! Changes are pending approval from City Corporation Administration.",
          config: updatedConfig,
        });
      } catch (e: any) {
        console.warn("[Ward Payment POST DB Warning]:", e.message);
      }

      // Memory fallback
      let memConfig = (memoryDb.wardPaymentConfigs || []).find((c: any) => c.wardId === targetWardId);
      if (!memConfig) {
        memConfig = {
          id: `wpc-${Date.now()}`,
          wardId: targetWardId,
          status: "PENDING_APPROVAL",
          pendingBkash: bkashNumber || null,
          pendingNagad: nagadNumber || null,
          pendingRocket: rocketNumber || null,
          pendingBank: bankDetails || null,
          pendingOther: otherDetails || null,
          rejectReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (!memoryDb.wardPaymentConfigs) memoryDb.wardPaymentConfigs = [];
        memoryDb.wardPaymentConfigs.push(memConfig);
      } else {
        memConfig.status = "PENDING_APPROVAL";
        memConfig.pendingBkash = bkashNumber || null;
        memConfig.pendingNagad = nagadNumber || null;
        memConfig.pendingRocket = rocketNumber || null;
        memConfig.pendingBank = bankDetails || null;
        memConfig.pendingOther = otherDetails || null;
        memConfig.rejectReason = null;
        memConfig.updatedAt = new Date().toISOString();
      }

      return res.status(200).json({
        success: true,
        message: "Payment details submitted! Changes are pending approval from City Corporation Administration.",
        config: memConfig,
      });
    }

    // ── PUT: City Corporation Admin Approves or Rejects Payment Details ─────
    if (req.method === "PUT") {
      if (!isCityAdmin && !isSuperAdmin) {
        return res.status(403).json({ error: "Forbidden: Only City Corporation Administrators or Super Admins can review Ward payment configurations." });
      }

      const { wardId, action, rejectReason } = req.body || {};

      if (!wardId) {
        return res.status(400).json({ error: "Ward ID is required." });
      }

      if (action !== "approve" && action !== "reject") {
        return res.status(400).json({ error: "Action must be either 'approve' or 'reject'." });
      }

      let existingConfig: any = null;
      try {
        existingConfig = await prisma.wardPaymentConfig.findUnique({
          where: { wardId },
          include: { ward: true },
        });
      } catch (e: any) {}

      if (!existingConfig) {
        existingConfig = (memoryDb.wardPaymentConfigs || []).find((c: any) => c.wardId === wardId);
      }

      if (!existingConfig) {
        return res.status(404).json({ error: "Payment configuration not found for this Ward." });
      }

      // City Admin security check
      if (isCityAdmin && currentUser.cityCorpId && existingConfig.ward?.cityCorpId && existingConfig.ward.cityCorpId !== currentUser.cityCorpId) {
        return res.status(403).json({ error: "Forbidden: You can only approve payment details for Wards inside your City Corporation." });
      }

      if (action === "approve") {
        try {
          const approved = await prisma.wardPaymentConfig.update({
            where: { wardId },
            data: {
              bkashNumber: existingConfig.pendingBkash || existingConfig.bkashNumber,
              nagadNumber: existingConfig.pendingNagad || existingConfig.nagadNumber,
              rocketNumber: existingConfig.pendingRocket || existingConfig.rocketNumber,
              bankDetails: existingConfig.pendingBank || existingConfig.bankDetails,
              otherDetails: existingConfig.pendingOther || existingConfig.otherDetails,
              pendingBkash: null,
              pendingNagad: null,
              pendingRocket: null,
              pendingBank: null,
              pendingOther: null,
              status: "APPROVED",
              rejectReason: null,
              approvedById: currentUser.userId,
              approvedAt: new Date(),
            },
            include: { ward: { select: { id: true, name: true, area: true } } },
          });

          await logAudit({
            userId: currentUser.userId,
            action: "WARD_PAYMENT_CONFIG_APPROVED",
            resource: "ward_payment",
            details: `City Admin approved payment details for Ward ${wardId}. Live accounts are now updated.`,
            ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
          });

          return res.status(200).json({
            success: true,
            message: "Ward payment details approved successfully and activated for citizen deposits!",
            config: approved,
          });
        } catch (e: any) {
          console.warn("[Ward Payment Approve DB Warning]:", e.message);
        }

        // Memory approve fallback
        existingConfig.bkashNumber = existingConfig.pendingBkash || existingConfig.bkashNumber;
        existingConfig.nagadNumber = existingConfig.pendingNagad || existingConfig.nagadNumber;
        existingConfig.rocketNumber = existingConfig.pendingRocket || existingConfig.rocketNumber;
        existingConfig.bankDetails = existingConfig.pendingBank || existingConfig.bankDetails;
        existingConfig.otherDetails = existingConfig.pendingOther || existingConfig.otherDetails;
        existingConfig.pendingBkash = null;
        existingConfig.pendingNagad = null;
        existingConfig.pendingRocket = null;
        existingConfig.pendingBank = null;
        existingConfig.pendingOther = null;
        existingConfig.status = "APPROVED";
        existingConfig.rejectReason = null;
        existingConfig.approvedById = currentUser.userId;
        existingConfig.approvedAt = new Date().toISOString();

        return res.status(200).json({
          success: true,
          message: "Ward payment details approved successfully and activated for citizen deposits!",
          config: existingConfig,
        });
      }

      if (action === "reject") {
        const reason = rejectReason || "Payment account numbers could not be verified by City Corporation Administration.";

        try {
          const rejected = await prisma.wardPaymentConfig.update({
            where: { wardId },
            data: {
              status: "REJECTED",
              rejectReason: reason,
              pendingBkash: null,
              pendingNagad: null,
              pendingRocket: null,
              pendingBank: null,
              pendingOther: null,
            },
            include: { ward: { select: { id: true, name: true, area: true } } },
          });

          await logAudit({
            userId: currentUser.userId,
            action: "WARD_PAYMENT_CONFIG_REJECTED",
            resource: "ward_payment",
            details: `City Admin rejected payment details update for Ward ${wardId}. Reason: ${reason}`,
            ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
          });

          return res.status(200).json({
            success: true,
            message: "Ward payment details request rejected.",
            config: rejected,
          });
        } catch (e: any) {
          console.warn("[Ward Payment Reject DB Warning]:", e.message);
        }

        existingConfig.status = "REJECTED";
        existingConfig.rejectReason = reason;
        existingConfig.pendingBkash = null;
        existingConfig.pendingNagad = null;
        existingConfig.pendingRocket = null;
        existingConfig.pendingBank = null;
        existingConfig.pendingOther = null;

        return res.status(200).json({
          success: true,
          message: "Ward payment details request rejected.",
          config: existingConfig,
        });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT"] }
);
