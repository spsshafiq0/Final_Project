import type { VercelResponse } from "@vercel/node";
import prisma from "../../lib/prisma";
import { apiHandler, AuthenticatedRequest } from "../../lib/middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Ward ID is required" });
    }

    if (req.method === "GET") {
      const ward = await prisma.ward.findUnique({
        where: { id },
        include: {
          cityCorp: true,
          bins: true,
          tracks: true,
          alerts: { where: { resolved: false } },
          admins: {
            select: { id: true, username: true, fullName: true, phone: true, email: true },
          },
        },
      });

      if (!ward) {
        return res.status(404).json({ error: "Ward not found" });
      }

      return res.status(200).json(ward);
    }

    if (req.method === "PUT") {
      if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN")) {
        return res.status(403).json({ error: "Only Super Admin or City Corp Admin can update Ward details" });
      }

      const existingWard = await prisma.ward.findUnique({ where: { id } });
      if (!existingWard) {
        return res.status(404).json({ error: "Ward not found" });
      }

      // Check if City Admin has rights to this ward
      if (currentUser.role === "CITY_ADMIN" && existingWard.cityCorpId !== currentUser.cityCorpId) {
        return res.status(403).json({ error: "You can only update wards in your own City Corporation" });
      }

      const { name, area, population, councilor, cityCorpId } = req.body || {};

      const updated = await prisma.ward.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(area && { area }),
          ...(population !== undefined && { population: Number(population) }),
          ...(councilor !== undefined && { councilor }),
          ...(cityCorpId && currentUser.role === "SUPER_ADMIN" && { cityCorpId }),
        },
      });

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN")) {
        return res.status(403).json({ error: "Only Super Admin or City Corp Admin can delete Wards" });
      }

      const existingWard = await prisma.ward.findUnique({ where: { id } });
      if (!existingWard) {
        return res.status(404).json({ error: "Ward not found" });
      }

      if (currentUser.role === "CITY_ADMIN" && existingWard.cityCorpId !== currentUser.cityCorpId) {
        return res.status(403).json({ error: "You can only delete wards in your own City Corporation" });
      }

      await prisma.ward.delete({
        where: { id },
      });

      return res.status(200).json({ message: "Ward deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
