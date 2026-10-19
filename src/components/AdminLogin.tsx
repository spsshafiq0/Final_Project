import { useState, useEffect } from "react";
import { Recycle, Shield, ChevronRight, Eye, EyeOff, AlertCircle, KeyRound, CheckCircle, Globe2, Loader2, Truck, Users } from "lucide-react";
import api, { WardItem, CityCorporationItem, userStorage } from "../lib/api";

interface AdminLoginProps {
  onLogin: (role: "super" | "city" | "ward", targetId?: string | number) => void;
  onNavigate: (page: string) => void;
}

export default function AdminLogin({ onLogin, onNavigate }: AdminLoginProps) {
  const [tab, setTab] = useState<"city" | "ward" | "super" | "driver" | "citizen">("city");
  const [ward, setWard] = useState<string>("1");
  const [pass, setPass] = useState("");
  const [username, setUsername] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetPhone, setResetPhone] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [dynamicWards, setDynamicWards] = useState<WardItem[]>([]);
  const [dynamicCities, setDynamicCities] = useState<CityCorporationItem[]>([]);

  // Load wards & cities from database/API
  useEffect(() => {
    async function loadData() {
      try {
        const [cities, wards] = await Promise.all([
          api.cities.getAll().catch(() => []),
          api.wards.getAll().catch(() => []),
        ]);
        if (cities && cities.length > 0) setDynamicCities(cities);
        if (wards && wards.length > 0) {
          setDynamicWards(wards);
          setWard(wards[0].id);
        }
      } catch (e) {
        console.warn("Could not fetch remote cities/wards for login dropdown, using fallback.");
      }
    }
    loadData();
  }, []);

  const handleQuickFill = (role: "super" | "city" | "ward" | "driver" | "citizen") => {
    setTab(role);
    setError("");
    if (role === "super") {
      setUsername("spsshafiq");
      setPass("Sps(#)12D");
    } else if (role === "city") {
      setUsername("spsshafiq_city");
      setPass("Sps(#)12D");
    } else if (role === "ward") {
      setUsername("spsshafiq_ward");
      setPass("Sps(#)12D");
    } else if (role === "driver") {
      setUsername("spsshafiq_driver");
      setPass("Sps(#)12D");
    } else if (role === "citizen") {
      setUsername("spsshafiq_citizen");
      setPass("Sps(#)12D");
    }
  };

  const handleLogin = async () => {
    if (!username || !pass) {
      setError("Username and password are required");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // 1. Try real backend API authentication
      const result = await api.auth.login(username, pass);
      setLoading(false);

      if (result.user.role === "SUPER_ADMIN") {
        onLogin("super");
      } else if (result.user.role === "CITY_ADMIN") {
        onLogin("city", result.user.cityCorpId || undefined);
      } else if (result.user.role === "WARD_ADMIN") {
        onLogin("ward", result.user.wardId || undefined);
      } else if (result.user.role === "DRIVER") {
        onNavigate("collector");
      } else if (result.user.role === "BUSINESS") {
        onNavigate("business");
      } else {
        onNavigate("citizen");
      }
    } catch (apiError: any) {
      // 2. Fallback to local demo credentials if server/database is not yet reached
      const isSuper =
        (username === "spsshafiq" || username === "superadmin" || username === "S.p.s.admin.all" || tab === "super") &&
        (pass === "Sps(#)12D" || pass === "admin123" || pass === "You#got789^)*()#@~77qQ");

      const isCity =
        (username === "spsshafiq_city" || username === "city.admin" || username === "dscc.admin" || username === "dncc.admin" || tab === "city") &&
        (pass === "Sps(#)12D" || pass === "admin123");

      const isWard =
        (username === "spsshafiq_ward" || username.startsWith("ward") || tab === "ward") &&
        (pass === "Sps(#)12D" || pass === "ward123" || pass === "admin123");

      const isDriver =
        (username === "spsshafiq_driver" || username === "driver01" || tab === "driver") &&
        (pass === "Sps(#)12D" || pass === "driver123" || pass === "admin123");

      const isCitizen =
        (username === "spsshafiq_citizen" || username === "citizen01" || tab === "citizen") &&
        (pass === "Sps(#)12D" || pass === "user123" || pass === "admin123");

      const isBiz =
        (username === "spsshafiq_biz" || username === "business01") && (pass === "Sps(#)12D" || pass === "business123" || pass === "admin123");

      if (isSuper) {
        setLoading(false);
        userStorage.set({ id: "super-01", username: "spsshafiq", fullName: "Shafiq", email: "spsshafiq95@gmail.com", role: "SUPER_ADMIN" });
        onLogin("super");
        return;
      }
      if (isCity) {
        setLoading(false);
        userStorage.set({ id: "city-01", username: username || "spsshafiq_city", fullName: "Shafiq (DNCC Chief)", email: "spsshafiq95@gmail.com", role: "CITY_ADMIN", cityCorpId: "dncc" });
        onLogin("city");
        return;
      }
      if (isWard) {
        setLoading(false);
        userStorage.set({ id: "ward-01", username: username || "spsshafiq_ward", fullName: "Shafiq (Ward 01 Inspector)", email: "spsshafiq95@gmail.com", role: "WARD_ADMIN", wardId: ward });
        onLogin("ward", ward);
        return;
      }
      if (isDriver) {
        setLoading(false);
        userStorage.set({ id: "driver-01", username: "spsshafiq_driver", fullName: "Shafiq (Truck Driver)", email: "spsshafiq95@gmail.com", role: "DRIVER" });
        onNavigate("collector");
        return;
      }
      if (isCitizen) {
        setLoading(false);
        userStorage.set({ id: "citizen-01", username: "spsshafiq_citizen", fullName: "Shafiq (Citizen)", email: "spsshafiq95@gmail.com", role: "CITIZEN", points: 2847 });
        onNavigate("citizen");
        return;
      }
      if (isBiz) {
        setLoading(false);
        userStorage.set({ id: "biz-01", username: "spsshafiq_biz", fullName: "Shafiq Commercial Enterprise", email: "spsshafiq95@gmail.com", role: "BUSINESS" });
        onNavigate("business");
        return;
      }

      setLoading(false);
      setError(apiError?.message || "Invalid username or password");
    }
  };

  const displayWards = dynamicWards.length > 0 ? dynamicWards : [
    { id: "1", name: "Ward 01", area: "Uttara North", cityCorpId: "dncc", population: 48000, councilor: "" },
    { id: "2", name: "Ward 02", area: "Uttara South", cityCorpId: "dncc", population: 52000, councilor: "" },
    { id: "3", name: "Ward 03", area: "Khilkhet", cityCorpId: "dncc", population: 39000, councilor: "" },
    { id: "4", name: "Ward 04", area: "Vatara", cityCorpId: "dncc", population: 29000, councilor: "" },
    { id: "5", name: "Ward 05", area: "Badda", cityCorpId: "dncc", population: 61000, councilor: "" },
    { id: "6", name: "Ward 06", area: "Gulshan", cityCorpId: "dncc", population: 44000, councilor: "" },
    { id: "10", name: "Ward 10", area: "Dhanmondi", cityCorpId: "dncc", population: 55000, councilor: "" },
    { id: "11", name: "Ward 11", area: "Mirpur-10", cityCorpId: "dncc", population: 83000, councilor: "" },
  ];

  return (
    <div
      className="min-h-screen bg-[#061309] flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #061309 0%, #0a1f0e 100%)" }}
    >
      <div className="absolute inset-0 map-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#16a34a] rounded-2xl flex items-center justify-center mx-auto mb-4 glow-green shadow-lg">
            <Recycle size={30} className="text-white" />
          </div>
          <div className="font-display font-800 text-2xl text-white">IntelliWaste Operations</div>
          <div className="text-[#4b7a5a] text-sm mt-1">Smart City Waste Management Platform</div>
        </div>

        {/* Card */}
        <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Role tabs */}
          <div className="flex flex-wrap gap-1 bg-[#061309] rounded-xl p-1 mb-5">
            <button
              onClick={() => handleQuickFill("super")}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "super" ? "bg-[#16a34a] text-white shadow" : "text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <Globe2 size={13} />
              Super
            </button>
            <button
              onClick={() => handleQuickFill("city")}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "city" ? "bg-[#16a34a] text-white shadow" : "text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <Shield size={13} />
              City Corp
            </button>
            <button
              onClick={() => handleQuickFill("ward")}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "ward" ? "bg-[#16a34a] text-white shadow" : "text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <Recycle size={13} />
              Ward
            </button>
            <button
              onClick={() => handleQuickFill("driver")}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "driver" ? "bg-[#16a34a] text-white shadow" : "text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <Truck size={13} />
              Driver
            </button>
            <button
              onClick={() => handleQuickFill("citizen")}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "citizen" ? "bg-[#16a34a] text-white shadow" : "text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <Users size={13} />
              Citizen
            </button>
          </div>

          {/* Role info */}
          <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-3.5 mb-5">
            {tab === "super" && (
              <div>
                <div className="text-[#4ade80] font-mono text-xs mb-1">👑 SUPER ADMIN (MINISTRY CENTRAL)</div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  National authority: Add City Corporations, assign Central Admins, and view country-wide operational metrics.
                </div>
              </div>
            )}
            {tab === "city" && (
              <div>
                <div className="text-[#4ade80] font-mono text-xs mb-1">🏢 CITY CORPORATION ADMIN (DNCC / DSCC)</div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  Jurisdiction management: Configure point-to-cash rate (৳0.20/pt), add wards, assign sub-admins, view all trucks & bins.
                </div>
              </div>
            )}
            {tab === "ward" && (
              <div>
                <div className="text-[#60a5fa] font-mono text-xs mb-1">🏛️ SUB-ADMIN (LOCAL WARD 01 INSPECTOR)</div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  Ward level: Monitor local smart bins & trucks, disburse physical cash to citizens with digital voucher codes.
                </div>
              </div>
            )}
            {tab === "driver" && (
              <div>
                <div className="text-[#f59e0b] font-mono text-xs mb-1">🚚 TRUCK DRIVER / COLLECTOR</div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  Field operations: Real-time route navigation, bin emptying logs, hazard protocol, and paid pickup jobs.
                </div>
              </div>
            )}
            {tab === "citizen" && (
              <div>
                <div className="text-[#38bdf8] font-mono text-xs mb-1">👤 CITIZEN USER (REWARDS & CASH OUT)</div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  Public portal: 2,847 recycling points pre-loaded. Request cash voucher, schedule pickups, report garbage issues.
                </div>
              </div>
            )}
          </div>

          {/* Ward selector for Ward Admin */}
          {tab === "ward" && (
            <div className="mb-4">
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">SELECT YOUR WARD</label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-[#86efac] text-sm focus:border-[#4ade80] outline-none"
              >
                {displayWards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — {w.area}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">USERNAME</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                tab === "super"
                  ? "spsshafiq"
                  : tab === "city"
                  ? "spsshafiq_city"
                  : tab === "ward"
                  ? "spsshafiq_ward"
                  : tab === "driver"
                  ? "spsshafiq_driver"
                  : "spsshafiq_citizen"
              }
              autoComplete="username"
              className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#4ade80] outline-none"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">PASSWORD</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#4ade80] outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4b7a5a] hover:text-[#86efac]"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {tab === "ward" && (
            <button
              onClick={() => {
                setForgotOpen(true);
                setResetStep(1);
              }}
              className="text-xs text-[#4ade80] hover:underline mb-4 flex items-center gap-1.5"
            >
              <KeyRound size={12} /> Forgot password?
            </button>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#16a34a] text-white font-semibold py-3 rounded-xl hover:bg-[#15803d] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Login as {tab === "super" ? "Super Admin" : tab === "city" ? "City Admin" : tab === "ward" ? "Ward Sub-Admin" : tab === "driver" ? "Driver" : "Citizen"}
                <ChevronRight size={16} />
              </>
            )}
          </button>

          {/* Quick Demo Fills Grid */}
          <div className="mt-5 pt-4 border-t border-[#1a3d22]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] text-[#4b7a5a] font-mono font-semibold">ALL TEST ACCOUNTS (1-CLICK FILL):</span>
              <span className="text-[10px] text-[#86efac]/70">Password: Sps(#)12D</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("super")}
                className="text-left text-[11px] p-2 bg-[#061309] border border-[#1a3d22] hover:border-[#4ade80] rounded-xl transition-all group"
              >
                <div className="text-[#4ade80] font-semibold flex items-center justify-between">
                  <span>👑 Super Admin</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#16a34a]/20 text-[#4ade80]">Shafiq</span>
                </div>
                <div className="font-mono text-[10px] text-[#86efac]/80 mt-0.5">spsshafiq / Sps(#)12D</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("city")}
                className="text-left text-[11px] p-2 bg-[#061309] border border-[#1a3d22] hover:border-[#4ade80] rounded-xl transition-all group"
              >
                <div className="text-[#86efac] font-semibold flex items-center justify-between">
                  <span>🏢 City Corp</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#16a34a]/20 text-[#86efac]">DNCC</span>
                </div>
                <div className="font-mono text-[10px] text-[#86efac]/80 mt-0.5">spsshafiq_city / Sps(#)12D</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("ward")}
                className="text-left text-[11px] p-2 bg-[#061309] border border-[#60a5fa]/40 hover:border-[#60a5fa] rounded-xl transition-all group"
              >
                <div className="text-[#60a5fa] font-semibold flex items-center justify-between">
                  <span>🏛️ Sub-Admin</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#60a5fa]/20 text-[#60a5fa]">Ward 01</span>
                </div>
                <div className="font-mono text-[10px] text-[#93c5fd]/80 mt-0.5">spsshafiq_ward / Sps(#)12D</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("driver")}
                className="text-left text-[11px] p-2 bg-[#061309] border border-[#f59e0b]/40 hover:border-[#f59e0b] rounded-xl transition-all group"
              >
                <div className="text-[#f59e0b] font-semibold flex items-center justify-between">
                  <span>🚚 Driver</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b]">DNCC-T01</span>
                </div>
                <div className="font-mono text-[10px] text-[#fcd34d]/80 mt-0.5">spsshafiq_driver / Sps(#)12D</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("citizen")}
                className="col-span-2 text-left text-[11px] p-2 bg-[#061309] border border-[#38bdf8]/40 hover:border-[#38bdf8] rounded-xl transition-all group"
              >
                <div className="text-[#38bdf8] font-semibold flex items-center justify-between">
                  <span>👤 Citizen (Shafiq)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8]">2,847 pts ready</span>
                </div>
                <div className="font-mono text-[10px] text-[#7dd3fc]/80 mt-0.5">spsshafiq_citizen / Sps(#)12D (Test Cash Out to BDT)</div>
              </button>
            </div>
          </div>

          <div className="text-center mt-5">
            <button
              onClick={() => onNavigate("landing")}
              className="text-xs text-[#4b7a5a] hover:text-[#86efac] transition-colors"
            >
              ← Back to public portal
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
          onClick={() => setForgotOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#16a34a]/20 rounded-xl flex items-center justify-center">
                <KeyRound size={18} className="text-[#4ade80]" />
              </div>
              <div>
                <div className="font-display font-700 text-white">Reset ward password</div>
                <div className="text-[#4b7a5a] text-xs">Secure mobile verification</div>
              </div>
            </div>
            {resetStep === 1 && (
              <div className="space-y-4">
                <input
                  value={resetPhone}
                  onChange={(e) => setResetPhone(e.target.value)}
                  placeholder="Account phone number"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none"
                />
                <button
                  disabled={!resetPhone}
                  onClick={() => setResetStep(2)}
                  className="w-full bg-[#16a34a] disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold"
                >
                  Send verification code
                </button>
              </div>
            )}
            {resetStep === 2 && (
              <div className="space-y-4">
                <div className="text-[#86efac] text-sm">
                  A 6-digit code was sent to {resetPhone}. For this demo, use{" "}
                  <span className="font-mono text-[#4ade80]">123456</span>.
                </div>
                <input
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create new password"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-3 text-white text-sm outline-none"
                />
                <button
                  disabled={resetCode !== "123456" || newPassword.length < 6}
                  onClick={() => {
                    setPass(newPassword);
                    setResetStep(3);
                  }}
                  className="w-full bg-[#16a34a] disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold"
                >
                  Reset password
                </button>
              </div>
            )}
            {resetStep === 3 && (
              <div className="text-center py-4">
                <CheckCircle size={38} className="text-[#4ade80] mx-auto mb-3" />
                <div className="text-white font-display font-700">Password updated</div>
                <div className="text-[#4b7a5a] text-sm mt-1 mb-5">Your new password is ready to use.</div>
                <button
                  onClick={() => setForgotOpen(false)}
                  className="w-full bg-[#16a34a] text-white rounded-xl py-3 text-sm font-semibold"
                >
                  Return to login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
