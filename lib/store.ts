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

// Root Super Admin seeded for resilience
const defaultRootSuperAdmin: StoredUser = {
  id: "usr-super-1",
  username: "spsshafiq",
  password: "$2a$10$HKkVtRwcZcEFJNbdQsXg7Oz1pxtT037uW8N3Gj2iHQenrzXX8Bp6S", // bcrypt hash of Sps(#)12D
  fullName: "Shafiq",
  email: "shafiq_mollah1087@uits.edu.bd",
  phone: "+8801700000000",
  role: "SUPER_ADMIN",
  active: true,
  points: 0,
  createdAt: new Date().toISOString(),
};

// Global persistent in-memory database store
const g = globalThis as any;

if (!g.__intelliwaste_store) {
  g.__intelliwaste_store = {
    isSetupComplete: true,
    setupLocked: true,
    cities: [] as StoredCity[],
    wards: [] as StoredWard[],
    users: [defaultRootSuperAdmin] as StoredUser[],
    bins: [] as StoredBin[],
    tracks: [] as StoredTrack[],
    alerts: [] as StoredAlert[],
    pickups: [] as any[],
    withdrawals: [] as any[],
  };
}

// Ensure arrays exist and Super Admin is present if store was previously created
if (!g.__intelliwaste_store.pickups) g.__intelliwaste_store.pickups = [];
if (!g.__intelliwaste_store.withdrawals) g.__intelliwaste_store.withdrawals = [];
if (!g.__intelliwaste_store.users || g.__intelliwaste_store.users.length === 0) {
  g.__intelliwaste_store.users = [defaultRootSuperAdmin];
}
g.__intelliwaste_store.isSetupComplete = true;
g.__intelliwaste_store.setupLocked = true;

export const memoryDb = g.__intelliwaste_store;

/**
 * Seed initial fixtures into memory store if empty
 */
export async function seedMemoryStore(superAdminPass = "Sps(#)12D") {
  const hash = await hashPassword(superAdminPass);

  // 1. Root Super Admin
  if (!memoryDb.users.some((u: StoredUser) => u.role === "SUPER_ADMIN")) {
    memoryDb.users.push({
      id: "usr-super-1",
      username: "spsshafiq",
      password: hash,
      fullName: "Shafiq",
      email: "shafiq_mollah1087@uits.edu.bd",
      phone: "+8801700000000",
      role: "SUPER_ADMIN",
      active: true,
      points: 0,
      createdAt: new Date().toISOString(),
    });
    memoryDb.isSetupComplete = true;
    memoryDb.setupLocked = true;
  }

  // 2. Initial City Corporations
  if (memoryDb.cities.length === 0) {
    const dncc: StoredCity = {
      id: "city-dncc-1",
      name: "Dhaka North City Corporation",
      code: "DNCC",
      address: "Plot 23-26, Road 46, Gulshan-2, Dhaka",
      phone: "+880-2-9894415",
      email: "info@dncc.gov.bd",
      active: true,
      pointRate: 0.20,
      minWithdrawPoints: 100,
      rewardActive: true,
      createdAt: new Date().toISOString(),
    };
    const dscc: StoredCity = {
      id: "city-dscc-1",
      name: "Dhaka South City Corporation",
      code: "DSCC",
      address: "Nagar Bhaban, Fulbaria, Dhaka",
      phone: "+880-2-9556014",
      email: "info@dscc.gov.bd",
      active: true,
      pointRate: 0.25,
      minWithdrawPoints: 150,
      rewardActive: true,
      createdAt: new Date().toISOString(),
    };
    memoryDb.cities.push(dncc, dscc);

    // Initial Wards
    const ward1: StoredWard = {
      id: "ward-01",
      name: "Ward 01",
      area: "Uttara North",
      population: 48500,
      councilor: "Abul Kalam",
      cityCorpId: dncc.id,
      createdAt: new Date().toISOString(),
    };
    const ward2: StoredWard = {
      id: "ward-02",
      name: "Ward 02",
      area: "Uttara South",
      population: 52000,
      councilor: "Rina Begum",
      cityCorpId: dncc.id,
      createdAt: new Date().toISOString(),
    };
    const ward3: StoredWard = {
      id: "ward-03",
      name: "Ward 03",
      area: "Khilkhet",
      population: 39000,
      councilor: "Faruk Ahmed",
      cityCorpId: dncc.id,
      createdAt: new Date().toISOString(),
    };
    const ward4: StoredWard = {
      id: "ward-04",
      name: "Ward 04",
      area: "Vatara",
      population: 29000,
      councilor: "Nasrin Parvin",
      cityCorpId: dncc.id,
      createdAt: new Date().toISOString(),
    };
    memoryDb.wards.push(ward1, ward2, ward3, ward4);

    // Initial Smart Bins (including Ammonia Gas & High Temp IoT sensors for route optimization)
    memoryDb.bins.push(
      {
        id: "bin-1",
        binCode: "B-201",
        location: "Sector 3 Park Entrance, Uttara",
        capacity: "120L",
        fill: 94,
        weight: 85,
        temp: "52°C [HIGH TEMP HAZARD]",
        gas: "75 ppm [AMMONIA SPIKE]",
        fire: true,
        status: "fire",
        lat: 23.872,
        lng: 90.395,
        wardId: ward1.id,
        createdAt: new Date().toISOString(),
      },
      {
        id: "bin-2",
        binCode: "B-204",
        location: "Rajlaxmi Complex Corner, Road 7",
        capacity: "240L",
        fill: 88,
        weight: 120,
        temp: "39°C [WARNING]",
        gas: "58 ppm [AMMONIA WARNING]",
        fire: false,
        status: "critical",
        lat: 23.868,
        lng: 90.399,
        wardId: ward1.id,
        createdAt: new Date().toISOString(),
      },
      {
        id: "bin-3",
        binCode: "B-108",
        location: "Azampur Bus Depot",
        capacity: "120L",
        fill: 42,
        weight: 35,
        temp: "27°C [Normal]",
        gas: "12 ppm [Normal]",
        fire: false,
        status: "normal",
        lat: 23.862,
        lng: 90.402,
        wardId: ward1.id,
        createdAt: new Date().toISOString(),
      }
    );

    // Initial Collection Tracks
    memoryDb.tracks.push({
      id: "TR-001",
      truckId: "DNCC-T01",
      driver: "Abdul Karim",
      phone: "+8801700000004",
      route: "Sector 3 → Rajlaxmi → Azampur Depot",
      stops: 6,
      status: "active",
      progress: 65,
      load: "72%",
      fuel: 85,
      startTime: "07:00 AM",
      gpsLat: 23.872,
      gpsLng: 90.395,
      wardId: ward1.id,
      driverId: "usr-driver-1",
      createdAt: new Date().toISOString(),
    });

    // Initial IoT Alerts
    memoryDb.alerts.push({
      id: "alt-1",
      type: "Toxic Ammonia & Heat Hazard",
      message: "Bin B-201 at Sector 3 Park detected 52°C heat and 75 ppm ammonia gas spike. Immediate dispatch required.",
      priority: "critical",
      resolved: false,
      wardId: ward1.id,
      binId: "bin-1",
      createdAt: new Date().toISOString(),
    });
  }

  return memoryDb;
}
