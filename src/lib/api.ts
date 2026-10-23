// IntelliWaste Unified API Client
// Handles JWT authentication, CRUD for City Corps, Wards, Bins, Tracks, Users, and Fallback Mock Data

const API_BASE = "/api";

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: "SUPER_ADMIN" | "CITY_ADMIN" | "WARD_ADMIN" | "CITIZEN" | "DRIVER" | "BUSINESS";
  cityCorpId?: string | null;
  cityCorp?: { id: string; name: string; code: string } | null;
  wardId?: string | null;
  ward?: { id: string; name: string; area: string } | null;
  points?: number;
  walletBalance?: number;
  address?: string | null;
  nid?: string | null;
}

export interface CityCorporationItem {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  active: boolean;
  pointRate?: number;
  minWithdrawPoints?: number;
  rewardActive?: boolean;
  wards?: { id: string; name: string; area: string }[];
  _count?: { wards: number; admins: number };
}

export interface WardItem {
  id: string;
  name: string;
  area: string;
  population: number;
  councilor: string;
  cityCorpId: string;
  reportEnabled?: boolean;
  withdrawEnabled?: boolean;
  cityCorp?: { id: string; name: string; code: string };
  _count?: { bins: number; tracks: number; alerts?: number };
}

export interface BinItem {
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
  ward?: WardItem;
}

export interface TrackItem {
  id: string;
  truckId: string;
  truckType?: "NORMAL" | "HAZARDOUS";
  route: string;
  stops: number;
  status: "active" | "idle" | "maintenance";
  progress: number;
  load: string;
  fuel: number;
  startTime?: string;
  gpsLat: number;
  gpsLng: number;
  mapsRouteUrl?: string | null;
  wardId: string;
  ward?: WardItem;
  driverId?: string | null;
  driver?: { id: string; fullName: string; phone?: string | null; username?: string; email?: string | null } | null;
}

export interface PickupScheduleItem {
  id: string;
  date: string;
  time: string;
  wasteType: "Organic" | "Recyclable" | "General" | "Hazardous";
  zone: string;
  status: "PENDING_APPROVAL" | "CONFIRMED" | "REJECTED";
  available: boolean;
  wardId?: string | null;
  ward?: { id: string; name: string; area: string } | null;
  cityCorpId?: string | null;
  cityCorp?: { id: string; name: string; code: string } | null;
  createdById?: string | null;
  createdByRole?: string | null;
  createdAt?: string;
}

export interface CityWasteItem {
  id: string;
  name: string;
  category: string;
  depositFee: number;
  unit: string;
  active: boolean;
  cityCorpId: string;
  cityCorp?: { id: string; name: string; code: string };
  createdAt?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "DEPOSIT" | "PAYMENT" | "REFUND";
  amount: number;
  paymentMethod?: string | null;
  trxId?: string | null;
  status: string;
  description?: string | null;
  createdAt: string;
}

export interface PickupItem {
  id: string;
  requesterType: string;
  area: string;
  address: string;
  wasteType: string;
  date: string;
  amount: number;
  status: "open" | "accepted" | "completed";
  securityCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  cityCorpId?: string | null;
  cityCorp?: { id: string; name: string; code: string } | null;
  wardId?: string | null;
  ward?: { id: string; name: string; area: string } | null;
  wasteItemId?: string | null;
  wasteItem?: CityWasteItem | null;
  requesterId?: string;
  requester?: { id: string; fullName: string; phone?: string | null };
  driverId?: string | null;
  driver?: { id: string; fullName: string; phone?: string | null } | null;
  createdAt: string;
}

export interface AlertItem {
  id: string;
  type: string;
  message: string;
  priority: "critical" | "high" | "medium";
  resolved: boolean;
  wardId?: string | null;
  ward?: { id: string; name: string; area: string } | null;
  binId?: string | null;
  bin?: BinItem | null;
  createdAt: string;
}

export interface WithdrawalItem {
  id: string;
  verificationCode: string;
  points: number;
  amount: number;
  pointRate?: number;
  status: "pending" | "approved" | "paid" | "rejected";
  citizenId: string;
  citizen?: { id: string; fullName: string; phone?: string | null; username?: string };
  citizenName?: string;
  citizenPhone?: string;
  wardId: string;
  ward?: { id: string; name: string; area: string; cityCorp?: { name: string; code: string; pointRate?: number } };
  processedById?: string | null;
  processedBy?: { id: string; fullName: string; username?: string } | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reportCode: string;
  location: string;
  lat?: number | null;
  lng?: number | null;
  description: string;
  imageUrl?: string | null;
  wasteType: string;
  status: "pending" | "investigating" | "resolved" | "FAKE_REPORT";
  priority: "normal" | "urgent" | "critical";
  pointsEarned: number;
  isFakeReport?: boolean;
  fakeReason?: string | null;
  reportedFakeByDriverId?: string | null;
  pointsRevoked?: boolean;
  citizenId: string;
  citizen?: { id: string; fullName: string; phone?: string; email?: string } | null;
  wardId?: string | null;
  ward?: { id: string; name: string; area: string } | null;
  createdAt: string;
}

export interface RankTierItem {
  id: string;
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number | null;
  badge: string;
}

export interface VoucherCodeItem {
  id: string;
  code: string;
  isRedeemed: boolean;
  redeemedByUserId?: string | null;
  redeemedByUserName?: string | null;
  redeemedAt?: string | null;
}

export interface RewardItem {
  id: string;
  name: string;
  partner: string;
  points: number;
  icon: string;
  category: string;
  description?: string;
  active: boolean;
  stockCount: number;
  available: boolean;
  totalCodes?: number;
  availableCodes?: number;
  redeemedCodes?: number;
  codes?: VoucherCodeItem[];
  myRedeemedCodes?: { id: string; code: string; rewardName: string; partner: string; redeemedAt: string }[];
  createdAt?: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  resource: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

// ─── Token Management ──────────────────────────────────────────────────
export const tokenStorage = {
  get: (): string | null => localStorage.getItem("intelliwaste_token"),
  set: (token: string) => localStorage.setItem("intelliwaste_token", token),
  remove: () => localStorage.removeItem("intelliwaste_token"),
};

export const userStorage = {
  get: (): UserProfile | null => {
    try {
      const data = localStorage.getItem("intelliwaste_user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  set: (user: UserProfile) => localStorage.setItem("intelliwaste_user", JSON.stringify(user)),
  remove: () => localStorage.removeItem("intelliwaste_user"),
};

// ─── Fetch Helper ──────────────────────────────────────────────────────
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && endpoint !== "/auth/login") {
      tokenStorage.remove();
      userStorage.remove();
    }
    const errorMsg = (isJson && data?.error) || response.statusText || "Request failed";
    throw new Error(errorMsg);
  }

  return data as T;
}

// ─── API Endpoints ─────────────────────────────────────────────────────

export const api = {
  // Auth
  auth: {
    login: async (username: string, password: string) => {
      const result = await request<{ token: string; user: UserProfile }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      tokenStorage.set(result.token);
      userStorage.set(result.user);
      return result;
    },
    register: async (userData: any) => {
      const result = await request<{ message: string; token: string; user: UserProfile }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      if (result.token) tokenStorage.set(result.token);
      if (result.user) userStorage.set(result.user);
      return result;
    },
    me: async () => {
      const result = await request<{ user: UserProfile }>("/auth/me");
      userStorage.set(result.user);
      return result.user;
    },
    logout: () => {
      tokenStorage.remove();
      userStorage.remove();
    },
    forgotPassword: async (identifier: string, role?: string) => {
      return request<{
        success: boolean;
        message: string;
        emailMasked: string;
        recoveryToken?: string;
      }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier, role }),
      });
    },
    verifyCode: async (identifier: string, code: string, recoveryToken?: string) => {
      return request<{ valid: boolean; message: string }>("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ identifier, code, recoveryToken }),
      });
    },
    resetPassword: async (identifier: string, code: string, newPassword: string, recoveryToken?: string) => {
      return request<{ success: boolean; message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ identifier, code, newPassword, recoveryToken }),
      });
    },
  },

  // First-Time System Setup & Root Super Admin Initialization
  setup: {
    getStatus: () => request<{ isSetupComplete: boolean; message: string }>("/setup"),
    initialize: (data: {
      fullName: string;
      username: string;
      email: string;
      password: string;
      cityCorpName?: string;
      cityCorpCode?: string;
    }) =>
      request<{
        success: boolean;
        message: string;
        token: string;
        user: UserProfile;
        error?: string;
      }>("/setup", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // City Corporations
  cities: {
    getAll: () => request<CityCorporationItem[]>("/cities"),
    getById: (id: string) => request<CityCorporationItem>(`/cities/${id}`),
    create: (data: Partial<CityCorporationItem>) =>
      request<CityCorporationItem>("/cities", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<CityCorporationItem>) =>
      request<CityCorporationItem>(`/cities/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/cities/${id}`, {
        method: "DELETE",
      }),
  },

  // Wards
  wards: {
    getAll: (cityCorpId?: string) => {
      const query = cityCorpId ? `?cityCorpId=${encodeURIComponent(cityCorpId)}` : "";
      return request<WardItem[]>(`/wards${query}`);
    },
    getById: (id: string) => request<WardItem>(`/wards/${id}`),
    create: (data: { name: string; area: string; cityCorpId: string; population?: number; councilor?: string }) =>
      request<WardItem>("/wards", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<WardItem>) =>
      request<WardItem>(`/wards/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/wards/${id}`, {
        method: "DELETE",
      }),
  },

  // Smart Bins
  bins: {
    getAll: (filters?: { wardId?: string; cityCorpId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.wardId) params.append("wardId", filters.wardId);
      if (filters?.cityCorpId) params.append("cityCorpId", filters.cityCorpId);
      if (filters?.status) params.append("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<BinItem[]>(`/bins${query}`);
    },
    getById: (id: string) => request<BinItem>(`/bins/${id}`),
    create: (data: Partial<BinItem>) =>
      request<BinItem>("/bins", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<BinItem>) =>
      request<BinItem>(`/bins/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/bins/${id}`, {
        method: "DELETE",
      }),
  },

  // Tracks / Trucks
  tracks: {
    getAll: (filters?: { wardId?: string; driverId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.wardId) params.append("wardId", filters.wardId);
      if (filters?.driverId) params.append("driverId", filters.driverId);
      if (filters?.status) params.append("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<TrackItem[]>(`/tracks${query}`);
    },
    getById: (id: string) => request<TrackItem>(`/tracks/${id}`),
    create: (data: Partial<TrackItem> & { driverName?: string; driverPhone?: string; driverUsername?: string; driverEmail?: string; driverPassword?: string; [key: string]: any }) =>
      request<TrackItem>("/tracks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<TrackItem>) =>
      request<TrackItem>(`/tracks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    assignDriver: (trackId: string, driverId: string | null, truckType?: "NORMAL" | "HAZARDOUS") =>
      request<TrackItem>(`/tracks/${trackId}`, {
        method: "PUT",
        body: JSON.stringify({ trackId, driverId, truckType }),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/tracks/${id}`, {
        method: "DELETE",
      }),
  },

  // Pickup Schedules (City Admin & Ward Admin)
  schedules: {
    getAll: (filters?: { wardId?: string; status?: string; public?: boolean; cityCorpId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.wardId) params.append("wardId", filters.wardId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.public) params.append("public", "true");
      if (filters?.cityCorpId) params.append("cityCorpId", filters.cityCorpId);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<PickupScheduleItem[]>(`/schedules${query}`);
    },
    create: (data: Partial<PickupScheduleItem>) =>
      request<PickupScheduleItem>("/schedules", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<PickupScheduleItem>) =>
      request<PickupScheduleItem>(`/schedules?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/schedules?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },

  // Users
  users: {
    getAll: (filters?: { role?: string; cityCorpId?: string; wardId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.role) params.append("role", filters.role);
      if (filters?.cityCorpId) params.append("cityCorpId", filters.cityCorpId);
      if (filters?.wardId) params.append("wardId", filters.wardId);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<UserProfile[]>(`/users${query}`);
    },
    create: (data: any) =>
      request<UserProfile>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<UserProfile>(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/users/${id}`, {
        method: "DELETE",
      }),
  },

  // Pickup Requests
  pickups: {
    getAll: (filters?: { status?: string; requesterType?: string; driverId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.requesterType) params.append("requesterType", filters.requesterType);
      if (filters?.driverId) params.append("driverId", filters.driverId);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<PickupItem[]>(`/pickups${query}`);
    },
    create: (data: Partial<PickupItem> & { contactName?: string; contactPhone?: string }) =>
      request<PickupItem>("/pickups", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<PickupItem>) =>
      request<PickupItem>(`/pickups/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    accept: (id: string) =>
      request<{ message: string; pickup: PickupItem }>(`/pickups/${id}`, {
        method: "PUT",
        body: JSON.stringify({ action: "accept" }),
      }),
    complete: (id: string, securityCode?: string) =>
      request<{ message: string; pickup: PickupItem }>(`/pickups/${id}`, {
        method: "PUT",
        body: JSON.stringify({ action: "complete", securityCode }),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/pickups/${id}`, {
        method: "DELETE",
      }),
  },

  // Alerts
  alerts: {
    getAll: (filters?: { wardId?: string; resolved?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.wardId) params.append("wardId", filters.wardId);
      if (filters?.resolved !== undefined) params.append("resolved", String(filters.resolved));
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<AlertItem[]>(`/alerts${query}`);
    },
    create: (data: Partial<AlertItem>) =>
      request<AlertItem>("/alerts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    resolve: (id: string) =>
      request<{ success: boolean; message: string }>(`/alerts?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ id, resolved: true }),
      }),
  },

  // Cash Withdrawals (Citizens withdraw cash from Ward Admin)
  withdrawals: {
    getAll: (filters?: { wardId?: string; status?: string; citizenId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.wardId) params.append("wardId", filters.wardId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.citizenId) params.append("citizenId", filters.citizenId);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<WithdrawalItem[]>(`/withdrawals${query}`);
    },
    getById: (id: string) => request<WithdrawalItem>(`/withdrawals/${id}`),
    create: (data: { points: number; wardId: string; citizenName?: string; citizenPhone?: string; notes?: string }) =>
      request<{ message: string; withdrawal: WithdrawalItem; instructions: string }>("/withdrawals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    process: (
      id: string,
      actionOrData: "pay" | "reject" | { status: "paid" | "rejected" | "approved"; verificationCode?: string; notes?: string },
      verificationCode?: string
    ) => {
      const body = typeof actionOrData === "string"
        ? { status: actionOrData === "pay" ? "paid" : "rejected", verificationCode }
        : actionOrData;
      return request<{ message: string; withdrawal: WithdrawalItem }>(`/withdrawals/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },

  // Rank Tiers Configuration (Managed by Super Admin)
  ranks: {
    getAll: () => request<RankTierItem[]>("/ranks"),
    create: (data: Partial<RankTierItem>) =>
      request<RankTierItem>("/ranks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<RankTierItem>) =>
      request<RankTierItem>(`/ranks?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/ranks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },

  // Partner Rewards & Unique Voucher Gift Cards (Managed by Super Admin)
  rewards: {
    getAll: (citizenId?: string) => {
      const query = citizenId ? `?citizenId=${encodeURIComponent(citizenId)}` : "";
      return request<RewardItem[]>(`/rewards${query}`);
    },
    create: (data: {
      name: string;
      partner: string;
      points: number;
      icon?: string;
      category?: string;
      description?: string;
      codes?: string[] | string;
      generateCount?: number;
      codePrefix?: string;
    }) =>
      request<RewardItem>("/rewards", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: Partial<RewardItem> & { addCodes?: string[] | string; generateCount?: number; codePrefix?: string }
    ) =>
      request<RewardItem>(`/rewards?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/rewards?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    redeem: (rewardId: string, citizenId?: string) =>
      request<{
        success: boolean;
        voucherCode: string;
        rewardName: string;
        partner: string;
        pointsDeducted: number;
        remainingPoints: number;
        redeemedAt: string;
        message: string;
      }>("/rewards", {
        method: "POST",
        body: JSON.stringify({ action: "redeem", rewardId, citizenId }),
      }),
    getPolicy: async (cityCorpId?: string) => {
      try {
        const path = cityCorpId ? `/cities/${cityCorpId}` : "/cities";
        const res = await request<any>(path);
        const city = Array.isArray(res) ? res[0] : res;
        return {
          pointRate: city?.pointRate ?? 0.20,
          minWithdrawPoints: city?.minWithdrawPoints ?? 100,
          rewardActive: city?.rewardActive ?? true,
        };
      } catch {
        return {
          pointRate: 0.20,
          minWithdrawPoints: 100,
          rewardActive: true,
        };
      }
    },
    updatePolicy: (cityCorpId: string, data: { pointRate?: number; minWithdrawPoints?: number; rewardActive?: boolean }) =>
      request<CityCorporationItem>(`/cities/${cityCorpId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    toggleGlobalCoupons: (enabled: boolean) =>
      request<{ couponsGloballyEnabled: boolean }>("/rewards", {
        method: "PUT",
        body: JSON.stringify({ toggleCouponsGlobal: enabled }),
      }),
    toggleGlobalWithdraw: (enabled: boolean) =>
      request<{ withdrawGloballyEnabled: boolean }>("/rewards", {
        method: "PUT",
        body: JSON.stringify({ toggleWithdrawGlobal: enabled }),
      }),
    getGlobalPolicy: () =>
      request<{ couponsGloballyEnabled: boolean; withdrawGloballyEnabled: boolean }>("/rewards?type=policy"),
  },

  // Live Dashboard Stats
  dashboard: {
    getStats: (filters?: { cityCorpId?: string; wardId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.cityCorpId) params.append("cityCorpId", filters.cityCorpId);
      if (filters?.wardId) params.append("wardId", filters.wardId);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<any>(`/dashboard/stats${query}`);
    },
  },

  // Seed
  seed: {
    run: (force = false) =>
      request<any>(`/seed${force ? "?force=true" : ""}`, {
        method: "POST",
      }),
  },

  // Citizen Waste Issue Reports
  reports: {
    getAll: (filters?: { wardId?: string; citizenId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.wardId) params.append("wardId", filters.wardId);
      if (filters?.citizenId) params.append("citizenId", filters.citizenId);
      if (filters?.status) params.append("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<ReportItem[]>(`/reports${query}`);
    },
    create: (data: {
      location: string;
      lat?: number;
      lng?: number;
      description: string;
      imageUrl?: string;
      wasteType?: string;
      priority?: string;
      wardId?: string;
      citizenId?: string;
    }) =>
      request<{ success: boolean; message: string; report: ReportItem; pointsAwarded: number }>("/reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      request<{ success: boolean; report: ReportItem }>("/reports", {
        method: "PUT",
        body: JSON.stringify({ id, status }),
      }),
    flagFake: (id: string, reason: string) =>
      request<{ success: boolean; message: string; report: ReportItem; pointsRevoked?: number }>("/reports", {
        method: "PUT",
        body: JSON.stringify({ id, action: "flag_fake", status: "FAKE_REPORT", reason }),
      }),
  },

  // City Waste Items (Configured by City Corporation Admin)
  wasteTypes: {
    getAll: (filters?: { cityCorpId?: string; active?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.cityCorpId) params.append("cityCorpId", filters.cityCorpId);
      if (filters?.active !== undefined) params.append("active", String(filters.active));
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<CityWasteItem[]>(`/waste-types${query}`);
    },
    create: (data: Partial<CityWasteItem>) =>
      request<CityWasteItem>("/waste-types", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<CityWasteItem>) =>
      request<CityWasteItem>(`/waste-types?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/waste-types?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },

  // Citizen & Business Wallet & Deposits (bKash, Nagad, Rocket, Card, Bank)
  wallet: {
    get: () => request<{ walletBalance: number; transactions: WalletTransaction[] }>("/wallet"),
    deposit: (data: { amount: number; paymentMethod: string; trxId?: string; senderNumber?: string; note?: string }) =>
      request<{ success: boolean; message: string; walletBalance: number; transaction: WalletTransaction }>("/wallet", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Security Audit Logs
  audit: {
    getAll: () => request<AuditLogItem[]>("/audit"),
  },
};

export default api;
