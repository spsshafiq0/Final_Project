export type RequesterType = "citizen" | "business";
export type PickupStatus = "open" | "accepted" | "completed";

export interface PickupRequest {
  id: number | string;
  requesterType: RequesterType;
  requesterName: string;
  area: string;
  address: string;
  wasteType: string;
  date: string;
  amount: number;
  status: PickupStatus;
  lat?: number | null;
  lng?: number | null;
  cityCorpId?: string | null;
  cityCorpName?: string | null;
  wardId?: string | null;
  wardName?: string | null;
  wasteItemId?: string | null;
  driverName?: string;
  securityCode?: string;
  createdAt: string;
}

const REQUESTS_KEY = "intelliwaste-pickup-requests";
const DRIVER_BALANCE_KEY = "intelliwaste-driver-balance";

const starterRequests: PickupRequest[] = [];

export function getPickupRequests(): PickupRequest[] {
  const stored = localStorage.getItem(REQUESTS_KEY);
  if (!stored) {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(starterRequests));
    return starterRequests;
  }
  try {
    return JSON.parse(stored) as PickupRequest[];
  } catch {
    return starterRequests;
  }
}

export function savePickupRequests(requests: PickupRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function addPickupRequest(request: Omit<PickupRequest, "id" | "status" | "createdAt">): PickupRequest {
  const created: PickupRequest = {
    ...request,
    id: Date.now(),
    status: "open",
    createdAt: "Just now",
  };
  savePickupRequests([created, ...getPickupRequests()]);
  return created;
}

export function acceptPickupRequest(id: number | string, assignedDriverName: string = "Assigned Driver"): PickupRequest[] {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const requests = getPickupRequests().map((request) =>
    String(request.id) === String(id)
      ? { ...request, status: "accepted" as const, driverName: assignedDriverName, securityCode: code }
      : request,
  );
  savePickupRequests(requests);
  return requests;
}

export function completePickupRequest(id: number | string, code: string): { success: boolean; requests: PickupRequest[] } {
  let success = false;
  let credit = 0;
  const requests = getPickupRequests().map((request) => {
    if (String(request.id) === String(id) && request.status === "accepted" && request.securityCode === code.trim()) {
      success = true;
      credit = request.amount;
      return { ...request, status: "completed" as const };
    }
    return request;
  });
  if (success) {
    savePickupRequests(requests);
    setDriverBalance(getDriverBalance() + credit);
  }
  return { success, requests };
}

export function getDriverBalance(): number {
  return Number(localStorage.getItem(DRIVER_BALANCE_KEY) ?? "0");
}

export function setDriverBalance(balance: number) {
  localStorage.setItem(DRIVER_BALANCE_KEY, String(balance));
}
