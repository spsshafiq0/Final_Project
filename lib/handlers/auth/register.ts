import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword, signToken } from "../../auth";
import { apiHandler, AuthenticatedRequest } from "../../middleware";

export default apiHandler(
  async (req: AuthenticatedRequest, res: VercelResponse, currentUser: any) => {
    const {
      username,
      password,
      fullName,
      email,
      phone,
      nid,
      address,
      role = "CITIZEN",
      cityCorpId,
      wardId,
    } = req.body || {};

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: "Username, password, and full name are required" });
    }

    // Role creation security check
    if (role === "SUPER_ADMIN") {
      if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin can create another Super Admin" });
      }
    } else if (role === "CITY_ADMIN") {
      if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin can create City Corporation Admins" });
      }
      if (!cityCorpId) {
        return res.status(400).json({ error: "cityCorpId is required for City Admin" });
      }
    } else if (role === "WARD_ADMIN") {
      if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN")) {
        return res.status(403).json({ error: "Only Super Admin or City Corp Admin can create Ward Admins" });
      }
      if (currentUser.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        // Ensure the ward belongs to this City Admin's city
        if (wardId) {
          const ward = await prisma.ward.findUnique({ where: { id: wardId } });
          if (!ward || ward.cityCorpId !== currentUser.cityCorpId) {
            return res.status(403).json({ error: "You can only assign admins to wards in your City Corporation" });
          }
        }
      }
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        email: email || null,
        phone: phone || null,
        nid: nid || null,
        address: address || null,
        role,
        cityCorpId: cityCorpId || null,
        wardId: wardId || null,
      },
      include: {
        cityCorp: true,
        ward: true,
      },
    });

    const token = signToken({
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
      cityCorpId: newUser.cityCorpId,
      wardId: newUser.wardId,
      fullName: newUser.fullName,
    });

    return res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        cityCorpId: newUser.cityCorpId,
        cityCorp: newUser.cityCorp,
        wardId: newUser.wardId,
        ward: newUser.ward,
      },
    });
  },
  { allowedMethods: ["POST"] }
);
