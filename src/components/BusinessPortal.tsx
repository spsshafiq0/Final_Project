import { useState } from "react";
import { ArrowLeft, CheckCircle, Clock, Home, LogIn, LogOut, RefreshCw, ShieldCheck, Store, UserPlus, Wallet, KeyRound } from "lucide-react";
import NearbyBinsMap from "./NearbyBinsMap";
import { addPickupRequest, completePickupRequest, getPickupRequests, type PickupRequest } from "../data/pickupStore";
import api from "../lib/api";
import ForgotPasswordModal from "./ForgotPasswordModal";

interface BusinessPortalProps {
  onNavigate: (page: string) => void;
}

interface BusinessProfile {
  shopName: string;
  email: string;
  password: string;
}

const PROFILE_KEY = "intelliwaste-business-profile";

export default function BusinessPortal({ onNavigate }: BusinessPortalProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [balance, setBalance] = useState(Number(localStorage.getItem("intelliwaste-business-balance") ?? "6000"));
  const [requests, setRequests] = useState<PickupRequest[]>(getPickupRequests());
  const [form, setForm] = useState({ area: "Mohammadpur", address: "", wasteType: "Restaurant Mixed Waste", date: "", amount: "450" });
  const [codes, setCodes] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");

  const login = async () => {
    if (!email || !password || (authMode === "register" && !shopName)) {
      setAuthError("Complete all required fields.");
      return;
    }
    setAuthError("");

    try {
      if (authMode === "register") {
        const username = email.split("@")[0] || `biz_${Date.now()}`;
        const res = await api.auth.register({
          username,
          password,
          fullName: shopName,
          email,
          role: "BUSINESS",
        });
        if (res?.user) {
          setShopName(res.user.fullName);
        }
      } else {
        const username = email.includes("@") ? email.split("@")[0] : email;
        const res = await api.auth.login(username, password);
        if (res?.user) {
          setShopName(res.user.fullName);
        }
      }
      setAuthenticated(true);
    } catch (err: any) {
      // Local fallback
      if (authMode === "register") {
        const profile: BusinessProfile = { shopName, email, password };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        localStorage.setItem("intelliwaste-business-balance", "6000");
        setBalance(6000);
        setAuthenticated(true);
      } else {
        const stored = localStorage.getItem(PROFILE_KEY);
        const profile = stored ? (JSON.parse(stored) as BusinessProfile) : null;
        if (profile && profile.email === email && profile.password === password) {
          setShopName(profile.shopName);
          setAuthenticated(true);
          return;
        }
        setAuthError(err?.message || "Invalid business credentials");
      }
    }
  };

  const refreshRequests = () => setRequests(getPickupRequests());

  const createRequest = () => {
    const amount = Number(form.amount);
    if (!form.address || !form.date || amount < 100) {
      setMessage("Enter a complete address, date and a deposit of at least ৳100.");
      return;
    }
    if (amount > balance) {
      setMessage("Deposit exceeds your current business balance.");
      return;
    }
    addPickupRequest({
      requesterType: "business",
      requesterName: shopName,
      area: form.area,
      address: form.address,
      wasteType: form.wasteType,
      date: form.date,
      amount,
    });
    setMessage(`৳${amount} reserved. Your request is now visible to area drivers.`);
    setForm((current) => ({ ...current, address: "", date: "" }));
    refreshRequests();
  };

  const confirmPickup = (request: PickupRequest) => {
    const result = completePickupRequest(request.id, codes[request.id] ?? "");
    setRequests(result.requests);
    if (result.success) {
      setBalance((current) => {
        const updated = current - request.amount;
        localStorage.setItem("intelliwaste-business-balance", String(updated));
        return updated;
      });
      setCodes((current) => {
        const copy = { ...current };
        delete copy[request.id];
        return copy;
      });
      setMessage(`Pickup confirmed. ৳${request.amount} was credited to the driver.`);
    } else {
      setMessage("The security code is incorrect.");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#061309] px-4 py-8 flex items-center justify-center">
        <div className="absolute inset-0 map-grid opacity-20" />
        <div className="relative z-10 w-full max-w-md">
          <button onClick={() => onNavigate("landing")} className="text-[#86efac] text-sm flex items-center gap-2 mb-6"><ArrowLeft size={16} /> Back to home</button>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-5 sm:p-8">
            <div className="w-12 h-12 bg-[#16a34a] rounded-xl flex items-center justify-center mb-4"><Store size={22} className="text-white" /></div>
            <div className="font-display font-800 text-2xl text-white">Shop & Restaurant</div>
            <div className="text-[#4b7a5a] text-sm mt-1 mb-6">Request secure, paid waste pickup for your business.</div>
            <div className="grid grid-cols-2 bg-[#061309] rounded-xl p-1 mb-5">
              {(["login", "register"] as const).map((mode) => <button key={mode} onClick={() => { setAuthMode(mode); setAuthError(""); }} className={`py-2.5 rounded-lg text-sm font-semibold capitalize ${authMode === mode ? "bg-[#16a34a] text-white" : "text-[#4b7a5a]"}`}>{mode}</button>)}
            </div>
            <div className="space-y-3">
              {authMode === "register" && <input value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="Shop or restaurant name" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4ade80]" />}
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4ade80]" />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && login()} placeholder="Password" autoComplete={authMode === "login" ? "current-password" : "new-password"} className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#4ade80]" />
              {authMode === "login" && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs text-[#4ade80] hover:underline flex items-center gap-1 font-medium"
                  >
                    <KeyRound size={12} /> Forgot password?
                  </button>
                </div>
              )}
            </div>
            {authError && <div className="text-red-400 bg-red-500/10 rounded-lg px-3 py-2 text-xs mt-3">{authError}</div>}
            <button onClick={login} className="w-full bg-[#16a34a] text-white rounded-xl py-3 mt-5 font-semibold flex items-center justify-center gap-2">{authMode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}{authMode === "login" ? "Login" : "Create business account"}</button>
          </div>
        </div>

        {/* Unified Brevo Email OTP Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={forgotOpen}
          onClose={() => setForgotOpen(false)}
          defaultIdentifier={email || ""}
          onSuccess={(newP) => {
            setPassword(newP);
          }}
        />
      </div>
    );
  }

  const ownRequests = requests.filter((request) => request.requesterType === "business" && request.requesterName === shopName);

  return (
    <div className="min-h-screen bg-[#f8fdf9]">
      <header className="bg-[#052e16] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => onNavigate("landing")} title="Back to home" className="text-[#86efac] hover:text-white transition-colors"><Home size={18} /></button>
            <div className="min-w-0"><div className="font-display font-700 truncate">{shopName}</div><div className="text-[#86efac] text-xs">Business Pickup Account</div></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#4ade80]/20 border border-[#4ade80]/30 rounded-xl px-3 py-2 flex items-center gap-2"><Wallet size={15} className="text-[#4ade80]" /><span className="font-mono font-bold text-[#4ade80]">৳{balance.toLocaleString()}</span></div>
            <button onClick={() => setAuthenticated(false)} title="Sign out" className="text-[#86efac] hover:text-white transition-colors p-1"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <NearbyBinsMap area={form.area} />

        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 bg-white border border-[#e2f5e9] rounded-2xl p-5">
            <div className="font-display font-700 text-[#052e16]">Create pickup request</div>
            <div className="text-[#4b7a5a] text-xs mt-1 mb-4">Your deposit is released only after security-code confirmation.</div>
            <div className="space-y-3">
              <select value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} className="w-full border border-[#e2f5e9] rounded-xl px-4 py-3 text-sm outline-none">
                {["Mohammadpur", "Dhanmondi", "Gulshan", "Banani", "Uttara", "Mirpur-10"].map((area) => <option key={area}>{area}</option>)}
              </select>
              <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Complete pickup address" className="w-full border border-[#e2f5e9] rounded-xl px-4 py-3 text-sm outline-none" />
              <select value={form.wasteType} onChange={(event) => setForm((current) => ({ ...current, wasteType: event.target.value }))} className="w-full border border-[#e2f5e9] rounded-xl px-4 py-3 text-sm outline-none">
                <option>Restaurant Mixed Waste</option><option>Hotel Mixed Waste</option><option>Shop Packaging Waste</option><option>General Extra Waste</option>
              </select>
              <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="w-full border border-[#e2f5e9] rounded-xl px-4 py-3 text-sm outline-none" />
              <input type="number" min="100" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} aria-label="Pickup deposit" className="w-full border border-[#e2f5e9] rounded-xl px-4 py-3 text-sm outline-none" />
              <button onClick={createRequest} className="w-full bg-[#052e16] text-white rounded-xl py-3 text-sm font-semibold">Reserve ৳{form.amount || "0"} & request</button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white border border-[#e2f5e9] rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><div className="font-display font-700 text-[#052e16]">Your pickup requests</div><div className="text-[#4b7a5a] text-xs">Confirm only after the driver completes collection.</div></div>
              <button onClick={refreshRequests} className="text-[#16a34a]"><RefreshCw size={16} /></button>
            </div>
            <div className="space-y-3">
              {ownRequests.map((request) => (
                <div key={request.id} className="border border-[#e2f5e9] rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><div className="font-semibold text-sm text-[#052e16]">{request.wasteType}</div><div className="text-[#4b7a5a] text-xs mt-1">{request.address} · ৳{request.amount}</div></div>
                    <span className={`text-xs rounded-full px-2 py-1 font-semibold ${request.status === "completed" ? "bg-green-100 text-green-700" : request.status === "accepted" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{request.status.toUpperCase()}</span>
                  </div>
                  {request.status === "open" && <div className="text-[#4b7a5a] text-xs mt-3 flex items-center gap-1"><Clock size={12} /> Waiting for an area driver</div>}
                  {request.status === "accepted" && <div className="mt-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3">
                    <div className="flex items-center gap-2 text-[#052e16] text-xs font-semibold mb-2"><ShieldCheck size={14} className="text-[#16a34a]" /> Driver accepted · {request.driverName}</div>
                    <div className="text-[#4b7a5a] text-xs mb-2">Security code: <span className="font-mono font-bold text-[#052e16]">{request.securityCode}</span>. Enter it after pickup to release payment.</div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input value={codes[request.id] ?? ""} onChange={(event) => setCodes((current) => ({ ...current, [request.id]: event.target.value }))} inputMode="numeric" maxLength={6} placeholder="Security code" className="flex-1 border border-[#bbf7d0] rounded-lg px-3 py-2 text-sm outline-none" />
                      <button onClick={() => confirmPickup(request)} className="bg-[#16a34a] text-white rounded-lg px-4 py-2 text-xs font-semibold">Confirm & release ৳{request.amount}</button>
                    </div>
                  </div>}
                  {request.status === "completed" && <div className="text-[#16a34a] text-xs mt-3 flex items-center gap-1"><CheckCircle size={13} /> Completed and driver credited</div>}
                </div>
              ))}
              {ownRequests.length === 0 && <div className="text-center text-[#4b7a5a] text-sm py-10">No pickup requests yet.</div>}
            </div>
          </div>
        </div>
        {message && <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-[#052e16] text-white rounded-xl p-4 shadow-2xl text-sm">{message}<button onClick={() => setMessage("")} className="float-right text-[#86efac] ml-3">Close</button></div>}
      </main>
    </div>
  );
}
