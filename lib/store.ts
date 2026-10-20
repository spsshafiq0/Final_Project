/// <reference types="node" />
/**
 * IntelliWaste Resilient Data Store
 * Provides persistent in-memory data structures with automatic fallback
 * when PostgreSQL credentials are not yet configured or database is unreachable.
 */

import { hashPassword } from "./auth";

export interface StoredCity {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  active: boolean;
  pointRate: number;
  minWithdrawPoints: number;
  rewardActive: boolean;
  createdAt: string;
}

export interface StoredWard {
  id: string;
  name: string;
  area: string;
  population: number;
  councilor: string;
  cityCorpId: string;
  createdAt: string;
}

export interface StoredUser {
  id: string;
  username: string;
  password: string; // bcrypt hashed
  fullName: string;
  email?: string | null;
  phone?: string | null;
  nid?: string | null;
  address?: string | null;
  role: "SUPER_ADMIN" | "CITY_ADMIN" | "WARD_ADMIN" | "DRIVER" | "CITIZEN" | "BUSINESS";
  active: boolean;
  points: number;
  cityCorpId?: string | null;
  wardId?: string | null;
  businessType?: string | null;
  tradeLicense?: string | null;
  licenseNumber?: string | null;
  createdAt: string;
}

export interface StoredBin {
  id: string;
  binCode: string;
  location: string;
  capacity: string;
  fill: number;
  weight: number;
  temp: string;
  gas: string;
  fire: boolean;
  status: "normal" | "warning" | "critical" | "fire";
  qr?: string | null;
  lastCollected?: string | null;
  lat: number;
  lng: number;
  wardId: string;
  createdAt: string;
}

export interface StoredTrack {
  id: string;
  truckId: string;
  driver?: string;
  phone?: string;
  route: string;
  stops: number;
  status: "active" | "idle" | "maintenance";
  progress: number;
  load: string;
  fuel: number;
  startTime: string;
  gpsLat: number;
  gpsLng: number;
  mapsRouteUrl?: string | null;
  wardId: string;
  driverId?: string | null;
  createdAt: string;
}

export interface StoredAlert {
  id: string;
  type: string;
  message: string;
  priority: "critical" | "high" | "medium";
  resolved: boolean;
  wardId?: string | null;
  binId?: string | null;
  createdAt: string;
}

export interface StoredWasteReport {
  id: string;
  reportCode: string;
  location: string;
  description: string;
  imageUrl?: string | null;
  wasteType: string;
  status: "pending" | "investigating" | "resolved";
  priority: "normal" | "urgent" | "critical";
  pointsEarned: number;
  citizenId: string;
  wardId?: string | null;
  createdAt: string;
}

// Global persistent in-memory database store
const g = globalThis as any;

if (!g.__intelliwaste_store) {
  g.__intelliwaste_store = {
    isSetupComplete: false,
    setupLocked: false,
    cities: [] as StoredCity[],
    wards: [] as StoredWard[],
    users: [] as StoredUser[],
    bins: [] as StoredBin[],
    tracks: [] as StoredTrack[],
    alerts: [] as StoredAlert[],
    pickups: [] as any[],
    withdrawals: [] as any[],
    wasteReports: [] as StoredWasteReport[],
    auditLogs: [] as any[],
  };
}

export const memoryDb = g.__intelliwaste_store;

/**
 * Clean memory store initialization
 */
export async function seedMemoryStore() {
  return memoryDb;
}
