import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const id = (req.query.id as string) || (req.body?.id as string);

    if (!id) {
      return res.status(400).json({ error: "Ward ID is required" });
    }

    let ward: any = null;
    try {
      ward = await prisma.ward.findUnique({
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
    } catch {}

    if (!ward) {
      ward = memoryDb.wards.find((w: any) => w.id === id || w.name === id);
      if (ward) {
        ward = {
          ...ward,
          cityCorp: memoryDb.cities.find((c: any) => c.id === ward.cityCorpId),
          bins: memoryDb.bins.filter((b: any) => b.wardId === ward.id),
          tracks: memoryDb.tracks.filter((t: any) => t.wardId === ward.id),
          alerts: memoryDb.alerts.filter((a: any) => a.wardId === ward.id && !a.resolved),
          admins: memoryDb.users.filter((u: any) => u.wardId === ward.id),
        };
      }
    }

    if (!ward) {
      return res.status(404).json({ error: "Ward not found" });
    }

    if (req.method === "GET") {
      return res.status(200).json(ward);
    }

    if (req.method === "PUT") {
      const { name, area, population, councilor, cityCorpId } = req.body || {};
      if (name) ward.name = name;
      if (area) ward.area = area;
      if (population !== undefined) ward.population = Number(population);
      if (councilor !== undefined) ward.councilor = councilor;
      if (cityCorpId) ward.cityCorpId = cityCorpId;

      try {
        await prisma.ward.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(area && { area }),
            ...(population !== undefined && { population: Number(population) }),
            ...(councilor !== undefined && { councilor }),
            ...(cityCorpId && { cityCorpId }),
          },
        }).catch(() => null);
      } catch {}

      return res.status(200).json(ward);
    }

    if (req.method === "DELETE") {
      try {
        await prisma.ward.delete({ where: { id } }).catch(() => null);
      } catch {}
      memoryDb.wards = memoryDb.wards.filter((w: any) => w.id !== id);
      return res.status(200).json({ message: "Ward deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);
