import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword, verifyRecoveryToken } from "../../auth";
import { apiHandler } from "../../middleware";
import otpStore from "../../otpStore";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    const { identifier, code, newPassword, recoveryToken } = req.body || {};

    if (!identifier || !code || !newPassword) {
      return res.status(400).json({ error: "Identifier, verification code, and new password are required." });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const cleanCode = String(code).trim();
    const cleanId = String(identifier).trim().toLowerCase();

    // 0. Verify via signed stateless recovery token (resilient across serverless lambdas)
    let isCodeValid = false;
    let decodedToken: any = null;
    if (recoveryToken && typeof recoveryToken === "string") {
      const decoded = verifyRecoveryToken(recoveryToken);
      if (
        decoded &&
        decoded.otpCode === cleanCode &&
        (!cleanId ||
          decoded.username.toLowerCase() === cleanId ||
          decoded.email.toLowerCase() === cleanId)
      ) {
        isCodeValid = true;
        decodedToken = decoded;
      }
    }

    // 1. Verify code via memory store or DB
    if (!isCodeValid) {
      const memoryEntry = otpStore.get(cleanId);
      if (memoryEntry && memoryEntry.code === cleanCode) {
        isCodeValid = true;
      }
    }

    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanId, mode: "insensitive" } },
            { email: { equals: cleanId, mode: "insensitive" } },
          ],
        },
      });

      if (
        !isCodeValid &&
        user &&
        user.resetOtp === cleanCode &&
        user.resetOtpExpires &&
        new Date(user.resetOtpExpires).getTime() > Date.now()
      ) {
        isCodeValid = true;
      }
    } catch (e: any) {
      console.warn("Prisma lookup failed in reset-password:", e.message);
    }

    if (!isCodeValid) {
      return res.status(400).json({
        error: "Invalid or expired verification code. Please request a new code.",
      });
    }

    // 2. Hash new password with bcrypt
    const hashedPassword = await hashPassword(newPassword);

    const targetUserId = decodedToken?.userId;
    const targetUsername = decodedToken?.username || cleanId;
    const targetEmail = decodedToken?.email;

    // 3. Update in Database
    try {
      await prisma.user.updateMany({
        where: {
          OR: [
            ...(targetUserId ? [{ id: targetUserId }] : []),
            { username: { equals: targetUsername, mode: "insensitive" } },
            ...(targetEmail ? [{ email: { equals: targetEmail, mode: "insensitive" } }] : []),
            { username: { equals: cleanId, mode: "insensitive" } },
            { email: { equals: cleanId, mode: "insensitive" } },
          ],
        },
        data: {
          password: hashedPassword,
          resetOtp: null,
          resetOtpExpires: null,
        },
      });
    } catch (dbErr: any) {
      console.warn("Could not update password in database:", dbErr.message);
    }

    // 4. Update in resilient memory store
    const memUserIndex = memoryDb.users.findIndex(
      (u: any) =>
        (targetUserId && u.id === targetUserId) ||
        u.username.toLowerCase() === targetUsername.toLowerCase() ||
        (targetEmail && u.email && u.email.toLowerCase() === targetEmail.toLowerCase()) ||
        u.username.toLowerCase() === cleanId ||
        (u.email && u.email.toLowerCase() === cleanId)
    );
    if (memUserIndex >= 0) {
      memoryDb.users[memUserIndex].password = hashedPassword;
    }

    // 5. Consume / clear OTP from memory
    otpStore.consume(cleanId, cleanCode);

    return res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  },
  { allowedMethods: ["POST"] }
);
