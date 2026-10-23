import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredCityWasteItem } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // ── GET: List City Waste Items ─────────────────────────────────────
    if (req.method === "GET") {
      const cityCorpId = req.query.cityCorpId as string | undefined;

      const whereClause: any = { active: true };
      if (cityCorpId) {
        whereClause.cityCorpId = cityCorpId;
      }

      try {
        const items = await prisma.cityWasteItem.findMany({
          where: whereClause,
          include: {
            cityCorp: { select: { id: true, name: true, code: true } },
          },
          orderBy: { name: "asc" },
        });

        if (items && items.length > 0) {
          return res.status(200).json(items);
        }
      } catch (e: any) {
        console.warn("[CityWasteItems GET Notice] Operating on resilient store:", e.message);
      }

      // Memory store fallback
      let list = memoryDb.cityWasteItems || [];
      if (cityCorpId) {
        list = list.filter((item: StoredCityWasteItem) => !item.cityCorpId || item.cityCorpId === cityCorpId);
      }

      // If empty, initialize default sample items
      if (list.length === 0) {
        list = [
          { id: "wi-1", name: "Bulky Household Furniture", category: "Bulky", depositFee: 250, unit: "Trip", active: true, cityCorpId: cityCorpId || null, createdAt: new Date().toISOString() },
          { id: "wi-2", name: "Restaurant Food & Organic Waste", category: "Organic", depositFee: 300, unit: "Bin / Barrel", active: true, cityCorpId: cityCorpId || null, createdAt: new Date().toISOString() },
          { id: "wi-3", name: "Hotel & Commercial Mixed Waste", category: "Commercial", depositFee: 400, unit: "Trip", active: true, cityCorpId: cityCorpId || null, createdAt: new Date().toISOString() },
          { id: "wi-4", name: "Construction & Renovation Debris", category: "Construction", depositFee: 500, unit: "Truckload", active: true, cityCorpId: cityCorpId || null, createdAt: new Date().toISOString() },
          { id: "wi-5", name: "E-Waste & Electronic Scraps", category: "Hazardous", depositFee: 350, unit: "Lot", active: true, cityCorpId: cityCorpId || null, createdAt: new Date().toISOString() },
        ];
        memoryDb.cityWasteItems = list;
      }

      return res.status(200).json(list);
    }

    // ── POST: Create Waste Item (City Corp Admin) ─────────────────────────
    if (req.method === "POST") {
      const { name, category, depositFee = 250, unit = "Trip", cityCorpId } = req.body || {};

      if (!name) {
        return res.status(400).json({ error: "Waste item name is required" });
      }

      const targetCityCorpId = cityCorpId || currentUser?.cityCorpId || null;

      try {
        const created = await prisma.cityWasteItem.create({
          data: {
            name: String(name).trim(),
            category: category ? String(category).trim() : "General",
            depositFee: Number(depositFee) || 250,
            unit: String(unit || "Trip").trim(),
            active: true,
            cityCorpId: targetCityCorpId,
          },
          include: {
            cityCorp: { select: { id: true, name: true, code: true } },
          },
        });
        return res.status(201).json(created);
      } catch (e: any) {
        console.warn("[CityWasteItems POST Notice] Using resilient store:", e.message);
      }

      const newItem: StoredCityWasteItem = {
        id: `wi-${Date.now()}`,
        name: String(name).trim(),
        category: category ? String(category).trim() : "General",
        depositFee: Number(depositFee) || 250,
        unit: String(unit || "Trip").trim(),
        active: true,
        cityCorpId: targetCityCorpId,
        createdAt: new Date().toISOString(),
      };

      if (!memoryDb.cityWasteItems) memoryDb.cityWasteItems = [];
      memoryDb.cityWasteItems.push(newItem);

      return res.status(201).json(newItem);
    }

    // ── PUT: Update Waste Item ──────────────────────────────────────────
    if (req.method === "PUT") {
      const id = (req.query.id as string) || req.body?.id;
      const { name, category, depositFee, unit, active } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: "Waste item ID is required" });
      }

      try {
        const updated = await prisma.cityWasteItem.update({
          where: { id },
          data: {
            ...(name && { name: String(name).trim() }),
            ...(category && { category: String(category).trim() }),
            ...(depositFee !== undefined && { depositFee: Number(depositFee) }),
            ...(unit && { unit: String(unit).trim() }),
            ...(active !== undefined && { active: Boolean(active) }),
          },
        });
        return res.status(200).json(updated);
      } catch (e: any) {
        console.warn("[CityWasteItems PUT Notice] Using resilient store:", e.message);
      }

      const idx = (memoryDb.cityWasteItems || []).findIndex((item: StoredCityWasteItem) => item.id === id);
      if (idx >= 0) {
        const cur = memoryDb.cityWasteItems[idx];
        const updatedItem: StoredCityWasteItem = {
          ...cur,
          ...(name && { name: String(name).trim() }),
          ...(category && { category: String(category).trim() }),
          ...(depositFee !== undefined && { depositFee: Number(depositFee) }),
          ...(unit && { unit: String(unit).trim() }),
          ...(active !== undefined && { active: Boolean(active) }),
        };
        memoryDb.cityWasteItems[idx] = updatedItem;
        return res.status(200).json(updatedItem);
      }

      return res.status(404).json({ error: "Waste item not found" });
    }

    // ── DELETE: Delete Waste Item ────────────────────────────────────────
    if (req.method === "DELETE") {
      const id = (req.query.id as string) || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: "Waste item ID is required" });
      }

      try {
        await prisma.cityWasteItem.delete({ where: { id } });
        return res.status(200).json({ success: true, message: "Waste item deleted" });
      } catch (e: any) {
        console.warn("[CityWasteItems DELETE Notice] Using resilient store:", e.message);
      }

      memoryDb.cityWasteItems = (memoryDb.cityWasteItems || []).filter((item: StoredCityWasteItem) => item.id !== id);
      return res.status(200).json({ success: true, message: "Waste item deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "DELETE"] }
);
