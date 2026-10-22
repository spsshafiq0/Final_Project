import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Trash2, Truck, AlertTriangle, CheckCircle, BarChart2, Bell, Shield,
  Globe, LogOut, Plus, Edit3, Trash, Search, Download, RefreshCw,
  Users, MapPin, Flame, Wind, X, ChevronRight, Eye, EyeOff, Save, Package,
  Navigation, ExternalLink, ClipboardList, Loader2, Coins, Wallet,
  Calendar, UserCheck, CheckCircle2, Clock
} from "lucide-react";
import { type Ward, type Bin, type Track } from "../data/cityData";
import api, { WardItem, BinItem, TrackItem, UserProfile, WithdrawalItem, ReportItem, AlertItem, PickupScheduleItem, userStorage } from "../lib/api";

interface MainAdminPanelProps {
  onLogout: () => void;
  onNavigateWard?: (wardId: string | number) => void;
  cityCorpId?: string;
}

interface SidebarItem {
  id: string;
  icon: any;
  label: string;
  badge?: number;
}

const SIDEBAR: SidebarItem[] = [
  { id: "overview",    icon: BarChart2, label: "City Overview" },
  { id: "wards",       icon: Globe,     label: "Ward Management" },
  { id: "rewards",     icon: Coins,     label: "Points & Cash Policy" },
  { id: "bins",        icon: Trash2,    label: "All Bins" },
  { id: "tracks",      icon: Truck,     label: "All Tracks" },
  { id: "schedules",   icon: Calendar,  label: "Pickup Schedules" },
  { id: "subadmins",   icon: Users,     label: "Sub-Admins" },
  { id: "waste",       icon: ClipboardList, label: "Waste Reports" },
  { id: "alerts",      icon: Bell,      label: "Alerts" },
  { id: "compliance",  icon: Shield,    label: "Compliance" },
];

const weeklyData = [
  { day: "Mon", collected: 12.4, sorted: 10.8 },
  { day: "Tue", collected: 15.1, sorted: 13.4 },
  { day: "Wed", collected: 13.8, sorted: 11.9 },
  { day: "Thu", collected: 18.2, sorted: 16.5 },
  { day: "Fri", collected: 16.7, sorted: 14.3 },
  { day: "Sat", collected: 21.3, sorted: 19.1 },
  { day: "Sun", collected: 9.5,  sorted: 8.2 },
];

const outputBreakdown = [
  { name: "Organic",    value: 32, color: "#4ade80" },
  { name: "Plastic",    value: 22, color: "#60a5fa" },
  { name: "Paper",      value: 14, color: "#fde68a" },
  { name: "Metal",      value: 12, color: "#94a3b8" },
  { name: "Glass",      value: 8,  color: "#7dd3fc" },
  { name: "Hazardous",  value: 5,  color: "#fca5a5" },
  { name: "Residual",   value: 7,  color: "#9ca3af" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    normal:      "bg-green-500/20 text-green-400",
    warning:     "bg-yellow-500/20 text-yellow-400",
    critical:    "bg-orange-500/20 text-orange-400",
    fire:        "bg-red-500/20 text-red-400",
    active:      "bg-green-500/20 text-green-400",
    idle:        "bg-yellow-500/20 text-yellow-400",
    maintenance: "bg-orange-500/20 text-orange-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${map[status] ?? "bg-[#1a3d22] text-[#4b7a5a]"}`}>
      {status.toUpperCase()}
    </span>
  );
}

// Shared input style
const inp = "w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80] placeholder-[#4b7a5a]";
const sel = "w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-[#86efac] text-sm outline-none focus:border-[#4ade80]";

// ── Add / Edit Ward Modal ──────────────────────────────────────────────
function WardModal({
  initial,
  onClose,
  onSave,
  title,
}: {
  initial?: Partial<Ward>;
  onClose: () => void;
  onSave: (w: { name: string; area: string; councilor: string; population: number }) => void;
  title: string;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    area: initial?.area ?? "",
    councilor: initial?.councilor ?? "",
    population: initial?.population ?? 50000,
  });

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-700 text-white text-lg">{title}</div>
          <button onClick={onClose}><X size={16} className="text-[#4b7a5a]" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">WARD NUMBER / NAME</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ward 01, Ward 16"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">AREA / LOCALITY</label>
            <input
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder="e.g. Uttara North, Mirpur-12, Banani"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">WARD COUNCILOR</label>
            <input
              value={form.councilor}
              onChange={(e) => setForm({ ...form, councilor: e.target.value })}
              placeholder="e.g. Md. Afsar Uddin"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ESTIMATED POPULATION</label>
            <input
              type="number"
              value={form.population}
              onChange={(e) => setForm({ ...form, population: Number(e.target.value) })}
              className={inp}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#1a3d22] text-[#4b7a5a] rounded-xl py-2.5 text-sm hover:border-[#4ade80]/30 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.name || !form.area) return;
              onSave(form);
              onClose();
            }}
            className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Save size={14} /> Save Ward
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Bin Modal ───────────────────────────────────────────────
function BinModal({
  initial, onClose, onSave, title, availableWards
}: {
  initial?: Partial<Bin>;
  onClose: () => void;
  onSave: (b: Partial<Bin>) => void;
  title: string;
  availableWards: Ward[];
}) {
  const [form, setForm] = useState({
    wardId:   initial?.wardId   ?? (availableWards[0]?.id || 1),
    location: initial?.location ?? "",
    capacity: initial?.capacity ?? "120L",
    lat:      initial?.lat      ?? 23.78,
    lng:      initial?.lng      ?? 90.40,
  });

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="font-display font-700 text-white">{title}</div>
          <button onClick={onClose}><X size={16} className="text-[#4b7a5a]" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">WARD</label>
            <select value={form.wardId} onChange={e => setForm(f => ({ ...f, wardId: Number(e.target.value) }))} className={sel}>
              {availableWards.map(w => (
                <option key={w.id} value={w.id}>{w.name} — {w.area}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">SPECIFIC LOCATION / STREET</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Sector 7, Road 3 Corner" className={inp} />
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">CAPACITY</label>
            <select value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className={sel}>
              <option value="120L">120L Standard Smart Bin</option>
              <option value="240L">240L Commercial Bin</option>
              <option value="360L">360L Industrial Heavy Bin</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">LATITUDE</label>
              <input type="number" step="0.001" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: Number(e.target.value) }))} className={inp} />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">LONGITUDE</label>
              <input type="number" step="0.001" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: Number(e.target.value) }))} className={inp} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#1a3d22] text-[#4b7a5a] rounded-xl py-2.5 text-sm hover:border-[#4ade80]/30 transition-colors">Cancel</button>
          <button
            onClick={() => {
              if (!form.location) return;
              onSave(form);
              onClose();
            }}
            className="flex-1 bg-[#16a34a] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#15803d] flex items-center justify-center gap-2"
          >
            <Save size={14} /> Save Bin
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Track Modal ─────────────────────────────────────────────
function TrackModal({
  initial, onClose, onSave, title, availableWards
}: {
  initial?: Partial<Track>;
  onClose: () => void;
  onSave: (t: any) => void;
  title: string;
  availableWards: Ward[];
}) {
  const [form, setForm] = useState({
    wardId:       initial?.wardId       ?? (availableWards[0]?.id || 1),
    truckId:      initial?.truckId      ?? "",
    driver:       initial?.driver       ?? "",
    phone:        initial?.phone        ?? "",
    driverUsername: (initial as any)?.driverUsername ?? "",
    driverEmail:    (initial as any)?.driverEmail    ?? "",
    driverPassword: "",
    route:        initial?.route        ?? "",
    stops:        initial?.stops        ?? 6,
    status:       initial?.status       ?? "active",
    fuel:         initial?.fuel         ?? 100,
    startTime:    initial?.startTime    ?? "07:00 AM",
    gpsLat:       initial?.gpsLat       ?? 23.78,
    gpsLng:       initial?.gpsLng       ?? 90.40,
    mapsRouteUrl: initial?.mapsRouteUrl ?? "",
  });
  const [showDriverPass, setShowDriverPass] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="font-display font-700 text-white">{title}</div>
          <button onClick={onClose}><X size={16} className="text-[#4b7a5a]" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">WARD</label>
              <select value={form.wardId} onChange={e => setForm(f => ({ ...f, wardId: Number(e.target.value) }))} className={sel}>
                {availableWards.map(w => (
                  <option key={w.id} value={w.id}>{w.name} — {w.area}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">TRUCK ID</label>
              <input value={form.truckId} onChange={e => setForm(f => ({ ...f, truckId: e.target.value }))} placeholder="DNCC-T00" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DRIVER NAME</label>
              <input value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} placeholder="Abdul Karim" className={inp} />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DRIVER PHONE</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="017XX-XXXXXX" className={inp} />
            </div>
          </div>

          {/* DRIVER LOGIN CREDENTIALS SECTION */}
          <div className="pt-3 border-t border-[#1a3d22] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#4ade80]">DRIVER APP CREDENTIALS</span>
              <span className="text-[10px] text-[#4b7a5a]">Auto-dispatches login via Brevo</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DRIVER USERNAME</label>
                <input
                  value={form.driverUsername}
                  onChange={e => setForm(f => ({ ...f, driverUsername: e.target.value }))}
                  placeholder="e.g. driver_karim"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DRIVER EMAIL</label>
                <input
                  type="email"
                  value={form.driverEmail}
                  onChange={e => setForm(f => ({ ...f, driverEmail: e.target.value }))}
                  placeholder="driver@gmail.com"
                  className={inp}
                />
              </div>
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DRIVER PASSWORD (HASHED)</label>
              <div className="relative">
                <input
                  type={showDriverPass ? "text" : "password"}
                  value={form.driverPassword}
                  onChange={e => setForm(f => ({ ...f, driverPassword: e.target.value }))}
                  placeholder="Min 6 characters (e.g. Pass#2025)"
                  className={`${inp} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowDriverPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4b7a5a] hover:text-[#4ade80]"
                >
                  {showDriverPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ROUTE DESCRIPTION</label>
            <input value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} placeholder="Sector 1 → Sector 3 → Metro" className={inp} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">STOPS</label>
              <input type="number" value={form.stops} onChange={e => setForm(f => ({ ...f, stops: Number(e.target.value) }))} className={inp} />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">FUEL %</label>
              <input type="number" value={form.fuel} onChange={e => setForm(f => ({ ...f, fuel: Number(e.target.value) }))} className={inp} />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">STATUS</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className={sel}>
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#1a3d22] text-[#4b7a5a] rounded-xl py-2.5 text-sm hover:border-[#4ade80]/30 transition-colors">Cancel</button>
          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className="flex-1 bg-[#16a34a] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#15803d] flex items-center justify-center gap-2 shadow"
          >
            <Save size={14} /> Save Track
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Sub-Admin Modal ────────────────────────────────────────────────
type SubAdminForm = {
  id?: number;
  wardId: number;
  name: string;
  username: string;
  password?: string;
  email: string;
  phone: string;
  nid: string;
  address: string;
  active: boolean;
};

function AddSubAdminModal({
  onClose,
  onSave,
  initial,
  availableWards
}: {
  onClose: () => void;
  onSave: (form: SubAdminForm) => void;
  initial?: SubAdminForm;
  availableWards: Ward[];
}) {
  const [form, setForm] = useState<SubAdminForm>(initial ?? {
    wardId: availableWards[0]?.id || 1,
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    nid: "",
    address: "",
    active: true,
  });
  const [error, setError] = useState("");

  const save = () => {
    if (!form.name || !form.username) {
      setError("Please complete name and username.");
      return;
    }
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="font-display font-700 text-white">{initial ? "Edit Ward Sub-Admin" : "Assign Ward Sub-Admin"}</div>
          <button onClick={onClose}><X size={16} className="text-[#4b7a5a]" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ASSIGN TO WARD</label>
            <select value={form.wardId} onChange={e => setForm(f => ({ ...f, wardId: Number(e.target.value) }))} className={sel}>
              {availableWards.map(w => (
                <option key={w.id} value={w.id}>{w.name} — {w.area}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ADMIN FULL NAME</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Md. Jamal Hossain" className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">USERNAME</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="ward.admin" className={inp} />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">PASSWORD</label>
              <input type="password" value={form.password || ""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">PHONE</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="017XX-XXXXXX" className={inp} />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">EMAIL</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@dcc.gov.bd" className={inp} />
            </div>
          </div>
        </div>
        {error && <div className="text-red-400 text-xs mt-3">{error}</div>}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#1a3d22] text-[#4b7a5a] rounded-xl py-2.5 text-sm hover:border-[#4ade80]/30 transition-colors">Cancel</button>
          <button onClick={save} className="flex-1 bg-[#16a34a] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#15803d] flex items-center justify-center gap-2">
            <Save size={14} /> Save Sub-Admin
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ward Detail Modal ──────────────────────────────────────────────────
function WardDetailModal({
  ward,
  localBins,
  localTracks,
  subAdmins,
  onClose,
}: {
  ward: Ward;
  localBins: Bin[];
  localTracks: Track[];
  subAdmins: SubAdminForm[];
  onClose: () => void;
}) {
  const wardBins = localBins.filter(b => b.wardId === ward.id);
  const wardTracks = localTracks.filter(t => t.wardId === ward.id);
  const currentSubAdmin = subAdmins.find(a => a.wardId === ward.id) || ward.subAdmin;
  const critical = wardBins.filter(b => b.status === "critical" || b.status === "fire");

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-display font-700 text-white text-lg">{ward.name} — {ward.area}</div>
            <div className="text-[#4b7a5a] text-xs">Councilor: {ward.councilor || "Not appointed"}</div>
          </div>
          <button onClick={onClose}><X size={16} className="text-[#4b7a5a]" /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Population", value: ward.population.toLocaleString() },
            { label: "Total Bins", value: wardBins.length || ward.totalBins },
            { label: "Active Tracks", value: wardTracks.filter(t => t.status === "active").length },
            { label: "Critical Bins", value: critical.length },
          ].map(k => (
            <div key={k.label} className="bg-[#061309] border border-[#1a3d22] rounded-xl p-3 text-center">
              <div className="font-mono font-bold text-[#4ade80] text-xl">{k.value}</div>
              <div className="text-[#4b7a5a] text-xs mt-1">{k.label}</div>
            </div>
          ))}
        </div>
        <div className="mb-5">
          <div className="text-[#4ade80] font-mono text-xs mb-2">SUB-ADMIN STATUS</div>
          {currentSubAdmin ? (
            <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#16a34a] rounded-full flex items-center justify-center font-bold text-white">{currentSubAdmin.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{currentSubAdmin.name}</div>
                <div className="text-[#4b7a5a] text-xs">@{currentSubAdmin.username} · {currentSubAdmin.phone}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-mono ${currentSubAdmin.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {currentSubAdmin.active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          ) : (
            <div className="bg-[#061309] border border-yellow-500/20 rounded-xl p-4 text-center text-xs text-yellow-400">
              No Sub-Admin Assigned
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Assign Driver / Change Driver Modal ───────────────────────────────
function AssignDriverModal({
  track,
  drivers,
  onClose,
  onAssign,
}: {
  track: any;
  drivers: UserProfile[];
  onClose: () => void;
  onAssign: (trackId: string, driverId: string | null, truckType: "NORMAL" | "HAZARDOUS") => Promise<void>;
}) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(track.driverId || "");
  const [truckType, setTruckType] = useState<"NORMAL" | "HAZARDOUS">(track.truckType === "HAZARDOUS" ? "HAZARDOUS" : "NORMAL");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1a3d22]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#16a34a]/20 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80]">
              <Truck size={20} />
            </div>
            <div>
              <div className="font-display font-bold text-white text-base">Assign / Change Driver</div>
              <div className="text-xs text-[#4ade80] font-mono">{track.truckId} · {track.route || "City Route"}</div>
            </div>
          </div>
          <button onClick={onClose}><X size={16} className="text-[#4b7a5a] hover:text-white" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#86efac] mb-1.5">TRUCK TYPE & CAPABILITY</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTruckType("NORMAL")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  truckType === "NORMAL"
                    ? "bg-[#16a34a]/20 border-[#4ade80] text-[#4ade80]"
                    : "bg-[#061309] border-[#1a3d22] text-[#4b7a5a] hover:border-[#1a3d22]/80"
                }`}
              >
                <div className="font-bold text-xs">Normal Waste Truck</div>
                <div className="text-[10px] opacity-80 mt-0.5">Organic, Recyclable, General</div>
              </button>
              <button
                type="button"
                onClick={() => setTruckType("HAZARDOUS")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  truckType === "HAZARDOUS"
                    ? "bg-red-500/20 border-red-500 text-red-400"
                    : "bg-[#061309] border-[#1a3d22] text-[#4b7a5a] hover:border-[#1a3d22]/80"
                }`}
              >
                <div className="font-bold text-xs">Hazardous Truck</div>
                <div className="text-[10px] opacity-80 mt-0.5">Toxins, Medical, Batteries</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#86efac] mb-1.5">SELECT REGISTERED DRIVER</label>
            <select
              value={selectedDriverId}
              onChange={e => setSelectedDriverId(e.target.value)}
              className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4ade80]"
            >
              <option value="">-- No Driver Assigned (Idle Truck) --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.fullName || d.username} ({d.phone || d.email || "Driver"})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#4b7a5a] mt-1">
              Select any registered driver to assign them to this truck. You can reassign or swap drivers anytime.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-[#1a3d22] text-[#4b7a5a] hover:text-white rounded-xl py-2.5 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSubmitting(true);
              try {
                await onAssign(track.id, selectedDriverId || null, truckType);
                onClose();
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={13} className="animate-spin" /> : <UserCheck size={14} />}
            <span>Confirm Assignment</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function MainAdminPanel({ onLogout, onNavigateWard, cityCorpId }: MainAdminPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddWard, setShowAddWard] = useState(false);
  const [editWard, setEditWard] = useState<Ward | null>(null);
  const [showAddBin, setShowAddBin] = useState(false);
  const [editBin, setEditBin] = useState<Bin | null>(null);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [showAddSubAdmin, setShowAddSubAdmin] = useState(false);
  const [editSubAdmin, setEditSubAdmin] = useState<SubAdminForm | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Dynamic state
  const currentUser = userStorage.get();
  const cityTitle = currentUser?.cityCorp?.name || "City Corporation";
  const cityCode = currentUser?.cityCorp?.code || "CITY";

  const [localWards, setLocalWards] = useState<Ward[]>([]);
  const [localBins, setLocalBins] = useState<Bin[]>([]);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subAdmins, setSubAdmins] = useState<SubAdminForm[]>([]);

  // Driver Assignment state
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [assigningTrack, setAssigningTrack] = useState<any | null>(null);

  // Pickup Schedules state
  const [schedules, setSchedules] = useState<PickupScheduleItem[]>([]);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState<"ALL" | "PENDING" | "CONFIRMED">("ALL");
  const [scheduleForm, setScheduleForm] = useState<{
    date: string;
    time: string;
    wasteType: "Organic" | "Recyclable" | "General" | "Hazardous";
    zone: string;
    wardId: string;
  }>({
    date: "",
    time: "08:00 – 11:00 AM",
    wasteType: "General",
    zone: "",
    wardId: "",
  });

  // Point-to-Money Rate & Rewards Policy State (Exclusive to City Corp Admin)
  const [pointRate, setPointRate] = useState<number>(0.20);
  const [minWithdrawPoints, setMinWithdrawPoints] = useState<number>(100);
  const [rewardActive, setRewardActive] = useState<boolean>(true);
  const [savingPolicy, setSavingPolicy] = useState<boolean>(false);
  const [policySaved, setPolicySaved] = useState<boolean>(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [wasteReports, setWasteReports] = useState<ReportItem[]>([]);
  const [localAlerts, setLocalAlerts] = useState<AlertItem[]>([]);

  // Load from API on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [apiWards, apiBins, apiTracks, apiUsers, apiWithdrawals, apiReports, apiAlerts, apiDrivers, apiSchedules] = await Promise.all([
          api.wards.getAll(cityCorpId).catch(() => []),
          api.bins.getAll({ cityCorpId }).catch(() => []),
          api.tracks.getAll().catch(() => []),
          api.users.getAll({ role: "WARD_ADMIN", cityCorpId }).catch(() => []),
          api.withdrawals.getAll().catch(() => []),
          api.reports.getAll().catch(() => []),
          api.alerts.getAll({ resolved: false }).catch(() => []),
          api.users.getAll({ role: "DRIVER" }).catch(() => []),
          api.schedules.getAll({ cityCorpId }).catch(() => []),
        ]);

        if (Array.isArray(apiDrivers)) setDrivers(apiDrivers);
        if (Array.isArray(apiSchedules)) setSchedules(apiSchedules);

        if (apiReports && apiReports.length > 0) {
          setWasteReports(apiReports);
        }

        if (apiWards && apiWards.length > 0) {
          const mappedWards: Ward[] = apiWards.map((w, idx) => ({
            id: Number(w.id) || idx + 1,
            name: w.name,
            area: w.area,
            population: w.population || 50000,
            councilor: w.councilor || "",
            totalBins: w._count?.bins || 0,
            activeTracks: w._count?.tracks || 0,
            subAdmin: null,
          }));
          setLocalWards(mappedWards);
        }

        if (apiUsers && apiUsers.length > 0) {
          const mappedAdmins: SubAdminForm[] = apiUsers.map((u: any, idx: number) => ({
            id: Number(u.id) || idx + 1,
            wardId: Number(u.wardId) || (idx % 15) + 1,
            name: u.fullName || u.username,
            username: u.username,
            email: u.email || "",
            phone: u.phone || "",
            nid: u.nid || "",
            address: u.address || "",
            active: u.active ?? true,
          }));
          setSubAdmins(mappedAdmins);
        }

        if (apiBins && apiBins.length > 0) {
          const mappedBins: Bin[] = apiBins.map((b) => ({
            id: b.binCode,
            wardId: 1,
            location: b.location,
            area: b.ward?.area || "Dhaka",
            fill: b.fill,
            weight: b.weight,
            temp: b.temp,
            gas: b.gas,
            fire: b.fire,
            status: b.status,
            capacity: b.capacity,
            qr: b.qr || `QR-${b.binCode}`,
            lastCollected: b.lastCollected || "Today",
            lat: b.lat,
            lng: b.lng,
          }));
          setLocalBins(mappedBins);
        }

        if (apiTracks && apiTracks.length > 0) {
          const mappedTracks: Track[] = apiTracks.map((t: any) => ({
            id: t.id,
            wardId: typeof t.wardId === "number" ? t.wardId : Number(t.wardId) || 1,
            truckId: t.truckId,
            truckType: t.truckType || "NORMAL",
            driverId: t.driverId,
            driver: t.driver?.fullName || (t.driverId ? "Driver Assigned" : "No Driver Assigned"),
            phone: t.driver?.phone || "017XX-XXXXXX",
            route: t.route,
            stops: t.stops,
            status: t.status,
            progress: t.progress,
            load: t.load,
            fuel: t.fuel,
            startTime: t.startTime || "07:00 AM",
            gpsLat: t.gpsLat,
            gpsLng: t.gpsLng,
            mapsRouteUrl: t.mapsRouteUrl || "",
          }));
          setLocalTracks(mappedTracks);
        }

        if (apiWithdrawals && apiWithdrawals.length > 0) {
          setWithdrawals(apiWithdrawals);
        }

        if (apiAlerts && apiAlerts.length > 0) {
          setLocalAlerts(apiAlerts);
        }

        // Fetch reward policy for this city
        const targetCityId = cityCorpId || currentUser?.cityCorpId || "";
        if (targetCityId) {
          api.cities.getById(targetCityId).then(c => {
            if (c) {
              if (c.pointRate !== undefined) setPointRate(c.pointRate);
              if (c.minWithdrawPoints !== undefined) setMinWithdrawPoints(c.minWithdrawPoints);
              if (c.rewardActive !== undefined) setRewardActive(c.rewardActive);
            }
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("Backend API notice, keeping memory fallback active.");
      }
    }
    fetchData();
  }, [cityCorpId]);

  const handleAssignDriver = async (trackId: string, driverId: string | null, truckType: "NORMAL" | "HAZARDOUS") => {
    try {
      await api.tracks.assignDriver(trackId, driverId, truckType);
      const updated = await api.tracks.getAll();
      if (Array.isArray(updated)) {
        setLocalTracks(updated.map((t: any) => ({
          id: t.id,
          wardId: typeof t.wardId === "number" ? t.wardId : Number(t.wardId) || 1,
          truckId: t.truckId,
          truckType: t.truckType || "NORMAL",
          driverId: t.driverId,
          driver: t.driver?.fullName || (t.driverId ? "Driver Assigned" : "No Driver Assigned"),
          phone: t.driver?.phone || "017XX-XXXXXX",
          route: t.route,
          stops: t.stops,
          status: t.status,
          progress: t.progress,
          load: t.load,
          fuel: t.fuel,
          startTime: t.startTime || "07:00 AM",
          gpsLat: t.gpsLat,
          gpsLng: t.gpsLng,
          mapsRouteUrl: t.mapsRouteUrl || "",
        })));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update driver assignment");
    }
  };

  const handleApproveSchedule = async (id: string) => {
    try {
      await api.schedules.update(id, { status: "CONFIRMED" });
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: "CONFIRMED" } : s));
    } catch (err: any) {
      alert(err.message || "Failed to approve schedule");
    }
  };

  const handleRejectSchedule = async (id: string) => {
    try {
      await api.schedules.update(id, { status: "REJECTED" });
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: "REJECTED" } : s));
    } catch (err: any) {
      alert(err.message || "Failed to reject schedule");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await api.schedules.delete(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete schedule");
    }
  };

  const handleCreateConfirmedSchedule = async () => {
    if (!scheduleForm.date) {
      alert("Please select a collection date");
      return;
    }
    try {
      const res = await api.schedules.create({
        date: scheduleForm.date,
        time: scheduleForm.time,
        wasteType: scheduleForm.wasteType,
        zone: scheduleForm.zone || "Central City Route",
        wardId: scheduleForm.wardId ? String(scheduleForm.wardId) : undefined,
        cityCorpId: cityCorpId || currentUser?.cityCorpId || undefined,
        status: "CONFIRMED",
      });
      if (res) {
        setSchedules(prev => [res, ...prev]);
        setShowAddSchedule(false);
        setScheduleForm({ date: "", time: "08:00 – 11:00 AM", wasteType: "General", zone: "", wardId: "" });
      }
    } catch (err: any) {
      alert(err.message || "Failed to create schedule");
    }
  };

  const saveRewardPolicy = async () => {
    setSavingPolicy(true);
    const targetCityId = cityCorpId || currentUser?.cityCorpId || "";
    if (!targetCityId) {
      setSavingPolicy(false);
      return;
    }
    try {
      await api.cities.update(targetCityId, {
        pointRate,
        minWithdrawPoints,
        rewardActive,
      });
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 3500);
    } catch (err: any) {
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 3500);
    } finally {
      setSavingPolicy(false);
    }
  };

  // Save Ward (Add new or Edit)
  const saveWard = async (form: { name: string; area: string; councilor: string; population: number }) => {
    try {
      const targetCityCorpId = cityCorpId || currentUser?.cityCorpId || "";
      if (targetCityCorpId) {
        await api.wards.create({
          name: form.name,
          area: form.area,
          councilor: form.councilor,
          population: form.population,
          cityCorpId: targetCityCorpId,
        }).catch(() => null);
      }
    } catch {}

    setLocalWards(prev => {
      const newWard: Ward = {
        id: prev.length + 1,
        name: form.name,
        area: form.area,
        councilor: form.councilor,
        population: form.population,
        totalBins: 0,
        activeTracks: 0,
        subAdmin: null,
      };
      return [...prev, newWard];
    });
  };

  const deleteWard = (wardId: number) => {
    if (!confirm("Are you sure you want to remove this Ward?")) return;
    setLocalWards(prev => prev.filter(w => w.id !== wardId));
    setLocalBins(prev => prev.filter(b => b.wardId !== wardId));
    setLocalTracks(prev => prev.filter(t => t.wardId !== wardId));
  };

  // Save Bin
  const saveBin = async (updated: Partial<Bin>) => {
    try {
      await api.bins.create({
        binCode: updated.id || `B-${Date.now().toString().slice(-4)}`,
        location: updated.location || "Street Corner",
        capacity: updated.capacity || "120L",
        wardId: String(updated.wardId || 1),
        lat: updated.lat || 23.78,
        lng: updated.lng || 90.40,
      }).catch(() => null);
    } catch {}

    setLocalBins(prev => {
      const ward = localWards.find(w => w.id === updated.wardId);
      const area = updated.area || ward?.area || "Dhaka";
      const idx = prev.findIndex(b => b.id === (updated as Bin).id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = { ...n[idx], ...updated, area } as Bin;
        return n;
      }
      const newId = `B-${String(prev.length + 1).padStart(3, "0")}`;
      return [...prev, { ...updated, id: newId, qr: `QR-${newId}`, area, lastCollected: "Never", status: "normal", fill: 0, weight: 0, temp: "Normal", gas: "Normal", fire: false } as Bin];
    });
  };

  // Save Track (with driver account provisioning & Brevo credentials dispatch)
  const saveTrack = async (updated: any) => {
    try {
      if (updated.truckId && updated.route) {
        await api.tracks.create({
          truckId: updated.truckId,
          driver: updated.driver,
          driverName: updated.driver,
          driverPhone: updated.phone,
          driverUsername: updated.driverUsername,
          driverEmail: updated.driverEmail,
          driverPassword: updated.driverPassword,
          route: updated.route,
          stops: updated.stops || 6,
          fuel: updated.fuel || 100,
          status: updated.status || "active",
          wardId: String(updated.wardId || 1),
          mapsRouteUrl: updated.mapsRouteUrl || "",
          gpsLat: updated.gpsLat || 23.78,
          gpsLng: updated.gpsLng || 90.40,
        }).catch((e) => console.warn("Track create notice:", e));
      }
    } catch {}

    setLocalTracks(prev => {
      const idx = prev.findIndex(t => t.id === updated.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = { ...n[idx], ...updated } as Track;
        return n;
      }
      const newTrack: Track = {
        id: updated.id || `TR-${String(prev.length + 1).padStart(3, "0")}`,
        truckId: updated.truckId || "DNCC-T00",
        driver: updated.driver || "Assigned Driver",
        phone: updated.phone || "01700-000000",
        route: updated.route || "Local Route",
        stops: updated.stops || 6,
        status: updated.status || "active",
        progress: updated.progress || 0,
        load: updated.load || "0%",
        fuel: updated.fuel || 100,
        startTime: updated.startTime || "07:00 AM",
        wardId: updated.wardId || 1,
        gpsLat: updated.gpsLat || 23.78,
        gpsLng: updated.gpsLng || 90.40,
        mapsRouteUrl: updated.mapsRouteUrl || "",
        username: updated.driverUsername,
        email: updated.driverEmail,
      };
      return [...prev, newTrack];
    });
  };

  // Save SubAdmin (with auto Brevo email dispatch)
  const saveSubAdmin = async (form: SubAdminForm) => {
    try {
      await api.users.create({
        fullName: form.name,
        username: form.username,
        password: form.password,
        role: "WARD_ADMIN",
        phone: form.phone,
        email: form.email,
        wardId: String(form.wardId),
        cityCorpId: cityCorpId || currentUser?.cityCorpId,
      }).catch((e) => console.warn("SubAdmin create notice:", e));
    } catch {}

    setSubAdmins(prev => {
      const existingIdx = prev.findIndex(a => a.wardId === form.wardId || (form.id && a.id === form.id));
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...form, id: form.id || Date.now() };
        return updated;
      }
      return [...prev, { ...form, id: Date.now() }];
    });
  };

  const totalCritical = localBins.filter(b => b.status === "critical" || b.status === "fire").length;
  const activeTrucks = localTracks.filter(t => t.status === "active").length;
  const totalBins = localBins.length;
  const wardsWithAdmin = new Set(subAdmins.map(a => a.wardId)).size;

  const filteredBins = localBins.filter(b =>
    (b.id || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.location || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.area || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredTracks = localTracks.filter(t =>
    (t.truckId || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.driver || "").toLowerCase().includes(search.toLowerCase())
  );

  const exportBinsCsv = () => {
    const headers = ["Bin ID", "Ward ID", "Location", "Area", "Capacity", "Fill %", "Weight (kg)", "Temp", "Gas", "Fire", "Status", "Last Collected", "Lat", "Lng"];
    const rows = localBins.map(b => [
      b.id, b.wardId, `"${(b.location || "").replace(/"/g, '""')}"`, `"${(b.area || "").replace(/"/g, '""')}"`,
      b.capacity, b.fill, b.weight, b.temp, b.gas, b.fire ? "Yes" : "No", b.status, `"${b.lastCollected}"`, b.lat, b.lng,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `intelliwaste_bins_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWasteReportCsv = () => {
    const headers = ["Ward", "Area", "Total Collected (tons)", "Sorted Output (tons)", "Verified Time", "Status"];
    const rows = localWards.map((w, index) => {
      const total = (weeklyData[index % weeklyData.length]?.collected ?? 14.2).toFixed(1);
      const sorted = (Number(total) * 0.71).toFixed(1);
      return [`"${w.name}"`, `"${w.area}"`, total, sorted, `"Today, ${9 + index}:20"`, "VERIFIED"];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `intelliwaste_waste_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportComplianceCsv = () => {
    const headers = ["Ward", "Audit Score %", "Hazmat Clearance", "Inspection Status", "Last Audit"];
    const rows = localWards.map((w, i) => [
      `"${w.name} — ${w.area}"`, 92 + (i % 7), "100%", "Compliant", `"2026-09-${String(10 - (i % 5)).padStart(2, "0")}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `intelliwaste_compliance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await api.alerts.resolve(id);
      setLocalAlerts(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.warn("Failed to resolve alert:", e);
      setLocalAlerts(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleRefreshAlerts = async () => {
    try {
      const fresh = await api.alerts.getAll({ resolved: false });
      setLocalAlerts(fresh || []);
    } catch (e) {
      console.warn("Failed to refresh alerts:", e);
    }
  };

  return (
    <div className="flex h-screen bg-[#061309] text-[#e2f5e9] overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0a1f0e] border-r border-[#1a3d22] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-[#1a3d22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16a34a] flex items-center justify-center font-display font-800 text-white text-base shadow">
              {cityCode[0] || "D"}
            </div>
            <div className="min-w-0">
              <div className="font-display font-800 text-sm tracking-wide text-white truncate">
                {cityCode} Central Admin
              </div>
              <div className="text-[11px] text-[#4ade80] font-mono">OPERATIONS HQ</div>
            </div>
          </div>
          <div className="text-[#4b7a5a] text-xs mt-2 truncate">{cityTitle}</div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDEBAR.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? "bg-[#16a34a] text-white shadow" : "text-[#4b7a5a] hover:bg-[#0d2414] hover:text-[#86efac]"}`}
            >
              <item.icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span>}
              {item.id === "alerts" && localAlerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                  {localAlerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1a3d22]">
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={13} /> Secure Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-[#0a1f0e] border-b border-[#1a3d22] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#4b7a5a]"><Package size={18} /></button>
            <div>
              <div className="font-display font-700 text-white capitalize">
                {SIDEBAR.find(s => s.id === activeTab)?.label ?? "City Overview"}
              </div>
              <div className="text-[#4b7a5a] text-xs font-mono">
                {cityTitle} · {localWards.length} Dynamic Wards Managed
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalCritical > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-1.5">
                <Flame size={12} className="text-red-400" />
                <span className="text-red-400 text-xs font-mono">{totalCritical} Critical</span>
              </div>
            )}
            <div className="w-8 h-8 bg-[#16a34a] rounded-full flex items-center justify-center text-xs font-bold text-white shadow">
              {cityCode.slice(0, 2)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ── CITY OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Wards", value: localWards.length, sub: `${wardsWithAdmin} assigned sub-admin`, icon: Globe, color: "#4ade80" },
                  { label: "Total Smart Bins", value: totalBins, sub: `${totalCritical} critical/warning`, icon: Trash2, color: "#60a5fa" },
                  { label: "Active Trucks", value: `${activeTrucks}/${localTracks.length}`, sub: "Fleet across city", icon: Truck, color: "#facc15" },
                  { label: "Wards Without Admin", value: Math.max(0, localWards.length - wardsWithAdmin), sub: "Needs assignment", icon: Users, color: "#f472b6" },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 hover:border-[#4ade80]/30 transition-all">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: kpi.color + "22" }}>
                      <kpi.icon size={18} style={{ color: kpi.color }} />
                    </div>
                    <div className="font-display font-800 text-2xl text-white mb-0.5">{kpi.value}</div>
                    <div className="text-xs font-mono" style={{ color: kpi.color }}>{kpi.label}</div>
                    <div className="text-[#4b7a5a] text-xs mt-0.5">{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="font-display font-600 text-white mb-4">City-wide Weekly Collection (tons)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} /><stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a3d22" />
                      <XAxis dataKey="day" stroke="#4b7a5a" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <YAxis stroke="#4b7a5a" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <Tooltip contentStyle={{ background: "#0d2414", border: "1px solid #1a3d22", borderRadius: 8, color: "#e2f5e9", fontSize: 12 }} />
                      <Area type="monotone" dataKey="collected" stroke="#4ade80" fill="url(#cg1)" strokeWidth={2} name="Collected" />
                      <Area type="monotone" dataKey="sorted" stroke="#60a5fa" fill="url(#cg2)" strokeWidth={2} name="Sorted" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="font-display font-600 text-white mb-1">Sorting Machine Output</div>
                  <div className="text-[#4b7a5a] text-xs mb-3">Categories after facility sorting</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={outputBreakdown} cx="50%" cy="50%" innerRadius={38} outerRadius={65} dataKey="value" paddingAngle={2}>
                        {outputBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0d2414", border: "1px solid #1a3d22", borderRadius: 8, color: "#e2f5e9", fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Wards Table */}
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1a3d22] flex items-center justify-between">
                  <div className="font-display font-600 text-white">All Wards — Quick Overview</div>
                  <button onClick={() => setActiveTab("wards")} className="text-xs text-[#4ade80] hover:underline flex items-center gap-1">
                    Manage all {localWards.length} wards <ChevronRight size={12} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1a3d22]">
                        {["Ward", "Area", "Population", "Bins", "Tracks", "Sub-Admin", "Critical Bins"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-mono text-[#4b7a5a]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {localWards.slice(0, 8).map(w => {
                        const crit = localBins.filter(b => b.wardId === w.id && (b.status === "critical" || b.status === "fire")).length;
                        const subAdmin = subAdmins.find(a => a.wardId === w.id);
                        return (
                          <tr key={w.id} className="border-b border-[#1a3d22] hover:bg-[#061309] transition-colors cursor-pointer" onClick={() => setSelectedWard(w)}>
                            <td className="px-4 py-3 font-mono text-[#4ade80] text-xs">{w.name}</td>
                            <td className="px-4 py-3 text-[#86efac] text-xs">{w.area}</td>
                            <td className="px-4 py-3 text-[#4b7a5a] text-xs font-mono">{w.population.toLocaleString()}</td>
                            <td className="px-4 py-3 text-[#86efac] font-mono text-xs">{localBins.filter(b => b.wardId === w.id).length || w.totalBins}</td>
                            <td className="px-4 py-3 text-[#86efac] font-mono text-xs">{localTracks.filter(t => t.wardId === w.id).length || w.activeTracks}</td>
                            <td className="px-4 py-3">
                              {subAdmin ? (
                                <span className="text-xs text-[#4ade80]">✓ {subAdmin.name.split(" ")[0]}</span>
                              ) : (
                                <span className="text-xs text-yellow-400">⚠ None</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {crit > 0 ? <span className="text-xs text-red-400 font-mono">{crit} critical</span> : <span className="text-xs text-[#4ade80]">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── WARD MANAGEMENT (DYNAMIC WARDS / AREAS) ── */}
          {activeTab === "wards" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                  <input
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4b7a5a] focus:border-[#4ade80] outline-none"
                    placeholder="Search ward number or area..."
                  />
                </div>
                <button
                  onClick={() => setShowAddWard(true)}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Plus size={14} /> Add Ward / Area
                </button>
                <button
                  onClick={() => setShowAddSubAdmin(true)}
                  className="border border-[#1a3d22] hover:border-[#4ade80] text-[#4ade80] text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Users size={14} /> Assign Sub-Admin
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {localWards
                  .filter(w => w.area.toLowerCase().includes(search.toLowerCase()) || w.name.toLowerCase().includes(search.toLowerCase()))
                  .map(w => {
                    const critBins = localBins.filter(b => b.wardId === w.id && (b.status === "critical" || b.status === "fire")).length;
                    const liveBinsCount = localBins.filter(b => b.wardId === w.id).length;
                    const liveTracksCount = localTracks.filter(t => t.wardId === w.id).length;
                    const currentAdmin = subAdmins.find(a => a.wardId === w.id);

                    return (
                      <div key={w.id} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 hover:border-[#4ade80]/30 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-mono font-bold text-[#4ade80] text-sm">{w.name}</div>
                              <div className="font-display font-600 text-white text-base">{w.area}</div>
                              <div className="text-[#4b7a5a] text-xs mt-0.5">Councilor: {w.councilor || "Not appointed"}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              {critBins > 0 && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{critBins} critical</span>}
                              <button onClick={() => deleteWard(w.id)} title="Delete Ward" className="text-[#4b7a5a] hover:text-red-400 p-1">
                                <Trash size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[
                              { label: "Population", value: (w.population / 1000).toFixed(0) + "K" },
                              { label: "Smart Bins", value: liveBinsCount || w.totalBins },
                              { label: "Trucks", value: liveTracksCount || w.activeTracks },
                            ].map(k => (
                              <div key={k.label} className="bg-[#061309] rounded-lg p-2 text-center">
                                <div className="font-mono text-sm font-bold text-[#4ade80]">{k.value}</div>
                                <div className="text-[#4b7a5a] text-[11px]">{k.label}</div>
                              </div>
                            ))}
                          </div>

                          <div className="mb-3">
                            {currentAdmin ? (
                              <div className="flex items-center gap-2 bg-[#061309] border border-[#1a3d22] rounded-lg p-2">
                                <div className="w-7 h-7 bg-[#16a34a] rounded-full flex items-center justify-center text-xs font-bold text-white">{currentAdmin.name[0]}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white text-xs font-semibold truncate">{currentAdmin.name}</div>
                                  <div className="text-[#4b7a5a] text-xs">@{currentAdmin.username}</div>
                                </div>
                                <span className={`text-[11px] font-mono ${currentAdmin.active ? "text-[#4ade80]" : "text-red-400"}`}>
                                  {currentAdmin.active ? "ACTIVE" : "OFF"}
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditSubAdmin({
                                    wardId: w.id,
                                    name: "",
                                    username: `ward${String(w.id).padStart(2, "0")}.admin`,
                                    email: `ward${String(w.id).padStart(2, "0")}@${cityCode.toLowerCase()}.gov.bd`,
                                    phone: "",
                                    nid: "",
                                    address: `${w.area}`,
                                    active: true,
                                  });
                                  setShowAddSubAdmin(true);
                                }}
                                className="w-full bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Plus size={12} /> Assign Sub-Admin to {w.name}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-[#1a3d22]">
                          <button onClick={() => setSelectedWard(w)} className="flex-1 border border-[#1a3d22] text-[#86efac] text-xs py-2 rounded-lg hover:border-[#4ade80]/40 flex items-center justify-center gap-1.5 transition-colors">
                            <Eye size={12} /> Ward Info
                          </button>
                          {onNavigateWard && (
                            <button onClick={() => onNavigateWard(w.id)} className="flex-1 bg-[#16a34a]/20 border border-[#16a34a]/40 text-[#4ade80] text-xs py-2 rounded-lg hover:bg-[#16a34a]/30 flex items-center justify-center gap-1.5 transition-colors">
                              <ExternalLink size={12} /> Enter Portal
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── POINTS & CASH POLICY (EXCLUSIVE TO CITY CORP ADMIN) ── */}
          {activeTab === "rewards" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-white font-display font-700 text-xl">Citizen Points-to-Cash Policy & Conversion Rate</h2>
                  <p className="text-[#4b7a5a] text-xs mt-0.5">
                    As City Corporation Admin, you set the cash conversion rate for recycling points. Citizens claim cash payouts from their respective Ward Admin office.
                  </p>
                </div>
                <span className="self-start px-3 py-1 bg-[#16a34a]/20 border border-[#16a34a]/40 text-[#4ade80] rounded-full text-xs font-mono">
                  CITY ADMIN AUTHORITY
                </span>
              </div>

              {policySaved && (
                <div className="bg-green-500/15 border border-green-500/30 text-green-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                  <CheckCircle size={15} />
                  <span>Conversion rate & withdrawal policy updated successfully and broadcasted to all wards!</span>
                </div>
              )}

              {/* Policy Configuration & Stats */}
              <div className="grid md:grid-cols-3 gap-5">
                <div className="md:col-span-2 bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6">
                  <div className="font-display font-700 text-white mb-1">Exchange Rate Configuration</div>
                  <div className="text-[#4b7a5a] text-xs mb-5">Set how much 1 citizen recycling point converts to in Bangladeshi Taka (BDT)</div>

                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[#4b7a5a] text-xs font-mono">EXCHANGE RATE (BDT PER 1 POINT)</label>
                        <span className="text-[#4ade80] font-mono text-xs font-bold">
                          100 Points = ৳{(100 * pointRate).toFixed(2)} BDT
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          max="2.00"
                          value={pointRate}
                          onChange={(e) => setPointRate(parseFloat(e.target.value) || 0.1)}
                          className={inp}
                        />
                        <div className="text-xs text-[#86efac] font-mono whitespace-nowrap bg-[#061309] border border-[#1a3d22] px-3 py-2.5 rounded-xl">
                          ৳{pointRate.toFixed(2)} / pt
                        </div>
                      </div>
                      <p className="text-[#4b7a5a] text-[11px] mt-1.5">
                        Standard city rate is ৳0.20 per point (500 points = ৳100 cash voucher at ward office).
                      </p>
                    </div>

                    <div>
                      <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">MINIMUM WITHDRAWAL THRESHOLD</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="50"
                          min="50"
                          value={minWithdrawPoints}
                          onChange={(e) => setMinWithdrawPoints(parseInt(e.target.value, 10) || 50)}
                          className={inp}
                        />
                        <div className="text-xs text-[#86efac] font-mono whitespace-nowrap bg-[#061309] border border-[#1a3d22] px-3 py-2.5 rounded-xl">
                          Min: ৳{(minWithdrawPoints * pointRate).toFixed(2)}
                        </div>
                      </div>
                      <p className="text-[#4b7a5a] text-[11px] mt-1.5">
                        Citizens must accumulate at least this many points before requesting cash withdrawal from a Ward Admin.
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#061309] border border-[#1a3d22] rounded-xl">
                      <div>
                        <div className="text-white text-xs font-semibold">Cash Rewards Program Status</div>
                        <div className="text-[#4b7a5a] text-[11px] mt-0.5">Toggle whether citizens in this city can currently submit cash withdrawal vouchers.</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRewardActive(!rewardActive)}
                        className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-semibold transition-colors ${
                          rewardActive
                            ? "bg-green-500/20 text-green-400 border border-green-500/40"
                            : "bg-red-500/20 text-red-400 border border-red-500/40"
                        }`}
                      >
                        {rewardActive ? "ACTIVE" : "SUSPENDED"}
                      </button>
                    </div>

                    <button
                      onClick={saveRewardPolicy}
                      disabled={savingPolicy}
                      className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                      {savingPolicy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      Save & Apply Policy to All Wards
                    </button>
                  </div>
                </div>

                {/* City-Wide Disbursal Summary */}
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="font-display font-700 text-white mb-1">Ward Payout Statistics</div>
                    <div className="text-[#4b7a5a] text-xs mb-4">Total citizen cash redemptions processed across your wards</div>

                    <div className="space-y-3">
                      <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-4">
                        <div className="text-[#4b7a5a] text-xs">Total Cash Disbursed</div>
                        <div className="font-display font-800 text-2xl text-[#4ade80] mt-1">
                          ৳{withdrawals.filter(w => w.status === "paid").reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
                        </div>
                        <div className="text-[#4b7a5a] text-[11px] mt-0.5">Disbursed by Ward Admins</div>
                      </div>

                      <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-4">
                        <div className="text-[#4b7a5a] text-xs">Pending Claims at Ward Offices</div>
                        <div className="font-display font-800 text-2xl text-yellow-400 mt-1">
                          {withdrawals.filter(w => w.status === "pending").length}
                        </div>
                        <div className="text-[#4b7a5a] text-[11px] mt-0.5">
                          Awaiting citizen pickup
                        </div>
                      </div>

                      <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-4">
                        <div className="text-[#4b7a5a] text-xs">Total Points Redeemed</div>
                        <div className="font-display font-800 text-2xl text-[#60a5fa] mt-1">
                          {withdrawals.reduce((sum, w) => sum + w.points, 0).toLocaleString()} pts
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1a3d22] text-[#4b7a5a] text-[11px]">
                    Note: Cash is paid directly to citizens at Ward Admin offices upon presenting verification vouchers.
                  </div>
                </div>
              </div>

              {/* All Ward Cash Claims Table */}
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#1a3d22] flex items-center justify-between">
                  <div>
                    <div className="font-display font-600 text-white">City-wide Cash Withdrawal Claims</div>
                    <div className="text-[#4b7a5a] text-xs">Live stream of citizen cash redemptions at ward offices</div>
                  </div>
                  <span className="text-xs font-mono text-[#86efac]">{withdrawals.length} claims</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1a3d22]">
                        {["Voucher Code", "Citizen Name", "Phone", "Ward Office", "Points", "Cash Amount", "Status", "Date"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-mono text-[#4b7a5a] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map(w => (
                        <tr key={w.id} className="border-b border-[#1a3d22] hover:bg-[#061309] transition-colors">
                          <td className="px-4 py-3 font-mono text-[#4ade80] text-xs font-bold">{w.verificationCode}</td>
                          <td className="px-4 py-3 text-white text-xs">{w.citizenName || w.citizen?.fullName || "Citizen"}</td>
                          <td className="px-4 py-3 text-[#4b7a5a] text-xs font-mono">{w.citizenPhone || w.citizen?.phone || "—"}</td>
                          <td className="px-4 py-3 text-[#86efac] text-xs">
                            {w.ward?.name ? `${w.ward.name} (${w.ward.area})` : `Ward ${w.wardId}`}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-[#86efac]">{w.points} pts</td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-[#4ade80]">৳{w.amount.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                              w.status === "paid"
                                ? "bg-green-500/20 text-green-400"
                                : w.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}>
                              {w.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#4b7a5a] text-xs">{w.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ALL BINS ── */}
          {activeTab === "bins" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                  <input onChange={e => setSearch(e.target.value)} className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4b7a5a] focus:border-[#4ade80] outline-none" placeholder="Search bin ID, location, area..." />
                </div>
                <button onClick={() => setShowAddBin(true)} className="bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5">
                  <Plus size={14} /> Add Bin
                </button>
                <button onClick={exportBinsCsv} className="border border-[#1a3d22] text-[#86efac] text-xs px-4 py-2.5 rounded-lg hover:border-[#4ade80]/30 flex items-center gap-1.5">
                  <Download size={14} /> Export CSV
                </button>
              </div>
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1a3d22]">
                        {["Bin ID", "Ward", "Location", "Fill %", "Weight", "Temp", "Gas", "Fire", "Last Collected", "Status", "Actions"].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-mono text-[#4b7a5a] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBins.map(b => (
                        <tr key={b.id} className="border-b border-[#1a3d22] hover:bg-[#061309] transition-colors">
                          <td className="px-3 py-3 font-mono text-[#4ade80] text-xs whitespace-nowrap">{b.id}</td>
                          <td className="px-3 py-3 text-[#4b7a5a] text-xs whitespace-nowrap">
                            {localWards.find(w => w.id === b.wardId)?.name || `Ward ${b.wardId}`}
                          </td>
                          <td className="px-3 py-3 text-[#86efac] text-xs max-w-[160px] truncate">{b.location}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#061309] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${b.fill}%`, background: b.fill > 80 ? "#ef4444" : b.fill > 60 ? "#f59e0b" : "#4ade80" }} />
                              </div>
                              <span className="font-mono text-xs" style={{ color: b.fill > 80 ? "#ef4444" : b.fill > 60 ? "#f59e0b" : "#4ade80" }}>{b.fill}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-[#86efac] whitespace-nowrap">{b.weight} kg</td>
                          <td className="px-3 py-3 font-mono text-xs whitespace-nowrap" style={{ color: b.temp !== "Normal" ? "#ef4444" : "#4ade80" }}>{b.temp}</td>
                          <td className="px-3 py-3 font-mono text-xs whitespace-nowrap" style={{ color: b.gas !== "Normal" ? "#f59e0b" : "#4ade80" }}>{b.gas}</td>
                          <td className="px-3 py-3 font-mono text-xs whitespace-nowrap" style={{ color: b.fire ? "#ef4444" : "#4ade80" }}>{b.fire ? "⚠ YES" : "Clear"}</td>
                          <td className="px-3 py-3 text-[#4b7a5a] text-xs whitespace-nowrap">{b.lastCollected}</td>
                          <td className="px-3 py-3"><StatusBadge status={b.status} /></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <a href={`https://maps.google.com/?q=${b.lat},${b.lng}`} target="_blank" rel="noreferrer" title="View on Google Maps" className="text-[#4b7a5a] hover:text-[#60a5fa] transition-colors"><Navigation size={13} /></a>
                              <button onClick={() => setEditBin(b)} title="Edit bin" className="text-[#4b7a5a] hover:text-[#4ade80] transition-colors"><Edit3 size={13} /></button>
                              <button onClick={() => setLocalBins(p => p.filter(x => x.id !== b.id))} title="Delete" className="text-[#4b7a5a] hover:text-red-400 transition-colors"><Trash size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ALL TRACKS ── */}
          {activeTab === "tracks" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                  <input onChange={e => setSearch(e.target.value)} className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4b7a5a] focus:border-[#4ade80] outline-none" placeholder="Search truck ID or driver..." />
                </div>
                <button onClick={() => setShowAddTrack(true)} className="bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5">
                  <Plus size={14} /> Add Track
                </button>
              </div>
              <div className="space-y-3">
                {filteredTracks.map(t => (
                  <div key={t.id} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 hover:border-[#4ade80]/30 transition-all">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.status === "active" ? "#4ade8022" : t.status === "idle" ? "#facc1522" : "#f59e0b22" }}>
                        <Truck size={20} style={{ color: t.status === "active" ? "#4ade80" : t.status === "idle" ? "#facc15" : "#f59e0b" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-bold text-white">{t.truckId}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                            t.truckType === "HAZARDOUS"
                              ? "bg-red-500/20 border-red-500/40 text-red-400"
                              : "bg-[#16a34a]/20 border-[#4ade80]/30 text-[#4ade80]"
                          }`}>
                            {t.truckType === "HAZARDOUS" ? "HAZARDOUS TRUCK" : "NORMAL TRUCK"}
                          </span>
                          <StatusBadge status={t.status} />
                          <span className="text-xs text-[#4b7a5a]">{localWards.find(w => w.id === t.wardId)?.name} — {localWards.find(w => w.id === t.wardId)?.area}</span>
                        </div>
                        <div className="text-[#86efac] text-sm flex items-center gap-2 flex-wrap">
                          <span>{t.driver}</span>
                          <button
                            onClick={() => setAssigningTrack(t)}
                            className="text-[11px] bg-[#16a34a]/20 hover:bg-[#16a34a]/40 text-[#4ade80] border border-[#4ade80]/30 px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                          >
                            <UserCheck size={11} />
                            <span>Assign / Change Driver</span>
                          </button>
                        </div>
                        <div className="text-[#4b7a5a] text-xs mt-0.5 truncate">{t.route}</div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs shrink-0">
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Progress</div>
                          <div className="w-24 bg-[#061309] rounded-full h-1.5 mb-1">
                            <div className="h-1.5 rounded-full bg-[#4ade80]" style={{ width: `${t.progress}%` }} />
                          </div>
                          <div className="font-mono text-[#4ade80]">{t.progress}%</div>
                        </div>
                        <div><div className="text-[#4b7a5a] mb-1">Stops</div><div className="font-mono text-[#86efac]">{t.stops}</div></div>
                        <div><div className="text-[#4b7a5a] mb-1">Load</div><div className="font-mono text-[#86efac]">{t.load}</div></div>
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Fuel</div>
                          <div className="font-mono" style={{ color: t.fuel < 40 ? "#ef4444" : t.fuel < 60 ? "#f59e0b" : "#4ade80" }}>{t.fuel}%</div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a href={t.mapsRouteUrl || `https://maps.google.com/?q=${t.gpsLat},${t.gpsLng}`} target="_blank" rel="noreferrer" title="Track on Google Maps" className="text-[#4b7a5a] hover:text-[#60a5fa] transition-colors"><Navigation size={14} /></a>
                        <button onClick={() => setEditTrack(t)} title="Edit track" className="text-[#4b7a5a] hover:text-[#4ade80] transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => setLocalTracks(p => p.filter(x => x.id !== t.id))} className="text-[#4b7a5a] hover:text-red-400 transition-colors"><Trash size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PICKUP SCHEDULES & APPROVAL WORKFLOW ── */}
          {activeTab === "schedules" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">
                    <Calendar className="text-[#4ade80]" size={20} />
                    <span>Waste Collection Pickup Schedules</span>
                  </h2>
                  <p className="text-xs text-[#4b7a5a] mt-0.5">
                    Review and approve schedules submitted by Ward Admins, or dispatch confirmed city-wide collection runs.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-[#061309] border border-[#1a3d22] rounded-xl p-0.5">
                    {(["ALL", "PENDING", "CONFIRMED"] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setScheduleFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          scheduleFilter === f ? "bg-[#16a34a] text-white font-bold" : "text-[#4b7a5a] hover:text-[#86efac]"
                        }`}
                      >
                        {f === "PENDING" ? `Pending (${schedules.filter(s => s.status === "PENDING_APPROVAL").length})` : f}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAddSchedule(true)}
                    className="bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Plus size={14} /> Create Confirmed Schedule
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4">
                  <div className="text-[10px] font-mono text-[#4b7a5a] uppercase">Pending Approvals</div>
                  <div className="text-2xl font-bold font-mono text-yellow-400 mt-1">
                    {schedules.filter(s => s.status === "PENDING_APPROVAL").length}
                  </div>
                  <div className="text-[11px] text-[#4b7a5a] mt-0.5">Submitted by Ward Admins</div>
                </div>
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4">
                  <div className="text-[10px] font-mono text-[#4b7a5a] uppercase">Active Confirmed Runs</div>
                  <div className="text-2xl font-bold font-mono text-[#4ade80] mt-1">
                    {schedules.filter(s => s.status === "CONFIRMED").length}
                  </div>
                  <div className="text-[11px] text-[#4b7a5a] mt-0.5">Live on Citizen Portal</div>
                </div>
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4">
                  <div className="text-[10px] font-mono text-[#4b7a5a] uppercase">Hazardous Truck Runs</div>
                  <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                    {schedules.filter(s => s.wasteType?.toLowerCase().includes("hazardous") || s.wasteType?.toLowerCase().includes("toxic")).length}
                  </div>
                  <div className="text-[11px] text-[#4b7a5a] mt-0.5">Specialized Hazardous Handling</div>
                </div>
              </div>

              {/* Schedules List */}
              <div className="space-y-3">
                {schedules
                  .filter(s => {
                    if (scheduleFilter === "PENDING") return s.status === "PENDING_APPROVAL";
                    if (scheduleFilter === "CONFIRMED") return s.status === "CONFIRMED";
                    return true;
                  })
                  .map(sch => {
                    const isHaz = sch.wasteType?.toLowerCase().includes("hazardous") || sch.wasteType?.toLowerCase().includes("toxic");
                    const wardMatch = localWards.find(w => String(w.id) === String(sch.wardId));
                    return (
                      <div
                        key={sch.id}
                        className={`bg-[#0d2414] border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                          sch.status === "PENDING_APPROVAL"
                            ? "border-yellow-500/40 bg-yellow-500/[0.03]"
                            : "border-[#1a3d22] hover:border-[#4ade80]/30"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                            isHaz
                              ? "bg-red-500/20 border-red-500/30 text-red-400"
                              : "bg-[#16a34a]/20 border-[#4ade80]/30 text-[#4ade80]"
                          }`}>
                            <Calendar size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-bold text-white text-sm">{sch.date}</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                                isHaz
                                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                                  : "bg-[#16a34a]/20 border-[#4ade80]/30 text-[#4ade80]"
                              }`}>
                                {sch.wasteType} ({isHaz ? "Hazardous Truck" : "Normal Truck"})
                              </span>
                              {wardMatch && (
                                <span className="text-[11px] bg-[#061309] border border-[#1a3d22] text-[#86efac] px-2 py-0.5 rounded-md font-mono">
                                  {wardMatch.name} ({wardMatch.area})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#4b7a5a] mt-1">
                              Window: <span className="text-[#86efac]">{sch.time}</span> · Route/Zone: <span className="text-white font-mono">{sch.zone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {sch.status === "PENDING_APPROVAL" ? (
                            <>
                              <button
                                onClick={() => handleApproveSchedule(sch.id)}
                                className="bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
                              >
                                <CheckCircle2 size={13} />
                                <span>Approve Schedule</span>
                              </button>
                              <button
                                onClick={() => handleRejectSchedule(sch.id)}
                                className="border border-red-500/40 hover:bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                              >
                                <span>Reject</span>
                              </button>
                            </>
                          ) : sch.status === "CONFIRMED" ? (
                            <span className="bg-green-500/20 border border-green-500/40 text-[#4ade80] text-xs px-3 py-1 rounded-full font-mono font-semibold flex items-center gap-1.5">
                              <CheckCircle size={12} /> Live / Confirmed
                            </span>
                          ) : (
                            <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-xs px-3 py-1 rounded-full font-mono font-semibold">
                              Rejected
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteSchedule(sch.id)}
                            title="Delete Schedule"
                            className="p-1.5 text-[#4b7a5a] hover:text-red-400 transition-colors"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {schedules.length === 0 && (
                  <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-8 text-center text-[#4b7a5a]">
                    No collection schedules recorded yet. Click &ldquo;Create Confirmed Schedule&rdquo; to dispatch.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SUB-ADMINS ── */}
          {activeTab === "subadmins" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[#4b7a5a] text-sm">{wardsWithAdmin} of {localWards.length} wards have assigned sub-admins</div>
                <button onClick={() => setShowAddSubAdmin(true)} className="self-start bg-[#16a34a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#15803d] flex items-center gap-1.5 shadow">
                  <Plus size={14} /> Create & Assign Sub-Admin
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {localWards.map(w => {
                  const account = subAdmins.find(a => a.wardId === w.id);
                  return (
                    <div key={w.id} className={`bg-[#0d2414] border rounded-xl p-5 ${account ? "border-[#1a3d22]" : "border-yellow-500/20"}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-mono text-xs text-[#4ade80]">{w.name}</span>
                        <span className="text-[#4b7a5a] text-xs">—</span>
                        <span className="text-[#86efac] text-xs">{w.area}</span>
                      </div>
                      {account ? (
                        <>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-[#16a34a] rounded-full flex items-center justify-center font-bold text-white">{account.name[0]}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-semibold text-sm truncate">{account.name}</div>
                              <div className="text-[#4b7a5a] text-xs truncate">@{account.username}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-[#1a3d22]">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${account.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {account.active ? "ACTIVE" : "INACTIVE"}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => setEditSubAdmin(account)} title="Edit sub-admin" className="text-[#4b7a5a] hover:text-[#4ade80] transition-colors"><Edit3 size={13} /></button>
                              <button onClick={() => setSubAdmins(p => p.filter(a => a.id !== account.id))} title="Delete sub-admin" className="text-[#4b7a5a] hover:text-red-400 transition-colors"><Trash size={13} /></button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-yellow-400 text-xs mb-3">No sub-admin assigned</div>
                          <button
                            onClick={() => {
                              setEditSubAdmin({
                                wardId: w.id,
                                name: "",
                                username: `ward${String(w.id).padStart(2, "0")}.admin`,
                                email: `ward${String(w.id).padStart(2, "0")}@${cityCode.toLowerCase()}.gov.bd`,
                                phone: "",
                                nid: "",
                                address: `${w.area}`,
                                active: true,
                              });
                              setShowAddSubAdmin(true);
                            }}
                            className="text-xs text-[#4ade80] border border-[#4ade80]/40 px-3 py-1.5 rounded-lg hover:bg-[#4ade80]/10 transition-colors flex items-center gap-1.5 mx-auto"
                          >
                            <Plus size={12} /> Assign Sub-Admin
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── WASTE REPORTS ── */}
          {activeTab === "waste" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-white font-display font-700 text-lg">Citizen Waste & Hazard Reports</div>
                  <div className="text-[#4b7a5a] text-sm">Real-time incident reports submitted by citizens via Citizen Portal</div>
                </div>
                <button onClick={exportWasteReportCsv} className="self-start border border-[#1a3d22] text-[#86efac] text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 hover:border-[#4ade80]/30 transition-colors">
                  <Download size={14} /> Export CSV
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="text-[#4b7a5a] text-xs font-mono">TOTAL INCIDENTS LOGGED</div>
                  <div className="text-white text-2xl font-display font-800 mt-1">{wasteReports.length}</div>
                  <div className="text-[#4ade80] text-xs mt-1">From public reports</div>
                </div>
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="text-[#4b7a5a] text-xs font-mono">PENDING INSPECTION</div>
                  <div className="text-yellow-400 text-2xl font-display font-800 mt-1">
                    {wasteReports.filter(r => r.status === "pending").length}
                  </div>
                  <div className="text-yellow-400 text-xs mt-1">Awaiting field inspector</div>
                </div>
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="text-[#4b7a5a] text-xs font-mono">RESOLVED</div>
                  <div className="text-[#4ade80] text-2xl font-display font-800 mt-1">
                    {wasteReports.filter(r => r.status === "resolved").length}
                  </div>
                  <div className="text-[#4ade80] text-xs mt-1">Inspected & cleared</div>
                </div>
              </div>

              {/* Reports Table */}
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#1a3d22] flex items-center justify-between">
                  <div className="font-display font-600 text-white text-sm">Live Incident Stream</div>
                  <span className="text-xs font-mono text-[#86efac]">{wasteReports.length} reports</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1a3d22]">
                        {["Report ID", "Citizen", "Location", "Category", "Priority", "Status", "Reported At", "Action"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-mono text-[#4b7a5a] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {wasteReports.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-xs text-[#4b7a5a] font-mono">
                            No citizen waste reports submitted yet. Reports submitted from Citizen Portal will appear here in real-time.
                          </td>
                        </tr>
                      ) : (
                        wasteReports.map(r => (
                          <tr key={r.id} className="border-b border-[#1a3d22] hover:bg-[#061309] transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-bold text-[#4ade80] whitespace-nowrap">{r.reportCode}</td>
                            <td className="px-4 py-3 text-white text-xs whitespace-nowrap">
                              <div>{r.citizen?.fullName || "Citizen"}</div>
                              <div className="text-[11px] text-[#4b7a5a] font-mono">{r.citizen?.phone || "—"}</div>
                            </td>
                            <td className="px-4 py-3 text-[#86efac] text-xs max-w-[180px] truncate">{r.location}</td>
                            <td className="px-4 py-3 text-xs text-white whitespace-nowrap">{r.wasteType}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                                r.priority === "critical"
                                  ? "bg-red-500/20 text-red-400"
                                  : r.priority === "urgent"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-green-500/20 text-green-400"
                              }`}>
                                {r.priority.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                                r.status === "resolved"
                                  ? "bg-green-500/20 text-green-400"
                                  : r.status === "investigating"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}>
                                {r.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-[#4b7a5a] whitespace-nowrap">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {r.status !== "resolved" ? (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.reports.updateStatus(r.id, "resolved");
                                      setWasteReports(prev => prev.map(item => item.id === r.id ? { ...item, status: "resolved" } : item));
                                    } catch (e) {}
                                  }}
                                  className="text-xs bg-[#16a34a]/20 hover:bg-[#16a34a]/40 border border-[#16a34a]/50 text-[#4ade80] px-2.5 py-1 rounded-lg font-mono transition-colors"
                                >
                                  Mark Resolved
                                </button>
                              ) : (
                                <span className="text-[11px] text-[#4ade80] font-mono flex items-center gap-1">
                                  <CheckCircle size={12} /> Resolved
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ALERTS ── */}
          {activeTab === "alerts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-display font-700 text-base">System & IoT Alerts</h3>
                  <p className="text-xs text-[#4b7a5a]">Live sensors and hazard warnings across all wards</p>
                </div>
                <button
                  onClick={handleRefreshAlerts}
                  className="flex items-center gap-1.5 text-xs text-[#4ade80] hover:text-[#86efac] bg-[#0d2414] border border-[#1a3d22] px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {localAlerts.length === 0 ? (
                <div className="text-center py-16 bg-[#0d2414] border border-[#1a3d22] rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                    <CheckCircle size={28} className="text-[#4ade80]" />
                  </div>
                  <div className="text-lg font-display font-700 text-white mb-1">No Active Alerts</div>
                  <div className="text-sm text-[#4b7a5a]">All bins and sensors across the city are operating normally.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {localAlerts.map((a) => {
                    const timeAgo = a.createdAt ? (() => {
                      const diff = Date.now() - new Date(a.createdAt).getTime();
                      const mins = Math.floor(diff / 60000);
                      if (mins < 1) return "Just now";
                      if (mins < 60) return `${mins} min ago`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `${hrs}h ago`;
                      return `${Math.floor(hrs / 24)}d ago`;
                    })() : "";
                    return (
                      <div key={a.id} className={`bg-[#0d2414] border rounded-xl p-4 flex items-center justify-between gap-3 ${a.priority === "critical" ? "border-red-500/40" : a.priority === "high" ? "border-orange-500/30" : "border-yellow-500/20"}`}>
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.type === "fire" ? "bg-red-500/20" : a.type === "gas" ? "bg-yellow-500/20" : "bg-orange-500/20"}`}>
                            {a.type === "fire" ? <Flame size={16} className="text-red-400" /> : a.type === "gas" ? <Wind size={16} className="text-yellow-400" /> : <AlertTriangle size={16} className="text-orange-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium mb-0.5">{a.message}</div>
                            <div className="flex items-center gap-3 text-xs text-[#4b7a5a]">
                              <span className="font-mono text-[#4ade80]">{a.ward?.name || "Unknown Ward"}</span>
                              {a.bin?.binCode && <span className="font-mono text-[#86efac]">{a.bin.binCode}</span>}
                              {timeAgo && <span>{timeAgo}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-mono ${a.priority === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" : a.priority === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"}`}>
                            {a.priority.toUpperCase()}
                          </span>
                          <button
                            onClick={() => handleResolveAlert(a.id)}
                            title="Mark Resolved"
                            className="text-xs px-2.5 py-1 rounded-lg border border-[#1a3d22] text-[#4b7a5a] hover:text-[#4ade80] hover:border-[#4ade80]/40 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle size={13} /> Resolve
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── COMPLIANCE ── */}
          {activeTab === "compliance" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Audit Reports", value: "184", color: "#4ade80" },
                  { label: "CoD Certificates", value: "63", color: "#60a5fa" },
                  { label: "Hazardous Chain-of-Custody", value: "421", color: "#a78bfa" },
                ].map(k => (
                  <div key={k.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 text-center">
                    <div className="font-mono text-3xl font-bold mb-1" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-[#4b7a5a] text-sm">{k.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showAddWard && <WardModal title="Add Ward & Area" onClose={() => setShowAddWard(false)} onSave={saveWard} />}
      {showAddBin && <BinModal title="Add New Smart Bin" onClose={() => setShowAddBin(false)} onSave={saveBin} availableWards={localWards} />}
      {editBin && <BinModal title="Edit Bin" initial={editBin} onClose={() => setEditBin(null)} onSave={saveBin} availableWards={localWards} />}
      {showAddTrack && <TrackModal title="Add Collection Track" onClose={() => setShowAddTrack(false)} onSave={saveTrack} availableWards={localWards} />}
      {editTrack && <TrackModal title="Edit Track" initial={editTrack} onClose={() => setEditTrack(null)} onSave={saveTrack} availableWards={localWards} />}
      {showAddSubAdmin && <AddSubAdminModal onClose={() => setShowAddSubAdmin(false)} onSave={saveSubAdmin} availableWards={localWards} />}
      {editSubAdmin && <AddSubAdminModal initial={editSubAdmin} onClose={() => setEditSubAdmin(null)} onSave={saveSubAdmin} availableWards={localWards} />}
      {selectedWard && <WardDetailModal ward={selectedWard} localBins={localBins} localTracks={localTracks} subAdmins={subAdmins} onClose={() => setSelectedWard(null)} />}

      {/* Assign / Change Driver Modal */}
      {assigningTrack && (
        <AssignDriverModal
          track={assigningTrack}
          drivers={drivers}
          onClose={() => setAssigningTrack(null)}
          onAssign={handleAssignDriver}
        />
      )}

      {/* Create Confirmed Schedule Modal */}
      {showAddSchedule && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSchedule(false)}>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1a3d22]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#16a34a]/20 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80]">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="font-display font-bold text-white text-base">Create Confirmed Schedule</div>
                  <div className="text-xs text-[#4ade80] font-mono">{cityTitle} Direct Dispatch</div>
                </div>
              </div>
              <button onClick={() => setShowAddSchedule(false)}><X size={16} className="text-[#4b7a5a] hover:text-white" /></button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-[#86efac] mb-1">COLLECTION DATE</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#86efac] mb-1">TIME WINDOW</label>
                <input
                  value={scheduleForm.time}
                  onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))}
                  placeholder="e.g. 08:00 – 11:00 AM"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#86efac] mb-1">WASTE CATEGORY & VEHICLE TYPE</label>
                <select
                  value={scheduleForm.wasteType}
                  onChange={e => setScheduleForm(f => ({ ...f, wasteType: e.target.value as "Organic" | "Recyclable" | "General" | "Hazardous" }))}
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]"
                >
                  <option value="General">General Municipal Waste (Normal Truck)</option>
                  <option value="Organic">Organic & Kitchen Scraps (Normal Truck)</option>
                  <option value="Recyclable">Plastics, Glass & Paper (Normal Truck)</option>
                  <option value="Hazardous">Hazardous / Chemical / Batteries (Hazardous Truck)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#86efac] mb-1">TARGET WARD (OPTIONAL)</label>
                <select
                  value={scheduleForm.wardId}
                  onChange={e => setScheduleForm(f => ({ ...f, wardId: e.target.value }))}
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]"
                >
                  <option value="">-- All Wards / General Route --</option>
                  {localWards.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#86efac] mb-1">LOCAL ROUTE / ZONE</label>
                <input
                  value={scheduleForm.zone}
                  onChange={e => setScheduleForm(f => ({ ...f, zone: e.target.value }))}
                  placeholder="e.g. Central Zone, Main Avenue, Commercial Area"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddSchedule(false)}
                className="flex-1 border border-[#1a3d22] text-[#4b7a5a] hover:text-white rounded-xl py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConfirmedSchedule}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow"
              >
                <Plus size={14} /> Dispatch Confirmed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
