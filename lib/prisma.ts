import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma Client instances in development
// (Vercel serverless functions can create many connections)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
