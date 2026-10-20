import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword } from "../../auth";
import { apiHandler } from "../../middleware";
import otpStore from "../../otpStore";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    const { identifier, code, newPassword } = req.body || {};

    if (!identifier || !code || !newPassword) {
      return res.status(400).json({ error: "Identifier, verification code, and new password are required." });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const cleanCode = String(code).trim();
    const cleanId = String(identifier).trim();

    // 1. Verify code via memory store or DB
    const memoryEntry = otpStore.get(cleanId);
    let isCodeValid = memoryEntry && memoryEntry.code === cleanCode;

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

    // 3. Update in Database if user exists in DB
    try {
      if (user?.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetOtp: null,
            resetOtpExpires: null,
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("Could not update password in database:", dbErr.message);
    }

    // 4. Update in resilient memory store
    const memUserIndex = memoryDb.users.findIndex(
      (u: any) =>
        u.username.toLowerCase() === cleanId.toLowerCase() ||
        (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
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
