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

export const wards: Ward[] = [
  { id: 1,  name: "Ward 01",  area: "Uttara North",     population: 48000, councilor: "Abul Kalam",    totalBins: 42, activeTracks: 3, subAdmin: { id: 1, wardId: 1,  name: "Jamal Hossain",  email: "ward01@dcc.gov.bd", phone: "01711-111001", createdAt: "2026-01-10", active: true } },
  { id: 2,  name: "Ward 02",  area: "Uttara South",     population: 52000, councilor: "Rina Begum",    totalBins: 38, activeTracks: 2, subAdmin: { id: 2, wardId: 2,  name: "Sultana Akter",  email: "ward02@dcc.gov.bd", phone: "01711-111002", createdAt: "2026-01-12", active: true } },
  { id: 3,  name: "Ward 03",  area: "Khilkhet",         population: 39000, councilor: "Faruk Ahmed",   totalBins: 31, activeTracks: 2, subAdmin: null },
  { id: 4,  name: "Ward 04",  area: "Vatara",           population: 29000, councilor: "Nasrin Parvin", totalBins: 24, activeTracks: 1, subAdmin: null },
  { id: 5,  name: "Ward 05",  area: "Badda",            population: 61000, councilor: "Kamal Uddin",   totalBins: 54, activeTracks: 4, subAdmin: { id: 3, wardId: 5,  name: "Ruhul Amin",     email: "ward05@dcc.gov.bd", phone: "01711-111005", createdAt: "2026-02-01", active: true } },
  { id: 6,  name: "Ward 06",  area: "Gulshan",          population: 44000, councilor: "Sumaiya Khan",  totalBins: 47, activeTracks: 3, subAdmin: { id: 4, wardId: 6,  name: "Nahid Islam",    email: "ward06@dcc.gov.bd", phone: "01711-111006", createdAt: "2026-02-14", active: true } },
  { id: 7,  name: "Ward 07",  area: "Banani",           population: 36000, councilor: "Tanvir Alam",   totalBins: 33, activeTracks: 2, subAdmin: null },
  { id: 8,  name: "Ward 08",  area: "Mohakhali",        population: 58000, councilor: "Rahela Khatun", totalBins: 51, activeTracks: 3, subAdmin: { id: 5, wardId: 8,  name: "Habibur Rahman", email: "ward08@dcc.gov.bd", phone: "01711-111008", createdAt: "2026-03-01", active: false } },
  { id: 9,  name: "Ward 09",  area: "Tejgaon",          population: 72000, councilor: "Sabur Khan",    totalBins: 63, activeTracks: 5, subAdmin: { id: 6, wardId: 9,  name: "Morshed Ali",    email: "ward09@dcc.gov.bd", phone: "01711-111009", createdAt: "2026-03-10", active: true } },
  { id: 10, name: "Ward 10",  area: "Dhanmondi",        population: 55000, councilor: "Dilara Islam",  totalBins: 48, activeTracks: 3, subAdmin: null },
  { id: 11, name: "Ward 11",  area: "Mirpur-10",        population: 83000, councilor: "Alamgir Mia",   totalBins: 72, activeTracks: 6, subAdmin: { id: 7, wardId: 11, name: "Sirajul Islam",  email: "ward11@dcc.gov.bd", phone: "01711-111011", createdAt: "2026-01-20", active: true } },
  { id: 12, name: "Ward 12",  area: "Pallabi",          population: 68000, councilor: "Nargis Parvin", totalBins: 59, activeTracks: 4, subAdmin: null },
  { id: 13, name: "Ward 13",  area: "Mohammadpur",      population: 74000, councilor: "Azizul Huq",    totalBins: 65, activeTracks: 5, subAdmin: { id: 8, wardId: 13, name: "Kamrul Hassan",  email: "ward13@dcc.gov.bd", phone: "01711-111013", createdAt: "2026-02-20", active: true } },
  { id: 14, name: "Ward 14",  area: "Hazaribagh",       population: 49000, councilor: "Selina Ahmed",  totalBins: 43, activeTracks: 3, subAdmin: null },
  { id: 15, name: "Ward 15",  area: "Kamrangirchar",    population: 91000, councilor: "Bachchu Mia",   totalBins: 78, activeTracks: 6, subAdmin: { id: 9, wardId: 15, name: "Delwar Hossain", email: "ward15@dcc.gov.bd", phone: "01711-111015", createdAt: "2026-01-05", active: true } },
];

export const bins: Bin[] = [
  { id: "B-001", wardId: 1,  location: "Uttara Sector 7, Road 3",     area: "Uttara North",  fill: 72, weight: 38, temp: "Normal", gas: "Normal",   fire: false, status: "warning",  capacity: "120L", qr: "QR-B001", lastCollected: "2026-09-10 09:30", lat: 23.87, lng: 90.39 },
  { id: "B-002", wardId: 1,  location: "Uttara Sector 9, Road 10",    area: "Uttara North",  fill: 34, weight: 18, temp: "Normal", gas: "Normal",   fire: false, status: "normal",   capacity: "120L", qr: "QR-B002", lastCollected: "2026-09-11 07:15", lat: 23.87, lng: 90.40 },
  { id: "B-003", wardId: 2,  location: "Uttara Sector 3, Road 1",     area: "Uttara South",  fill: 88, weight: 46, temp: "Normal", gas: "Normal",   fire: false, status: "critical", capacity: "240L", qr: "QR-B003", lastCollected: "2026-09-09 14:00", lat: 23.86, lng: 90.38 },
  { id: "B-004", wardId: 5,  location: "Badda Link Road, Merul",      area: "Badda",         fill: 91, weight: 53, temp: "High",   gas: "Elevated", fire: false, status: "critical", capacity: "120L", qr: "QR-B004", lastCollected: "2026-09-09 10:30", lat: 23.78, lng: 90.43 },
  { id: "B-005", wardId: 5,  location: "Satarkul Road, Badda",        area: "Badda",         fill: 45, weight: 24, temp: "Normal", gas: "Normal",   fire: false, status: "normal",   capacity: "120L", qr: "QR-B005", lastCollected: "2026-09-11 08:00", lat: 23.78, lng: 90.44 },
  { id: "B-006", wardId: 6,  location: "Gulshan-1 Circle, Road 53",   area: "Gulshan",       fill: 62, weight: 32, temp: "Normal", gas: "Normal",   fire: false, status: "warning",  capacity: "240L", qr: "QR-B006", lastCollected: "2026-09-10 11:00", lat: 23.78, lng: 90.41 },
  { id: "B-007", wardId: 6,  location: "Gulshan-2, Road 79",          area: "Gulshan",       fill: 95, weight: 58, temp: "High",   gas: "Critical", fire: false, status: "critical", capacity: "120L", qr: "QR-B007", lastCollected: "2026-09-08 16:00", lat: 23.79, lng: 90.42 },
  { id: "B-008", wardId: 9,  location: "Tejgaon Industrial Area",     area: "Tejgaon",       fill: 78, weight: 44, temp: "Normal", gas: "Normal",   fire: false, status: "critical", capacity: "240L", qr: "QR-B008", lastCollected: "2026-09-10 07:00", lat: 23.76, lng: 90.40 },
  { id: "B-009", wardId: 9,  location: "Farmgate, Green Road",        area: "Tejgaon",       fill: 55, weight: 28, temp: "Normal", gas: "Normal",   fire: false, status: "normal",   capacity: "120L", qr: "QR-B009", lastCollected: "2026-09-11 06:30", lat: 23.75, lng: 90.39 },
  { id: "B-010", wardId: 11, location: "Mirpur-10 Roundabout",        area: "Mirpur-10",     fill: 87, weight: 48, temp: "Normal", gas: "Normal",   fire: false, status: "critical", capacity: "120L", qr: "QR-B010", lastCollected: "2026-09-09 15:00", lat: 23.81, lng: 90.36 },
  { id: "B-011", wardId: 11, location: "Mirpur-11, Pirerbagh",        area: "Mirpur-10",     fill: 29, weight: 14, temp: "Normal", gas: "Normal",   fire: false, status: "normal",   capacity: "240L", qr: "QR-B011", lastCollected: "2026-09-11 09:00", lat: 23.82, lng: 90.36 },
  { id: "B-012", wardId: 13, location: "Mohammadpur Bus Stand",       area: "Mohammadpur",   fill: 96, weight: 60, temp: "High",   gas: "Elevated", fire: true,  status: "fire",     capacity: "120L", qr: "QR-B012", lastCollected: "2026-09-08 12:00", lat: 23.76, lng: 90.36 },
  { id: "B-013", wardId: 13, location: "Town Hall, Mohammadpur",      area: "Mohammadpur",   fill: 41, weight: 20, temp: "Normal", gas: "Normal",   fire: false, status: "normal",   capacity: "240L", qr: "QR-B013", lastCollected: "2026-09-11 07:45", lat: 23.76, lng: 90.35 },
  { id: "B-014", wardId: 15, location: "Kamrangirchar Ferry Ghat",    area: "Kamrangirchar", fill: 84, weight: 50, temp: "Normal", gas: "Normal",   fire: false, status: "critical", capacity: "120L", qr: "QR-B014", lastCollected: "2026-09-09 13:00", lat: 23.71, lng: 90.38 },
  { id: "B-015", wardId: 15, location: "Hazaribagh Road, Kalyanpur",  area: "Kamrangirchar", fill: 57, weight: 30, temp: "Normal", gas: "Normal",   fire: false, status: "warning",  capacity: "120L", qr: "QR-B015", lastCollected: "2026-09-10 10:00", lat: 23.72, lng: 90.38 },
];

export const tracks: Track[] = [
  { id: "TR-001", wardId: 1,  truckId: "DNCC-T01", driver: "Jamir Uddin",    phone: "01711-201001", route: "Uttara Sector 7 → Sector 9 → Sector 11", stops: 8,  status: "active",      progress: 62, load: "1.1t", fuel: 74, startTime: "07:00 AM", gpsLat: 23.874, gpsLng: 90.389, mapsRouteUrl: "https://maps.google.com/?q=Uttara+Sector+7,+Dhaka" },
  { id: "TR-002", wardId: 1,  truckId: "DNCC-T02", driver: "Bellal Hossain", phone: "01711-201002", route: "Uttara Sector 3 → Sector 6 → Depot",      stops: 6,  status: "idle",        progress: 0,  load: "0t",   fuel: 90, startTime: "09:00 AM", gpsLat: 23.869, gpsLng: 90.382, mapsRouteUrl: "https://maps.google.com/?q=Uttara+Sector+3,+Dhaka" },
  { id: "TR-003", wardId: 5,  truckId: "DNCC-T08", driver: "Khorshed Alam",  phone: "01711-201008", route: "Badda Link Road → Merul → Rampura",        stops: 11, status: "active",      progress: 45, load: "0.9t", fuel: 58, startTime: "06:30 AM", gpsLat: 23.782, gpsLng: 90.432, mapsRouteUrl: "https://maps.google.com/?q=Badda+Link+Road,+Dhaka" },
  { id: "TR-004", wardId: 6,  truckId: "DNCC-T12", driver: "Sohel Rana",     phone: "01711-201012", route: "Gulshan-1 → Gulshan-2 → DOHS Depot",       stops: 9,  status: "active",      progress: 80, load: "1.6t", fuel: 43, startTime: "07:30 AM", gpsLat: 23.781, gpsLng: 90.414, mapsRouteUrl: "https://maps.google.com/?q=Gulshan-1,+Dhaka" },
  { id: "TR-005", wardId: 9,  truckId: "DNCC-T17", driver: "Alamgir Khan",   phone: "01711-201017", route: "Tejgaon Ind. → Farmgate → Karwan Bazar",   stops: 14, status: "active",      progress: 33, load: "0.7t", fuel: 81, startTime: "06:00 AM", gpsLat: 23.758, gpsLng: 90.398, mapsRouteUrl: "https://maps.google.com/?q=Tejgaon+Industrial+Area,+Dhaka" },
  { id: "TR-006", wardId: 11, truckId: "DNCC-T21", driver: "Rahim Badsha",   phone: "01711-201021", route: "Mirpur-10 → Pirerbagh → Kazipara",         stops: 12, status: "active",      progress: 70, load: "1.4t", fuel: 36, startTime: "06:30 AM", gpsLat: 23.812, gpsLng: 90.362, mapsRouteUrl: "https://maps.google.com/?q=Mirpur-10,+Dhaka" },
  { id: "TR-007", wardId: 13, truckId: "DNCC-T25", driver: "Jalal Mia",      phone: "01711-201025", route: "Mohammadpur Bus Stand → Town Hall → Sat",  stops: 10, status: "active",      progress: 55, load: "1.1t", fuel: 62, startTime: "07:00 AM", gpsLat: 23.762, gpsLng: 90.356, mapsRouteUrl: "https://maps.google.com/?q=Mohammadpur+Bus+Stand,+Dhaka" },
  { id: "TR-008", wardId: 15, truckId: "DNCC-T30", driver: "Nurul Islam",    phone: "01711-201030", route: "Kamrangirchar Ghat → Hazaribagh → Shia",   stops: 13, status: "maintenance", progress: 0,  load: "0t",   fuel: 20, startTime: "—",        gpsLat: 23.714, gpsLng: 90.381, mapsRouteUrl: "https://maps.google.com/?q=Kamrangirchar,+Dhaka" },
];

export function getBinsForWard(wardId: number): Bin[] {
  return bins.filter(b => b.wardId === wardId);
}

export function getTracksForWard(wardId: number): Track[] {
  return tracks.filter(t => t.wardId === wardId);
}

export function getWardById(wardId: number): Ward | undefined {
  return wards.find(w => w.id === wardId);
}
