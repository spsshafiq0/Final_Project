export interface Bin {
  id: string;
  wardId: number;
  location: string;
  area: string;
  fill: number;
  weight: number;
  temp: string;
  gas: string;
  fire: boolean;
  status: "normal" | "warning" | "critical" | "fire";
  capacity: string;
  qr: string;
  lastCollected: string;
  lat: number;
  lng: number;
}

export interface Track {
  id: string;
  wardId: number;
  truckId: string;
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
  id: number;
  wardId: number;
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
  id: number;
  name: string;
  area: string;
  population: number;
  councilor: string;
  totalBins: number;
  activeTracks: number;
  subAdmin: WardSubAdmin | null;
}

export const wards: Ward[] = [];

export const bins: Bin[] = [];

export const tracks: Track[] = [];

export function getBinsForWard(wardId: number): Bin[] {
  return bins.filter(b => b.wardId === wardId);
}

export function getTracksForWard(wardId: number): Track[] {
  return tracks.filter(t => t.wardId === wardId);
}

export function getWardById(wardId: number): Ward | undefined {
  return wards.find(w => w.id === wardId);
}
