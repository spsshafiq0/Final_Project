import type { VercelResponse } from "@vercel/node";
import prisma from "../../lib/prisma";
import { apiHandler, AuthenticatedRequest } from "../../lib/middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser) => {
    if (req.method === "GET") {
      let wardId = req.query.wardId as string | undefined;
      let cityCorpId = req.query.cityCorpId as string | undefined;
      const status = req.query.status as any;

      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        wardId = currentUser.wardId;
      } else if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        cityCorpId = currentUser.cityCorpId;
      }

      const whereClause: any = {};
      if (wardId) whereClause.wardId = wardId;
      if (cityCorpId) whereClause.ward = { cityCorpId };
      if (status) whereClause.status = status;

      const bins = await prisma.bin.findMany({
        where: whereClause,
        include: {
          ward: {
            include: {
              cityCorp: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
        orderBy: { binCode: "asc" },
      });

      return res.status(200).json(bins);
    }

    if (req.method === "POST") {
      if (
        !currentUser ||
        !["SUPER_ADMIN", "CITY_ADMIN", "WARD_ADMIN"].includes(currentUser.role)
      ) {
        return res.status(403).json({ error: "Unauthorized to add smart bins" });
      }

      const { binCode, location, capacity, wardId, lat, lng } = req.body || {};

      if (!binCode || !location || !wardId) {
        return res.status(400).json({ error: "binCode, location, and wardId are required" });
      }

      // Check unique binCode
      const existing = await prisma.bin.findUnique({ where: { binCode } });
      if (existing) {
        return res.status(409).json({ error: `Bin with code ${binCode} already exists` });
      }

      const bin = await prisma.bin.create({
        data: {
          binCode,
          location,
          capacity: capacity || "120L",
          wardId,
          lat: lat ? parseFloat(lat) : 0,
          lng: lng ? parseFloat(lng) : 0,
        },
        include: {
          ward: true,
        },
      });

      return res.status(201).json(bin);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
