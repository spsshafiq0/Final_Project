import { useState, useEffect } from "react"
import {
  Recycle,
  Shield,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle,
  Globe2,
  Loader2,
  Truck,
  Users,
} from "lucide-react"
import api, {
  WardItem,
  CityCorporationItem,
  userStorage,
  tokenStorage,
} from "../lib/api"
import ForgotPasswordModal from "./ForgotPasswordModal"

interface AdminLoginProps {
  onLogin: (role: "super" | "city" | "ward", targetId?: string | number) => void
  onNavigate: (page: string) => void
}

export default function AdminLogin({ onLogin, onNavigate }: AdminLoginProps) {
  const [tab, setTab] =
    useState<"city" | "ward" | "super" | "driver" | "citizen">("city")
  const [ward, setWard] = useState<string>("1")
  const [pass, setPass] = useState("")
  const [username, setUsername] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [isSetupDone, setIsSetupDone] = useState(() => {
    return localStorage.getItem("intelliwaste_setup_locked") !== "false"
  })

  const [dynamicWards, setDynamicWards] = useState<WardItem[]>([])
  const [dynamicCities, setDynamicCities] = useState<CityCorporationItem[]>([])

  // Load wards & cities from database/API and check setup lock status
  useEffect(() => {
    // Check backend to verify if initial setup was completed
    api.setup
      .getStatus()
      .then((res) => {
        if (res?.isSetupComplete === false) {
          setIsSetupDone(false)
        } else {
          localStorage.setItem("intelliwaste_setup_locked", "true")
          setIsSetupDone(true)
        }
      })
      .catch(() => {
        localStorage.setItem("intelliwaste_setup_locked", "true")
        setIsSetupDone(true)
      })

    async function loadData() {
      try {
        const [cities, wards] = await Promise.all([
          api.cities.getAll().catch(() => []),
          api.wards.getAll().catch(() => []),
        ])
        if (cities && cities.length > 0) setDynamicCities(cities)
        if (wards && wards.length > 0) {
          setDynamicWards(wards)
          setWard(wards[0].id)
        }
      } catch (e) {
        console.warn(
          "Could not fetch remote cities/wards for login dropdown, using fallback.",
        )
      }
    }
    loadData()
  }, [])

  const handleLogin = async () => {
    if (!username || !pass) {
      setError("Username and password are required")
      return
    }
    setError("")
    setLoading(true)

    try {
      const result = await api.auth.login(username, pass)
      setLoading(false)

      if (!result?.user) {
        throw new Error(result?.error || "Login failed: Invalid server response")
      }

      if (result.user.role === "SUPER_ADMIN") {
        onLogin("super")
      } else if (result.user.role === "CITY_ADMIN") {
        onLogin("city", result.user.cityCorpId || undefined)
      } else if (result.user.role === "WARD_ADMIN") {
        onLogin("ward", result.user.wardId || undefined)
      } else if (result.user.role === "DRIVER") {
        onNavigate("collector")
      } else if (result.user.role === "BUSINESS") {
        onNavigate("business")
      } else {
        onNavigate("citizen")
      }
    } catch (apiError: any) {
      setLoading(false)
      setError(apiError?.message || "Invalid username or password")
    }
  }

  const displayWards = dynamicWards;

  return (
    <div
      className="min-h-screen bg-[#061309] flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: "linear-gradient(135deg, #061309 0%, #0a1f0e 100%)",
      }}
    >
      <div className="absolute inset-0 map-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#16a34a] rounded-2xl flex items-center justify-center mx-auto mb-4 glow-green shadow-lg">
            <Recycle size={30} className="text-white" />
          </div>
          <div className="font-display font-800 text-2xl text-white">
            IntelliWaste Operations
          </div>
          <div className="text-[#4b7a5a] text-sm mt-1">
            Smart City Waste Management Platform
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Role tabs */}
          <div className="flex flex-wrap gap-1 bg-[#061309] rounded-xl p-1 mb-5">
            <button
              onClick={() => {
                setTab("super")
                setError("")
              }}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "super"
                  ? "bg-[#16a34a] text-white shadow"
                  : "text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <Globe2 size={13} />
              Super
            </button>
            <button
              onClick={() => {
                setTab("city")
                setError("")
              }}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "city"
                  ? "bg-[#16a34a] text-white shadow"
                  : "text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <Shield size={13} />
              City Corp
            </button>
            <button
              onClick={() => {
                setTab("ward")
                setError("")
              }}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "ward"
                  ? "bg-[#16a34a] text-white shadow"
                  : "text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <Recycle size={13} />
              Ward
            </button>
            <button
              onClick={() => {
                setTab("driver")
                setError("")
              }}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "driver"
                  ? "bg-[#16a34a] text-white shadow"
                  : "text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <Truck size={13} />
              Driver
            </button>
            <button
              onClick={() => {
                setTab("citizen")
                setError("")
              }}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === "citizen"
                  ? "bg-[#16a34a] text-white shadow"
                  : "text-[#4b7a5a] hover:text-[#86efac]"
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
                <div className="text-[#4ade80] font-mono text-xs mb-1">
                  👑 SUPER ADMIN (MINISTRY CENTRAL)
                </div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  National authority: Add City Corporations, assign Central
                  Admins, and view country-wide operational metrics.
                </div>
              </div>
            )}
            {tab === "city" && (
              <div>
                <div className="text-[#4ade80] font-mono text-xs mb-1">
                  🏢 CITY CORPORATION ADMIN
                </div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  Jurisdiction management: Configure point-to-cash rate,
                  manage wards, assign sub-admins, view all trucks & bins.
                </div>
              </div>
            )}
            {tab === "ward" && (
              <div>
                <div className="text-[#60a5fa] font-mono text-xs mb-1">
                  🏛️ WARD SUB-ADMIN
                </div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  Ward level: Monitor local smart bins & trucks, disburse
                  physical cash to citizens with digital voucher codes.
                </div>
              </div>
            )}
            {tab === "driver" && (
              <div>
                <div className="text-[#f59e0b] font-mono text-xs mb-1">
                  🚚 TRUCK DRIVER / COLLECTOR
                </div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  Field operations: Real-time route navigation, bin emptying
                  logs, hazard protocol, and paid pickup jobs.
                </div>
              </div>
            )}
            {tab === "citizen" && (
              <div>
                <div className="text-[#38bdf8] font-mono text-xs mb-1">
                  👤 CITIZEN USER (REWARDS & CASH OUT)
                </div>
                <div className="text-[#4b7a5a] text-xs leading-relaxed">
                  Public portal: Earn recycling points, claim cash payout
                  vouchers, schedule pickups, and report garbage issues.
                </div>
              </div>
            )}
          </div>

          {/* Ward selector for Ward Admin */}
          {tab === "ward" && (
            <div className="mb-4">
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">
                SELECT YOUR WARD
              </label>
              {displayWards.length > 0 ? (
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-[#86efac] text-sm focus:border-[#4ade80] outline-none"
                >
                  {displayWards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.area ? `— ${w.area}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-[#86efac]/70 p-2.5 bg-[#061309] border border-[#1a3d22] rounded-xl font-mono">
                  No wards registered yet. City Admin can create wards.
                </div>
              )}
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">
              USERNAME
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your registered username"
              autoComplete="username"
              className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#4ade80] outline-none"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">
              PASSWORD
            </label>
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

          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs text-[#4ade80] hover:underline flex items-center gap-1.5 font-medium"
            >
              <KeyRound size={12} /> Forgot password?
            </button>
          </div>

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
                Login as{" "}
                {tab === "super"
                  ? "Super Admin"
                  : tab === "city"
                    ? "City Admin"
                    : tab === "ward"
                      ? "Ward Sub-Admin"
                      : tab === "driver"
                        ? "Driver"
                        : "Citizen"}
                <ChevronRight size={16} />
              </>
            )}
          </button>

          {/* First-Time Server Setup & Root Admin Wizard (Hidden once setup is complete) */}
          {!isSetupDone && (
            <div className="mt-5 pt-4 border-t border-[#1a3d22]">
              <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-white text-xs font-semibold flex items-center gap-1.5">
                    <Shield size={13} className="text-[#4ade80]" />
                    <span>First-Time Setup / Installer</span>
                  </div>
                  <div className="text-[#4b7a5a] text-[11px] mt-0.5">
                    Private registration form to create initial Super Admin
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("setup")}
                  className="bg-[#16a34a]/20 hover:bg-[#16a34a]/40 border border-[#16a34a]/50 text-[#4ade80] text-xs px-3 py-1.5 rounded-lg font-mono transition-colors"
                >
                  Open Setup →
                </button>
              </div>
            </div>
          )}

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

      {/* Unified Brevo Email OTP Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotOpen}
        onClose={() => setForgotOpen(false)}
        defaultIdentifier={username}
        role={
          tab === "super"
            ? "SUPER_ADMIN"
            : tab === "city"
              ? "CITY_ADMIN"
              : tab === "ward"
                ? "WARD_ADMIN"
                : tab === "driver"
                  ? "DRIVER"
                  : "CITIZEN"
        }
        onSuccess={(newP) => {
          setPass(newP);
        }}
      />
    </div>
  )
}
