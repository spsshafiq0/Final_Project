import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    if (req.method === "GET") {
      let cityCorpId = req.query.cityCorpId as string | undefined;

      // Restrict based on role
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        cityCorpId = currentUser.cityCorpId;
      }

      const whereClause: any = {};
      if (cityCorpId) {
        whereClause.cityCorpId = cityCorpId;
      }
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.id = currentUser.wardId;
      }

      const wards = await prisma.ward.findMany({
        where: whereClause,
        include: {
          cityCorp: {
            select: { id: true, name: true, code: true },
          },
          admins: {
            select: { id: true, username: true, fullName: true, phone: true },
          },
          _count: {
            select: { bins: true, tracks: true, alerts: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return res.status(200).json(wards);
    }

    if (req.method === "POST") {
      if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN")) {
        return res.status(403).json({ error: "Only Super Admin or City Corp Admin can create Wards" });
      }

      let { name, area, population, councilor, cityCorpId } = req.body || {};

      // If City Admin, force their own cityCorpId
      if (currentUser.role === "CITY_ADMIN") {
        if (!currentUser.cityCorpId) {
          return res.status(400).json({ error: "Your City Admin account is not associated with a City Corporation" });
        }
        cityCorpId = currentUser.cityCorpId;
      }

      if (!name || !area || !cityCorpId) {
        return res.status(400).json({ error: "Name, area, and cityCorpId are required" });
      }

      // Check if city exists
      const city = await prisma.cityCorporation.findUnique({ where: { id: cityCorpId } });
      if (!city) {
        return res.status(404).json({ error: "City Corporation not found" });
      }

      const ward = await prisma.ward.create({
        data: {
          name,
          area,
          population: population ? Number(population) : 0,
          councilor: councilor || "",
          cityCorpId,
        },
        include: {
          cityCorp: true,
        },
      });

      return res.status(201).json(ward);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
