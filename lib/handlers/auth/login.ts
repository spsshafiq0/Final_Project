import type { VercelRequest, VercelResponse } from "@vercel/node"
import prisma from "../../prisma"
import { comparePassword, signToken } from "../../auth"
import { apiHandler } from "../../middleware"
import { memoryDb, StoredUser } from "../../store"
import { logAudit } from "../../audit"

export default apiHandler(
  async (req: VercelRequest, res: VercelResponse) => {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" })
    }

    const cleanUsername = String(username).toLowerCase().trim()

    let user: any = null
    let dbError: string | null = null

    // 1. Try Prisma DB
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanUsername, mode: "insensitive" } },
            { email: { equals: cleanUsername, mode: "insensitive" } },
          ],
        },
        include: {
          cityCorp: true,
          ward: true,
        },
      })
    } catch (e: any) {
      dbError = e?.message || String(e)
      console.warn("[Auth Login Notice] Database error:", e.message)
    }

    // 2. Fallback to memory store
    if (!user) {
      const memUser = memoryDb.users.find(
        (u: StoredUser) =>
          u.username.toLowerCase() === cleanUsername ||
          (u.email && u.email.toLowerCase() === cleanUsername),
      )

      if (memUser) {
        const city = memoryDb.cities.find(
          (c: any) => c.id === memUser.cityCorpId,
        )
        const ward = memoryDb.wards.find((w: any) => w.id === memUser.wardId)
        user = {
          ...memUser,
          cityCorp: city || null,
          ward: ward || null,
        }
      }
    }

    if (!user || !user.active) {
      if (dbError && Boolean(process.env.VERCEL || process.env.NODE_ENV === "production")) {
        return res.status(503).json({
          error: `Database connection error: Unable to verify credentials because PostgreSQL is unreachable (${dbError}). Please verify your DATABASE_URL in Vercel settings.`,
        })
      }
      return res.status(401).json({ error: "Invalid username or password" })
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" })
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      cityCorpId: user.cityCorpId,
      wardId: user.wardId,
      fullName: user.fullName,
    })

    await logAudit({
      userId: user.id,
      action: "USER_LOGIN",
      resource: "auth",
      details: `User ${user.username} (${user.role}) logged in successfully`,
      ipAddress: (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string),
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
        points: user.points || 0,
        address: user.address,
        cityCorpId: user.cityCorpId,
        cityCorp: user.cityCorp,
        wardId: user.wardId,
        ward: user.ward,
      },
    })
  },
  { allowedMethods: ["POST"] },
)
