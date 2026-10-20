import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredCity, StoredUser } from "../../store";
import { hashPassword } from "../../auth";
import { sendWelcomeCredentialsEmail } from "../../email";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List City Corporations ────────────────────────────────────
    if (req.method === "GET") {
      try {
        const cities = await prisma.cityCorporation.findMany({
          include: {
            wards: {
              select: { id: true, name: true, area: true },
            },
            admins: {
              select: { id: true, username: true, fullName: true, role: true },
            },
            _count: {
              select: { wards: true, admins: true },
            },
          },
          orderBy: { name: "asc" },
        });

        if (cities && cities.length > 0) {
          return res.status(200).json(cities);
        }
      } catch (e: any) {
        console.warn("[Cities GET Notice] Fallback to memory store:", e.message);
      }

      // Memory store fallback with enriched relations
      const memCities = memoryDb.cities.map((c: StoredCity) => ({
        ...c,
        wards: memoryDb.wards.filter((w: any) => w.cityCorpId === c.id),
        admins: memoryDb.users.filter((u: any) => u.cityCorpId === c.id),
        _count: {
          wards: memoryDb.wards.filter((w: any) => w.cityCorpId === c.id).length,
          admins: memoryDb.users.filter((u: any) => u.cityCorpId === c.id).length,
        },
      }));

      return res.status(200).json(memCities);
    }

    // ── POST: Create City Corporation (and optionally City Admin) ──────
    if (req.method === "POST") {
      if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin can create City Corporations" });
      }

      const {
        name,
        code,
        address,
        phone,
        email,
        pointRate,
        minWithdrawPoints,
        adminName,
        adminUsername,
        adminEmail,
        adminPassword,
      } = req.body || {};

      if (!name || !code) {
        return res.status(400).json({ error: "Name and code are required (e.g. DNCC)" });
      }

      const upperCode = code.toUpperCase().trim();
      let createdCity: any = null;

      // 1. Try Prisma DB
      try {
        const existing = await prisma.cityCorporation.findUnique({
          where: { code: upperCode },
        });
        if (existing) {
          return res.status(409).json({ error: `City Corporation with code ${upperCode} already exists` });
        }

        createdCity = await prisma.cityCorporation.create({
          data: {
            name,
            code: upperCode,
            address: address || null,
            phone: phone || null,
            email: email || null,
            pointRate: pointRate ? Number(pointRate) : 0.20,
            minWithdrawPoints: minWithdrawPoints ? Number(minWithdrawPoints) : 100,
          },
        });

        // If admin credentials provided, create City Admin user in DB
        if (adminName && adminUsername && adminPassword) {
          const hashedAdminPass = await hashPassword(adminPassword);
          await prisma.user.create({
            data: {
              fullName: adminName,
              username: adminUsername.toLowerCase().trim(),
              password: hashedAdminPass,
              email: adminEmail || email || null,
              phone: phone || null,
              role: "CITY_ADMIN",
              cityCorpId: createdCity.id,
              active: true,
            },
          }).catch((err) => console.warn("Admin create error in PG:", err.message));
        }
      } catch (dbErr: any) {
        console.warn("[City Create Notice] Operating in resilient memory mode:", dbErr.message);
      }

      // 2. Also save to resilient memory store
      const cityId = createdCity?.id || `city-${Date.now()}`;
      const memCity: StoredCity = {
        id: cityId,
        name,
        code: upperCode,
        address: address || null,
        phone: phone || null,
        email: email || null,
        active: true,
        pointRate: pointRate ? Number(pointRate) : 0.20,
        minWithdrawPoints: minWithdrawPoints ? Number(minWithdrawPoints) : 100,
        rewardActive: true,
        createdAt: new Date().toISOString(),
      };

      if (!memoryDb.cities.some((c: StoredCity) => c.code === upperCode)) {
        memoryDb.cities.push(memCity);
      }

      // If initial City Admin credentials were supplied:
      if (adminName && adminUsername && adminPassword) {
        const hashedPass = await hashPassword(adminPassword);
        const memAdmin: StoredUser = {
          id: `usr-city-${Date.now()}`,
          fullName: adminName,
          username: adminUsername.toLowerCase().trim(),
          password: hashedPass,
          email: adminEmail || email || null,
          phone: phone || null,
          role: "CITY_ADMIN",
          cityCorpId: cityId,
          active: true,
          points: 0,
          createdAt: new Date().toISOString(),
        };

        if (!memoryDb.users.some((u: StoredUser) => u.username === memAdmin.username)) {
          memoryDb.users.push(memAdmin);
        }

        // Send welcome email with credentials via Brevo
        const recipientEmail = adminEmail || email;
        if (recipientEmail && recipientEmail.includes("@")) {
          sendWelcomeCredentialsEmail({
            email: recipientEmail,
            fullName: adminName,
            username: adminUsername.toLowerCase().trim(),
            password: adminPassword,
            role: "CITY_ADMIN",
          }).catch((mailErr) => console.error("[Brevo City Admin Email Error]", mailErr.message));
        }
      }

      return res.status(201).json(createdCity || memCity);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
