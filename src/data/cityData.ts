export interface Bin {
  id: string;
  dbId?: string;
  wardId: number | string;
  cityCorpId?: string;
  location: string;
  area: string;
  fill: number;
  fillLevel?: number;
  weight: number;
  temp: string;
  gas: string;
  fire: boolean;
  status: "normal" | "warning" | "critical" | "fire";
  capacity: string;
  capacityKg?: number;
  qr: string;
  lastCollected: string;
  lat: number;
  lng: number;
}

export interface Track {
  id: string;
  wardId: number | string;
  truckId: string;
  truckType?: "NORMAL" | "HAZARDOUS";
  driverId?: string | null;
  driver: string;
  phone: string;
  route: string;
  stops: number;
  status: "active" | "idle" | "maintenance";
  progress: number;
  load: string;
  fuel: number;
  startTime: string;
  gpsLat: number;
  gpsLng: number;
  mapsRouteUrl: string;
  username?: string;
  email?: string;
  nid?: string;
  address?: string;
}

export interface WardSubAdmin {
  id: number | string;
  wardId: number | string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  active: boolean;
  username?: string;
  nid?: string;
  address?: string;
  area?: string;
}

export interface Ward {
  id: number | string;
  name: string;
  area: string;
  population: number;
  councilor: string;
  totalBins: number;
  activeTracks: number;
  subAdmin: WardSubAdmin | null;
  cityCorpId?: string | number;
}

export const wards: Ward[] = [];

export const bins: Bin[] = [];

export const tracks: Track[] = [];

export function getBinsForWard(wardId: number | string): Bin[] {
  return bins.filter(b => String(b.wardId) === String(wardId));
}

export function getTracksForWard(wardId: number | string): Track[] {
  return tracks.filter(t => String(t.wardId) === String(wardId));
}

export function getWardById(wardId: number | string): Ward | undefined {
  return wards.find(w => String(w.id) === String(wardId));
}

