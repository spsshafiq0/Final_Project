import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiHandler } from "../middleware";
import { memoryDb } from "../store";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    return res.status(200).json({
      success: true,
      message: memoryDb.isSetupComplete
        ? "System is fully installed and operational."
        : "System is ready for first-time Super Admin initialization via /setup.",
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
