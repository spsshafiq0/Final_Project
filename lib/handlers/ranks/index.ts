import type { VercelResponse } from "@vercel/node";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb, StoredRankTier } from "../../store";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    // Ensure rankTiers array exists
    if (!memoryDb.rankTiers) {
      memoryDb.rankTiers = [
        { id: "tier-1", level: 1, name: "Eco Beginner", minPoints: 0, maxPoints: 200, badge: "🌱" },
        { id: "tier-2", level: 2, name: "Green Scout", minPoints: 201, maxPoints: 600, badge: "🌿" },
        { id: "tier-3", level: 3, name: "Waste Warrior", minPoints: 601, maxPoints: 1500, badge: "⭐" },
        { id: "tier-4", level: 4, name: "Eco Champion", minPoints: 1501, maxPoints: 3000, badge: "🏅" },
        { id: "tier-5", level: 5, name: "Earth Guardian", minPoints: 3001, maxPoints: null, badge: "🏆" },
      ];
    }

    // ── GET: List All Rank Tiers ──────────────────────────────────────────
    if (req.method === "GET") {
      const sorted = [...memoryDb.rankTiers].sort((a, b) => a.level - b.level);
      return res.status(200).json(sorted);
    }

    // Only SUPER_ADMIN or CITY_ADMIN can modify rank tiers
    if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN") {
      return res.status(403).json({ error: "Only administrators can configure rank tiers" });
    }

    // ── POST: Create New Rank Tier ─────────────────────────────────────────
    if (req.method === "POST") {
      const { level, name, minPoints, maxPoints, badge } = req.body || {};

      if (!name || level === undefined || minPoints === undefined) {
        return res.status(400).json({ error: "Level, Name, and Minimum Points are required" });
      }

      const newTier: StoredRankTier = {
        id: `tier-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        level: Number(level) || 1,
        name: String(name).trim(),
        minPoints: Number(minPoints) || 0,
        maxPoints: maxPoints === null || maxPoints === "" || maxPoints === undefined ? null : Number(maxPoints),
        badge: badge || "🏅",
      };

      memoryDb.rankTiers.push(newTier);
      memoryDb.rankTiers.sort((a: StoredRankTier, b: StoredRankTier) => a.level - b.level);

      return res.status(201).json(newTier);
    }

    // ── PUT: Update Rank Tier ─────────────────────────────────────────────
    if (req.method === "PUT") {
      const id = ((req.query?.id as string) || req.body?.id) as string;
      if (!id) {
        return res.status(400).json({ error: "Tier ID is required" });
      }

      const idx = memoryDb.rankTiers.findIndex((t: StoredRankTier) => t.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Rank tier not found" });
      }

      const { level, name, minPoints, maxPoints, badge } = req.body || {};
      if (level !== undefined) memoryDb.rankTiers[idx].level = Number(level);
      if (name !== undefined) memoryDb.rankTiers[idx].name = String(name).trim();
      if (minPoints !== undefined) memoryDb.rankTiers[idx].minPoints = Number(minPoints);
      if (maxPoints !== undefined) {
        memoryDb.rankTiers[idx].maxPoints =
          maxPoints === null || maxPoints === "" ? null : Number(maxPoints);
      }
      if (badge !== undefined) memoryDb.rankTiers[idx].badge = badge;

      memoryDb.rankTiers.sort((a: StoredRankTier, b: StoredRankTier) => a.level - b.level);

      return res.status(200).json(memoryDb.rankTiers[idx]);
    }

    // ── DELETE: Remove Rank Tier ──────────────────────────────────────────
    if (req.method === "DELETE") {
      const id = ((req.query?.id as string) || req.body?.id) as string;
      if (!id) {
        return res.status(400).json({ error: "Tier ID is required" });
      }

      memoryDb.rankTiers = memoryDb.rankTiers.filter((t: StoredRankTier) => t.id !== id);
      return res.status(200).json({ success: true, message: "Rank tier deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "DELETE"] }
);
