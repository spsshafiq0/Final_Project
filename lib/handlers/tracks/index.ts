import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredTrack, StoredUser } from "../../store";
import { hashPassword } from "../../auth";
import { sendWelcomeCredentialsEmail } from "../../email";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List Tracks ───────────────────────────────────────────────
    if (req.method === "GET") {
      let wardId = req.query.wardId as string | undefined;
      const driverId = req.query.driverId as string | undefined;
      const status = req.query.status as any;

      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        wardId = currentUser.wardId;
      }

      const whereClause: any = {};
      if (wardId) whereClause.wardId = wardId;
      if (driverId) whereClause.driverId = driverId;
      if (status) whereClause.status = status;
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.ward = { cityCorpId: currentUser.cityCorpId };
      }

      try {
        const tracks = await prisma.track.findMany({
          where: whereClause,
          include: {
            ward: {
              include: {
                cityCorp: { select: { id: true, name: true, code: true } },
              },
            },
            driver: {
              select: { id: true, username: true, fullName: true, phone: true, email: true },
            },
          },
          orderBy: { truckId: "asc" },
        });

        if (tracks && tracks.length > 0) {
          return res.status(200).json(tracks);
        }
      } catch (e: any) {
        console.warn("[Tracks GET Notice] Fallback to memory store:", e.message);
      }

      // Memory store fallback
      let memTracks = [...memoryDb.tracks];
      if (wardId) memTracks = memTracks.filter((t: StoredTrack) => t.wardId === wardId);

      const enriched = memTracks.map((t: StoredTrack) => {
        const ward = memoryDb.wards.find((w: any) => w.id === t.wardId);
        const city = ward ? memoryDb.cities.find((c: any) => c.id === ward.cityCorpId) : null;
        const driverUser = memoryDb.users.find((u: any) => u.id === t.driverId || u.fullName === t.driver);

        return {
          ...t,
          ward: ward ? { ...ward, cityCorp: city ? { id: city.id, name: city.name, code: city.code } : null } : null,
          driver: driverUser ? { id: driverUser.id, username: driverUser.username, fullName: driverUser.fullName, phone: driverUser.phone, email: driverUser.email } : { fullName: t.driver || "Driver", phone: t.phone || "" },
        };
      });

      return res.status(200).json(enriched);
    }

    // ── POST: Create Track & Driver Account ─────────────────────────────
    if (req.method === "POST") {
      const {
        truckId,
        driver,
        driverName,
        driverUsername,
        driverEmail,
        driverPassword,
        phone,
        driverPhone,
        nid,
        address,
        route,
        stops,
        fuel,
        status,
        wardId,
        mapsRouteUrl,
        gpsLat,
        gpsLng,
      } = req.body || {};

      if (!truckId || !route) {
        return res.status(400).json({ error: "Truck ID and route description are required" });
      }

      const assignedWardId = String(wardId || currentUser?.wardId || memoryDb.wards[0]?.id || "1");
      const finalDriverName = driverName || driver || "Assigned Driver";
      const finalDriverPhone = driverPhone || phone || "01700-000000";

      let assignedDriverId: string | null = null;

      // 1. If Driver Account credentials provided, create the driver user
      if (driverUsername && driverPassword) {
        const cleanUser = String(driverUsername).toLowerCase().trim();
        const hashedPass = await hashPassword(driverPassword);

        // Try Prisma create driver
        try {
          const user = await prisma.user.create({
            data: {
              username: cleanUser,
              password: hashedPass,
              fullName: finalDriverName,
              email: driverEmail || null,
              phone: finalDriverPhone,
              nid: nid || null,
              address: address || null,
              role: "DRIVER",
              wardId: assignedWardId,
              active: true,
            },
          });
          assignedDriverId = user.id;
        } catch (uErr: any) {
          console.warn("[Driver User PG Create Notice]", uErr.message);
        }

        // Save to memoryDb
        if (!assignedDriverId) assignedDriverId = `usr-driver-${Date.now()}`;
        if (!memoryDb.users.some((u: StoredUser) => u.username === cleanUser)) {
          memoryDb.users.push({
            id: assignedDriverId,
            username: cleanUser,
            password: hashedPass,
            fullName: finalDriverName,
            email: driverEmail || null,
            phone: finalDriverPhone,
            nid: nid || null,
            address: address || null,
            role: "DRIVER",
            wardId: assignedWardId,
            active: true,
            points: 0,
            createdAt: new Date().toISOString(),
          });
        }

        // Send Brevo email to Driver
        if (driverEmail && driverEmail.includes("@")) {
          sendWelcomeCredentialsEmail({
            email: driverEmail,
            fullName: finalDriverName,
            username: cleanUser,
            password: driverPassword,
            role: "DRIVER",
          }).catch((mailErr) => console.error("[Brevo Driver Email Error]", mailErr.message));
        }
      }

      let createdTrack: any = null;

      // 2. Try Prisma DB track create
      try {
        createdTrack = await prisma.track.create({
          data: {
            truckId,
            truckType: (req.body?.truckType === "HAZARDOUS" ? "HAZARDOUS" : "NORMAL") as any,
            route,
            stops: stops ? Number(stops) : 6,
            fuel: fuel ? Number(fuel) : 100,
            status: status || "active",
            wardId: assignedWardId,
            driverId: assignedDriverId || req.body?.driverId || null,
            mapsRouteUrl: mapsRouteUrl || "",
            gpsLat: gpsLat ? Number(gpsLat) : 23.78,
            gpsLng: gpsLng ? Number(gpsLng) : 90.40,
          },
          include: {
            ward: true,
            driver: { select: { id: true, username: true, fullName: true, phone: true } },
          },
        });
      } catch (dbErr: any) {
        console.warn("[Track Create Notice] Fallback to memory store:", dbErr.message);
      }

      // 3. Save to memory store
      const memTrack: StoredTrack = {
        id: createdTrack?.id || `TR-${Date.now()}`,
        truckId,
        truckType: req.body?.truckType === "HAZARDOUS" ? "HAZARDOUS" : "NORMAL",
        driver: finalDriverName,
        phone: finalDriverPhone,
        route,
        stops: stops ? Number(stops) : 6,
        status: status || "active",
        progress: 0,
        load: "0t",
        fuel: fuel ? Number(fuel) : 100,
        startTime: "07:00 AM",
        gpsLat: gpsLat ? Number(gpsLat) : 23.78,
        gpsLng: gpsLng ? Number(gpsLng) : 90.40,
        mapsRouteUrl: mapsRouteUrl || "",
        wardId: assignedWardId,
        driverId: assignedDriverId || req.body?.driverId || null,
        createdAt: new Date().toISOString(),
      };

      memoryDb.tracks.push(memTrack);

      return res.status(201).json(createdTrack || memTrack);
    }

    // ── PUT: Assign / Change Driver & Update Track Type ─────────────────
    if (req.method === "PUT" || req.method === "PATCH") {
      const { id, trackId, driverId, truckType, route, status, stops, fuel } = req.body || {};
      const targetId = String(trackId || id || req.query.id);

      if (!targetId) {
        return res.status(400).json({ error: "Track ID is required to assign or update driver" });
      }

      let updatedTrack: any = null;

      try {
        const updateData: any = {};
        if (driverId !== undefined) updateData.driverId = driverId || null;
        if (truckType) updateData.truckType = truckType === "HAZARDOUS" ? "HAZARDOUS" : "NORMAL";
        if (route) updateData.route = route;
        if (status) updateData.status = status;
        if (stops !== undefined) updateData.stops = Number(stops);
        if (fuel !== undefined) updateData.fuel = Number(fuel);

        updatedTrack = await prisma.track.update({
          where: { id: targetId },
          data: updateData,
          include: {
            ward: true,
            driver: { select: { id: true, username: true, fullName: true, phone: true } },
          },
        });
      } catch (e: any) {
        console.warn("[Track Update Notice] Fallback to memory store:", e.message);
      }

      // Memory store update
      const memTrack = memoryDb.tracks.find((t: StoredTrack) => t.id === targetId || t.truckId === targetId);
      if (memTrack) {
        if (driverId !== undefined) {
          memTrack.driverId = driverId || null;
          const assignedUser = memoryDb.users.find((u: any) => u.id === driverId);
          if (assignedUser) {
            memTrack.driver = assignedUser.fullName;
            memTrack.phone = assignedUser.phone || "";
          } else {
            memTrack.driver = "Unassigned";
            memTrack.phone = "";
          }
        }
        if (truckType) memTrack.truckType = truckType === "HAZARDOUS" ? "HAZARDOUS" : "NORMAL";
        if (route) memTrack.route = route;
        if (status) memTrack.status = status;
      }

      return res.status(200).json(updatedTrack || memTrack || { success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "PATCH"] }
);
