import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Trash2, Truck, AlertTriangle, CheckCircle, Map, BarChart2, Settings,
  Bell, Zap, Thermometer, Wind, Flame, Battery, RefreshCw, Eye,
  TrendingUp, TrendingDown, Package, Users, Globe, Shield, Search,
  ChevronRight, X, Filter, Download, MapPin
} from "lucide-react";

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

import { bins as fallbackBins, tracks as fallbackTracks } from "../data/cityData";

const bins = fallbackBins.map(b => ({
  id: b.id,
  fill: b.fill,
  weight: b.weight,
  temp: b.temp,
  gas: b.gas,
  status: b.status,
  loc: b.area,
  capacity: b.capacity,
  lat: b.lat,
  lng: b.lng
}));

const trucks = fallbackTracks.map(t => ({
  id: t.truckId,
  driver: t.driver,
  status: t.status,
  route: t.route,
  progress: t.progress,
  load: t.load,
  fuel: t.fuel,
  bins: t.stops
}));

const weeklyData = [
  { day: "Mon", collected: 3.2, sorted: 2.8, recycled: 1.9 },
  { day: "Tue", collected: 4.1, sorted: 3.6, recycled: 2.4 },
  { day: "Wed", collected: 3.8, sorted: 3.2, recycled: 2.1 },
  { day: "Thu", collected: 5.2, sorted: 4.7, recycled: 3.2 },
  { day: "Fri", collected: 4.9, sorted: 4.3, recycled: 2.9 },
  { day: "Sat", collected: 6.1, sorted: 5.5, recycled: 3.8 },
  { day: "Sun", collected: 2.8, sorted: 2.4, recycled: 1.6 },
];

const wasteBreakdown = [
  { name: "Organic", value: 32, color: "#4ade80" },
  { name: "Plastic", value: 22, color: "#60a5fa" },
  { name: "Paper", value: 15, color: "#fde68a" },
  { name: "Metal", value: 11, color: "#94a3b8" },
  { name: "Glass", value: 8, color: "#7dd3fc" },
  { name: "Hazardous", value: 5, color: "#fca5a5" },
  { name: "Other", value: 7, color: "#9ca3af" },
];

const hourlyFill = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  avg: Math.floor(30 + Math.sin(i / 3) * 25 + Math.random() * 10),
}));

const alerts = [
  { id: 1, type: "fire", msg: "Bin B-204 — Smoke/Fire detected in Old Dhaka", time: "2 min ago", priority: "critical" },
  { id: 2, type: "overflow", msg: "Bin B-218 — Fill level 92% in Gulshan-2", time: "8 min ago", priority: "critical" },
  { id: 3, type: "overflow", msg: "Bin B-102 — Fill level 87% in Mirpur-10", time: "14 min ago", priority: "high" },
  { id: 4, type: "gas", msg: "Bin B-218 — Elevated methane detected", time: "22 min ago", priority: "high" },
  { id: 5, type: "maintenance", msg: "Truck T-04 — Scheduled maintenance overdue", time: "1 hr ago", priority: "medium" },
];

const SIDEBAR = [
  { id: "overview", icon: BarChart2, label: "Overview" },
  { id: "bins", icon: Trash2, label: "Bin Monitor" },
  { id: "fleet", icon: Truck, label: "Fleet GPS" },
  { id: "analytics", icon: TrendingUp, label: "Analytics" },
  { id: "alerts", icon: Bell, label: "Alerts", badge: 5 },
  { id: "compliance", icon: Shield, label: "Compliance" },
  { id: "sorting", icon: Package, label: "Sorting Machine" },
];

const MapDot = ({ x, pct, color, id }: { x: number; pct: number; color: string; id: string }) => (
  <div
    className="absolute flex flex-col items-center group cursor-pointer"
    style={{ left: `${x}%`, top: `${35 + (x % 30)}%`, transform: "translate(-50%, -50%)" }}
  >
    <div className="relative">
      <div className="w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style={{ background: color }}>
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>
      {pct > 80 && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 pulse-green" />}
    </div>
    <div className="hidden group-hover:block absolute bottom-7 bg-[#0d2414] border border-[#1a3d22] rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap z-10 shadow-xl">
      <div className="font-mono font-bold">{id}</div>
      <div>Fill: {pct}%</div>
    </div>
  </div>
);

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));
  const criticalBins = bins.filter(b => b.status === "critical" || b.status === "fire");

  return (
    <div className="flex h-screen dark-theme overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a1f0e] border-r border-[#1a3d22] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-4 border-b border-[#1a3d22] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center">
              <Trash2 size={15} className="text-white" />
            </div>
            <div>
              <div className="font-display font-700 text-sm text-white">IntelliWaste</div>
              <div className="text-[#4b7a5a] text-xs">Admin Dashboard</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#4b7a5a] hover:text-white">
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDEBAR.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? "bg-[#16a34a] text-white" : "text-[#4b7a5a] hover:bg-[#0d2414] hover:text-[#86efac]"}`}
            >
              <item.icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#1a3d22]">
          <button onClick={() => onNavigate("landing")} className="w-full text-xs text-[#4b7a5a] hover:text-[#86efac] transition-colors flex items-center gap-2">
            <Globe size={12} />
            Back to Landing Page
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-[#0a1f0e] border-b border-[#1a3d22] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#4b7a5a] hover:text-white">
              <Filter size={18} />
            </button>
            <div>
              <div className="font-display font-700 text-white capitalize">{activeTab === "overview" ? "System Overview" : SIDEBAR.find(s => s.id === activeTab)?.label}</div>
              <div className="text-[#4b7a5a] text-xs font-mono">Updated: {lastUpdated.toLocaleTimeString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {visibleAlerts.filter(a => a.priority === "critical").length > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-1.5">
                <AlertTriangle size={13} className="text-red-400" />
                <span className="text-red-400 text-xs font-mono">{visibleAlerts.filter(a => a.priority === "critical").length} Critical</span>
              </div>
            )}
            <button onClick={() => setLastUpdated(new Date())} className="text-[#4b7a5a] hover:text-[#4ade80] transition-colors p-2">
              <RefreshCw size={16} />
            </button>
            <div className="w-8 h-8 bg-[#16a34a] rounded-full flex items-center justify-center text-xs font-bold text-white">A</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Critical alerts banner */}
              {visibleAlerts.filter(a => a.priority === "critical").length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Flame size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-red-400 font-semibold text-sm mb-1">Active Alerts</div>
                    {visibleAlerts.filter(a => a.priority === "critical").slice(0, 2).map(a => (
                      <div key={a.id} className="text-red-300 text-xs">{a.msg}</div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab("alerts")} className="text-xs text-red-400 hover:underline shrink-0">View all</button>
                </div>
              )}

              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Active Trucks", value: "3/5", sub: "2 offline", icon: Truck, color: "#4ade80", trend: "up" },
                  { label: "Critical Bins", value: criticalBins.length.toString(), sub: "Needs immediate pickup", icon: AlertTriangle, color: "#ef4444", trend: "up" },
                  { label: "Sorted Today", value: "4.2t", sub: "↑ 12% vs yesterday", icon: Package, color: "#60a5fa", trend: "up" },
                  { label: "Carbon Saved", value: "62 kg", sub: "CO₂ equivalent", icon: Wind, color: "#a78bfa", trend: "up" },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 hover:border-[#4ade80]/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: kpi.color + "22" }}>
                        <kpi.icon size={18} style={{ color: kpi.color }} />
                      </div>
                      {kpi.trend === "up" ? <TrendingUp size={14} className="text-[#4ade80]" /> : <TrendingDown size={14} className="text-red-400" />}
                    </div>
                    <div className="font-display font-800 text-2xl text-white mb-1">{kpi.value}</div>
                    <div className="text-[#4ade80] text-xs font-mono">{kpi.label}</div>
                    <div className="text-[#4b7a5a] text-xs mt-0.5">{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Weekly collection */}
                <div className="lg:col-span-2 bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-display font-600 text-white">Weekly Waste Collection (tons)</div>
                    <button className="text-[#4b7a5a] hover:text-[#86efac]"><Download size={14} /></button>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a3d22" />
                      <XAxis dataKey="day" stroke="#4b7a5a" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <YAxis stroke="#4b7a5a" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <Tooltip contentStyle={{ background: "#0d2414", border: "1px solid #1a3d22", borderRadius: 8, color: "#e2f5e9", fontSize: 12 }} />
                      <Area type="monotone" dataKey="collected" stroke="#4ade80" fill="url(#colGrad)" strokeWidth={2} name="Collected" />
                      <Area type="monotone" dataKey="recycled" stroke="#60a5fa" fill="url(#recGrad)" strokeWidth={2} name="Recycled" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Waste breakdown */}
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="font-display font-600 text-white mb-1">Sorting Machine Output</div>
                  <div className="text-[#4b7a5a] text-xs mb-3">Categories after facility sorting</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={wasteBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                        {wasteBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0d2414", border: "1px solid #1a3d22", borderRadius: 8, color: "#e2f5e9", fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {wasteBreakdown.map(w => (
                      <div key={w.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: w.color }} />
                        <span className="text-[#4b7a5a] text-xs">{w.name} {w.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live map placeholder */}
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1a3d22] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map size={16} className="text-[#4ade80]" />
                    <span className="font-display font-600 text-white">Live Fleet & Bin Map — Dhaka City</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full pulse-green" />
                    <span className="text-[#4ade80] font-mono text-xs">LIVE</span>
                  </div>
                </div>
                <div className="relative h-72 map-grid bg-[#061309]">
                  {/* Simulated map pins */}
                  {bins.map((bin, i) => (
                    <MapDot
                      key={bin.id}
                      x={10 + (i * 11)}
                      pct={bin.fill}
                      id={bin.id}
                      color={bin.status === "fire" ? "#ef4444" : bin.status === "critical" ? "#f59e0b" : bin.status === "warning" ? "#facc15" : "#4ade80"}
                    />
                  ))}
                  {/* Truck icons */}
                  {trucks.filter(t => t.status === "active").map((truck, i) => (
                    <div key={truck.id} className="absolute group cursor-pointer" style={{ left: `${20 + i * 20}%`, top: `${50 + i * 8}%`, transform: "translate(-50%, -50%)" }}>
                      <div className="w-7 h-7 bg-[#60a5fa] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <Truck size={12} className="text-white" />
                      </div>
                      <div className="hidden group-hover:block absolute bottom-8 bg-[#0d2414] border border-[#1a3d22] rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap z-10">
                        <div className="font-mono font-bold">{truck.id}</div>
                        <div>{truck.driver}</div>
                        <div>{truck.route}</div>
                      </div>
                    </div>
                  ))}

                  {/* Legend */}
                  <div className="absolute bottom-3 left-3 bg-[#0d2414]/90 border border-[#1a3d22] rounded-lg p-3 flex gap-4 flex-wrap">
                    {[
                      { color: "#4ade80", label: "Normal" },
                      { color: "#facc15", label: "Warning" },
                      { color: "#f59e0b", label: "Critical" },
                      { color: "#ef4444", label: "Fire/Hazard" },
                      { color: "#60a5fa", label: "Truck" },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                        <span className="text-[#4b7a5a] text-xs">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bin Monitor */}
          {activeTab === "bins" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                  <input className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4b7a5a] focus:border-[#4ade80] outline-none" placeholder="Search bins..." />
                </div>
                <select className="bg-[#0d2414] border border-[#1a3d22] rounded-lg px-3 py-2 text-sm text-[#86efac] outline-none">
                  <option>All Status</option>
                  <option>Critical</option>
                  <option>Warning</option>
                  <option>Normal</option>
                </select>
              </div>

              <div className="grid gap-4">
                {bins.map(bin => (
                  <div
                    key={bin.id}
                    className={`bg-[#0d2414] border rounded-xl p-5 cursor-pointer transition-all hover:border-[#4ade80]/40 ${selectedBin === bin.id ? "border-[#4ade80]" : "border-[#1a3d22]"}`}
                    onClick={() => setSelectedBin(selectedBin === bin.id ? null : bin.id)}
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                        background: bin.status === "fire" ? "#ef444422" : bin.status === "critical" ? "#f59e0b22" : bin.status === "warning" ? "#facc1522" : "#4ade8022"
                      }}>
                        <Trash2 size={20} style={{
                          color: bin.status === "fire" ? "#ef4444" : bin.status === "critical" ? "#f59e0b" : bin.status === "warning" ? "#facc15" : "#4ade80"
                        }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-bold text-white">{bin.id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${bin.status === "fire" ? "bg-red-500/20 text-red-400" :
                              bin.status === "critical" ? "bg-orange-500/20 text-orange-400" :
                                bin.status === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                                  "bg-green-500/20 text-green-400"
                            }`}>{bin.status.toUpperCase()}</span>
                          <span className="text-xs bg-[#1a3d22] text-[#4ade80] px-2 py-0.5 rounded-full font-mono">Smart Bin</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#4b7a5a]">
                          <MapPin size={10} />
                          <span>{bin.loc}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <div className="text-[#4b7a5a] text-xs mb-1">Fill Level</div>
                          <div className="w-32 bg-[#061309] rounded-full h-2 mb-1">
                            <div className="h-2 rounded-full" style={{
                              width: `${bin.fill}%`,
                              background: bin.fill > 80 ? "#ef4444" : bin.fill > 60 ? "#f59e0b" : "#4ade80"
                            }} />
                          </div>
                          <div className="font-mono text-xs" style={{ color: bin.fill > 80 ? "#ef4444" : bin.fill > 60 ? "#f59e0b" : "#4ade80" }}>{bin.fill}%</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="text-[#4b7a5a]">Weight: </span><span className="font-mono text-[#86efac]">{bin.weight} kg</span></div>
                          <div><span className="text-[#4b7a5a]">Temp: </span><span className={`font-mono ${bin.temp !== "Normal" ? "text-red-400" : "text-[#86efac]"}`}>{bin.temp}</span></div>
                          <div><span className="text-[#4b7a5a]">Gas: </span><span className={`font-mono ${bin.gas !== "Normal" ? "text-red-400" : "text-[#86efac]"}`}>{bin.gas}</span></div>
                          <div><span className="text-[#4b7a5a]">Fire: </span><span className={`font-mono ${bin.status === "fire" ? "text-red-400" : "text-[#86efac]"}`}>{bin.status === "fire" ? "DETECTED" : "Clear"}</span></div>
                        </div>
                      </div>
                    </div>
                    {selectedBin === bin.id && (
                      <div className="mt-4 pt-4 border-t border-[#1a3d22] grid sm:grid-cols-3 gap-4">
                        {[
                          { label: "Bin ID", value: bin.id },
                          { label: "Location", value: bin.loc },
                          { label: "Bin Type", value: "Smart Bin — Mixed Waste" },
                          { label: "Capacity", value: bin.capacity },
                          { label: "Fill Level", value: `${bin.fill}%` },
                          { label: "Weight", value: `${bin.weight} kg` },
                          { label: "Temperature", value: bin.temp },
                          { label: "Gas/Odor", value: bin.gas },
                          { label: "Fire/Smoke", value: bin.status === "fire" ? "DETECTED" : "Clear" },
                          { label: "Status", value: bin.status.toUpperCase() },
                          { label: "Sorting", value: "At facility after collection" },
                          { label: "QR Code", value: `QR-${bin.id}` },
                        ].map(d => (
                          <div key={d.label}>
                            <div className="text-[#4b7a5a] text-xs">{d.label}</div>
                            <div className="text-[#86efac] font-mono text-sm">{d.value}</div>
                          </div>
                        ))}
                        <div className="sm:col-span-3 flex gap-3 mt-2">
                          <button className="bg-[#16a34a] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#15803d] transition-colors">Dispatch Truck</button>
                          <button className="border border-[#1a3d22] text-[#86efac] text-xs px-4 py-2 rounded-lg hover:border-[#4ade80]/40 transition-colors">View History</button>
                          <button className="border border-red-500/40 text-red-400 text-xs px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors">Flag Hazard</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fleet GPS */}
          {activeTab === "fleet" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: "Total Fleet", value: trucks.length, color: "#4ade80" },
                  { label: "Active", value: trucks.filter(t => t.status === "active").length, color: "#4ade80" },
                  { label: "Idle", value: trucks.filter(t => t.status === "idle").length, color: "#facc15" },
                  { label: "Maintenance", value: trucks.filter(t => t.status === "maintenance").length, color: "#f59e0b" },
                  { label: "Avg Load", value: "1.3t", color: "#60a5fa" },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4 text-center">
                    <div className="font-mono text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                    <div className="text-[#4b7a5a] text-xs mt-1">{kpi.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {trucks.map(truck => (
                  <div key={truck.id} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                        background: truck.status === "active" ? "#4ade8022" : truck.status === "idle" ? "#facc1522" : "#f59e0b22"
                      }}>
                        <Truck size={20} style={{ color: truck.status === "active" ? "#4ade80" : truck.status === "idle" ? "#facc15" : "#f59e0b" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-bold text-white">{truck.id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${truck.status === "active" ? "bg-green-500/20 text-green-400" :
                              truck.status === "idle" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-orange-500/20 text-orange-400"
                            }`}>{truck.status.toUpperCase()}</span>
                        </div>
                        <div className="text-[#4b7a5a] text-sm">{truck.driver}</div>
                        <div className="text-[#86efac] text-xs mt-0.5">{truck.route}</div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Route Progress</div>
                          <div className="w-28 bg-[#061309] rounded-full h-2 mb-1">
                            <div className="h-2 rounded-full bg-[#4ade80]" style={{ width: `${truck.progress}%` }} />
                          </div>
                          <div className="font-mono text-[#4ade80]">{truck.progress}%</div>
                        </div>
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Load</div>
                          <div className="font-mono text-[#86efac]">{truck.load}</div>
                        </div>
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Fuel</div>
                          <div className="font-mono" style={{ color: truck.fuel < 50 ? "#f59e0b" : "#4ade80" }}>{truck.fuel}%</div>
                        </div>
                        <div>
                          <div className="text-[#4b7a5a] mb-1">Bins Done</div>
                          <div className="font-mono text-[#86efac]">{truck.bins}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="font-display font-600 text-white mb-4">Hourly Average Fill Level</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={hourlyFill}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a3d22" />
                      <XAxis dataKey="hour" stroke="#4b7a5a" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} interval={3} />
                      <YAxis stroke="#4b7a5a" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                      <Tooltip contentStyle={{ background: "#0d2414", border: "1px solid #1a3d22", borderRadius: 8, color: "#e2f5e9", fontSize: 11 }} />
                      <Line type="monotone" dataKey="avg" stroke="#4ade80" strokeWidth={2} dot={false} name="Avg Fill %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="font-display font-600 text-white mb-4">Weekly Collection vs Recycling</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a3d22" />
                      <XAxis dataKey="day" stroke="#4b7a5a" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <YAxis stroke="#4b7a5a" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                      <Tooltip contentStyle={{ background: "#0d2414", border: "1px solid #1a3d22", borderRadius: 8, color: "#e2f5e9", fontSize: 11 }} />
                      <Legend wrapperStyle={{ color: "#4b7a5a", fontSize: 11 }} />
                      <Bar dataKey="collected" fill="#4ade80" name="Collected" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="recycled" fill="#60a5fa" name="Recycled" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Collected (month)", value: "128.4 tons", trend: "+8%" },
                  { label: "Recycling Rate", value: "67.2%", trend: "+3.1%" },
                  { label: "Carbon Saved (month)", value: "18.6 tons CO₂", trend: "+12%" },
                  { label: "Route Cost Savings", value: "৳ 2,84,000", trend: "+22%" },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                    <div className="text-[#4b7a5a] text-xs mb-1">{stat.label}</div>
                    <div className="font-display font-700 text-white text-xl mb-1">{stat.value}</div>
                    <div className="text-[#4ade80] text-xs font-mono">{stat.trend} vs last month</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {activeTab === "alerts" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-[#4ade80]" />
                <span className="font-display font-600 text-white">{visibleAlerts.length} Active Alerts</span>
              </div>
              {visibleAlerts.map(alert => (
                <div key={alert.id} className={`bg-[#0d2414] border rounded-xl p-5 flex items-start gap-4 ${alert.priority === "critical" ? "border-red-500/40" :
                    alert.priority === "high" ? "border-orange-500/40" :
                      "border-yellow-500/20"
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.type === "fire" ? "bg-red-500/20" : "bg-orange-500/20"
                    }`}>
                    {alert.type === "fire" ? <Flame size={18} className="text-red-400" /> :
                      alert.type === "overflow" ? <AlertTriangle size={18} className="text-orange-400" /> :
                        alert.type === "gas" ? <Wind size={18} className="text-yellow-400" /> :
                          <Settings size={18} className="text-[#4b7a5a]" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm mb-1">{alert.msg}</div>
                    <div className="text-[#4b7a5a] text-xs font-mono">{alert.time}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-mono ${alert.priority === "critical" ? "bg-red-500/20 text-red-400" :
                        alert.priority === "high" ? "bg-orange-500/20 text-orange-400" :
                          "bg-yellow-500/20 text-yellow-400"
                      }`}>{alert.priority.toUpperCase()}</span>
                    <button onClick={() => setDismissedAlerts(d => [...d, alert.id])} className="text-[#4b7a5a] hover:text-white"><X size={14} /></button>
                  </div>
                </div>
              ))}
              {visibleAlerts.length === 0 && (
                <div className="text-center py-16">
                  <CheckCircle size={40} className="text-[#4ade80] mx-auto mb-3" />
                  <div className="text-white font-display font-600">All clear! No active alerts.</div>
                </div>
              )}
            </div>
          )}

          {/* Compliance */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Audit Reports Generated", value: "47", color: "#4ade80" },
                  { label: "Hazardous Pickups Certified", value: "23", color: "#60a5fa" },
                  { label: "Chain-of-Custody Records", value: "189", color: "#a78bfa" },
                ].map(k => (
                  <div key={k.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 text-center">
                    <div className="font-mono text-3xl font-bold mb-1" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-[#4b7a5a] text-sm">{k.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                <div className="font-display font-600 text-white mb-4">Compliance Log</div>
                <div className="space-y-3">
                  {[
                    { action: "Certificate of Destruction issued", item: "Medical waste — Gulshan-2 Clinic", time: "Today 09:14", status: "Certified" },
                    { action: "Hazardous pickup chain-of-custody signed", item: "Battery waste — Mirpur Industrial", time: "Today 08:52", status: "Logged" },
                    { action: "Environmental audit report generated", item: "Monthly — Zone A (Mirpur)", time: "Yesterday 17:30", status: "Generated" },
                    { action: "Driver safety checklist completed", item: "T-02 — Chemical waste pickup", time: "Yesterday 11:20", status: "Verified" },
                    { action: "Regulatory report submitted", item: "Q3 2026 — EPA Bangladesh", time: "Sep 01, 2026", status: "Submitted" },
                  ].map((log, i) => (
                    <div key={i} className="flex flex-wrap items-start gap-3 py-3 border-b border-[#1a3d22] last:border-0">
                      <Shield size={14} className="text-[#4ade80] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm">{log.action}</div>
                        <div className="text-[#4b7a5a] text-xs">{log.item}</div>
                        <div className="text-[#4b7a5a] text-xs font-mono mt-0.5">{log.time}</div>
                      </div>
                      <span className="bg-[#4ade80]/20 text-[#4ade80] text-xs px-2 py-0.5 rounded-full font-mono">{log.status}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 flex items-center gap-2 text-xs text-[#4ade80] hover:underline">
                  <Download size={12} /> Download Full Audit Log
                </button>
              </div>
            </div>
          )}

          {/* Sorting Machine */}
          {activeTab === "sorting" && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Items Sorted Today", value: "3,847", color: "#4ade80" },
                  { label: "Accuracy Rate", value: "98.4%", color: "#60a5fa" },
                  { label: "Belt Speed", value: "0.8 m/s", color: "#facc15" },
                  { label: "Machine Status", value: "RUNNING", color: "#4ade80" },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 text-center">
                    <div className="font-mono text-2xl font-bold mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
                    <div className="text-[#4b7a5a] text-xs">{kpi.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-display font-600 text-white">Conveyor Belt — Live Simulation</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#4ade80] rounded-full pulse-green" />
                    <span className="text-[#4ade80] font-mono text-xs">ACTIVE</span>
                  </div>
                </div>
                <div className="relative h-20 bg-[#061309] rounded-xl overflow-hidden border border-[#1a3d22] flex items-center">
                  <div className="flex gap-6 conveyor-belt px-4" style={{ width: "200%" }}>
                    {["🍌", "🥤", "📦", "🔩", "💻", "⚠️", "👕", "🫙", "📄", "🔋", "🍌", "🥤", "📦", "🔩", "💻", "⚠️", "👕", "🫙"].map((item, i) => (
                      <div key={i} className="w-14 h-14 bg-[#0d2414] border border-[#1a3d22] rounded-lg flex items-center justify-center text-2xl shrink-0">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="font-display font-600 text-white mb-4">Category Output Today</div>
                  {[
                    { cat: "Organic", count: 1240, color: "#4ade80" },
                    { cat: "Plastic", count: 987, color: "#60a5fa" },
                    { cat: "Metal", count: 643, color: "#94a3b8" },
                    { cat: "Paper", count: 521, color: "#fde68a" },
                    { cat: "Glass", count: 312, color: "#7dd3fc" },
                    { cat: "Hazardous", count: 144, color: "#fca5a5" },
                  ].map(c => (
                    <div key={c.cat} className="flex items-center gap-3 py-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
                      <div className="flex-1 text-sm text-[#86efac]">{c.cat}</div>
                      <div className="w-32 bg-[#061309] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${(c.count / 1240) * 100}%`, background: c.color }} />
                      </div>
                      <div className="font-mono text-xs text-[#4b7a5a] w-12 text-right">{c.count}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <div className="font-display font-600 text-white mb-4">Sensor Health</div>
                  {[
                    { sensor: "Camera + ML", status: "OK", ping: "12ms" },
                    { sensor: "Inductive Metal", status: "OK", ping: "4ms" },
                    { sensor: "Electromagnet", status: "OK", ping: "8ms" },
                    { sensor: "Capacitive Moisture", status: "OK", ping: "6ms" },
                    { sensor: "NIR Optical", status: "WARN", ping: "45ms" },
                    { sensor: "X-ray Module", status: "OK", ping: "28ms" },
                    { sensor: "Chemical/Gas", status: "OK", ping: "18ms" },
                    { sensor: "Air Jet Actuator", status: "OK", ping: "3ms" },
                  ].map(s => (
                    <div key={s.sensor} className="flex items-center gap-3 py-1.5 border-b border-[#1a3d22] last:border-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${s.status === "OK" ? "bg-[#4ade80]" : "bg-yellow-400"}`} />
                      <div className="flex-1 text-xs text-[#86efac]">{s.sensor}</div>
                      <div className={`text-xs font-mono ${s.status === "OK" ? "text-[#4ade80]" : "text-yellow-400"}`}>{s.status}</div>
                      <div className="text-xs font-mono text-[#4b7a5a]">{s.ping}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
