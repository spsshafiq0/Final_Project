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

export interface StoredRankTier {
  id: string;
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number | null;
  badge: string;
}

export interface StoredVoucherCode {
  id: string;
  code: string;
  isRedeemed: boolean;
  redeemedByUserId?: string | null;
  redeemedByUserName?: string | null;
  redeemedAt?: string | null;
}

export interface StoredReward {
  id: string;
  name: string;
  partner: string;
  points: number;
  icon: string;
  category: string;
  description?: string;
  active: boolean;
  codes: StoredVoucherCode[];
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
    rankTiers: [
      { id: "tier-1", level: 1, name: "Eco Beginner", minPoints: 0, maxPoints: 200, badge: "🌱" },
      { id: "tier-2", level: 2, name: "Green Scout", minPoints: 201, maxPoints: 600, badge: "🌿" },
      { id: "tier-3", level: 3, name: "Waste Warrior", minPoints: 601, maxPoints: 1500, badge: "⭐" },
      { id: "tier-4", level: 4, name: "Eco Champion", minPoints: 1501, maxPoints: 3000, badge: "🏅" },
      { id: "tier-5", level: 5, name: "Earth Guardian", minPoints: 3001, maxPoints: null, badge: "🏆" },
    ] as StoredRankTier[],
    rewards: [
      {
        id: "rew-1",
        name: "Shajgoj 20% Off",
        partner: "Shajgoj",
        points: 500,
        icon: "🛍️",
        category: "Shopping",
        description: "20% off on skincare and cosmetics orders",
        active: true,
        codes: [
          { id: "c-1-1", code: "SHAJ-20-8491", isRedeemed: false },
          { id: "c-1-2", code: "SHAJ-20-3329", isRedeemed: false },
          { id: "c-1-3", code: "SHAJ-20-7714", isRedeemed: false },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: "rew-2",
        name: "Pathao Ride Credit ৳100",
        partner: "Pathao",
        points: 800,
        icon: "🛵",
        category: "Rides",
        description: "৳100 credit for bike or car ride across the city",
        active: true,
        codes: [
          { id: "c-2-1", code: "PATH-100-9921", isRedeemed: false },
          { id: "c-2-2", code: "PATH-100-4482", isRedeemed: false },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: "rew-3",
        name: "Shohoz Movie Ticket",
        partner: "Shohoz",
        points: 1200,
        icon: "🎬",
        category: "Entertainment",
        description: "1 Free movie ticket voucher on Star Cineplex",
        active: true,
        codes: [
          { id: "c-3-1", code: "SHOZ-MOV-1192", isRedeemed: false },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: "rew-4",
        name: "Tree Planted in Your Name",
        partner: "Green Bangladesh",
        points: 200,
        icon: "🌳",
        category: "Eco Action",
        description: "A native tree sapling planted in urban green belt with certificate",
        active: true,
        codes: [
          { id: "c-4-1", code: "TREE-DNCC-0012", isRedeemed: false },
          { id: "c-4-2", code: "TREE-DNCC-0013", isRedeemed: false },
          { id: "c-4-3", code: "TREE-DNCC-0014", isRedeemed: false },
        ],
        createdAt: new Date().toISOString(),
      },
    ] as StoredReward[],
  };
}

// Ensure rankTiers and rewards exist if store was already instantiated
if (!g.__intelliwaste_store.rankTiers || g.__intelliwaste_store.rankTiers.length === 0) {
  g.__intelliwaste_store.rankTiers = [
    { id: "tier-1", level: 1, name: "Eco Beginner", minPoints: 0, maxPoints: 200, badge: "🌱" },
    { id: "tier-2", level: 2, name: "Green Scout", minPoints: 201, maxPoints: 600, badge: "🌿" },
    { id: "tier-3", level: 3, name: "Waste Warrior", minPoints: 601, maxPoints: 1500, badge: "⭐" },
    { id: "tier-4", level: 4, name: "Eco Champion", minPoints: 1501, maxPoints: 3000, badge: "🏅" },
    { id: "tier-5", level: 5, name: "Earth Guardian", minPoints: 3001, maxPoints: null, badge: "🏆" },
  ];
}

if (!g.__intelliwaste_store.rewards || g.__intelliwaste_store.rewards.length === 0) {
  g.__intelliwaste_store.rewards = [
    {
      id: "rew-1",
      name: "Shajgoj 20% Off",
      partner: "Shajgoj",
      points: 500,
      icon: "🛍️",
      category: "Shopping",
      description: "20% off on skincare and cosmetics orders",
      active: true,
      codes: [
        { id: "c-1-1", code: "SHAJ-20-8491", isRedeemed: false },
        { id: "c-1-2", code: "SHAJ-20-3329", isRedeemed: false },
        { id: "c-1-3", code: "SHAJ-20-7714", isRedeemed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: "rew-2",
      name: "Pathao Ride Credit ৳100",
      partner: "Pathao",
      points: 800,
      icon: "🛵",
      category: "Rides",
      description: "৳100 credit for bike or car ride across the city",
      active: true,
      codes: [
        { id: "c-2-1", code: "PATH-100-9921", isRedeemed: false },
        { id: "c-2-2", code: "PATH-100-4482", isRedeemed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: "rew-3",
      name: "Shohoz Movie Ticket",
      partner: "Shohoz",
      points: 1200,
      icon: "🎬",
      category: "Entertainment",
      description: "1 Free movie ticket voucher on Star Cineplex",
      active: true,
      codes: [
        { id: "c-3-1", code: "SHOZ-MOV-1192", isRedeemed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: "rew-4",
      name: "Tree Planted in Your Name",
      partner: "Green Bangladesh",
      points: 200,
      icon: "🌳",
      category: "Eco Action",
      description: "A native tree sapling planted in urban green belt with certificate",
      active: true,
      codes: [
        { id: "c-4-1", code: "TREE-DNCC-0012", isRedeemed: false },
        { id: "c-4-2", code: "TREE-DNCC-0013", isRedeemed: false },
        { id: "c-4-3", code: "TREE-DNCC-0014", isRedeemed: false },
      ],
      createdAt: new Date().toISOString(),
    },
  ];
}

export const memoryDb = g.__intelliwaste_store;

/**
 * Clean memory store initialization
 */
export async function seedMemoryStore() {
  return memoryDb;
}
