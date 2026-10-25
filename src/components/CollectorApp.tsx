import { useState, useMemo, useEffect } from "react";
import { Truck, MapPin, CheckCircle, AlertTriangle, Clock, Navigation, Package, Shield, ArrowLeft, ChevronRight, Battery, Fuel, Wind, Wallet, Banknote, Home, ListChecks, Trash2, KeyRound, LogIn, RefreshCw, LogOut, Flame, Sparkles, Radio, AlertOctagon, X } from "lucide-react";
import { acceptPickupRequest, completePickupRequest, getDriverBalance, getPickupRequests, setDriverBalance, type PickupRequest } from "../data/pickupStore";
import api, { ReportItem, userStorage } from "../lib/api";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { optimizePriorityRoute, defaultSmartBinsWithTelemetry, BinTelemetry } from "../lib/routeOptimizer";
import DriverRouteMap from "./DriverRouteMap";

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
  const [currentUser, setCurrentUser] = useState<any>(userStorage.get());
  const [loggedIn, setLoggedIn] = useState(Boolean(userStorage.get()?.role === "DRIVER" || userStorage.get()));
  const [driverIdentity, setDriverIdentity] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [driverResetPassword, setDriverResetPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [completedStops, setCompletedStops] = useState<number[]>([]);
  const [activeStop, setActiveStop] = useState<number | null>(null);
  const [showHazard, setShowHazard] = useState(false);
  const [hazardChecked, setHazardChecked] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"Route & Map" | "Pickups" | "Citizen Reports" | "Earnings">("Route & Map");
  const [balance, setBalance] = useState(getDriverBalance());
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>(getPickupRequests());
  const [driverCodes, setDriverCodes] = useState<Record<string | number, string>>({});
  const [driverPickupMsg, setDriverPickupMsg] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawn, setWithdrawn] = useState(false);

  // Active Waste Issue Reports (for Priority Base Map & Fake Report Penalty)
  const [wasteReports, setWasteReports] = useState<ReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [flaggingReport, setFlaggingReport] = useState<ReportItem | null>(null);
  const [flagFakeReason, setFlagFakeReason] = useState<string>("No waste found at location / False dumping claim");
  const [isSubmittingFlag, setIsSubmittingFlag] = useState<boolean>(false);
  const [flagSuccessMsg, setFlagSuccessMsg] = useState<string>("");

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

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const reps = await api.reports.getAll({ status: "pending" });
      if (Array.isArray(reps)) {
        setWasteReports(reps);
      }
    } catch {}
    finally {
      setLoadingReports(false);
    }
  };

  const handleFlagFake = async () => {
    if (!flaggingReport) return;
    setIsSubmittingFlag(true);
    try {
      const res = await api.reports.flagFake(flaggingReport.id, flagFakeReason);
      if (res?.success) {
        setFlagSuccessMsg(`Report flagged as FAKE DUMPING! ${res.pointsRevoked ?? 150} points revoked from citizen account.`);
        setWasteReports(prev => prev.filter(r => r.id !== flaggingReport.id));
        setTimeout(() => {
          setFlaggingReport(null);
          setFlagSuccessMsg("");
        }, 1600);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to flag report.");
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await api.reports.updateStatus(reportId, "resolved");
      setWasteReports(prev => prev.filter(r => r.id !== reportId));
      setDriverPickupMsg("Waste report marked as collected and resolved!");
    } catch (err: any) {
      alert(err?.message || "Failed to resolve report.");
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const progress = route.length > 0 ? (completedStops.length / route.length) * 100 : 0;

  const loginDriver = async () => {
    if (!driverIdentity || !driverPassword) {
      setLoginError("Enter your phone number or username and password.");
      return;
    }

    try {
      const res = await api.auth.login(driverIdentity, driverPassword);
      if (res?.user) {
        setCurrentUser(res.user);
        setLoginError("");
        setBalance(getDriverBalance());
        setPickupRequests(getPickupRequests());
        setLoggedIn(true);
      } else {
        setLoginError("Invalid credentials. Please verify your username and password.");
      }
    } catch (err: any) {
      setLoginError(err?.message || "Invalid driver credentials. Please verify your phone or username and password.");
    }
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
            { label: "Route & Map", icon: MapPin },
            { label: "Pickups", icon: ListChecks },
            { label: "Citizen Reports", icon: AlertTriangle },
            { label: "Earnings", icon: Wallet },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => {
                setActiveTab(item.label as typeof activeTab);
                setBalance(getDriverBalance());
                setPickupRequests(getPickupRequests());
                if (item.label === "Citizen Reports") loadReports();
              }}
              className={`flex-1 min-w-28 py-3 flex items-center justify-center gap-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === item.label ? "border-[#4ade80] text-[#4ade80]" : "border-transparent text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <item.icon size={14} /> {item.label}
              {item.label === "Citizen Reports" && wasteReports.length > 0 && (
                <span className="bg-red-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                  {wasteReports.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Route & Map" && (
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
            <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-[#4b7a5a] text-xs font-mono">TODAY'S COLLECTION</div>
                <div className="text-white font-display font-800 text-2xl mt-2">{completedStops.length} Completed</div>
                <div className="text-[#86efac] text-xs mt-1">Live Neon DB Sync</div>
              </div>
              <a href="#driver-route-map" className="text-[#4ade80] text-xs font-semibold mt-4 flex items-center gap-1">
                <span>View road route map ↓</span>
              </a>
            </div>
          </div>

          {/* ── UNIFIED PRIORITY-BASED COLLECTION ROUTE MAP (GOOGLE MAPS ROAD STYLE) ── */}
          <div id="driver-route-map" className="pt-1">
            <DriverRouteMap currentUser={currentUser} />
          </div>
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

      {/* Citizen Waste Reports Queue */}
      {activeTab === "Citizen Reports" && (
        <div className="max-w-5xl mx-auto px-4 py-5 space-y-6">

          {/* Citizen Waste Reports Queue */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#1a3d22]">
            <div>
              <h2 className="text-white font-display font-700 text-lg flex items-center gap-2">
                <MapPin className="text-[#4ade80]" size={20} />
                <span>Priority Base Map & Citizen Reports</span>
              </h2>
              <p className="text-[#4b7a5a] text-xs">
                Real-time citizen waste dumping reports with exact Google Coordinates. Verify on-site before collection.
              </p>
            </div>
            <button
              onClick={loadReports}
              disabled={loadingReports}
              className="border border-[#1a3d22] text-[#86efac] hover:text-white rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <RefreshCw size={13} className={loadingReports ? "animate-spin" : ""} />
              <span>Refresh Reports ({wasteReports.length})</span>
            </button>
          </div>

          {/* Map Preview Container */}
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#86efac]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                <span>Active Google Coordinate Hotspots ({wasteReports.length})</span>
              </span>
              <span className="text-[#4b7a5a]">Dhaka Metropolis Grid</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#1a3d22] bg-[#061309] h-64 sm:h-80 relative flex items-center justify-center">
              {/* Dynamic Coordinate Pins Map Visualization */}
              <div className="absolute inset-0 bg-[radial-gradient(#1a3d22_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
              
              <div className="absolute top-4 left-4 z-10 bg-[#0d2414]/90 border border-[#1a3d22] rounded-lg px-3 py-1.5 text-[11px] font-mono text-[#86efac]">
                📍 Live Truck GPS: 23.7542° N, 90.3654° E (Route Active)
              </div>

              {wasteReports.length === 0 ? (
                <div className="text-center text-[#4b7a5a] text-sm z-10">
                  <CheckCircle size={32} className="text-[#4ade80] mx-auto mb-2 opacity-60" />
                  No pending citizen waste reports in your sector. All clear!
                </div>
              ) : (
                <div className="w-full h-full relative p-4">
                  {wasteReports.slice(0, 8).map((rep, idx) => {
                    const topPct = 20 + ((idx * 27) % 60);
                    const leftPct = 15 + ((idx * 33) % 70);
                    const isHazard = rep.priority === "urgent" || rep.wasteType?.toLowerCase().includes("hazard");
                    return (
                      <div
                        key={rep.id}
                        style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                        title={`${rep.reportCode} - ${rep.location}`}
                      >
                        <div className={`p-2 rounded-full border shadow-lg flex items-center justify-center animate-bounce ${
                          isHazard
                            ? "bg-red-500/30 border-red-500 text-red-400 ring-2 ring-red-500/50"
                            : "bg-amber-500/30 border-amber-500 text-amber-400"
                        }`}>
                          <AlertTriangle size={16} />
                        </div>
                        <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#061309] border border-[#1a3d22] rounded-lg p-2 text-xs font-mono whitespace-nowrap shadow-xl z-20">
                          <div className="font-bold text-white">{rep.reportCode} ({rep.wasteType})</div>
                          <div className="text-[#4b7a5a] text-[10px]">
                            Coords: {rep.lat ? `${rep.lat.toFixed(4)}, ${rep.lng?.toFixed(4)}` : "23.7542, 90.3654"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#86efac] uppercase tracking-wide">
              Priority Collection Queue ({wasteReports.length} pending)
            </div>

            {wasteReports.map((rep, idx) => {
              const repLat = rep.lat ?? 23.7542;
              const repLng = rep.lng ?? 90.3654;
              const isHazard = rep.priority === "urgent" || rep.wasteType?.toLowerCase().includes("hazard");

              return (
                <div
                  key={rep.id}
                  className={`bg-[#0d2414] border rounded-xl p-4 sm:p-5 transition-all ${
                    isHazard ? "border-red-500/50 bg-red-950/10" : "border-[#1a3d22]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {rep.imageUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#061309] border border-[#1a3d22] shrink-0">
                        <img src={rep.imageUrl} alt="Report waste" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono font-bold text-white text-sm">{rep.reportCode}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isHazard ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {rep.wasteType}
                        </span>
                        <span className="text-xs text-[#4b7a5a]">· Priority: {rep.priority?.toUpperCase()}</span>
                      </div>

                      <div className="text-white text-sm mt-1">{rep.description}</div>
                      <div className="text-[#86efac] text-xs mt-1.5 flex items-center gap-1.5 font-mono">
                        <MapPin size={12} className="text-[#4ade80]" />
                        <span>{rep.location}</span>
                        <span className="text-[#4b7a5a]">({repLat.toFixed(5)}, {repLng.toFixed(5)})</span>
                      </div>
                      {rep.citizen && (
                        <div className="text-[#4b7a5a] text-[11px] mt-1">
                          Reported by: {rep.citizen.fullName || rep.citizen.phone || "Citizen"} · Reward: +{rep.pointsEarned || 150} pts
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 mt-3 sm:mt-0">
                      <a
                        href={`https://maps.google.com/?q=${repLat},${repLng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#1a3d22] hover:bg-[#255230] text-[#4ade80] border border-[#4ade80]/30 rounded-lg px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Navigation size={13} />
                        <span>Google Map</span>
                      </a>

                      <button
                        onClick={() => handleResolveReport(rep.id)}
                        className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg px-3.5 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle size={13} />
                        <span>Collect Waste</span>
                      </button>

                      <button
                        onClick={() => setFlaggingReport(rep)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-lg px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        title="Flag as Fake Dumping Report"
                      >
                        <AlertOctagon size={13} />
                        <span>Flag Fake</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "Pickups" && (
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-white font-display font-700 text-lg">On-Demand Pickup Requests</div>
              <div className="text-[#4b7a5a] text-sm">Coordinate-matched pickup requests on your route.</div>
            </div>
            <button onClick={() => setPickupRequests(getPickupRequests())} className="text-[#4ade80] border border-[#1a3d22] rounded-lg p-2"><RefreshCw size={15} /></button>
          </div>
          <div className="space-y-3">
            {pickupRequests.filter((request) => request.status !== "completed").map((job, index) => {
              const accepted = job.status === "accepted";
              const jobLat = job.lat ?? 23.7542;
              const jobLng = job.lng ?? 90.3654;

              return <div key={job.id} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{job.requesterName}</span>
                      <span className="text-[#4ade80] font-mono font-bold">৳{job.amount}</span>
                      <span className="text-[10px] font-mono text-[#86efac] bg-[#061309] border border-[#1a3d22] px-2 py-0.5 rounded-full">{job.date}</span>
                    </div>
                    <div className="text-[#86efac] text-sm mt-1">{job.wasteType}</div>
                    <div className="text-[#4b7a5a] text-xs mt-1 flex items-center gap-1">
                      <MapPin size={11} className="text-[#4ade80]" />
                      <span>{job.address} · Coords: {jobLat.toFixed(4)}, {jobLng.toFixed(4)}</span>
                    </div>
                    {accepted && (
                      <div className="mt-3 bg-[#061309] border border-[#1a3d22] rounded-xl p-3">
                        <div className="text-[#60a5fa] text-xs mb-2">Accepted. Enter customer 6-digit verification code to complete & credit deposit:</div>
                        <div className="flex gap-2">
                          <input
                            value={driverCodes[job.id] ?? ""}
                            onChange={e => setDriverCodes(c => ({ ...c, [job.id]: e.target.value }))}
                            placeholder="6-digit code"
                            maxLength={6}
                            className="flex-1 bg-[#0d2414] border border-[#1a3d22] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#4ade80]"
                          />
                          <button
                            onClick={() => handleDriverComplete(Number(job.id), job.amount)}
                            className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
                          >
                            Claim ৳{job.amount}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={`https://maps.google.com/?q=${jobLat},${jobLng}`} target="_blank" rel="noreferrer" className="border border-[#1a3d22] text-[#60a5fa] rounded-lg px-3 py-2 text-xs">Map</a>
                    <button
                      disabled={accepted}
                      onClick={() => {
                        api.pickups.accept(String(job.id)).catch(() => {});
                        setPickupRequests(acceptPickupRequest(Number(job.id)));
                      }}
                      className="bg-[#16a34a] disabled:bg-[#1a3d22] disabled:text-[#4b7a5a] text-white rounded-lg px-4 py-2 text-xs font-semibold"
                    >
                      {accepted ? "Awaiting code" : "Accept job"}
                    </button>
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
            {pickupRequests.filter((request) => request.status !== "completed").length === 0 && (
              <div className="text-[#4b7a5a] text-sm text-center py-12">No active on-demand pickup requests on your scheduled route.</div>
            )}
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
      {/* Flag Fake Report Modal */}
      {flaggingReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setFlaggingReport(null)}>
          <div className="bg-[#0d2414] border border-red-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#1a3d22] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <AlertOctagon size={18} />
                </div>
                <div>
                  <h3 className="font-display font-700 text-white text-base">Flag Fake Dumping Report</h3>
                  <p className="text-[11px] font-mono text-red-400">{flaggingReport.reportCode}</p>
                </div>
              </div>
              <button onClick={() => setFlaggingReport(null)} className="text-[#4b7a5a] hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {flagSuccessMsg ? (
              <div className="py-4 text-center">
                <CheckCircle size={36} className="text-[#4ade80] mx-auto mb-2" />
                <div className="text-white font-bold text-sm">{flagSuccessMsg}</div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
                  ⚠️ <strong>Fraud Notice:</strong> Flagging this coordinate will mark the report as a false dump and automatically <strong>revoke {flaggingReport.pointsEarned || 150} eco points</strong> from the reporter's account.
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#86efac] mb-1.5">REASON FOR FLAGGING</label>
                  <select
                    value={flagFakeReason}
                    onChange={e => setFlagFakeReason(e.target.value)}
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-red-400"
                  >
                    <option>No garbage/waste found at this coordinate</option>
                    <option>False / staged dumping photo</option>
                    <option>Private property / incorrect complaint</option>
                    <option>Duplicate or spam submission</option>
                  </select>
                </div>

                <div className="text-xs text-[#4b7a5a]">
                  Location: <strong className="text-white">{flaggingReport.location}</strong> ({flaggingReport.lat?.toFixed(5) || "23.7542"}, {flaggingReport.lng?.toFixed(5) || "90.3654"})
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setFlaggingReport(null)}
                    className="flex-1 border border-[#1a3d22] text-[#4b7a5a] hover:text-white py-2.5 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmittingFlag}
                    onClick={handleFlagFake}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    {isSubmittingFlag ? "Revoking..." : "Confirm & Revoke Points"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
