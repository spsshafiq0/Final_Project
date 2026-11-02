import { useState, useEffect, useMemo } from "react"
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
  Building2,
  ArrowLeft,
  Sparkles,
  Lock,
  User,
  SlidersHorizontal,
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
    useState<"city" | "ward" | "super" | "driver" | "citizen">("super")
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
  const [selectedCityCorpId, setSelectedCityCorpId] = useState<string>("")

  // List of unique City Corporations available
  const availableCities = useMemo(() => {
    if (dynamicCities.length > 0) return dynamicCities
    const map = new Map<string, CityCorporationItem>()
    for (const w of dynamicWards) {
      const cid = String(w.cityCorpId || w.cityCorp?.id || "")
      if (cid && !map.has(cid)) {
        map.set(cid, {
          id: cid,
          name: w.cityCorp?.name || `City Corporation (${cid})`,
          code: w.cityCorp?.code || "",
          active: true,
        })
      }
    }
    return Array.from(map.values())
  }, [dynamicCities, dynamicWards])

  // Filter wards that strictly belong to the selected City Corporation
  const displayWards = useMemo(() => {
    if (!selectedCityCorpId) return dynamicWards
    return dynamicWards.filter((w) => {
      const cid = String(w.cityCorpId || w.cityCorp?.id || "")
      return cid === String(selectedCityCorpId)
    })
  }, [dynamicWards, selectedCityCorpId])

  // When availableCities load, default selectedCityCorpId if empty
  useEffect(() => {
    if (!selectedCityCorpId && availableCities.length > 0) {
      setSelectedCityCorpId(String(availableCities[0].id))
    }
  }, [availableCities, selectedCityCorpId])

  // Auto-sync selected ward when displayWards changes
  useEffect(() => {
    if (displayWards.length > 0) {
      if (!displayWards.some((w) => String(w.id) === String(ward))) {
        setWard(String(displayWards[0].id))
      }
    } else {
      setWard("")
    }
  }, [displayWards, ward])

  const handleCityChange = (cityId: string) => {
    setSelectedCityCorpId(cityId)
    const matching = dynamicWards.filter((w) => {
      const cid = String(w.cityCorpId || w.cityCorp?.id || "")
      return cid === String(cityId)
    })
    if (matching.length > 0) {
      setWard(String(matching[0].id))
    } else {
      setWard("")
    }
  }

  // Load wards & cities from database/API and check setup lock status
  useEffect(() => {
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
        if (cities && cities.length > 0) {
          setDynamicCities(cities)
          setSelectedCityCorpId((prev) => prev || String(cities[0].id))
        }
        if (wards && wards.length > 0) {
          setDynamicWards(wards)
          setWard(String(wards[0].id))
        }
      } catch (e) {
        console.warn("Could not fetch remote cities/wards for login dropdown")
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
        throw new Error((result as any)?.error || "Login failed: Invalid server response")
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

  const roleMeta = {
    super: {
      title: "Ministry & Super Administrator",
      badge: "NATIONAL AUTHORITY",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      desc: "System-wide jurisdiction: configure national city corporations, appoint central commissioners, and audit country-wide waste metrics.",
      accent: "text-emerald-400",
    },
    city: {
      title: "City Corporation Administrator",
      badge: "MUNICIPAL LEVEL",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      desc: "Manage city-wide wards, configure reward point conversion rates, inspect live fleet tracks, and dispatch collection vehicles.",
      accent: "text-cyan-400",
    },
    ward: {
      title: "Ward Sub-Admin & Operations Desk",
      badge: "LOCAL DISPATCH",
      badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/30",
      desc: "Monitor local smart bins, supervise assigned drivers, and disburse physical cash to citizens using digital verification vouchers.",
      accent: "text-teal-400",
    },
    driver: {
      title: "Fleet Driver & Collector",
      badge: "FIELD FLEET",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      desc: "Turn-by-turn OSRM CVRP route navigation, container emptying validation, and high-priority hazard intervention.",
      accent: "text-amber-400",
    },
    citizen: {
      title: "Citizen & Commercial Account",
      badge: "PUBLIC SERVICE",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      desc: "Report local dumping with GPS photos, request bulky item pickup, and redeem verified recycling points for cash vouchers.",
      accent: "text-blue-400",
    },
  }

  const activeMeta = roleMeta[tab]

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      
      {/* Background Gradients & Grids */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Back to Home Button */}
      <div className="relative z-10 w-full max-w-lg mb-6">
        <button
          onClick={() => onNavigate("landing")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to IntelliWaste Home</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-emerald-500/20 border border-emerald-400/30">
            <Recycle size={28} className="text-white" />
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
            Operations Command Portal
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Authenticate to access your municipal role dashboard
          </p>
        </div>

        {/* Main Glassmorphic Card */}
        <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800">
          
          {/* Segmented Role Selector */}
          <div className="mb-6">
            <label className="block text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-2">
              Select Operating Role
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
              {[
                { id: "super", label: "Super", icon: Globe2 },
                { id: "city", label: "City Corp", icon: Building2 },
                { id: "ward", label: "Ward", icon: Recycle },
                { id: "driver", label: "Driver", icon: Truck },
                { id: "citizen", label: "Citizen", icon: Users },
              ].map((r) => {
                const Icon = r.icon
                const isActive = tab === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setTab(r.id as any)
                      setError("")
                    }}
                    className={`py-2.5 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-800 text-white shadow-lg border border-slate-700"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <Icon size={14} className={isActive ? "text-emerald-400" : "text-slate-400"} />
                    <span className="text-[10px] font-medium truncate max-w-full">{r.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Role Context Banner */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${activeMeta.badgeColor}`}>
                {activeMeta.badge}
              </span>
              <span className="text-[11px] font-mono text-slate-500">Security: Encrypted JWT</span>
            </div>
            <h3 className="font-display font-bold text-sm text-white mb-1">{activeMeta.title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{activeMeta.desc}</p>
          </div>

          {/* Ward & City Dropdowns for Ward Admin Role */}
          {tab === "ward" && (
            <div className="space-y-4 mb-6 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
              <div>
                <label className="block text-slate-400 text-xs font-mono mb-1.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-cyan-400" />
                  <span>JURISDICTION CITY CORPORATION</span>
                </label>
                {availableCities.length > 0 ? (
                  <select
                    value={selectedCityCorpId}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:border-emerald-400 outline-none"
                  >
                    {availableCities.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.name} {c.code ? `(${c.code})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-400 p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono">
                    No City Corporations registered yet.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-mono mb-1.5 flex items-center gap-1.5">
                  <Recycle size={13} className="text-teal-400" />
                  <span>ASSIGNED WARD NUMBER</span>
                </label>
                {displayWards.length > 0 ? (
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:border-emerald-400 outline-none"
                  >
                    {displayWards.map((w) => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                        {w.name} {w.area ? `— ${w.area}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-400 p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono">
                    No wards configured under this City Corporation.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
            className="space-y-4"
          >
            {/* Username Input */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                USERNAME OR EMAIL
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <User size={16} />
                </div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    tab === "super"
                      ? "e.g. spsshafiq"
                      : tab === "city"
                        ? "e.g. dncc_admin"
                        : tab === "ward"
                          ? "e.g. ward33_admin"
                          : tab === "driver"
                            ? "e.g. driver_01"
                            : "Your registered username or email"
                  }
                  autoComplete="username"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono text-slate-300">
                  SECURE PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <KeyRound size={12} />
                  <span>Forgot?</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-11 py-3 text-white text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 outline-none transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/25 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:opacity-95 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin text-slate-950" />
              ) : (
                <>
                  <span>Sign in as {activeMeta.title.split(" ")[0]}</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* First-time installer quick trigger if not initialized */}
          {!isSetupDone && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-white text-xs font-semibold flex items-center gap-1.5">
                    <Shield size={13} className="text-emerald-400" />
                    <span>First-Time Setup Assistant</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Initialize central databases &amp; Super Admin
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("setup")}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-lg font-mono transition-colors cursor-pointer"
                >
                  Setup →
                </button>
              </div>
            </div>
          )}

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
          setPass(newP)
        }}
      />
    </div>
  )
}
