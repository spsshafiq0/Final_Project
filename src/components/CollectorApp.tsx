import { useState, useMemo } from "react";
import { Truck, MapPin, CheckCircle, AlertTriangle, Clock, Navigation, Package, Shield, ArrowLeft, ChevronRight, Battery, Fuel, Wind, Wallet, Banknote, Home, ListChecks, Trash2, KeyRound, LogIn, RefreshCw, LogOut, Flame, Sparkles, Radio } from "lucide-react";
import NearbyBinsMap from "./NearbyBinsMap";
import { acceptPickupRequest, completePickupRequest, getDriverBalance, getPickupRequests, setDriverBalance, type PickupRequest } from "../data/pickupStore";
import api from "../lib/api";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { optimizePriorityRoute, defaultSmartBinsWithTelemetry, BinTelemetry } from "../lib/routeOptimizer";

interface CollectorAppProps {
  onNavigate: (page: string) => void;
}

const hazardProtocol = [
  "Don PPE before approaching — gloves, mask, and reflective vest mandatory",
  "Scan bin QR code to confirm waste category and alert type",
  "Do NOT open bin manually if gas or fire alert is active — await hazmat clearance",
  "Contact Hazmat Unit at +880-1999-HAZMAT before proceeding",
  "Secure spill containment kit from truck compartment C",
  "Use sealed container bag from truck — seal and tag before loading",
  "Document weight and volume on app before departure",
  "Drive directly to certified handler — no detours",
];

export default function CollectorApp({ onNavigate }: CollectorAppProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [driverIdentity, setDriverIdentity] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [driverResetPassword, setDriverResetPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [completedStops, setCompletedStops] = useState<number[]>([]);
  const [activeStop, setActiveStop] = useState<number | null>(null);
  const [showHazard, setShowHazard] = useState(false);
  const [hazardChecked, setHazardChecked] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"Home" | "Bins" | "Pickups" | "Earnings">("Home");
  const [balance, setBalance] = useState(getDriverBalance());
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>(getPickupRequests());
  const [driverCodes, setDriverCodes] = useState<Record<number, string>>({});
  const [driverPickupMsg, setDriverPickupMsg] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawn, setWithdrawn] = useState(false);

  // IoT Smart Bins Telemetry State & AI Priority Route Optimization
  const [binsList, setBinsList] = useState<BinTelemetry[]>(defaultSmartBinsWithTelemetry);
  const [iotAlertToast, setIotAlertToast] = useState<string | null>(null);

  // Dynamically calculate optimized route prioritizing hazards and minimizing fuel
  const optResult = useMemo(() => {
    return optimizePriorityRoute({ lat: 23.78, lng: 90.40 }, binsList);
  }, [binsList]);

  const route = optResult.orderedStops;

  const triggerIotHazardSim = () => {
    setBinsList(prev => prev.map(b => {
      if (b.id === "B-204") {
        return {
          ...b,
          tempCelsius: 54,
          ammoniaPpm: 82,
          fill: 98,
          fire: true,
          status: "critical"
        };
      }
      return b;
    }));
    setIotAlertToast("🚨 IoT TELEMETRY ALERT: High Temperature (54°C) & Toxic Ammonia (82 ppm) detected at Bin B-204! Dynamic AI Re-Routing: Stop #1 assigned with priority.");
  };

  const handleDriverComplete = (jobId: number, amount: number) => {
    const code = driverCodes[jobId] ?? "";
    const result = completePickupRequest(jobId, code);
    if (result.success) {
      setPickupRequests(result.requests);
      setBalance(getDriverBalance());
      setDriverPickupMsg(`Job completed! ৳${amount} credited to your account.`);
    } else {
      setDriverPickupMsg("Invalid security code. Please check with customer.");
    }
  };

  const toggleStop = (stopNum: number) => {
    setCompletedStops(prev =>
      prev.includes(stopNum) ? prev.filter(s => s !== stopNum) : [...prev, stopNum]
    );
    setActiveStop(null);
  };

  const progress = route.length > 0 ? (completedStops.length / route.length) * 100 : 0;

  const loginDriver = async () => {
    if (!driverIdentity || !driverPassword) {
      setLoginError("Enter your phone number or username and password.");
      return;
    }

    try {
      const res = await api.auth.login(driverIdentity, driverPassword);
      if (res?.user) {
        setLoginError("");
        setBalance(getDriverBalance());
        setPickupRequests(getPickupRequests());
        setLoggedIn(true);
        return;
      }
    } catch (err: any) {
      if (driverResetPassword && driverPassword === driverResetPassword) {
        setLoginError("");
        setBalance(getDriverBalance());
        setPickupRequests(getPickupRequests());
        setLoggedIn(true);
        return;
      }
      setLoginError(err?.message || "Invalid driver credentials. Please verify your phone or username and password.");
      return;
    }

    setLoginError("");
    setBalance(getDriverBalance());
    setPickupRequests(getPickupRequests());
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#061309] px-4 py-8 flex items-center justify-center">
        <div className="absolute inset-0 map-grid opacity-20" />
        <div className="relative z-10 w-full max-w-md">
          <button onClick={() => onNavigate("landing")} className="text-[#86efac] text-sm flex items-center gap-2 mb-6"><ArrowLeft size={16} /> Back to home</button>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-5 sm:p-8">
            <div className="w-12 h-12 bg-[#16a34a] rounded-xl flex items-center justify-center mb-4"><Truck size={22} className="text-white" /></div>
            <div className="font-display font-800 text-2xl text-white">Track Driver Login</div>
            <div className="text-[#4b7a5a] text-sm mt-1 mb-6">Access your assigned bins, optimized route and pickups.</div>
            <div className="space-y-4">
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-2">PHONE NUMBER OR USERNAME</label>
                <input value={driverIdentity} onChange={e => setDriverIdentity(e.target.value)} autoComplete="username" placeholder="driver_username" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4ade80]" />
              </div>
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-2">PASSWORD</label>
                <input type="password" value={driverPassword} onChange={e => setDriverPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && loginDriver()} autoComplete="current-password" placeholder="Enter password" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4ade80]" />
              </div>
            </div>
            <button onClick={() => { setForgotOpen(true); setLoginError(""); }} className="text-[#4ade80] text-xs mt-4 flex items-center gap-1.5"><KeyRound size={12} /> Forgot password?</button>
            {loginError && <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs mt-4">{loginError}</div>}
            <button onClick={loginDriver} className="w-full bg-[#16a34a] text-white rounded-xl py-3 mt-5 font-semibold flex items-center justify-center gap-2"><LogIn size={16} /> Login to Driver Portal</button>
          </div>
        </div>

        {/* Unified Brevo Email OTP Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={forgotOpen}
          onClose={() => setForgotOpen(false)}
          defaultIdentifier={driverIdentity}
          role="DRIVER"
          onSuccess={(newP) => {
            setDriverPassword(newP);
            setDriverResetPassword(newP);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#061309]">
      {/* Header */}
      <div className="bg-[#0a1f0e] border-b border-[#1a3d22] px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate("landing")} title="Back to home" className="text-[#4b7a5a] hover:text-[#4ade80] transition-colors">
                <Home size={18} />
              </button>
              <div>
                <div className="font-display font-700 text-white">Track Driver Portal</div>
                <div className="text-[#4b7a5a] text-xs">Truck T-02 · Karim Ahmed</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[#4ade80] font-mono text-xs">{completedStops.length}/{route.length} done</div>
                <div className="text-[#4b7a5a] text-xs">Est. 2h 40m left</div>
              </div>
              <button onClick={() => setLoggedIn(false)} title="Sign out" className="text-[#4b7a5a] hover:text-red-400 transition-colors p-1">
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-[#061309] rounded-full h-2 mb-1">
            <div className="bg-[#4ade80] h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-[#4b7a5a] font-mono">
            <span>Route Progress: {Math.round(progress)}%</span>
            <span>Load: 0.8t / 2t</span>
          </div>
        </div>
      </div>

      <div className="bg-[#0a1f0e] border-b border-[#1a3d22] px-3">
        <div className="max-w-5xl mx-auto flex overflow-x-auto scrollbar-hide">
          {[
            { label: "Home", icon: Home },
            { label: "Bins", icon: Trash2 },
            { label: "Pickups", icon: ListChecks },
            { label: "Earnings", icon: Wallet },
          ].map(item => (
            <button key={item.label} onClick={() => { setActiveTab(item.label as typeof activeTab); setBalance(getDriverBalance()); setPickupRequests(getPickupRequests()); }} className={`flex-1 min-w-24 py-3 flex items-center justify-center gap-2 text-xs font-semibold border-b-2 ${activeTab === item.label ? "border-[#4ade80] text-[#4ade80]" : "border-transparent text-[#4b7a5a]"}`}>
              <item.icon size={14} /> {item.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Home" && (
        <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">
          {/* AI Priority Route & Fuel Cost Reduction Banner */}
          <div className="bg-gradient-to-r from-[#0d2414] via-[#11381c] to-[#0d2414] border border-[#4ade80]/40 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse"></span>
                <span className="text-xs font-mono font-bold text-[#4ade80] uppercase tracking-wide">
                  AI IoT Priority Route & Fuel Optimization Engine
                </span>
              </div>
              <button
                type="button"
                onClick={triggerIotHazardSim}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow"
              >
                <Radio size={13} className="animate-pulse" />
                <span>Simulate IoT Hazard Surge</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-[#061309]/80 border border-[#1a3d22] rounded-xl p-3">
                <div className="text-[#4b7a5a]">FUEL SAVED</div>
                <div className="text-lg font-bold text-[#4ade80] mt-0.5">⛽ {optResult.fuelSavedLitres} L</div>
                <div className="text-[11px] text-[#86efac]">Diesel Conserved</div>
              </div>
              <div className="bg-[#061309]/80 border border-[#1a3d22] rounded-xl p-3">
                <div className="text-[#4b7a5a]">COST REDUCTION</div>
                <div className="text-lg font-bold text-[#facc15] mt-0.5">৳{optResult.moneySavedBdt}</div>
                <div className="text-[11px] text-[#fde047]">@ ৳105/L Diesel</div>
              </div>
              <div className="bg-[#061309]/80 border border-[#1a3d22] rounded-xl p-3">
                <div className="text-[#4b7a5a]">OPTIMIZED ROUTE</div>
                <div className="text-lg font-bold text-white mt-0.5">{optResult.totalDistanceKm} km</div>
                <div className="text-[11px] text-[#4ade80]">Saved {optResult.distanceSavedKm} km</div>
              </div>
              <div className="bg-[#061309]/80 border border-[#1a3d22] rounded-xl p-3">
                <div className="text-[#4b7a5a]">HAZARD DISPATCH</div>
                <div className="text-lg font-bold text-red-400 mt-0.5">{optResult.hazardStopsCount} Critical</div>
                <div className="text-[11px] text-red-300">Prioritized at Stop #1</div>
              </div>
            </div>

            {iotAlertToast && (
              <div className="mt-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl p-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-red-400 shrink-0" />
                  <span>{iotAlertToast}</span>
                </div>
                <button onClick={() => setIotAlertToast(null)} className="text-red-400 hover:text-white font-mono ml-2">✕</button>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 bg-gradient-to-br from-[#0d2414] to-[#12351d] border border-[#4ade80]/30 rounded-2xl p-5">
              <div className="text-[#86efac] text-sm">Available balance</div>
              <div className="font-display font-800 text-3xl text-white mt-1">৳{balance.toLocaleString()}</div>
              <div className="text-[#4b7a5a] text-xs mt-1">Bin routes + citizen pickup earnings</div>
              <button onClick={() => { setWithdrawOpen(true); setWithdrawn(false); }} className="mt-5 bg-[#4ade80] text-[#052e16] rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2"><Banknote size={15} /> Withdraw</button>
            </div>
            <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-5">
              <div className="text-[#4b7a5a] text-xs">Today's progress</div>
              <div className="text-white font-display font-800 text-2xl mt-2">{completedStops.length}/{route.length}</div>
              <div className="text-[#86efac] text-sm">assigned bins collected</div>
              <button onClick={() => setActiveTab("Bins")} className="text-[#4ade80] text-xs font-semibold mt-5">View assigned route →</button>
            </div>
          </div>

          <div>
            <div className="text-white font-display font-700 mb-3">Priority bins under your track</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {route.slice(0, 3).map(stop => (
                <div key={stop.id} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-white font-bold">{stop.id}</span>
                    <span className={stop.fill >= 80 ? "text-red-400 font-mono font-bold" : "text-orange-400 font-mono font-bold"}>{stop.fill}%</span>
                  </div>
                  <div className="text-[#4b7a5a] text-xs mt-2 truncate">{stop.location}</div>
                  <div className="flex items-center gap-2 mt-2 font-mono text-[11px]">
                    <span className={stop.tempCelsius >= 45 ? "text-red-400 font-bold" : "text-[#86efac]"}>🌡️ {stop.tempCelsius}°C</span>
                    <span className={stop.ammoniaPpm >= 50 ? "text-orange-400 font-bold" : "text-[#4b7a5a]"}>🧪 {stop.ammoniaPpm} ppm NH₃</span>
                  </div>
                  <a href={`https://maps.google.com/?q=${stop.location}`} target="_blank" rel="noreferrer" className="text-[#60a5fa] text-xs mt-3 flex items-center gap-1"><Navigation size={12} /> Open location</a>
                </div>
              ))}
            </div>
          </div>
          <NearbyBinsMap area="Mohammadpur" dark />
        </div>
      )}

      {/* Vehicle status bar */}
      <div className="bg-[#0d2414] border-b border-[#1a3d22] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3 sm:gap-4 text-xs font-mono overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5">
            <Fuel size={12} className="text-[#facc15]" />
            <span className="text-[#facc15]">52%</span>
            <span className="text-[#4b7a5a]">Fuel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Battery size={12} className="text-[#4ade80]" />
            <span className="text-[#4ade80]">OK</span>
            <span className="text-[#4b7a5a]">Battery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind size={12} className="text-[#60a5fa]" />
            <span className="text-[#60a5fa]">Normal</span>
            <span className="text-[#4b7a5a]">Cabin Air</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 bg-[#4ade80] rounded-full pulse-green" />
            <span className="text-[#4ade80]">GPS ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Hazard alert banner */}
      {activeTab === "Bins" && route.some(r => (r.hazardLevel !== "NORMAL") && !completedStops.includes(r.stopNumber)) && (
        <div className="bg-red-500/15 border-b border-red-500/40 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <div className="flex-1">
              <div className="text-red-400 text-sm font-semibold">Priority Hazard Detected: Stop #1 ({route[0]?.id})</div>
              <div className="text-red-300 text-xs">
                {route[0]?.hazardDescription || "High temperature / ammonia gas detected. Prioritized for immediate clearance."}
              </div>
            </div>
            <button onClick={() => setShowHazard(true)} className="text-xs text-red-400 border border-red-400/50 px-3 py-1.5 rounded-lg hover:bg-red-500/10 whitespace-nowrap">
              Safety Protocol
            </button>
          </div>
        </div>
      )}

      {/* Route list */}
      <div className={`${activeTab === "Bins" ? "block" : "hidden"} max-w-3xl mx-auto px-4 py-4 space-y-3`}>
        {/* Dynamic Route Optimizer Stats summary */}
        <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#4ade80]" />
            <div>
              <div className="text-white text-xs font-semibold">Priority Route & Fuel Optimizer</div>
              <div className="text-[#4b7a5a] text-[11px] font-mono">
                {optResult.optimizationSummary}
              </div>
            </div>
          </div>
          <button
            onClick={triggerIotHazardSim}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-2.5 py-1 rounded-lg shrink-0"
          >
            Trigger Test Surge
          </button>
        </div>

        {route.map(stop => {
          const isDone = completedStops.includes(stop.stopNumber);
          const isActive = activeStop === stop.stopNumber;
          const isHazard = stop.hazardLevel === "DUAL_HAZARD" || stop.hazardLevel === "FIRE_HAZARD" || stop.hazardLevel === "TOXIC_AMMONIA";

          return (
            <div
              key={stop.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                isDone ? "border-[#1a3d22] opacity-60" :
                isHazard ? "border-red-500/60 shadow-lg shadow-red-500/10" :
                stop.fill >= 80 ? "border-orange-500/50" :
                stop.fill >= 60 ? "border-yellow-500/30" :
                "border-[#1a3d22]"
              } ${isDone ? "bg-[#0a1f0e]" : "bg-[#0d2414]"}`}
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setActiveStop(isActive ? null : stop.stopNumber)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                  isDone ? "bg-[#4ade80] text-[#052e16]" :
                  isHazard ? "bg-red-500/20 text-red-400 border border-red-500" :
                  stop.fill >= 80 ? "bg-orange-500/20 text-orange-400" :
                  "bg-[#1a3d22] text-[#4b7a5a]"
                }`}>
                  {isDone ? <CheckCircle size={16} /> : stop.stopNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-white text-sm">{stop.id}</span>
                    {isHazard && (
                      <span className="text-[10px] font-mono bg-red-500/20 border border-red-500/50 text-red-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                        ⚠️ {stop.priorityBadge}
                      </span>
                    )}
                    {stop.fill >= 80 && !isHazard && (
                      <span className="text-[10px] font-mono bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-semibold">
                        CRITICAL OVERFLOW
                      </span>
                    )}
                  </div>
                  <div className="text-[#4b7a5a] text-xs truncate">{stop.location} · {stop.area}</div>
                  <div className="flex items-center gap-3 mt-1.5 font-mono text-[11px]">
                    <span className={stop.tempCelsius >= 45 ? "text-red-400 font-bold" : "text-[#86efac]"}>
                      🌡️ Temp: {stop.tempCelsius}°C
                    </span>
                    <span className={stop.ammoniaPpm >= 50 ? "text-red-400 font-bold" : "text-[#4ade80]"}>
                      🧪 NH₃: {stop.ammoniaPpm} ppm
                    </span>
                    <span className="text-[#4b7a5a]">
                      📍 {stop.distanceFromPrevKm} km away (~{stop.estimatedArrivalMins}m)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold" style={{ color: stop.fill >= 80 ? "#ef4444" : stop.fill >= 60 ? "#f59e0b" : "#4ade80" }}>
                      {stop.fill}%
                    </div>
                    <div className="text-[#4b7a5a] text-xs font-mono">{stop.capacity || "120L"}</div>
                  </div>
                  <ChevronRight size={14} className={`text-[#4b7a5a] transition-transform ${isActive ? "rotate-90" : ""}`} />
                </div>
              </div>

              {isActive && !isDone && (
                <div className="border-t border-[#1a3d22] p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div className="bg-[#061309] rounded-lg p-2.5">
                      <div className="text-[#4b7a5a] text-[10px]">FILL LEVEL</div>
                      <div className="font-bold text-sm" style={{ color: stop.fill >= 80 ? "#ef4444" : "#f59e0b" }}>{stop.fill}%</div>
                    </div>
                    <div className="bg-[#061309] rounded-lg p-2.5">
                      <div className="text-[#4b7a5a] text-[10px]">TEMPERATURE</div>
                      <div className={`font-bold text-sm ${stop.tempCelsius >= 45 ? "text-red-400" : "text-[#86efac]"}`}>{stop.tempCelsius}°C</div>
                    </div>
                    <div className="bg-[#061309] rounded-lg p-2.5">
                      <div className="text-[#4b7a5a] text-[10px]">AMMONIA (NH₃)</div>
                      <div className={`font-bold text-sm ${stop.ammoniaPpm >= 50 ? "text-red-400" : "text-[#4ade80]"}`}>{stop.ammoniaPpm} ppm</div>
                    </div>
                  </div>

                  {isHazard && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-xs text-red-300">
                      <div className="font-bold text-red-400 mb-1 flex items-center gap-1.5">
                        <Flame size={14} /> Hazard Assessment:
                      </div>
                      <div>{stop.hazardDescription}</div>
                      <button onClick={() => setShowHazard(true)} className="mt-2 text-xs text-red-400 underline flex items-center gap-1">
                        <Shield size={12} /> View Hazmat PPE Protocol
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <a
                      href={`https://maps.google.com/?q=${stop.location}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-[#1a3d22] border border-[#1a3d22] text-[#4ade80] rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:border-[#4ade80]/40 transition-colors"
                    >
                      <Navigation size={14} />
                      Navigate ({stop.distanceFromPrevKm} km)
                    </a>
                    <button
                      onClick={() => toggleStop(stop.stopNumber)}
                      className="flex-1 bg-[#16a34a] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#15803d] transition-colors"
                    >
                      Mark Collected
                    </button>
                  </div>
                </div>
              )}

              {isDone && (
                <div className="border-t border-[#1a3d22] px-4 py-2 flex items-center justify-between">
                  <span className="text-[#4ade80] text-xs font-mono">✓ Collected & Cleared</span>
                  <button onClick={() => setCompletedStops(p => p.filter(s => s !== stop.stopNumber))} className="text-[#4b7a5a] text-xs hover:text-[#86efac]">Undo</button>
                </div>
              )}
            </div>
          );
        })}

        {/* End of route */}
        {completedStops.length === route.length && route.length > 0 && (
          <div className="bg-[#0d2414] border border-[#4ade80]/40 rounded-xl p-6 text-center">
            <CheckCircle size={40} className="text-[#4ade80] mx-auto mb-3" />
            <div className="font-display font-700 text-white text-xl mb-1">Route Complete! 🎉</div>
            <div className="text-[#86efac] text-sm mb-4">All {route.length} priority bins collected. Total fuel saved: {optResult.fuelSavedLitres} L (৳{optResult.moneySavedBdt}).</div>
          </div>
        )}
      </div>

      {activeTab === "Pickups" && (
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><div className="text-white font-display font-700 text-lg">Area pickup requests</div><div className="text-[#4b7a5a] text-sm">Paid requests matched to your Mohammadpur route.</div></div>
            <button onClick={() => setPickupRequests(getPickupRequests())} className="text-[#4ade80] border border-[#1a3d22] rounded-lg p-2"><RefreshCw size={15} /></button>
          </div>
          <div className="space-y-3">
            {pickupRequests.filter((request) => request.area === "Mohammadpur" && request.status !== "completed").map((job, index) => {
              const accepted = job.status === "accepted";
              return <div key={job.id} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="text-white font-semibold">{job.requesterName}</span><span className="text-[#4ade80] font-mono font-bold">৳{job.amount}</span></div>
                    <div className="text-[#86efac] text-sm mt-1">{job.wasteType}</div>
                    <div className="text-[#4b7a5a] text-xs mt-1 flex items-center gap-1"><MapPin size={11} /> {job.address} · {(1.2 + index * .8).toFixed(1)} km</div>
                    {accepted && (
                      <div className="mt-3 bg-[#061309] border border-[#1a3d22] rounded-xl p-3">
                        <div className="text-[#60a5fa] text-xs mb-2">Accepted. Enter the customer's 6-digit code to complete:</div>
                        <div className="flex gap-2">
                          <input
                            value={driverCodes[job.id] ?? ""}
                            onChange={e => setDriverCodes(c => ({ ...c, [job.id]: e.target.value }))}
                            placeholder="6-digit code"
                            maxLength={6}
                            className="flex-1 bg-[#0d2414] border border-[#1a3d22] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#4ade80]"
                          />
                          <button
                            onClick={() => handleDriverComplete(job.id, job.amount)}
                            className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
                          >
                            Claim ৳{job.amount}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a href={`https://maps.google.com/?q=${job.address}`} target="_blank" rel="noreferrer" className="border border-[#1a3d22] text-[#60a5fa] rounded-lg px-3 py-2 text-xs">Map</a>
                    <button disabled={accepted} onClick={() => setPickupRequests(acceptPickupRequest(job.id))} className="bg-[#16a34a] disabled:bg-[#1a3d22] disabled:text-[#4b7a5a] text-white rounded-lg px-4 py-2 text-xs font-semibold">{accepted ? "Awaiting code" : "Accept job"}</button>
                  </div>
                </div>
              </div>;
            })}
            {driverPickupMsg && (
              <div className="p-3 bg-[#0d2414] border border-[#4ade80]/40 rounded-xl text-xs text-[#86efac] flex items-center justify-between">
                <span>{driverPickupMsg}</span>
                <button onClick={() => setDriverPickupMsg("")} className="font-bold ml-2 text-white">✕</button>
              </div>
            )}
            {pickupRequests.filter((request) => request.area === "Mohammadpur" && request.status !== "completed").length === 0 && <div className="text-[#4b7a5a] text-sm text-center py-12">No active pickup requests in your area.</div>}
          </div>
        </div>
      )}

      {activeTab === "Earnings" && (
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
          <div className="bg-[#0d2414] border border-[#4ade80]/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><div className="text-[#4b7a5a] text-sm">Withdrawable balance</div><div className="text-white font-display font-800 text-3xl">৳{balance.toLocaleString()}</div></div>
            <button onClick={() => { setWithdrawOpen(true); setWithdrawn(false); }} className="bg-[#4ade80] text-[#052e16] rounded-xl px-5 py-3 text-sm font-bold">Request withdrawal</button>
          </div>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
            <div className="text-white font-display font-700 mb-4">Recent earnings</div>
            {[["Citizen pickup · Cafe Riverside", "+ ৳450", "Today, 10:24"], ["Route completion bonus", "+ ৳800", "Yesterday, 17:40"], ["Citizen pickup · Hotel Green View", "+ ৳700", "Sep 09, 14:10"]].map(row => <div key={row[0]} className="flex items-center justify-between gap-3 py-3 border-b border-[#1a3d22] last:border-0"><div><div className="text-[#86efac] text-sm">{row[0]}</div><div className="text-[#4b7a5a] text-xs">{row[2]}</div></div><div className="text-[#4ade80] font-mono font-bold">{row[1]}</div></div>)}
          </div>
          <div className="text-[#4b7a5a] text-xs bg-[#061309] border border-[#1a3d22] rounded-xl p-4">Withdrawals are reviewed and settled under your service contract with the Main Admin.</div>
        </div>
      )}

      {/* Hazard Protocol Modal */}
      {showHazard && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowHazard(false)}>
          <div className="bg-[#0d2414] border border-red-500/40 rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Shield size={18} className="text-red-400" />
              </div>
              <div>
                <div className="font-display font-700 text-white">Hazard Safety Protocol</div>
                <div className="text-red-400 text-xs font-mono">MANDATORY — Read before approaching B-204</div>
              </div>
            </div>
            <div className="space-y-3">
              {hazardProtocol.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${hazardChecked.includes(i) ? "border-[#4ade80]/40 bg-[#4ade80]/5" : "border-[#1a3d22]"}`}
                  onClick={() => setHazardChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${hazardChecked.includes(i) ? "border-[#4ade80] bg-[#4ade80]" : "border-[#1a3d22]"}`}>
                    {hazardChecked.includes(i) && <CheckCircle size={10} className="text-[#052e16]" />}
                  </div>
                  <div>
                    <div className="text-[#4b7a5a] text-xs font-mono mb-0.5">STEP {i + 1}</div>
                    <div className="text-[#86efac] text-sm">{step}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-[#4b7a5a] text-center mb-3">
              {hazardChecked.length}/{hazardProtocol.length} steps acknowledged
            </div>
            <button
              onClick={() => setShowHazard(false)}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${hazardChecked.length === hazardProtocol.length ? "bg-[#16a34a] text-white hover:bg-[#15803d]" : "bg-[#1a3d22] text-[#4b7a5a] cursor-not-allowed"}`}
              disabled={hazardChecked.length !== hazardProtocol.length}
            >
              {hazardChecked.length === hazardProtocol.length ? "Protocol Acknowledged — Proceed Safely" : `Acknowledge all ${hazardProtocol.length} steps to continue`}
            </button>
          </div>
        </div>
      )}
      {withdrawOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setWithdrawOpen(false)}>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            {withdrawn ? <div className="text-center py-4"><CheckCircle size={38} className="text-[#4ade80] mx-auto mb-3" /><div className="text-white font-display font-700">Withdrawal requested</div><div className="text-[#4b7a5a] text-sm mt-1">Main Admin will review and settle your request.</div><button onClick={() => setWithdrawOpen(false)} className="w-full bg-[#16a34a] text-white rounded-xl py-3 mt-5">Done</button></div> : <>
              <div className="text-white font-display font-700 text-lg">Withdraw earnings</div>
              <div className="text-[#4b7a5a] text-sm mt-1 mb-4">Available: ৳{balance.toLocaleString()}</div>
              <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white outline-none" />
              <select className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-[#86efac] outline-none mt-3"><option>bKash · 01711-201025</option><option>Bank account on contract</option></select>
              <button disabled={!withdrawAmount || Number(withdrawAmount) > balance || Number(withdrawAmount) < 100} onClick={() => { const updated = balance - Number(withdrawAmount); setBalance(updated); setDriverBalance(updated); setWithdrawn(true); }} className="w-full bg-[#16a34a] disabled:opacity-40 text-white rounded-xl py-3 mt-4 font-semibold">Submit to Main Admin</button>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
