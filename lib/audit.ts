import prisma from "./prisma";
import { memoryDb } from "./store";

export interface LogParams {
  userId?: string | null;
  action: string;
  resource: string;
  details?: string | null;
  ipAddress?: string | null;
}

export async function logAudit(params: LogParams): Promise<void> {
  const timestamp = new Date().toISOString();

  // 1. Try Prisma DB
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resource: params.resource,
        details: params.details || null,
        ipAddress: params.ipAddress || null,
      },
    }).catch(() => null);
  } catch (err: any) {
    console.warn("[AuditLog DB Warning]", err.message);
  }

  // 2. High-speed resilient memory buffer
  if (!memoryDb.auditLogs) {
    memoryDb.auditLogs = [];
  }

  memoryDb.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: params.userId || null,
    action: params.action,
    resource: params.resource,
    details: params.details || null,
    ipAddress: params.ipAddress || null,
    createdAt: timestamp,
  });

  // Keep last 100 in memory
  if (memoryDb.auditLogs.length > 100) {
    memoryDb.auditLogs = memoryDb.auditLogs.slice(0, 100);
  }
}

export default logAudit;
