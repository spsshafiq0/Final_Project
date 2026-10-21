import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword } from "../../auth";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { sendWelcomeCredentialsEmail } from "../../email";
import { memoryDb, StoredUser } from "../../store";
import { logAudit } from "../../audit";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List Users ────────────────────────────────────────────────
    if (req.method === "GET") {
      const role = req.query.role as any;
      let cityCorpId = req.query.cityCorpId as string | undefined;
      let wardId = req.query.wardId as string | undefined;

      const whereClause: any = {};
      if (role) whereClause.role = role;

      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.OR = [
          { cityCorpId: currentUser.cityCorpId },
          { ward: { cityCorpId: currentUser.cityCorpId } },
        ];
      } else if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.wardId = currentUser.wardId;
      } else {
        if (cityCorpId) whereClause.cityCorpId = cityCorpId;
        if (wardId) whereClause.wardId = wardId;
      }

      try {
        const users = await prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            phone: true,
            nid: true,
            address: true,
            role: true,
            active: true,
            cityCorpId: true,
            cityCorp: { select: { id: true, name: true, code: true } },
            wardId: true,
            ward: { select: { id: true, name: true, area: true } },
            points: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        if (users && users.length > 0) {
          return res.status(200).json(users);
        }
      } catch (e: any) {
        console.warn("[Users GET Notice] Fallback to memory store:", e.message);
      }

      // Fallback to memory store
      let memUsers = [...memoryDb.users];
      if (role) memUsers = memUsers.filter((u: StoredUser) => u.role === role);
      if (cityCorpId) memUsers = memUsers.filter((u: StoredUser) => u.cityCorpId === cityCorpId);
      if (wardId) memUsers = memUsers.filter((u: StoredUser) => u.wardId === wardId);

      const sanitized = memUsers.map((u: StoredUser) => {
        const city = memoryDb.cities.find((c: any) => c.id === u.cityCorpId);
        const ward = memoryDb.wards.find((w: any) => w.id === u.wardId);
        return {
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          nid: u.nid,
          address: u.address,
          role: u.role,
          active: u.active,
          points: u.points || 0,
          cityCorpId: u.cityCorpId,
          cityCorp: city ? { id: city.id, name: city.name, code: city.code } : null,
          wardId: u.wardId,
          ward: ward ? { id: ward.id, name: ward.name, area: ward.area } : null,
          createdAt: u.createdAt,
        };
      });

      return res.status(200).json(sanitized);
    }

    // ── POST: Create User (Sub-Admin, Driver, Citizen, etc.) ────────────
    if (req.method === "POST") {
      const {
        username,
        password,
        fullName,
        email,
        phone,
        nid,
        address,
        role,
        cityCorpId,
        wardId,
      } = req.body || {};

      if (!username || !password || !fullName || !role) {
        return res.status(400).json({ error: "Username, password, full name, and role are required" });
      }

      const cleanUsername = String(username).toLowerCase().trim();
      const hashedPassword = await hashPassword(password);
      
      let targetCityCorpId: string | null = (cityCorpId && String(cityCorpId).trim() !== "" && cityCorpId !== "none") 
        ? String(cityCorpId).trim() 
        : (currentUser?.cityCorpId || null);
        
      let targetWardId: string | null = (wardId && String(wardId).trim() !== "" && wardId !== "none") 
        ? String(wardId).trim() 
        : (currentUser?.wardId || null);

      let createdUser: any = null;

      // 1. Try Prisma DB with smart foreign key resolution
      try {
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { username: { equals: cleanUsername, mode: "insensitive" } },
              ...(email ? [{ email: { equals: email.trim().toLowerCase(), mode: "insensitive" } }] : []),
            ],
          },
        });
        if (existing) {
          return res.status(409).json({ error: "An account with this username or email already exists." });
        }

        // Verify or sync CityCorporation in PostgreSQL
        let dbCityCorpId: string | null = null;
        if (targetCityCorpId) {
          const dbCity = await prisma.cityCorporation.findFirst({
            where: {
              OR: [
                { id: targetCityCorpId },
                { code: targetCityCorpId.toUpperCase() },
              ],
            },
          }).catch(() => null);

          if (dbCity) {
            dbCityCorpId = dbCity.id;
            targetCityCorpId = dbCity.id;
          } else {
            // Check memoryDb and sync to Prisma
            const upperTarget = targetCityCorpId ? targetCityCorpId.toUpperCase() : "";
            const memCity = memoryDb.cities.find((c: any) => c.id === targetCityCorpId || (upperTarget && c.code === upperTarget));
            if (memCity) {
              const syncedCity = await prisma.cityCorporation.create({
                data: {
                  id: memCity.id,
                  name: memCity.name,
                  code: memCity.code.toUpperCase(),
                  address: memCity.address || null,
                  phone: memCity.phone || null,
                  email: memCity.email || null,
                  pointRate: memCity.pointRate || 0.2,
                  minWithdrawPoints: memCity.minWithdrawPoints || 100,
                },
              }).catch(() => null);
              if (syncedCity) {
                dbCityCorpId = syncedCity.id;
                targetCityCorpId = syncedCity.id;
              }
            }
          }
        }

        // Verify Ward in PostgreSQL
        let dbWardId: string | null = null;
        if (targetWardId) {
          const dbWard = await prisma.ward.findUnique({
            where: { id: targetWardId },
          }).catch(() => null);
          if (dbWard) {
            dbWardId = dbWard.id;
          }
        }

        createdUser = await prisma.user.create({
          data: {
            username: cleanUsername,
            password: hashedPassword,
            fullName,
            email: email ? email.trim().toLowerCase() : null,
            phone: phone || null,
            nid: nid || null,
            address: address || null,
            role,
            cityCorpId: dbCityCorpId,
            wardId: dbWardId,
          },
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            active: true,
            cityCorpId: true,
            wardId: true,
          },
        });
      } catch (dbErr: any) {
        console.warn("[User Create Notice] Prisma error:", dbErr.message);
        // If Prisma failed due to foreign key or relation, retry creating user without relations to guarantee account creation
        try {
          createdUser = await prisma.user.create({
            data: {
              username: cleanUsername,
              password: hashedPassword,
              fullName,
              email: email ? email.trim().toLowerCase() : null,
              phone: phone || null,
              nid: nid || null,
              address: address || null,
              role,
            },
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              active: true,
              cityCorpId: true,
              wardId: true,
            },
          });
        } catch (retryErr: any) {
          console.warn("[User Create Retry Notice]", retryErr.message);
        }
      }

      // 2. Also save to resilient memory store
      const userId = createdUser?.id || `usr-${Date.now()}`;
      const memUser: StoredUser = {
        id: userId,
        username: cleanUsername,
        password: hashedPassword,
        fullName,
        email: email || null,
        phone: phone || null,
        nid: nid || null,
        address: address || null,
        role,
        cityCorpId: targetCityCorpId,
        wardId: targetWardId,
        active: true,
        points: 0,
        createdAt: new Date().toISOString(),
      };

      if (!memoryDb.users.some((u: StoredUser) => u.username === cleanUsername)) {
        memoryDb.users.push(memUser);
      }

      // 3. Send automated welcome email with credentials via Brevo
      if (email && email.includes("@")) {
        sendWelcomeCredentialsEmail({
          email,
          fullName,
          username: cleanUsername,
          password,
          role,
        }).catch((err) => console.error("[Brevo Welcome Email Error]", err.message));
      }

      await logAudit({
        userId: currentUser?.userId || null,
        action: "CREATE_USER",
        resource: "users",
        details: `Created user ${cleanUsername} (${role}) by ${currentUser?.username || "system"}`,
        ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
      });

      return res.status(201).json(createdUser || {
        id: memUser.id,
        username: memUser.username,
        fullName: memUser.fullName,
        email: memUser.email,
        phone: memUser.phone,
        role: memUser.role,
        active: memUser.active,
        cityCorpId: memUser.cityCorpId,
        wardId: memUser.wardId,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
