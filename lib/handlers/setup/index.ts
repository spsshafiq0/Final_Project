import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword, signToken } from "../../auth";
import { apiHandler } from "../../middleware";
import { memoryDb, StoredUser } from "../../store";
import { sendWelcomeCredentialsEmail } from "../../email";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    // ── GET: Check if initial setup is complete ──────────────────────────
    if (req.method === "GET") {
      let isComplete = Boolean(memoryDb.isSetupComplete || memoryDb.setupLocked);

      if (!isComplete) {
        try {
          const count = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
          if (count > 0) isComplete = true;
        } catch (e) {
          // ignore error
        }
      }

      if (!isComplete && memoryDb.users.some((u: StoredUser) => u.role === "SUPER_ADMIN")) {
        isComplete = true;
      }

      if (isComplete) {
        memoryDb.isSetupComplete = true;
        memoryDb.setupLocked = true;
      }

      return res.status(200).json({
        isSetupComplete: isComplete,
        message: isComplete
          ? "System is fully installed and operational. Installer is permanently locked."
          : "System is ready for Super Admin initialization.",
      });
    }

    // ── POST: First-time root Super Admin initialization ─────────────────
    if (req.method === "POST") {
      let alreadyInstalled = Boolean(memoryDb.isSetupComplete || memoryDb.setupLocked);

      if (!alreadyInstalled) {
        try {
          const count = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
          if (count > 0) alreadyInstalled = true;
        } catch (e) {
          // ignore error
        }
      }

      if (!alreadyInstalled && memoryDb.users.some((u: StoredUser) => u.role === "SUPER_ADMIN")) {
        alreadyInstalled = true;
      }

      // Security Check: Block permanently if Super Admin already exists
      if (alreadyInstalled) {
        return res.status(403).json({
          error: "Initial setup has already been completed. This installer is permanently disabled for system security.",
        });
      }

      const { fullName, username, email, password } = req.body || {};

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

      // Cryptographically hash password (bcrypt salt rounds = 10)
      const hashedPassword = await hashPassword(password);
      const cleanUsername = username.toLowerCase().trim();

      let createdUser: any = null;

      // 1. Persist to PostgreSQL if database connection is available
      try {
        createdUser = await prisma.user.upsert({
          where: { username: cleanUsername },
          update: {
            fullName,
            email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
            active: true,
          },
          create: {
            fullName,
            username: cleanUsername,
            email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
            active: true,
          },
        }).catch(() => null);
      } catch (dbErr: any) {
        console.warn("[Setup Notice] Operating on resilient store:", dbErr.message);
      }

      // 2. Persist to resilient high-speed store
      const superAdminId = createdUser?.id || `usr-super-${Date.now()}`;
      const existingSuperIndex = memoryDb.users.findIndex((u: StoredUser) => u.role === "SUPER_ADMIN");

      const memUser: StoredUser = {
        id: superAdminId,
        fullName,
        username: cleanUsername,
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        active: true,
        points: 0,
        createdAt: new Date().toISOString(),
      };

      if (existingSuperIndex >= 0) {
        memoryDb.users[existingSuperIndex] = memUser;
      } else {
        memoryDb.users.push(memUser);
      }

      // Mark setup as complete and permanently seal installer
      memoryDb.isSetupComplete = true;
      memoryDb.setupLocked = true;

      // 3. Send official Welcome & Credentials email via Brevo
      sendWelcomeCredentialsEmail({
        email,
        fullName,
        username: cleanUsername,
        password,
        role: "SUPER_ADMIN",
        loginUrl: process.env.APP_URL || "https://final-project-tau-pearl.vercel.app",
      }).catch((mailErr) => console.error("[Setup Email Notice]", mailErr.message));

      // 4. Sign JWT session token
      const token = signToken({
        userId: superAdminId,
        username: cleanUsername,
        role: "SUPER_ADMIN",
        fullName,
      });

      return res.status(200).json({
        success: true,
        message: "System successfully initialized! Super Admin account created and secured.",
        token,
        user: {
          id: superAdminId,
          username: cleanUsername,
          fullName,
          email,
          role: "SUPER_ADMIN",
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
