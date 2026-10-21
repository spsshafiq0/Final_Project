import type { VercelResponse } from "@vercel/node";
import prisma from "../../prisma";
import { hashPassword, signToken } from "../../auth";
import { apiHandler, AuthenticatedRequest } from "../../middleware";
import { memoryDb } from "../../store";
import { logAudit } from "../../audit";
import { validateUsername, validatePassword, validateEmail, sanitizeString } from "../../security";

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

    const userCheck = validateUsername(username);
    if (!userCheck.valid) {
      return res.status(400).json({ error: userCheck.error });
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.error });
    }

    const cleanFullName = sanitizeString(fullName, 100);
    if (!cleanFullName) {
      return res.status(400).json({ error: "Full name is required" });
    }

    let cleanEmail: string | null = null;
    if (email && String(email).trim()) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) {
        return res.status(400).json({ error: emailCheck.error });
      }
      cleanEmail = emailCheck.clean;
    }

    const cleanUsername = userCheck.clean;

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

    // Check if username already exists in Prisma or memoryDb
    let isTaken = false;
    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanUsername, mode: "insensitive" } },
            ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: "insensitive" } }] : []),
          ],
        },
      }).catch(() => null);
      if (existing) isTaken = true;
    } catch {}

    if (!isTaken && memoryDb.users.some((u: any) => u.username.toLowerCase() === cleanUsername || (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail))) {
      isTaken = true;
    }

    if (isTaken) {
      return res.status(409).json({ error: "Username or email is already taken" });
    }

    const hashedPassword = await hashPassword(password);
    let newUser: any = null;

    try {
      newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          password: hashedPassword,
          fullName: cleanFullName,
          email: cleanEmail,
          phone: phone ? String(phone).trim() : null,
          nid: nid ? String(nid).trim() : null,
          address: address ? sanitizeString(address, 200) : null,
          role,
          cityCorpId: cityCorpId || null,
          wardId: wardId || null,
        },
        include: {
          cityCorp: true,
          ward: true,
        },
      }).catch(() => null);
    } catch (e: any) {
      console.warn("[Register PG Notice] Falling back to memory store:", e.message);
    }

    const userId = newUser?.id || `usr-reg-${Date.now()}`;
    const memUser = {
      id: userId,
      username: cleanUsername,
      password: hashedPassword,
      fullName: cleanFullName,
      email: cleanEmail,
      phone: phone ? String(phone).trim() : null,
      nid: nid ? String(nid).trim() : null,
      address: address ? sanitizeString(address, 200) : null,
      role,
      active: true,
      points: 0,
      cityCorpId: cityCorpId || null,
      wardId: wardId || null,
      createdAt: new Date().toISOString(),
    };

    if (!memoryDb.users.some((u: any) => u.username === cleanUsername)) {
      memoryDb.users.push(memUser);
    }

    await logAudit({
      userId: memUser.id,
      action: "USER_REGISTER",
      resource: "users",
      details: `New account registered: ${cleanUsername} (${role})`,
      ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
    });

    const token = signToken({
      userId: memUser.id,
      username: memUser.username,
      role: memUser.role,
      cityCorpId: memUser.cityCorpId,
      wardId: memUser.wardId,
      fullName: memUser.fullName,
    });

    return res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: memUser.id,
        username: memUser.username,
        fullName: memUser.fullName,
        email: memUser.email,
        phone: memUser.phone,
        role: memUser.role,
        cityCorpId: memUser.cityCorpId,
        wardId: memUser.wardId,
      },
    });
  },
  { allowedMethods: ["POST"] }
);
