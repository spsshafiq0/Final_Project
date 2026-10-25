import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiHandler } from "../middleware";
import { memoryDb } from "../store";
// @ts-ignore
import { runMigrationAndSeed } from "../../scripts/seed.js";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    const shouldSeed = req.method === "POST" || req.query.seed === "true" || memoryDb.bins.length === 0;

    let seedResult = null;
    if (shouldSeed) {
      const count = req.query.count ? parseInt(req.query.count as string, 10) : undefined;
      seedResult = await runMigrationAndSeed(count);
    }

    return res.status(200).json({
      success: true,
      message: seedResult
        ? "Idempotent migration and seed executed successfully."
        : "IntelliWaste system database status.",
      seedResult,
      stats: {
        cities: memoryDb.cities.length,
        wards: memoryDb.wards.length,
        users: memoryDb.users.length,
        bins: memoryDb.bins.length,
        tracks: memoryDb.tracks.length,
      },
      isSetupComplete: Boolean(memoryDb.isSetupComplete),
    });
  },
  { allowedMethods: ["GET", "POST"] }
);
