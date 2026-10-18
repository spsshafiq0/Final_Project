import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: {
        cityCorp: true,
        ward: true,
      },
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: "User account inactive or not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        cityCorpId: user.cityCorpId,
        cityCorp: user.cityCorp,
        wardId: user.wardId,
        ward: user.ward,
      },
    });
  },
  { requireAuth: true, allowedMethods: ["GET"] }
);
