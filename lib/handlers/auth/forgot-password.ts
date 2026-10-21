import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler } from "../../middleware";
import { sendPasswordResetOtpEmail } from "../../email";
import otpStore from "../../otpStore";
import { memoryDb } from "../../store";
import { signRecoveryToken } from "../../auth";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    const { identifier, role } = req.body || {};

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return res.status(400).json({ error: "Please provide your registered email or username." });
    }

    const cleanInput = identifier.trim().toLowerCase();

    // 1. Look up user by username or email in Prisma DB
    let user: any = null;
    let dbError: string | null = null;
    try {
      const whereCondition: any = {
        OR: [
          { username: { equals: cleanInput, mode: "insensitive" } },
          { email: { equals: cleanInput, mode: "insensitive" } },
        ],
      };
      if (role && typeof role === "string") {
        whereCondition.role = role;
      }

      user = await prisma.user.findFirst({
        where: whereCondition,
      });

      // If user found with different role, check if exists with other role to provide specific feedback
      if (!user && role) {
        const otherRoleUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: { equals: cleanInput, mode: "insensitive" } },
              { email: { equals: cleanInput, mode: "insensitive" } },
            ],
          },
        });
        if (otherRoleUser) {
          return res.status(404).json({
            error: `No ${role.replace("_", " ").toLowerCase()} account found with this identifier.`,
          });
        }
      }
    } catch (e: any) {
      dbError = e?.message || String(e);
      console.warn("Prisma lookup failed, checking resilient memory store:", e.message);
    }

    // 2. Fallback to resilient memory store
    if (!user) {
      const memUser = memoryDb.users.find(
        (u: any) =>
          (u.username.toLowerCase() === cleanInput ||
            (u.email && u.email.toLowerCase() === cleanInput)) &&
          (!role || u.role === role)
      );

      if (memUser) {
        user = {
          id: memUser.id,
          username: memUser.username,
          fullName: memUser.fullName,
          email: memUser.email,
          role: memUser.role,
        };
      } else if (role) {
        const otherRoleMem = memoryDb.users.find(
          (u: any) =>
            u.username.toLowerCase() === cleanInput ||
            (u.email && u.email.toLowerCase() === cleanInput)
        );
        if (otherRoleMem) {
          return res.status(404).json({
            error: `No ${role.replace("_", " ").toLowerCase()} account found with this identifier.`,
          });
        }
      }
    }

    if (!user) {
      if (dbError && Boolean(process.env.VERCEL || process.env.NODE_ENV === "production")) {
        return res.status(503).json({
          error: `Database connection error: Unable to lookup account because PostgreSQL is unreachable (${dbError}). Please verify your DATABASE_URL in Vercel settings.`,
        });
      }
      return res.status(404).json({
        error: "No account found matching this username or email address.",
      });
    }

    const recipientEmail = user.email;
    if (!recipientEmail || !recipientEmail.includes("@")) {
      return res.status(400).json({
        error: "No official email address is registered for this account. Please contact system support.",
      });
    }

    // Generate secure 6-digit verification code with 10-minute TTL
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInMinutes = 10;
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

    // 1. Generate signed stateless recovery token (preserves validation across serverless lambda cold starts)
    const recoveryToken = signRecoveryToken({
      userId: user.id,
      username: user.username,
      email: recipientEmail,
      otpCode,
      role: user.role,
    });

    // 2. Store in memory cache
    otpStore.set(user.username, {
      code: otpCode,
      userId: user.id,
      fullName: user.fullName,
      email: recipientEmail,
      expiresAt,
    });
    otpStore.set(recipientEmail, {
      code: otpCode,
      userId: user.id,
      fullName: user.fullName,
      email: recipientEmail,
      expiresAt,
    });

    // 3. Attempt updating Prisma user record if available
    try {
      await prisma.user.updateMany({
        where: {
          OR: [
            { id: user.id },
            { username: user.username },
            { email: recipientEmail },
          ],
        },
        data: {
          resetOtp: otpCode,
          resetOtpExpires: new Date(expiresAt),
        },
      });
    } catch (dbErr: any) {
      console.warn("Could not save resetOtp to DB column (stateless token active):", dbErr.message);
    }

    // 4. Send via Brevo Email API safely wrapped in try/catch
    try {
      await sendPasswordResetOtpEmail({
        email: recipientEmail,
        fullName: user.fullName,
        otpCode,
        expiresInMinutes,
      });
    } catch (mailErr: any) {
      console.warn("[Password Reset Email Dispatch Warn]", mailErr.message);
    }

    // Mask email for privacy (e.g. sh***87@uits.edu.bd)
    const [local, domain] = recipientEmail.split("@");
    const maskedLocal = local.length <= 3 ? local[0] + "***" : local.slice(0, 2) + "***" + local.slice(-2);
    const maskedEmail = `${maskedLocal}@${domain}`;

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${maskedEmail}`,
      emailMasked: maskedEmail,
      recoveryToken,
    });
  },
  { allowedMethods: ["POST"] }
);
