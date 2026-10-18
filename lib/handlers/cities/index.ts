import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    if (req.method === "GET") {
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
      return res.status(200).json(cities);
    }

    if (req.method === "POST") {
      if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin can create City Corporations" });
      }

      const { name, code, address, phone, email } = req.body || {};
      if (!name || !code) {
        return res.status(400).json({ error: "Name and code are required (e.g. DNCC)" });
      }

      const existing = await prisma.cityCorporation.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (existing) {
        return res.status(409).json({ error: "City Corporation with this code already exists" });
      }

      const city = await prisma.cityCorporation.create({
        data: {
          name,
          code: code.toUpperCase(),
          address: address || null,
          phone: phone || null,
          email: email || null,
        },
      });

      return res.status(201).json(city);
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);
