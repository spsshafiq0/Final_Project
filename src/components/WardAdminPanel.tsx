import { useState, useEffect } from "react";
import {
  Trash2, Truck, AlertTriangle, Bell, Shield, LogOut,
  Plus, Edit3, Trash, Search, Download, RefreshCw,
  MapPin, Flame, Wind, X, Save, ChevronDown, ChevronUp,
  BarChart2, Package, CheckCircle, Clock, Navigation, ExternalLink,
  Banknote, CheckCircle2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getBinsForWard, getTracksForWard, getWardById, type Bin, type Track, wards } from "../data/cityData";
import api, { WithdrawalItem } from "../lib/api";

interface WardAdminPanelProps {
  wardId: number;
  onLogout: () => void;
}

const TABS = [
  { id: "overview",    icon: BarChart2, label: "Ward Overview" },
  { id: "withdrawals", icon: Banknote,  label: "Cash Payouts" },
  { id: "bins",        icon: Trash2,    label: "My Bins" },
  { id: "tracks",      icon: Truck,     label: "My Tracks" },
  { id: "waste",       icon: Package,   label: "Waste Data" },
  { id: "alerts",      icon: Bell,      label: "Alerts" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    normal: "bg-green-500/20 text-green-400",
    warning: "bg-yellow-500/20 text-yellow-400",
    critical: "bg-orange-500/20 text-orange-400",
    fire: "bg-red-500/20 text-red-400",
    active: "bg-green-500/20 text-green-400",
    idle: "bg-yellow-500/20 text-yellow-400",
    maintenance: "bg-orange-500/20 text-orange-400",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${map[status] ?? "bg-[#1a3d22] text-[#4b7a5a]"}`}>{status.toUpperCase()}</span>;
}

// ── Add Track Modal (Ward-level) ────────────────────────────────────────
function AddTrackModal({ wardId, onClose, onAdd }: { wardId: number; onClose: () => void; onAdd: (t: Partial<Track>) => void }) {
  const ward = getWardById(wardId) || wards[0];
  const [form, setForm] = useState({
    truckId: "",
    driver: "",
    phone: "",
    username: "",
    email: "",
    nid: "",
    address: "",
    route: "",
    stops: 6,
    gpsLat: 23.78,
    gpsLng: 90.40,
    mapsRouteUrl: "",
  });
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display font-700 text-white">Add Collection Track</div>
            <div className="text-[#4ade80] text-xs font-mono">{ward?.name} — {ward?.area}</div>
          </div>
          <button onClick={onClose}><X size={16} className="text-[#4b7a5a]" /></button>
        </div>
        <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-3 mb-4">
          <div className="text-[#4b7a5a] text-xs">This track will be assigned to <span className="text-[#4ade80] font-mono">{ward?.name}</span> only. You cannot add tracks for other wards.</div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">TRUCK ID</label>
              <input value={form.truckId} onChange={e => setForm(f => ({ ...f, truckId: e.target.value }))} placeholder="DNCC-T00" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#4ade80] placeholder-[#4b7a5a]" />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">STOPS</label>
              <input type="number" value={form.stops} onChange={e => setForm(f => ({ ...f, stops: Number(e.target.value) }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DRIVER NAME</label>
            <input value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} placeholder="Full name" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80] placeholder-[#4b7a5a]" />
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DRIVER PHONE</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="017XX-XXXXXX" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80] placeholder-[#4b7a5a]" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">USERNAME</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="driver.username" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">EMAIL</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="driver@example.com" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">NID NUMBER</label>
              <input value={form.nid} onChange={e => setForm(f => ({ ...f, nid: e.target.value }))} placeholder="National ID" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">FULL ADDRESS</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Driver address" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ROUTE DESCRIPTION</label>
            <input value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} placeholder="Road 1 → Road 7 → Depot" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80] placeholder-[#4b7a5a]" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-[#1a3d22] text-[#4b7a5a] rounded-xl py-2.5 text-sm">Cancel</button>
          <button
            onClick={() => {
              onAdd({
                ...form,
                wardId,
                status: "idle",
                progress: 0,
                load: "0t",
                fuel: 100,
                startTime: "07:00 AM",
                mapsRouteUrl: form.mapsRouteUrl || `https://maps.google.com/?q=${form.gpsLat},${form.gpsLng}`,
              });
              onClose();
            }}
            className="flex-1 bg-[#16a34a] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Save size={14} /> Save Track
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Track Modal (Ward-level) ───────────────────────────────────────
function EditTrackModal({ track, onClose, onSave }: { track: Track; onClose: () => void; onSave: (t: Track) => void }) {
  const [form, setForm] = useState({
    truckId:      track.truckId,
    driver:       track.driver,
    phone:        track.phone,
    route:        track.route,
    stops:        track.stops,
    gpsLat:       track.gpsLat,
    gpsLng:       track.gpsLng,
    mapsRouteUrl: track.mapsRouteUrl,
    status:       track.status,
    fuel:         track.fuel,
  });
  const liveLink = form.mapsRouteUrl || `https://maps.google.com/?q=${form.gpsLat},${form.gpsLng}`;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-700 text-white">Edit Track</div>
          <button onClick={onClose}><X size={16} className="text-[#4b7a5a]" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">TRUCK ID</label>
              <input value={form.truckId} onChange={e => setForm(f => ({ ...f, truckId: e.target.value }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">STOPS</label>
              <input type="number" value={form.stops} onChange={e => setForm(f => ({ ...f, stops: Number(e.target.value) }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DRIVER NAME</label>
            <input value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DRIVER PHONE</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ROUTE DESCRIPTION</label>
            <input value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">GPS LATITUDE</label>
              <input type="number" step="0.001" value={form.gpsLat} onChange={e => setForm(f => ({ ...f, gpsLat: Number(e.target.value) }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">GPS LONGITUDE</label>
              <input type="number" step="0.001" value={form.gpsLng} onChange={e => setForm(f => ({ ...f, gpsLng: Number(e.target.value) }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
          </div>
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">GOOGLE MAPS ROUTE URL (optional)</label>
            <input value={form.mapsRouteUrl} onChange={e => setForm(f => ({ ...f, mapsRouteUrl: e.target.value }))} placeholder="https://maps.google.com/..." className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4ade80] placeholder-[#4b7a5a]" />
          </div>
          <a href={liveLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-[#60a5fa] hover:underline">
            <Navigation size={12} /> Preview live location on Google Maps
          </a>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">STATUS</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Track["status"] }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]">
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">FUEL %</label>
              <input type="number" min={0} max={100} value={form.fuel} onChange={e => setForm(f => ({ ...f, fuel: Number(e.target.value) }))} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-[#1a3d22] text-[#4b7a5a] rounded-xl py-2.5 text-sm">Cancel</button>
          <button onClick={() => { onSave({ ...track, ...form }); onClose(); }} className="flex-1 bg-[#16a34a] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Update Waste Data Modal ─────────────────────────────────────────────
function UpdateWasteModal({
  binId,
  onClose,
  onSave,
}: {
  binId: string;
  onClose: () => void;
  onSave: (data: { binId: string; organic: number; plastic: number; paper: number; metal: number; total: number }) => void;
}) {
  const [form, setForm] = useState({ organic: "", plastic: "", metal: "", paper: "", glass: "", hazardous: "", residual: "", notes: "" });
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display font-700 text-white">Update Waste Collection Data</div>
            <div className="text-[#4ade80] text-xs font-mono">{binId}</div>
          </div>
          <button onClick={onClose}><X size={16} className="text-[#4b7a5a]" /></button>
        </div>
        <div className="text-[#4b7a5a] text-xs mb-4">Enter estimated weights (kg) after collection and sorting at facility.</div>
        <div className="space-y-3">
          {[
            { key: "organic", label: "Organic / Biodegradable", icon: "🌱" },
            { key: "plastic", label: "Plastic", icon: "♻️" },
            { key: "metal", label: "Metal / Cans", icon: "🔩" },
            { key: "paper", label: "Paper / Cardboard", icon: "📄" },
            { key: "glass", label: "Glass", icon: "🫙" },
            { key: "hazardous", label: "Hazardous (flagged)", icon: "⚠️" },
            { key: "residual", label: "Non-recyclable Residual", icon: "🗑️" },
          ].map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="text-lg w-6">{f.icon}</span>
              <label className="flex-1 text-[#86efac] text-sm">{f.label}</label>
              <input
                type="number"
                placeholder="kg"
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-20 bg-[#061309] border border-[#1a3d22] rounded-lg px-2 py-1.5 text-white text-sm outline-none focus:border-[#4ade80] text-right"
              />
            </div>
          ))}
          <div>
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1">NOTES</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any observations about this collection..." className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#4ade80] resize-none placeholder-[#4b7a5a]" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-[#1a3d22] text-[#4b7a5a] rounded-xl py-2.5 text-sm">Cancel</button>
          <button
            onClick={() => {
              const organic = Number(form.organic) || 0;
              const plastic = Number(form.plastic) || 0;
              const paper = Number(form.paper) || 0;
              const metal = Number(form.metal) || 0;
              const glass = Number(form.glass) || 0;
              const hazardous = Number(form.hazardous) || 0;
              const residual = Number(form.residual) || 0;
              const total = organic + plastic + paper + metal + glass + hazardous + residual;
              onSave({ binId, organic, plastic, paper, metal, total: total || 25 });
              onClose();
            }}
            className="flex-1 bg-[#16a34a] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Save size={14} /> Save Data
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function WardAdminPanel({ wardId, onLogout }: WardAdminPanelProps) {
  const ward = getWardById(wardId) || wards[0];
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [updateBin, setUpdateBin] = useState<string | null>(null);
  const [expandedBin, setExpandedBin] = useState<string | null>(null);
  const [localBins, setLocalBins] = useState<Bin[]>(getBinsForWard(wardId));
  const [localTracks, setLocalTracks] = useState<Track[]>(getTracksForWard(wardId));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState([
    { bin: "B-013", organic: 18, plastic: 9, paper: 7, metal: 4, total: 42, time: "Today 10:30", done: true },
    { bin: "B-012", organic: 22, plastic: 11, paper: 6, metal: 5, total: 52, time: "Yesterday 15:00", done: true },
  ]);

  // Cash Withdrawals State
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [payoutSearch, setPayoutSearch] = useState("");
  const [activeVoucherModal, setActiveVoucherModal] = useState<WithdrawalItem | null>(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutReceipt, setPayoutReceipt] = useState<WithdrawalItem | null>(null);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");

  const fetchWardWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const data = await api.withdrawals.getAll({ wardId: String(wardId) });
      if (Array.isArray(data)) {
        setWithdrawals(data);
      }
    } catch {
      // Mock fallback
      setWithdrawals([
        {
          id: "wdr-demo-1",
          citizenId: "c-1",
          wardId: String(wardId),
          points: 500,
          amount: 100,
          pointRate: 0.20,
          status: "pending",
          verificationCode: "WDR-8921",
          createdAt: new Date().toISOString(),
          citizen: { id: "c-1", fullName: "Tanvir Ahmed", phone: "01712345678" },
        },
        {
          id: "wdr-demo-2",
          citizenId: "c-2",
          wardId: String(wardId),
          points: 1200,
          amount: 240,
          pointRate: 0.20,
          status: "paid",
          verificationCode: "WDR-3310",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          paidAt: new Date(Date.now() - 3600000).toISOString(),
          citizen: { id: "c-2", fullName: "Sadia Sultana", phone: "01898765432" },
        }
      ]);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    setLocalBins(getBinsForWard(wardId));
    setLocalTracks(getTracksForWard(wardId));
    fetchWardWithdrawals();
  }, [wardId]);

  const handleConfirmDisbursal = async (wdr: WithdrawalItem) => {
    setIsProcessingPayout(true);
    setPayoutError("");
    setPayoutSuccess("");
    try {
      const res = await api.withdrawals.process(wdr.id, "pay", voucherCodeInput);
      const updatedItem = (res as any)?.withdrawal || res || { ...wdr, status: "paid", paidAt: new Date().toISOString() };
      setWithdrawals(prev => prev.map(item => item.id === wdr.id ? { ...item, status: "paid", paidAt: new Date().toISOString() } : item));
      setPayoutReceipt(updatedItem);
      setActiveVoucherModal(null);
      setVoucherCodeInput("");
      setPayoutSuccess(`Successfully disbursed ৳${wdr.amount} cash to ${wdr.citizen?.fullName || "Citizen"}`);
    } catch (err: any) {
      setPayoutError(err?.message || "Failed to disburse cash. Check verification code.");
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleRejectPayout = async (wdr: WithdrawalItem) => {
    if (!confirm(`Reject claim ${wdr.verificationCode}? ${wdr.points} points will be refunded to the citizen.`)) return;
    try {
      await api.withdrawals.process(wdr.id, "reject");
      setWithdrawals(prev => prev.map(item => item.id === wdr.id ? { ...item, status: "rejected" } : item));
      setPayoutSuccess(`Claim rejected and ${wdr.points} points refunded to citizen.`);
    } catch (err: any) {
      alert("Failed to reject claim: " + (err?.message || "Network error"));
    }
  };

  const handleSaveWaste = (data: { binId: string; organic: number; plastic: number; paper: number; metal: number; total: number }) => {
    setRecentSubmissions(prev => [
      {
        bin: data.binId,
        organic: data.organic,
        plastic: data.plastic,
        paper: data.paper,
        metal: data.metal,
        total: data.total,
        time: "Just now",
        done: true,
      },
      ...prev,
    ]);
    setLocalBins(prev =>
      prev.map(b =>
        b.id === data.binId
          ? { ...b, lastCollected: "Just now", fill: 0, weight: 0, status: "normal" as const }
          : b
      )
    );
  };

  const criticalBins = localBins.filter(b => b.status === "critical" || b.status === "fire");
  const activeTracks = localTracks.filter(t => t.status === "active");

  const weeklyWard = [
    { day: "Mon", collected: 1.2 }, { day: "Tue", collected: 1.8 },
    { day: "Wed", collected: 1.4 }, { day: "Thu", collected: 2.1 },
    { day: "Fri", collected: 1.9 }, { day: "Sat", collected: 2.7 },
    { day: "Sun", collected: 0.9 },
  ];

  const filteredBins = localBins.filter(b =>
    b.id.toLowerCase().includes(search.toLowerCase()) ||
    b.location.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTracks = localTracks.filter(t =>
    t.truckId.toLowerCase().includes(search.toLowerCase()) ||
    t.driver.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen dark-theme overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-[#0a1f0e] border-r border-[#1a3d22] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-4 border-b border-[#1a3d22]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center"><Truck size={14} className="text-white" /></div>
            <div>
              <div className="font-display font-700 text-sm text-white">{ward.name}</div>
              <div className="text-[#60a5fa] text-xs font-mono">WARD SUB-ADMIN</div>
            </div>
          </div>
          <div className="text-[#4b7a5a] text-xs mt-1">{ward.area}</div>
          <div className="text-[#4b7a5a] text-xs">Councilor: {ward.councilor}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? "bg-[#16a34a] text-white" : "text-[#4b7a5a] hover:bg-[#0d2414] hover:text-[#86efac]"}`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
        {/* Ward restriction reminder */}
        <div className="p-3 mx-3 mb-2 bg-[#061309] border border-[#1a3d22] rounded-xl">
          <div className="text-[#4b7a5a] text-xs leading-relaxed">
            <span className="text-[#60a5fa] font-mono">SCOPE:</span> You can only view and manage <span className="text-[#4ade80] font-semibold">{ward.name}</span> data.
          </div>
        </div>
        <div className="p-4 border-t border-[#1a3d22]">
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={13} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-[#0a1f0e] border-b border-[#1a3d22] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#4b7a5a]"><Package size={18} /></button>
            <div>
              <div className="font-display font-700 text-white">{TABS.find(t => t.id === activeTab)?.label}</div>
              <div className="text-[#4b7a5a] text-xs font-mono">{ward.name} · {ward.area}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {criticalBins.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-1.5">
                <AlertTriangle size={12} className="text-red-400" />
                <span className="text-red-400 text-xs font-mono">{criticalBins.length} Critical</span>
              </div>
            )}
            <div className="w-8 h-8 bg-[#16a34a] rounded-full flex items-center justify-center text-xs font-bold text-white">
              {ward.subAdmin?.name[0] ?? "W"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* ── WARD OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Critical banner */}
              {criticalBins.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Flame size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-red-400 font-semibold text-sm mb-1">{criticalBins.length} bin(s) need immediate attention in your ward</div>
                    {criticalBins.map(b => (
                      <div key={b.id} className="text-red-300 text-xs">{b.id} — {b.location} ({b.fill}% full{b.fire ? ", FIRE" : ""})</div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab("bins")} className="text-xs text-red-400 hover:underline shrink-0">View bins</button>
                </div>
              )}

              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Bins",      value: localBins.length,   sub: `${criticalBins.length} critical`,     color: "#4ade80",  icon: Trash2 },
                  { label: "Active Tracks",   value: activeTracks.length, sub: `${localTracks.length} total`,        color: "#60a5fa",  icon: Truck },
                  { label: "Population",      value: (ward.population / 1000).toFixed(0) + "K", sub: ward.area,     color: "#facc15",  icon: MapPin },
                  { label: "Ward",            value: ward.name,           sub: `Councilor: ${ward.councilor}`,       color: "#a78bfa",  icon: Shield },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4 hover:border-[#4ade80]/30 transition-all">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: kpi.color + "22" }}>
                      <kpi.icon size={16} style={{ color: kpi.color }} />
                    </div>
                    <div className="font-display font-800 text-xl text-white mb-0.5">{kpi.value}</div>
                    <div className="text-xs font-mono" style={{ color: kpi.color }}>{kpi.label}</div>
                    <div className="text-[#4b7a5a] text-xs mt-0.5">{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                <div className="font-display font-600 text-white mb-4">{ward.name} — Weekly Collection (tons)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklyWard}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a3d22" />
                    <XAxis dataKey="day" stroke="#4b7a5a" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                    <YAxis stroke="#4b7a5a" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                    <Tooltip contentStyle={{ background: "#0d2414", border: "1px solid #1a3d22", borderRadius: 8, color: "#e2f5e9", fontSize: 12 }} />
                    <Bar dataKey="collected" fill="#4ade80" name="Collected (tons)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bins summary */}
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1a3d22] flex items-center justify-between">
                  <div className="font-display font-600 text-white">Bins in {ward.name}</div>
                  <button onClick={() => setActiveTab("bins")} className="text-xs text-[#4ade80] hover:underline">View all →</button>
                </div>
                <div className="divide-y divide-[#1a3d22]">
                  {localBins.map(b => (
                    <div key={b.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[#061309] transition-colors">
                      <span className="font-mono text-xs text-[#4ade80] w-12">{b.id}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#86efac] text-xs truncate">{b.location}</div>
                      </div>
                      <div className="w-20 bg-[#061309] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${b.fill}%`, background: b.fill > 80 ? "#ef4444" : b.fill > 60 ? "#f59e0b" : "#4ade80" }} />
                      </div>
                      <span className="font-mono text-xs w-8 text-right" style={{ color: b.fill > 80 ? "#ef4444" : b.fill > 60 ? "#f59e0b" : "#4ade80" }}>{b.fill}%</span>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CASH PAYOUTS (Ward Admin) ── */}
          {activeTab === "withdrawals" && (
            <div className="space-y-5">
              {payoutSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between text-green-400 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    <span>{payoutSuccess}</span>
                  </div>
                  <button onClick={() => setPayoutSuccess("")} className="text-green-300 hover:text-white text-xs font-mono">DISMISS</button>
                </div>
              )}

              {payoutError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} />
                    <span>{payoutError}</span>
                  </div>
                  <button onClick={() => setPayoutError("")} className="text-red-300 hover:text-white text-xs font-mono">DISMISS</button>
                </div>
              )}

              {/* Header Info */}
              <div className="bg-gradient-to-r from-[#0d2414] to-[#081b0f] border border-[#1a3d22] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Banknote className="text-[#4ade80]" size={22} />
                    <h2 className="font-display font-bold text-lg text-white">Ward Cash Disbursal Office</h2>
                    <span className="bg-[#16a34a]/20 text-[#4ade80] text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
                      {ward.name}
                    </span>
                  </div>
                  <p className="text-[#86efac] text-xs mt-1">
                    Citizens can bring their recycling reward vouchers here to collect cash in person.
                  </p>
                </div>
                <button
                  onClick={fetchWardWithdrawals}
                  disabled={loadingWithdrawals}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1a3d22] bg-[#061309] text-xs text-[#86efac] hover:text-white hover:border-[#4ade80] transition-colors"
                >
                  <RefreshCw size={12} className={loadingWithdrawals ? "animate-spin" : ""} />
                  <span>Refresh Claims</span>
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#86efac] font-mono">PENDING CASH CLAIMS</span>
                    <Clock size={16} className="text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold font-display text-yellow-400">
                    ৳{withdrawals.filter(w => w.status === "pending").reduce((sum, w) => sum + Number(w.amount || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-[#4b7a5a] mt-1">
                    {withdrawals.filter(w => w.status === "pending").length} citizens awaiting payout
                  </div>
                </div>

                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#86efac] font-mono">CASH DISBURSED</span>
                    <CheckCircle2 size={16} className="text-[#4ade80]" />
                  </div>
                  <div className="text-2xl font-bold font-display text-[#4ade80]">
                    ৳{withdrawals.filter(w => w.status === "paid").reduce((sum, w) => sum + Number(w.amount || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-[#4b7a5a] mt-1">
                    {withdrawals.filter(w => w.status === "paid").length} completed cash payouts
                  </div>
                </div>

                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#86efac] font-mono">POINTS REDEEMED</span>
                    <Package size={16} className="text-[#60a5fa]" />
                  </div>
                  <div className="text-2xl font-bold font-display text-[#60a5fa]">
                    {withdrawals.reduce((sum, w) => sum + (w.points || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-[#4b7a5a] mt-1">
                    Total recycling points converted to BDT
                  </div>
                </div>
              </div>

              {/* Claims Search & Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d2414] border border-[#1a3d22] rounded-xl p-3">
                <div className="relative flex-1 min-w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                  <input
                    value={payoutSearch}
                    onChange={e => setPayoutSearch(e.target.value)}
                    placeholder="Search voucher code (e.g. WDR-), citizen name, or phone..."
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#4b7a5a] focus:border-[#4ade80] outline-none"
                  />
                </div>
                <div className="text-xs font-mono text-[#86efac]">
                  Total {withdrawals.length} vouchers recorded
                </div>
              </div>

              {/* Claims List Table */}
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1a3d22] bg-[#061309] text-[#86efac] font-mono uppercase">
                        <th className="py-3 px-4">Voucher Code</th>
                        <th className="py-3 px-4">Citizen</th>
                        <th className="py-3 px-4">Points</th>
                        <th className="py-3 px-4">Cash (BDT)</th>
                        <th className="py-3 px-4">Claimed At</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a3d22]/50 text-white">
                      {withdrawals
                        .filter(w => {
                          const q = payoutSearch.toLowerCase();
                          return (
                            !q ||
                            w.verificationCode?.toLowerCase().includes(q) ||
                            w.citizen?.fullName?.toLowerCase().includes(q) ||
                            w.citizen?.phone?.toLowerCase().includes(q)
                          );
                        })
                        .map(item => {
                          const isPending = item.status === "pending";
                          const isPaid = item.status === "paid";
                          const isRejected = item.status === "rejected";

                          return (
                            <tr key={item.id} className="hover:bg-[#061309]/60 transition-colors">
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold bg-[#1a3d22] text-[#4ade80] px-2.5 py-1 rounded border border-[#4ade80]/30 tracking-wider">
                                  {item.verificationCode}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-white">{item.citizen?.fullName || "Citizen"}</div>
                                <div className="text-[#86efac] text-[11px] font-mono">{item.citizen?.phone || "No phone"}</div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[#60a5fa]">
                                {item.points.toLocaleString()} pts
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-display font-bold text-sm text-[#4ade80]">
                                  ৳{Number(item.amount).toFixed(2)}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-[#86efac] font-mono text-[11px]">
                                {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="py-3.5 px-4">
                                {isPending && (
                                  <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold">
                                    PENDING
                                  </span>
                                )}
                                {isPaid && (
                                  <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold flex items-center gap-1 w-max">
                                    <CheckCircle2 size={10} /> PAID
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold">
                                    REJECTED
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {isPending ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setActiveVoucherModal(item);
                                        setVoucherCodeInput(item.verificationCode); // prefill or leave to verify
                                        setPayoutError("");
                                      }}
                                      className="bg-[#16a34a] hover:bg-[#15803d] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
                                    >
                                      <Banknote size={14} /> Pay Cash
                                    </button>
                                    <button
                                      onClick={() => handleRejectPayout(item)}
                                      className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                                      title="Reject claim & refund points"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : isPaid ? (
                                  <button
                                    onClick={() => setPayoutReceipt(item)}
                                    className="border border-[#1a3d22] bg-[#061309] hover:border-[#4ade80] text-[#86efac] hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ml-auto transition-colors"
                                  >
                                    <ExternalLink size={12} /> Receipt
                                  </button>
                                ) : (
                                  <span className="text-[#4b7a5a] text-[11px] font-mono">Refunded</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      {withdrawals.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#4b7a5a]">
                            <Banknote size={36} className="mx-auto mb-2 opacity-40 text-[#4ade80]" />
                            <p className="font-semibold text-white">No withdrawal claims yet for {ward.name}</p>
                            <p className="text-xs text-[#86efac] mt-1">When citizens in this ward redeem points for cash, their claims will appear here.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── MY BINS ── */}
          {activeTab === "bins" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                  <input onChange={e => setSearch(e.target.value)} className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4b7a5a] focus:border-[#4ade80] outline-none" placeholder="Search bin ID or location..." />
                </div>
                <div className="text-xs text-[#4b7a5a] font-mono">{localBins.length} bins in {ward.name}</div>
              </div>

              <div className="space-y-3">
                {filteredBins.map(bin => (
                  <div key={bin.id} className={`bg-[#0d2414] border rounded-xl overflow-hidden transition-all ${bin.status === "fire" ? "border-red-500/50" : bin.status === "critical" ? "border-orange-500/40" : bin.status === "warning" ? "border-yellow-500/30" : "border-[#1a3d22]"}`}>
                    <div
                      className="flex flex-wrap items-center gap-4 p-5 cursor-pointer"
                      onClick={() => setExpandedBin(expandedBin === bin.id ? null : bin.id)}
                    >
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bin.status === "fire" ? "#ef444422" : bin.status === "critical" ? "#f59e0b22" : bin.status === "warning" ? "#facc1522" : "#4ade8022" }}>
                        <Trash2 size={18} style={{ color: bin.status === "fire" ? "#ef4444" : bin.status === "critical" ? "#f59e0b" : bin.status === "warning" ? "#facc15" : "#4ade80" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-mono font-bold text-white text-sm">{bin.id}</span>
                          <StatusBadge status={bin.status} />
                          {bin.fire && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">🔥 FIRE</span>}
                        </div>
                        <div className="flex items-center gap-1.5 text-[#4b7a5a] text-xs">
                          <MapPin size={10} />
                          <span className="truncate">{bin.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="w-28 bg-[#061309] rounded-full h-2 mb-1">
                            <div className="h-2 rounded-full" style={{ width: `${bin.fill}%`, background: bin.fill > 80 ? "#ef4444" : bin.fill > 60 ? "#f59e0b" : "#4ade80" }} />
                          </div>
                          <div className="font-mono text-xs text-right" style={{ color: bin.fill > 80 ? "#ef4444" : bin.fill > 60 ? "#f59e0b" : "#4ade80" }}>{bin.fill}%</div>
                        </div>
                        {expandedBin === bin.id ? <ChevronUp size={14} className="text-[#4b7a5a]" /> : <ChevronDown size={14} className="text-[#4b7a5a]" />}
                      </div>
                    </div>

                    {expandedBin === bin.id && (
                      <div className="border-t border-[#1a3d22] p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
                          {[
                            { label: "Bin ID", value: bin.id },
                            { label: "Capacity", value: bin.capacity },
                            { label: "Weight", value: `${bin.weight} kg` },
                            { label: "Fill Level", value: `${bin.fill}%` },
                            { label: "Temperature", value: bin.temp, alert: bin.temp !== "Normal" },
                            { label: "Gas / Odor", value: bin.gas, alert: bin.gas !== "Normal" },
                            { label: "Fire / Smoke", value: bin.fire ? "⚠ DETECTED" : "Clear", alert: bin.fire },
                            { label: "Last Collected", value: bin.lastCollected },
                            { label: "QR Code", value: bin.qr },
                            { label: "Coordinates", value: `${bin.lat}°N, ${bin.lng}°E` },
                          ].map(d => (
                            <div key={d.label} className="bg-[#061309] rounded-lg p-2.5">
                              <div className="text-[#4b7a5a] text-xs mb-0.5">{d.label}</div>
                              <div className={`font-mono text-xs font-semibold ${(d as any).alert ? "text-red-400" : "text-[#86efac]"}`}>{d.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setUpdateBin(bin.id)} className="bg-[#16a34a] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#15803d] flex items-center gap-1.5">
                            <Package size={12} /> Update Waste Data
                          </button>
                          <a href={`https://maps.google.com/?q=${bin.lat},${bin.lng}`} target="_blank" rel="noreferrer" className="border border-blue-500/40 text-[#60a5fa] text-xs px-4 py-2 rounded-lg hover:bg-blue-500/10 flex items-center gap-1.5">
                            <Navigation size={12} /> View on Map
                          </a>
                          <button className="border border-[#1a3d22] text-[#86efac] text-xs px-4 py-2 rounded-lg hover:border-[#4ade80]/30 flex items-center gap-1.5">
                            <Clock size={12} /> View History
                          </button>
                          <button className="border border-[#1a3d22] text-[#86efac] text-xs px-4 py-2 rounded-lg hover:border-[#4ade80]/30 flex items-center gap-1.5">
                            <RefreshCw size={12} /> Request Collection
                          </button>
                          {bin.status === "fire" || bin.status === "critical" ? (
                            <button className="border border-red-500/40 text-red-400 text-xs px-4 py-2 rounded-lg hover:bg-red-500/10 flex items-center gap-1.5">
                              <Flame size={12} /> Alert Hazmat
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MY TRACKS ── */}
          {activeTab === "tracks" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                  <input onChange={e => setSearch(e.target.value)} className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4b7a5a] focus:border-[#4ade80] outline-none" placeholder="Search truck or driver..." />
                </div>
                <button onClick={() => setShowAddTrack(true)} className="bg-[#16a34a] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#15803d] flex items-center gap-2">
                  <Plus size={14} /> Add Track
                </button>
              </div>

              {/* Ward-scope notice */}
              <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-3 flex items-start gap-2">
                <Shield size={13} className="text-[#60a5fa] mt-0.5 shrink-0" />
                <div className="text-xs text-[#4b7a5a]">You can add tracks for <span className="text-[#4ade80] font-mono">{ward.name}</span> only. Trucks from other wards are managed by the City Corporation Account.</div>
              </div>

              <div className="space-y-3">
                {filteredTracks.length === 0 && (
                  <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-8 text-center">
                    <Truck size={32} className="text-[#4b7a5a] mx-auto mb-3" />
                    <div className="text-white font-display font-600">No tracks assigned yet</div>
                    <div className="text-[#4b7a5a] text-sm mb-4">Add a collection truck route for your ward</div>
                    <button onClick={() => setShowAddTrack(true)} className="bg-[#16a34a] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#15803d] flex items-center gap-2 mx-auto">
                      <Plus size={14} /> Add First Track
                    </button>
                  </div>
                )}
                {filteredTracks.map(t => (
                  <div key={t.id} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 hover:border-[#4ade80]/30 transition-all">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.status === "active" ? "#4ade8022" : t.status === "idle" ? "#facc1522" : "#f59e0b22" }}>
                        <Truck size={20} style={{ color: t.status === "active" ? "#4ade80" : t.status === "idle" ? "#facc15" : "#f59e0b" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-bold text-white">{t.truckId}</span>
                          <StatusBadge status={t.status} />
                        </div>
                        <div className="text-[#86efac] text-sm font-medium">{t.driver}</div>
                        <div className="text-[#4b7a5a] text-xs">{t.phone}</div>
                        <div className="text-[#4b7a5a] text-xs mt-0.5 truncate">{t.route}</div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Progress</div>
                          <div className="w-24 bg-[#061309] rounded-full h-1.5 mb-1">
                            <div className="h-1.5 rounded-full bg-[#4ade80]" style={{ width: `${t.progress}%` }} />
                          </div>
                          <div className="font-mono text-[#4ade80]">{t.progress}% ({t.stops} stops)</div>
                        </div>
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Load</div>
                          <div className="font-mono text-[#86efac]">{t.load}</div>
                        </div>
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Fuel</div>
                          <div className="font-mono" style={{ color: t.fuel < 40 ? "#ef4444" : t.fuel < 60 ? "#f59e0b" : "#4ade80" }}>{t.fuel}%</div>
                        </div>
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Start Time</div>
                          <div className="font-mono text-[#86efac]">{t.startTime}</div>
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

          {/* ── WASTE DATA ── */}
          {activeTab === "waste" && (
            <div className="space-y-4">
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4">
                <div className="text-[#4ade80] font-mono text-xs mb-1">WARD WASTE INFORMATION — {ward.area.toUpperCase()}</div>
                <div className="text-[#4b7a5a] text-sm">Update waste collection data after each pickup. This feeds the city-wide analytics and compliance reports.</div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "This Month Collected", value: "42.7 tons", color: "#4ade80" },
                  { label: "Avg per Collection", value: "1.8 tons", color: "#60a5fa" },
                  { label: "Recycling Rate (est.)", value: "64%", color: "#facc15" },
                ].map(k => (
                  <div key={k.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4 text-center">
                    <div className="font-mono text-2xl font-bold mb-1" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-[#4b7a5a] text-xs">{k.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                <div className="font-display font-600 text-white mb-4">Update Waste Data per Bin</div>
                <div className="space-y-3">
                  {localBins.map(b => (
                    <div key={b.id} className="flex items-center gap-4 p-3 bg-[#061309] rounded-xl border border-[#1a3d22] hover:border-[#4ade80]/30 transition-all">
                      <span className="font-mono text-xs text-[#4ade80] w-12 shrink-0">{b.id}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#86efac] text-xs truncate">{b.location}</div>
                        <div className="text-[#4b7a5a] text-xs">Last: {b.lastCollected}</div>
                      </div>
                      <StatusBadge status={b.status} />
                      <button onClick={() => setUpdateBin(b.id)} className="bg-[#16a34a] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#15803d] flex items-center gap-1 whitespace-nowrap shrink-0">
                        <Edit3 size={11} /> Update
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                <div className="font-display font-600 text-white mb-4">Recent Waste Submissions</div>
                <div className="space-y-3">
                  {recentSubmissions.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#061309] rounded-xl border border-[#1a3d22]">
                      <CheckCircle size={14} className="text-[#4ade80] mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-[#4ade80]">{r.bin}</span>
                          <span className="text-[#4b7a5a] text-xs font-mono">{r.time}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-[#4b7a5a]">Organic: <span className="text-[#86efac]">{r.organic}kg</span></span>
                          <span className="text-[#4b7a5a]">Plastic: <span className="text-[#86efac]">{r.plastic}kg</span></span>
                          <span className="text-[#4b7a5a]">Paper: <span className="text-[#86efac]">{r.paper}kg</span></span>
                          <span className="text-[#4b7a5a]">Metal: <span className="text-[#86efac]">{r.metal}kg</span></span>
                          <span className="text-[#4b7a5a]">Total: <span className="text-[#4ade80] font-mono font-bold">{r.total}kg</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ALERTS (Ward-only) ── */}
          {activeTab === "alerts" && (
            <div className="space-y-3">
              <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-3 text-xs text-[#4b7a5a]">
                Showing alerts for <span className="text-[#4ade80] font-mono">{ward.name}</span> only.
              </div>
              {localBins.filter(b => b.status !== "normal").map(b => (
                <div key={b.id} className={`bg-[#0d2414] border rounded-xl p-4 flex items-start gap-3 ${b.status === "fire" ? "border-red-500/40" : b.status === "critical" ? "border-orange-500/30" : "border-yellow-500/20"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${b.status === "fire" ? "bg-red-500/20" : "bg-orange-500/20"}`}>
                    {b.fire ? <Flame size={16} className="text-red-400" /> : <AlertTriangle size={16} className="text-orange-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-semibold mb-0.5">{b.id} — {b.location}</div>
                    <div className="text-[#4b7a5a] text-xs">
                      Fill: {b.fill}% · Weight: {b.weight}kg · Temp: {b.temp} · Gas: {b.gas}{b.fire ? " · 🔥 FIRE DETECTED" : ""}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
              {localBins.filter(b => b.status !== "normal").length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle size={40} className="text-[#4ade80] mx-auto mb-3" />
                  <div className="text-white font-display font-600">All bins are normal in {ward.name}</div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showAddTrack && <AddTrackModal wardId={wardId} onClose={() => setShowAddTrack(false)} onAdd={t => setLocalTracks(p => [...p, { ...t, id: `TR-${String(Date.now()).slice(-4)}` } as Track])} />}
      {editTrack && <EditTrackModal track={editTrack} onClose={() => setEditTrack(null)} onSave={updated => setLocalTracks(p => p.map(x => x.id === updated.id ? updated : x))} />}
      {updateBin && <UpdateWasteModal binId={updateBin} onClose={() => setUpdateBin(null)} onSave={handleSaveWaste} />}

      {/* ── Cash Handover & Voucher Verification Modal ── */}
      {activeVoucherModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setActiveVoucherModal(null)}
              className="absolute top-4 right-4 text-[#4b7a5a] hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#16a34a]/20 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80]">
                <Banknote size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base">Disburse Cash to Citizen</h3>
                <div className="text-xs text-[#86efac]">{ward.name} Disbursal Counter</div>
              </div>
            </div>

            {payoutError && (
              <div className="mb-4 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl p-3 text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{payoutError}</span>
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b7a5a]">Citizen Name:</span>
                  <span className="text-white font-semibold">{activeVoucherModal.citizen?.fullName || "Citizen"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b7a5a]">Phone Number:</span>
                  <span className="text-[#86efac] font-mono">{activeVoucherModal.citizen?.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b7a5a]">Points Redeemed:</span>
                  <span className="text-[#60a5fa] font-mono font-bold">{activeVoucherModal.points.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4b7a5a]">Rate Applied:</span>
                  <span className="text-[#4b7a5a] font-mono">৳{activeVoucherModal.pointRate || 0.20} / pt</span>
                </div>
              </div>

              {/* Cash Amount Highlight */}
              <div className="bg-gradient-to-r from-[#16a34a]/20 to-[#0d2414] border border-[#4ade80]/40 rounded-xl p-4 text-center">
                <span className="text-[11px] font-mono text-[#86efac] uppercase tracking-wider block">
                  CASH AMOUNT TO HAND OVER
                </span>
                <span className="font-display font-black text-3xl text-[#4ade80] tracking-tight mt-0.5 block">
                  ৳{Number(activeVoucherModal.amount).toFixed(2)} BDT
                </span>
              </div>

              {/* Verification Code Input */}
              <div>
                <label className="block text-xs font-mono text-[#86efac] mb-1.5">
                  VERIFY CITIZEN VOUCHER CODE
                </label>
                <div className="relative">
                  <input
                    value={voucherCodeInput}
                    onChange={e => setVoucherCodeInput(e.target.value.toUpperCase())}
                    placeholder="WDR-XXXX"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-center font-mono text-base font-bold text-white tracking-widest focus:border-[#4ade80] outline-none"
                  />
                </div>
                <p className="text-[11px] text-[#4b7a5a] mt-1 text-center">
                  Voucher code shown on citizen's mobile portal screen
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveVoucherModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#1a3d22] text-[#86efac] hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDisbursal(activeVoucherModal)}
                disabled={isProcessingPayout}
                className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                {isProcessingPayout ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>Confirm Cash Payout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Official Cash Payout Receipt Modal ── */}
      {payoutReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d2414] border border-[#4ade80]/40 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setPayoutReceipt(null)}
              className="absolute top-4 right-4 text-[#4b7a5a] hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="text-center pb-4 border-b border-[#1a3d22]">
              <div className="w-12 h-12 bg-[#16a34a]/20 border border-[#4ade80]/40 rounded-full flex items-center justify-center text-[#4ade80] mx-auto mb-2">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-display font-black text-white text-base">INTELLIWASTE OFFICIAL RECEIPT</h3>
              <p className="text-xs text-[#86efac] font-mono mt-0.5">CITIZEN CASH DISBURSAL</p>
            </div>

            <div className="py-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#1a3d22]/50">
                <span className="text-[#4b7a5a]">VOUCHER NO:</span>
                <span className="text-[#4ade80] font-bold">{payoutReceipt.verificationCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a3d22]/50">
                <span className="text-[#4b7a5a]">WARD OFFICE:</span>
                <span className="text-white">{ward.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a3d22]/50">
                <span className="text-[#4b7a5a]">CITIZEN:</span>
                <span className="text-white font-semibold">{payoutReceipt.citizen?.fullName || "Citizen"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a3d22]/50">
                <span className="text-[#4b7a5a]">PHONE:</span>
                <span className="text-white">{payoutReceipt.citizen?.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1a3d22]/50">
                <span className="text-[#4b7a5a]">POINTS REDEEMED:</span>
                <span className="text-[#60a5fa]">{payoutReceipt.points} PTS</span>
              </div>
              <div className="flex justify-between py-2 bg-[#061309] px-3 rounded-lg border border-[#1a3d22]">
                <span className="text-[#86efac] font-bold">CASH DISBURSED:</span>
                <span className="text-[#4ade80] font-bold text-sm">৳{Number(payoutReceipt.amount).toFixed(2)} BDT</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#4b7a5a]">DISBURSAL TIME:</span>
                <span className="text-[#86efac]">
                  {payoutReceipt.paidAt ? new Date(payoutReceipt.paidAt).toLocaleString() : new Date().toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#4b7a5a]">STATUS:</span>
                <span className="text-[#4ade80] font-bold">VERIFIED & PAID IN CASH</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-[#4ade80]/40 bg-[#061309] hover:bg-[#16a34a]/20 text-[#86efac] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download size={14} /> Print Receipt
              </button>
              <button
                onClick={() => setPayoutReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
