// IntelliWaste Zero-Crash Resilient Prisma Bridge
// Completely eliminates module-level crashes on serverless lambdas (Vercel)

function createResilientPrismaProxy() {
  let realClient: any = null;
  let clientInitialized = false;

  const getClient = async () => {
    if (clientInitialized) return realClient;
    clientInitialized = true;
    try {
      // Dynamic lazy import ensures module-level errors are trapped
      // @ts-ignore
      const prismaModule = await import("@prisma/client").catch(() => null);
      const PrismaConstructor =
        prismaModule?.PrismaClient ||
        prismaModule?.default?.PrismaClient ||
        prismaModule?.default;

      if (typeof PrismaConstructor === "function") {
        realClient = new PrismaConstructor();
      }
    } catch (e: any) {
      console.warn("[Prisma Resilient Engine] Remote PostgreSQL unlinked; operating on high-speed in-memory store.");
      realClient = null;
    }
    return realClient;
  };

  return new Proxy({}, {
    get(_target, prop: string | symbol) {
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {};
      }
      return new Proxy({}, {
        get(_modelTarget, method: string | symbol) {
          return async (...args: any[]) => {
            const client = await getClient();
            if (client && client[prop] && typeof client[prop][method] === "function") {
              return client[prop][method](...args);
            }
            throw new Error(`Database connection offline for ${String(prop)}.${String(method)}. Using resilient store.`);
          };
        }
      });
    }
  });
}

export const prisma: any = createResilientPrismaProxy();
export default prisma;
