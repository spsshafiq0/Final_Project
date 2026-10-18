// @ts-ignore
import * as PrismaScope from "@prisma/client";

// Resilient instantiation supporting both hoisted and isolated package exports
const PrismaConstructor =
  (PrismaScope as any).PrismaClient ||
  (PrismaScope as any).default?.PrismaClient ||
  (PrismaScope as any).default;

const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || (PrismaConstructor ? new PrismaConstructor() : ({} as any));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
