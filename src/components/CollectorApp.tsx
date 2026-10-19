import { useState } from "react";
import { Truck, MapPin, CheckCircle, AlertTriangle, Clock, Navigation, Package, Shield, ArrowLeft, ChevronRight, Battery, Fuel, Wind, Wallet, Banknote, Home, ListChecks, Trash2, KeyRound, LogIn, RefreshCw, LogOut } from "lucide-react";
import NearbyBinsMap from "./NearbyBinsMap";
import { acceptPickupRequest, completePickupRequest, getDriverBalance, getPickupRequests, setDriverBalance, type PickupRequest } from "../data/pickupStore";
import api from "../lib/api";

interface CollectorAppProps {
  onNavigate: (page: string) => void;
}

const route = [
  { stop: 1, bin: "B-218", loc: "House 12, Road 5, Gulshan-2", fill: 92, cap: "120L", status: "urgent", done: false, hazard: false },
  { stop: 2, bin: "B-204", loc: "Old Town Market, Old Dhaka", fill: 96, cap: "120L", status: "fire", done: false, hazard: true },
  { stop: 3, bin: "B-102", loc: "Mirpur-10 Roundabout", fill: 87, cap: "120L", status: "urgent", done: false, hazard: false },
  { stop: 4, bin: "B-156", loc: "Block E, Banani Road 11", fill: 71, cap: "120L", status: "warning", done: false, hazard: false },
  { stop: 5, bin: "B-047", loc: "Satmasjid Road, Dhanmondi", fill: 54, cap: "240L", status: "normal", done: false, hazard: false },
  { stop: 6, bin: "B-117", loc: "Mohammadpur Bus Stand", fill: 33, cap: "240L", status: "normal", done: false, hazard: false },
];

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
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetIdentity, setResetIdentity] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
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

  const progress = (completedStops.length / route.length) * 100;

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
    } catch {
      // Fallback to local credential check
    }

    if (driverPassword !== "driver123" && driverPassword !== driverResetPassword && driverPassword !== "admin123") {
      setLoginError("Invalid driver credentials.");
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
            <div className="text-[#4b7a5a] text-sm mt-1 mb-6">Access your assigned bins, pickups and earnings.</div>
            <div className="space-y-4">
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-2">PHONE NUMBER OR USERNAME</label>
                <input value={driverIdentity} onChange={e => setDriverIdentity(e.target.value)} autoComplete="username" placeholder="01711-201025 or driver.username" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4ade80]" />
              </div>
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-2">PASSWORD</label>
                <input type="password" value={driverPassword} onChange={e => setDriverPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && loginDriver()} autoComplete="current-password" placeholder="Enter password" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4ade80]" />
              </div>
            </div>
            <button onClick={() => { setForgotOpen(true); setResetStep(1); setLoginError(""); }} className="text-[#4ade80] text-xs mt-4 flex items-center gap-1.5"><KeyRound size={12} /> Forgot password?</button>
            {loginError && <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs mt-4">{loginError}</div>}
            <button onClick={loginDriver} className="w-full bg-[#16a34a] text-white rounded-xl py-3 mt-5 font-semibold flex items-center justify-center gap-2"><LogIn size={16} /> Login to Driver Portal</button>

            {/* Quick Demo Fill for Driver */}
            <div className="mt-4 pt-4 border-t border-[#1a3d22]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#4b7a5a] font-mono font-semibold">TEST DRIVER ACCOUNT:</span>
                <span className="text-[10px] text-[#4ade80]">1-Click load</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDriverIdentity("driver01");
                  setDriverPassword("driver123");
                  setLoginError("");
                }}
                className="w-full text-left text-xs p-2.5 bg-[#061309] border border-[#1a3d22] hover:border-[#4ade80] rounded-xl transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#4ade80]">🚚 Abdul Karim (Truck Driver)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#16a34a]/30 text-[#4ade80]">DNCC-T01</span>
                </div>
                <div className="text-[11px] font-mono text-[#4b7a5a] mt-1">
                  Username: <strong className="text-white">driver01</strong> | Password: <strong className="text-white">driver123</strong>
                </div>
              </button>
            </div>
          </div>
        </div>

        {forgotOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={() => setForgotOpen(false)}>
            <div className="w-full max-w-md bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-5 sm:p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#16a34a]/20 rounded-xl flex items-center justify-center"><KeyRound size={18} className="text-[#4ade80]" /></div>
                <div><div className="font-display font-700 text-white">Reset driver password</div><div className="text-[#4b7a5a] text-xs">Verify the account-linked phone number</div></div>
              </div>
              {resetStep === 1 && <div className="space-y-4">
                <input value={resetIdentity} onChange={e => setResetIdentity(e.target.value)} placeholder="Registered phone number" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none" />
                <button disabled={!resetIdentity} onClick={() => setResetStep(2)} className="w-full bg-[#16a34a] disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold">Send verification code</button>
              </div>}
              {resetStep === 2 && <div className="space-y-4">
                <div className="text-[#86efac] text-sm">A 6-digit code was sent to {resetIdentity}. For this demo, use <span className="font-mono text-[#4ade80]">123456</span>.</div>
                <input value={resetCode} onChange={e => setResetCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Create new password" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none" />
                <button disabled={resetCode !== "123456" || newPassword.length < 6} onClick={() => { setDriverResetPassword(newPassword); setDriverPassword(newPassword); setResetStep(3); }} className="w-full bg-[#16a34a] disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold">Reset password</button>
              </div>}
              {resetStep === 3 && <div className="text-center py-4">
                <CheckCircle size={38} className="text-[#4ade80] mx-auto mb-3" />
                <div className="text-white font-display font-700">Password updated</div>
                <div className="text-[#4b7a5a] text-sm mt-1 mb-5">You can now log in with the new password.</div>
                <button onClick={() => { setDriverIdentity(resetIdentity); setForgotOpen(false); }} className="w-full bg-[#16a34a] text-white rounded-xl py-3 text-sm font-semibold">Return to login</button>
              </div>}
            </div>
          </div>
        )}
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
              {route.slice(0, 3).map(stop => <div key={stop.bin} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-4">
                <div className="flex items-center justify-between"><span className="font-mono text-white font-bold">{stop.bin}</span><span className={stop.fill > 90 ? "text-red-400 font-mono" : "text-orange-400 font-mono"}>{stop.fill}%</span></div>
                <div className="text-[#4b7a5a] text-xs mt-2">{stop.loc}</div>
                <a href={`https://maps.google.com/?q=${stop.loc}`} target="_blank" rel="noreferrer" className="text-[#60a5fa] text-xs mt-3 flex items-center gap-1"><Navigation size={12} /> Open location</a>
              </div>)}
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

      {/* Hazard alert */}
      {activeTab === "Bins" && route.some(r => r.hazard && !completedStops.includes(r.stop)) && (
        <div className="bg-red-500/15 border-b border-red-500/40 px-4 py-3">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <div className="flex-1">
              <div className="text-red-400 text-sm font-semibold">Hazardous Stop Ahead: Bin B-204 (Fire/Smoke Detected)</div>
              <div className="text-red-300 text-xs">Follow hazard safety protocol before approaching</div>
            </div>
            <button onClick={() => setShowHazard(true)} className="text-xs text-red-400 border border-red-400/50 px-3 py-1.5 rounded-lg hover:bg-red-500/10 whitespace-nowrap">
              View Protocol
            </button>
          </div>
        </div>
      )}

      {/* Route list */}
      <div className={`${activeTab === "Bins" ? "block" : "hidden"} max-w-3xl mx-auto px-4 py-4 space-y-3`}>
        {route.map(stop => {
          const isDone = completedStops.includes(stop.stop);
          const isActive = activeStop === stop.stop;
          return (
            <div
              key={stop.stop}
              className={`border rounded-xl overflow-hidden transition-all ${
                isDone ? "border-[#1a3d22] opacity-60" :
                stop.hazard ? "border-red-500/50" :
                stop.status === "urgent" ? "border-orange-500/50" :
                stop.status === "warning" ? "border-yellow-500/30" :
                "border-[#1a3d22]"
              } ${isDone ? "bg-[#0a1f0e]" : "bg-[#0d2414]"}`}
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setActiveStop(isActive ? null : stop.stop)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                  isDone ? "bg-[#4ade80] text-[#052e16]" :
                  stop.hazard ? "bg-red-500/20 text-red-400" :
                  stop.status === "urgent" ? "bg-orange-500/20 text-orange-400" :
                  "bg-[#1a3d22] text-[#4b7a5a]"
                }`}>
                  {isDone ? <CheckCircle size={16} /> : stop.stop}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-white text-sm">{stop.bin}</span>
                    {stop.hazard && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">⚠️ HAZARD</span>}
                    {stop.status === "urgent" && !stop.hazard && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">URGENT</span>}
                  </div>
                  <div className="text-[#4b7a5a] text-xs truncate">{stop.loc}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-sm" style={{ color: stop.fill > 80 ? "#ef4444" : stop.fill > 60 ? "#f59e0b" : "#4ade80" }}>{stop.fill}%</div>
                    <div className="text-[#4b7a5a] text-xs font-mono">{stop.cap}</div>
                  </div>
                  <ChevronRight size={14} className={`text-[#4b7a5a] transition-transform ${isActive ? "rotate-90" : ""}`} />
                </div>
              </div>

              {isActive && !isDone && (
                <div className="border-t border-[#1a3d22] p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#061309] rounded-lg p-3">
                      <div className="text-[#4b7a5a] mb-1">Fill Level</div>
                      <div className="font-mono font-bold" style={{ color: stop.fill > 80 ? "#ef4444" : "#f59e0b" }}>{stop.fill}%</div>
                    </div>
                    <div className="bg-[#061309] rounded-lg p-3">
                      <div className="text-[#4b7a5a] mb-1">Capacity</div>
                      <div className="font-mono font-bold text-[#86efac]">{stop.cap}</div>
                    </div>
                  </div>

                  {stop.hazard && (
                    <button onClick={() => setShowHazard(true)} className="w-full bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
                      <Shield size={14} />
                      View Hazard Safety Protocol First
                    </button>
                  )}

                  <div className="flex gap-3">
                    <a
                      href={`https://maps.google.com/?q=${stop.loc}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-[#1a3d22] border border-[#1a3d22] text-[#4ade80] rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:border-[#4ade80]/40 transition-colors"
                    >
                      <Navigation size={14} />
                      Navigate
                    </a>
                    <button
                      onClick={() => toggleStop(stop.stop)}
                      className="flex-1 bg-[#16a34a] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#15803d] transition-colors"
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              )}

              {isDone && (
                <div className="border-t border-[#1a3d22] px-4 py-2 flex items-center justify-between">
                  <span className="text-[#4ade80] text-xs font-mono">✓ Collected</span>
                  <button onClick={() => setCompletedStops(p => p.filter(s => s !== stop.stop))} className="text-[#4b7a5a] text-xs hover:text-[#86efac]">Undo</button>
                </div>
              )}
            </div>
          );
        })}

        {/* End of route */}
        {completedStops.length === route.length && (
          <div className="bg-[#0d2414] border border-[#4ade80]/40 rounded-xl p-6 text-center">
            <CheckCircle size={40} className="text-[#4ade80] mx-auto mb-3" />
            <div className="font-display font-700 text-white text-xl mb-1">Route Complete! 🎉</div>
            <div className="text-[#86efac] text-sm mb-4">All {route.length} bins collected. Return to depot.</div>
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-[#061309] rounded-lg p-3">
                <div className="text-[#4ade80] font-bold text-lg">0.8t</div>
                <div className="text-[#4b7a5a]">Total load</div>
              </div>
              <div className="bg-[#061309] rounded-lg p-3">
                <div className="text-[#4ade80] font-bold text-lg">6</div>
                <div className="text-[#4b7a5a]">Bins done</div>
              </div>
              <div className="bg-[#061309] rounded-lg p-3">
                <div className="text-[#4ade80] font-bold text-lg">2h 3m</div>
                <div className="text-[#4b7a5a]">Duration</div>
              </div>
            </div>
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
