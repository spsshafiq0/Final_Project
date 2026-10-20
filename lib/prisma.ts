// @ts-ignore
import * as PrismaScope from "@prisma/client";

// Resilient Proxy that intercepts all model calls and gracefully rejects if DB is not connected
function createResilientPrismaProxy() {
  return new Proxy({}, {
    get(_target, prop: string | symbol) {
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {};
      }
      return new Proxy({}, {
        get(_modelTarget, method: string | symbol) {
          return async () => {
            throw new Error(`Database connection not available for ${String(prop)}.${String(method)}. Using resilient store.`);
          };
        }
      });
    }
  });
}

// Resilient instantiation supporting hoisted, bundled, and serverless environments
let instantiatedClient: any = null;

try {
  const PrismaConstructor =
    (PrismaScope as any)?.PrismaClient ||
    (PrismaScope as any)?.default?.PrismaClient ||
    (PrismaScope as any)?.default;

  if (typeof PrismaConstructor === "function") {
    instantiatedClient = new PrismaConstructor();
  }
} catch (err: any) {
  console.warn("[Prisma Resilient Mode] Remote DB client initialization bypassed:", err?.message || err);
}

const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma =
  globalForPrisma.prisma ||
  instantiatedClient ||
  createResilientPrismaProxy();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
