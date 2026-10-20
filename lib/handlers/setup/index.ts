import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword, signToken } from "../../auth";
import { apiHandler } from "../../middleware";
import { memoryDb, StoredUser, StoredCity } from "../../store";
import { sendWelcomeCredentialsEmail } from "../../email";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    // ── GET: Check if initial setup is complete ──────────────────────────
    if (req.method === "GET") {
      let pgSuperCount = 0;
      try {
        pgSuperCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
      } catch (e: any) {
        // Fallback to memory store check if DB is not connected
      }

      const memSuperCount = memoryDb.users.filter((u: StoredUser) => u.role === "SUPER_ADMIN").length;
      const isComplete = memoryDb.isSetupComplete || pgSuperCount > 0 || memSuperCount > 0;

      return res.status(200).json({
        isSetupComplete: isComplete,
        message: isComplete
          ? "System is fully installed and operational. Installer is permanently locked."
          : "System is uninitialized. First-time Super Admin setup is required.",
      });
    }

    // ── POST: First-time root Super Admin initialization ─────────────────
    if (req.method === "POST") {
      // 1. Security Check: Block if setup has already been completed
      let pgSuperCount = 0;
      try {
        pgSuperCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
      } catch (e: any) {}

      const memSuperCount = memoryDb.users.filter((u: StoredUser) => u.role === "SUPER_ADMIN").length;
      if (memoryDb.isSetupComplete || pgSuperCount > 0 || memSuperCount > 0) {
        return res.status(403).json({
          error: "Initial setup has already been completed. This installer is permanently disabled for system security.",
        });
      }

      const { fullName, username, email, password, cityCorpName, cityCorpCode } = req.body || {};

      if (!fullName || !username || !email || !password) {
        return res.status(400).json({
          error: "Full name, username, official email, and password are required.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 characters long.",
        });
      }

      // Hash password using strong bcrypt
      const hashedPassword = await hashPassword(password);

      let createdUser: any = null;
      let createdCity: any = null;

      // 2. Persist to PostgreSQL if connected
      try {
        if (cityCorpName && cityCorpCode) {
          createdCity = await prisma.cityCorporation.create({
            data: {
              name: cityCorpName,
              code: cityCorpCode.toUpperCase(),
              email,
            },
          });
        }

        createdUser = await prisma.user.create({
          data: {
            fullName,
            username: username.toLowerCase().trim(),
            email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
            active: true,
          },
        });
      } catch (dbErr: any) {
        console.warn("[Setup Notice] Operating in resilient memory mode:", dbErr.message);
      }

      // 3. Persist to resilient memory store
      const superAdminId = createdUser?.id || `usr-super-${Date.now()}`;
      const memUser: StoredUser = {
        id: superAdminId,
        fullName,
        username: username.toLowerCase().trim(),
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        active: true,
        points: 0,
        createdAt: new Date().toISOString(),
      };
      memoryDb.users.push(memUser);

      if (cityCorpName && cityCorpCode && !createdCity) {
        const memCity: StoredCity = {
          id: `city-${Date.now()}`,
          name: cityCorpName,
          code: cityCorpCode.toUpperCase(),
          email,
          active: true,
          pointRate: 0.20,
          minWithdrawPoints: 100,
          rewardActive: true,
          createdAt: new Date().toISOString(),
        };
        memoryDb.cities.push(memCity);
      }

      // Permanently lock the setup installer
      memoryDb.isSetupComplete = true;

      // 4. Send official Welcome & Credentials email via Brevo
      sendWelcomeCredentialsEmail({
        email,
        fullName,
        username: username.toLowerCase().trim(),
        password,
        role: "SUPER_ADMIN",
        loginUrl: process.env.APP_URL || "https://intelliwaste.vercel.app",
      }).catch((mailErr) => console.error("[Setup Email Error]", mailErr.message));

      // 5. Sign authentication token
      const token = signToken({
        userId: superAdminId,
        username: memUser.username,
        role: "SUPER_ADMIN",
        fullName: memUser.fullName,
      });

      return res.status(201).json({
        success: true,
        message: "System successfully initialized! Super Admin account created and secured.",
        token,
        user: {
          id: superAdminId,
          username: memUser.username,
          fullName: memUser.fullName,
          email: memUser.email,
          role: "SUPER_ADMIN",
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
