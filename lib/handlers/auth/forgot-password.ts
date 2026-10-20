import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler } from "../../middleware";
import { sendPasswordResetOtpEmail } from "../../email";
import otpStore from "../../otpStore";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    const { identifier } = req.body || {};

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return res.status(400).json({ error: "Please provide your registered email or username." });
    }

    const cleanInput = identifier.trim();

    // Look up user by username or email
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanInput, mode: "insensitive" } },
            { email: { equals: cleanInput, mode: "insensitive" } },
          ],
        },
      });
    } catch (e: any) {
      console.warn("Prisma lookup failed, falling back to in-memory check:", e.message);
    }

    // Fallback if DB doesn't have the user yet (e.g. demo Shafiq accounts)
    if (!user) {
      const isShafiq =
        cleanInput.toLowerCase().includes("spsshafiq") ||
        cleanInput.toLowerCase() === "spsshafiq95@gmail.com";
      if (isShafiq) {
        user = {
          id: "shafiq-demo-id",
          username: "spsshafiq",
          fullName: "Shafiq",
          email: "spsshafiq95@gmail.com",
        };
      }
    }

    if (!user) {
      return res.status(404).json({
        error: "No account found matching this username or email address.",
      });
    }

    if (!user.email) {
      return res.status(400).json({
        error: "This account has no registered email address on file. Please contact your system administrator.",
      });
    }

    // Generate secure 6-digit verification code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInMinutes = 10;
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

    // 1. Store in memory cache
    otpStore.set(user.username, {
      code: otpCode,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      expiresAt,
    });
    otpStore.set(user.email, {
      code: otpCode,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      expiresAt,
    });

    // 2. Attempt updating Prisma user record if available
    try {
      if (user.id && user.id !== "shafiq-demo-id") {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetOtp: otpCode,
            resetOtpExpires: new Date(expiresAt),
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("Could not save resetOtp to DB column (using memoryStore):", dbErr.message);
    }

    // 3. Send via Brevo Email API
    await sendPasswordResetOtpEmail({
      email: user.email,
      fullName: user.fullName,
      otpCode,
      expiresInMinutes,
    });

    // Mask email for privacy (e.g. sp***95@gmail.com)
    const [local, domain] = user.email.split("@");
    const maskedLocal = local.length <= 3 ? local[0] + "***" : local.slice(0, 2) + "***" + local.slice(-2);
    const maskedEmail = `${maskedLocal}@${domain}`;

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${maskedEmail}`,
      emailMasked: maskedEmail,
      // Include code in dev preview if BREVO_API_KEY is not yet entered
      previewCode: process.env.NODE_ENV !== "production" ? otpCode : undefined,
    });
  },
  { allowedMethods: ["POST"] }
);
