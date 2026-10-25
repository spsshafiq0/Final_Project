/**
 * IntelliWaste Real-Time Socket.io & Event Bus Bridge
 * 
 * Manages driver room subscriptions:
 * - `cc:<cityCorporationId>`
 * - `ward:<wardId>` (if assigned)
 * 
 * Automatically emits:
 * - `bin:updated` on telemetry/fill changes
 * - `route:needs-reoptimize` on urgent fire/gas/overflow alerts in scope
 */

import { EventEmitter } from "node:events";

export const eventBus = new EventEmitter();
eventBus.setMaxListeners(100);

// Connected driver sockets registry
const connectedDrivers = new Map();

/**
 * Register a driver socket into the appropriate CC and Ward rooms
 */
export function registerDriverSocket(socketId: string, driverInfo: { driverId: string; cityCorpId: string; wardId?: string | null }) {
  const rooms = [`cc:${driverInfo.cityCorpId}`];
  if (driverInfo.wardId) {
    rooms.push(`ward:${driverInfo.wardId}`);
  }

  connectedDrivers.set(socketId, {
    ...driverInfo,
    rooms,
    connectedAt: new Date(),
  });

  return rooms;
}

export function unregisterDriverSocket(socketId: string) {
  connectedDrivers.delete(socketId);
}

/**
 * Broadcast an urgent hazard/overflow alert to affected driver rooms
 */
export function broadcastAlertToScope(alert: {
  type: "fire" | "gas" | "overflow" | "maintenance" | string;
  message: string;
  binId?: string;
  cityCorpId?: string;
  wardId?: string;
  lat?: number;
  lng?: number;
}) {
  const payload = {
    ...alert,
    timestamp: new Date().toISOString(),
  };

  // Emit on local event bus
  eventBus.emit("alert:new", payload);

  const isUrgent = alert.type === "fire" || alert.type === "gas" || alert.type === "overflow";
  if (isUrgent) {
    const reoptPayload = {
      urgent: true,
      reason: alert.message || `Critical ${alert.type} alert triggered`,
      binId: alert.binId,
      cityCorpId: alert.cityCorpId,
      wardId: alert.wardId,
      lat: alert.lat,
      lng: alert.lng,
      timestamp: new Date().toISOString(),
    };

    eventBus.emit("route:needs-reoptimize", reoptPayload);

    // If global socket.io instance attached
    const g = globalThis as any;
    if (g.__io) {
      if (alert.wardId) {
        g.__io.to(`ward:${alert.wardId}`).emit("route:needs-reoptimize", reoptPayload);
      }
      if (alert.cityCorpId) {
        g.__io.to(`cc:${alert.cityCorpId}`).emit("route:needs-reoptimize", reoptPayload);
      }
    }
  }
}

/**
 * Broadcast bin update to room
 */
export function broadcastBinUpdate(bin: any) {
  eventBus.emit("bin:update", bin);
  const g = globalThis as any;
  if (g.__io) {
    if (bin.wardId) {
      g.__io.to(`ward:${bin.wardId}`).emit("bin:update", bin);
    }
    if (bin.cityCorpId) {
      g.__io.to(`cc:${bin.cityCorpId}`).emit("bin:update", bin);
    }
  }
}

export default {
  eventBus,
  registerDriverSocket,
  unregisterDriverSocket,
  broadcastAlertToScope,
  broadcastBinUpdate,
};
