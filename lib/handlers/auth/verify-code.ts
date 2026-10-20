import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler } from "../../middleware";
import otpStore from "../../otpStore";
import { verifyRecoveryToken } from "../../auth";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    const { identifier, code, recoveryToken } = req.body || {};

    if (!identifier || !code) {
      return res.status(400).json({ error: "Identifier and verification code are required." });
    }

    const cleanCode = String(code).trim();
    const cleanId = String(identifier).trim().toLowerCase();

    // 0. Validate via signed stateless recovery token (resilient across lambdas)
    if (recoveryToken && typeof recoveryToken === "string") {
      const decoded = verifyRecoveryToken(recoveryToken);
      if (
        decoded &&
        decoded.otpCode === cleanCode &&
        (decoded.username.toLowerCase() === cleanId || decoded.email.toLowerCase() === cleanId)
      ) {
        return res.status(200).json({ valid: true, message: "Verification code is valid." });
      }
    }

    // 1. Check in-memory OTP store
    const isMemoryValid = otpStore.verify(cleanId, cleanCode);
    if (isMemoryValid) {
      return res.status(200).json({ valid: true, message: "Verification code is valid." });
    }

    // 2. Check Database OTP column
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanId, mode: "insensitive" } },
            { email: { equals: cleanId, mode: "insensitive" } },
          ],
        },
      });

      if (
        user &&
        user.resetOtp === cleanCode &&
        user.resetOtpExpires &&
        new Date(user.resetOtpExpires).getTime() > Date.now()
      ) {
        return res.status(200).json({ valid: true, message: "Verification code is valid." });
      }
    } catch (e: any) {
      console.warn("Prisma verify check failed:", e.message);
    }

    return res.status(400).json({
      error: "Invalid or expired 6-digit verification code. Please request a new one.",
    });
  },
  { allowedMethods: ["POST"] }
);
