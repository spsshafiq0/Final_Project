import type { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { comparePassword, signToken } from "../../auth";
import { apiHandler } from "../../middleware";

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        cityCorp: true,
        ward: true,
      },
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: "Invalid credentials or account inactive" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      cityCorpId: user.cityCorpId,
      wardId: user.wardId,
      fullName: user.fullName,
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points,
        address: user.address,
        cityCorpId: user.cityCorpId,
        cityCorp: user.cityCorp,
        wardId: user.wardId,
        ward: user.ward,
      },
    });
  },
  { allowedMethods: ["POST"] }
);
