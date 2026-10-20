import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Plus,
  Search,
  Edit3,
  Trash2,
  LogOut,
  X,
  Save,
  Globe2,
  Truck,
  Database,
  RefreshCw,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import api, { CityCorporationItem, UserProfile } from "../lib/api";

interface SuperAdminPanelProps {
  onLogout: () => void;
}

export default function SuperAdminPanel({ onLogout }: SuperAdminPanelProps) {
  const [tab, setTab] = useState<"overview" | "cities" | "accounts" | "system">("overview");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Live data from API
  const [cities, setCities] = useState<CityCorporationItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Modals state
  const [showCityModal, setShowCityModal] = useState(false);
  const [editingCity, setEditingCity] = useState<CityCorporationItem | null>(null);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [cityForm, setCityForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    adminName: "",
    adminUsername: "",
    adminEmail: "",
    adminPassword: "",
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "CITY_ADMIN" as UserProfile["role"],
    cityCorpId: "",
    phone: "",
    email: "",
    nid: "",
    address: "",
  });

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [citiesData, usersData, statsData] = await Promise.all([
        api.cities.getAll().catch(() => []),
        api.users.getAll().catch(() => []),
        api.dashboard.getStats().catch(() => null),
      ]);
      setCities(citiesData || []);
      setUsers(usersData || []);
      setStats(statsData);
    } catch (err: any) {
      console.error("Failed to load super admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotify = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  // Quick seed database
  const handleSeedDatabase = async () => {
    if (!confirm("Seed or refresh default City Corporations, Wards, Bins, and Admin accounts in Database?")) return;
    setLoading(true);
    try {
      const res = await api.seed.run(true);
      showNotify("success", res.message || "Database successfully seeded!");
      await loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Failed to seed database");
    } finally {
      setLoading(false);
    }
  };

  // City modal actions
  const openCreateCity = () => {
    setEditingCity(null);
    setShowAdminPass(false);
    setCityForm({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      adminName: "",
      adminUsername: "",
      adminEmail: "",
      adminPassword: "",
    });
    setShowCityModal(true);
  };

  const openEditCity = (city: CityCorporationItem) => {
    setEditingCity(city);
    setCityForm({
      name: city.name,
      code: city.code,
      address: city.address || "",
      phone: city.phone || "",
      email: city.email || "",
      adminName: "",
      adminUsername: "",
      adminEmail: "",
      adminPassword: "",
    });
    setShowCityModal(true);
  };

  const saveCity = async () => {
    if (!cityForm.name || !cityForm.code) {
      showNotify("error", "Name and Code (e.g. DNCC) are required");
      return;
    }
    setLoading(true);
    try {
      if (editingCity) {
        await api.cities.update(editingCity.id, cityForm);
        showNotify("success", "City Corporation updated successfully");
      } else {
        await api.cities.create(cityForm);
        showNotify("success", "City Corporation created successfully");
      }
      setShowCityModal(false);
      await loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Failed to save City Corporation");
    } finally {
      setLoading(false);
    }
  };

  const deleteCity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? All associated wards, bins, and tracks will be deleted!`)) return;
    setLoading(true);
    try {
      await api.cities.delete(id);
      showNotify("success", "City Corporation deleted");
      await loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Failed to delete City Corporation");
    } finally {
      setLoading(false);
    }
  };

  // User modal actions
  const openCreateUser = (presetCityCorpId?: string) => {
    setEditingUser(null);
    setUserForm({
      fullName: "",
      username: "",
      password: "",
      role: "CITY_ADMIN",
      cityCorpId: presetCityCorpId || (cities[0]?.id || ""),
      phone: "",
      email: "",
      nid: "",
      address: "",
    });
    setShowUserModal(true);
  };

  const saveUser = async () => {
    if (!userForm.fullName || !userForm.username) {
      showNotify("error", "Full name and username are required");
      return;
    }
    if (!editingUser && !userForm.password) {
      showNotify("error", "Password is required for new accounts");
      return;
    }
    setLoading(true);
    try {
      if (editingUser) {
        await api.users.update(editingUser.id, userForm);
        showNotify("success", "Account updated successfully");
      } else {
        await api.users.create(userForm);
        showNotify("success", "Account created and assigned successfully");
      }
      setShowUserModal(false);
      await loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user: UserProfile) => {
    try {
      await api.users.update(user.id, { active: !user.role });
      await loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Failed to toggle user status");
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user account "${name}"?`)) return;
    try {
      await api.users.delete(id);
      showNotify("success", "User deleted successfully");
      await loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Failed to delete user");
    }
  };

  const filteredCities = cities.filter((c) =>
    `${c.name} ${c.code} ${c.address}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    `${u.fullName} ${u.username} ${u.role} ${u.cityCorp?.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#061309] text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0a1f0e] border-b border-[#1a3d22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#16a34a] flex items-center justify-center shrink-0 shadow-lg">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-800 text-lg tracking-wide truncate">IntelliWaste Super Admin</div>
              <div className="text-[#4ade80] text-xs font-mono">NATIONAL OVERSIGHT & CITY CORPORATION REGISTRY</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedDatabase}
              title="Initialize or seed demo database"
              className="bg-[#061309] border border-[#1a3d22] hover:border-[#4ade80] text-[#4ade80] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">Seed Database</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-[#061309] border border-[#1a3d22] text-[#86efac] p-2 rounded-xl text-xs hover:border-[#4ade80] transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onLogout} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1.5 shrink-0 ml-2">
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto scrollbar-hide border-t border-[#1a3d22]/50">
          {[
            { id: "overview", label: "National Overview", icon: Globe2 },
            { id: "cities", label: `City Corporations (${cities.length})`, icon: Building2 },
            { id: "accounts", label: `Account Control (${users.length})`, icon: Users },
            { id: "system", label: "System Health", icon: Activity },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as typeof tab)}
              className={`py-3 px-4 text-xs font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                tab === item.id ? "border-[#4ade80] text-[#4ade80]" : "border-transparent text-[#4b7a5a] hover:text-[#86efac]"
              }`}
            >
              <item.icon size={15} /> {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Notifications */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div
            className={`flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl border ${
              notification.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {notification.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* TAB 1: OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-800 text-2xl">National Solid Waste Platform</h1>
                <p className="text-[#4b7a5a] text-sm mt-1">
                  Hierarchical structure: Central Super Admin → City Corporations → Wards → Smart Bins & Collection Tracks.
                </p>
              </div>
              <button
                onClick={openCreateCity}
                className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all shadow-lg self-start sm:self-auto"
              >
                <Plus size={15} /> Add New City Corporation
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "City Corporations",
                  value: cities.length,
                  icon: Building2,
                  desc: "Autonomous municipal bodies",
                },
                {
                  label: "Wards Registered",
                  value: stats?.overview?.totalWards ?? cities.reduce((acc, c) => acc + (c._count?.wards || 0), 0),
                  icon: Globe2,
                  desc: "Sub-corporation administrative units",
                },
                {
                  label: "Active Smart Bins",
                  value: stats?.overview?.totalBins ?? 0,
                  icon: Database,
                  desc: "IoT telemetry monitored",
                },
                {
                  label: "Active Trucks",
                  value: stats?.overview?.activeTrucks ?? 0,
                  icon: Truck,
                  desc: "GPS collection tracks",
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 shadow">
                  <stat.icon size={20} className="text-[#4ade80] mb-3" />
                  <div className="font-display font-800 text-2xl">{stat.value}</div>
                  <div className="text-white text-xs font-semibold mt-1">{stat.label}</div>
                  <div className="text-[#4b7a5a] text-[11px] mt-0.5">{stat.desc}</div>
                </div>
              ))}
            </div>

            {/* Quick City Corporations Card Preview */}
            <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-700 text-lg">Active City Corporations</h2>
                  <p className="text-[#4b7a5a] text-xs">Each City Corporation manages its own wards and sub-ward admins.</p>
                </div>
                <button
                  onClick={() => setTab("cities")}
                  className="text-xs text-[#4ade80] hover:underline flex items-center gap-1"
                >
                  View All ({cities.length}) →
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cities.map((city) => {
                  const assignedAdmins = users.filter((u) => u.role === "CITY_ADMIN" && u.cityCorpId === city.id);
                  return (
                    <div key={city.id} className="bg-[#061309] border border-[#1a3d22] rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs px-2 py-0.5 bg-[#16a34a]/20 text-[#4ade80] rounded">
                            {city.code}
                          </span>
                          <span className="text-[11px] text-[#4b7a5a]">
                            {city._count?.wards || 0} Wards
                          </span>
                        </div>
                        <div className="font-display font-700 text-sm mt-2">{city.name}</div>
                        <div className="text-[#4b7a5a] text-xs mt-1 truncate">{city.address || "Address not set"}</div>

                        <div className="mt-3 pt-3 border-t border-[#1a3d22]/60">
                          <div className="text-[11px] text-[#4b7a5a]">Assigned City Admin:</div>
                          {assignedAdmins.length > 0 ? (
                            <div className="text-xs text-[#86efac] font-medium mt-0.5">
                              {assignedAdmins.map((a) => a.fullName).join(", ")}
                            </div>
                          ) : (
                            <div className="text-xs text-yellow-500/80 font-mono mt-0.5">
                              No admin assigned yet
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 flex gap-2">
                        <button
                          onClick={() => openCreateUser(city.id)}
                          className="flex-1 bg-[#1a3d22] hover:bg-[#16a34a] text-[#86efac] hover:text-white rounded-lg py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus size={12} /> Assign Admin
                        </button>
                        <button
                          onClick={() => openEditCity(city)}
                          className="px-2.5 py-1.5 bg-[#0d2414] border border-[#1a3d22] text-[#4ade80] rounded-lg text-xs"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CITY CORPORATIONS MANAGEMENT */}
        {tab === "cities" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search City Corporation by name, code, or address..."
                  className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#4ade80]"
                />
              </div>
              <button
                onClick={openCreateCity}
                className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow"
              >
                <Plus size={15} /> Add City Corporation
              </button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCities.map((city) => {
                const assignedAdmins = users.filter((u) => u.role === "CITY_ADMIN" && u.cityCorpId === city.id);
                return (
                  <div key={city.id} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs px-2.5 py-0.5 bg-[#16a34a]/20 text-[#4ade80] rounded-md font-semibold">
                            {city.code}
                          </span>
                          <h3 className="font-display font-700 text-base mt-2 text-white">{city.name}</h3>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-mono">
                          ACTIVE
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-[#86efac]">
                        {city.address && (
                          <div className="flex items-start gap-2">
                            <MapPin size={13} className="text-[#4b7a5a] shrink-0 mt-0.5" />
                            <span className="truncate">{city.address}</span>
                          </div>
                        )}
                        {city.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-[#4b7a5a] shrink-0" />
                            <span>{city.phone}</span>
                          </div>
                        )}
                        {city.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={13} className="text-[#4b7a5a] shrink-0" />
                            <span>{city.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 p-3 bg-[#061309] rounded-xl">
                        <div className="text-[11px] text-[#4b7a5a] font-mono">ASSIGNED CITY ADMINS ({assignedAdmins.length})</div>
                        {assignedAdmins.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {assignedAdmins.map((admin) => (
                              <div key={admin.id} className="text-xs text-white flex items-center justify-between">
                                <span className="font-medium">{admin.fullName}</span>
                                <span className="text-[#4b7a5a] font-mono">@{admin.username}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-yellow-400/80 mt-1">None assigned yet</div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5 pt-4 border-t border-[#1a3d22]">
                      <button
                        onClick={() => openCreateUser(city.id)}
                        className="flex-1 bg-[#1a3d22] hover:bg-[#16a34a] text-[#86efac] hover:text-white rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus size={12} /> Assign Admin
                      </button>
                      <button
                        onClick={() => openEditCity(city)}
                        className="border border-[#1a3d22] rounded-lg px-3 py-2 text-xs text-[#4ade80] hover:border-[#4ade80] transition-colors"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => deleteCity(city.id, city.name)}
                        className="border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNTS MANAGEMENT */}
        {tab === "accounts" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user by name, username, or role..."
                  className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#4ade80]"
                />
              </div>
              <button
                onClick={() => openCreateUser()}
                className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow"
              >
                <Plus size={15} /> Create Admin / Staff
              </button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[#4ade80] text-[11px] font-mono px-2 py-0.5 bg-[#16a34a]/20 rounded">
                          {user.role}
                        </span>
                        <h3 className="font-display font-700 text-sm mt-2 text-white">{user.fullName}</h3>
                        <div className="text-[#4b7a5a] text-xs font-mono">@{user.username}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                        ACTIVE
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs">
                      {user.cityCorp && (
                        <div>
                          <span className="text-[#4b7a5a]">City Corp:</span>{" "}
                          <span className="text-[#86efac] font-medium">{user.cityCorp.name} ({user.cityCorp.code})</span>
                        </div>
                      )}
                      {user.ward && (
                        <div>
                          <span className="text-[#4b7a5a]">Assigned Ward:</span>{" "}
                          <span className="text-[#86efac]">{user.ward.name} — {user.ward.area}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div>
                          <span className="text-[#4b7a5a]">Phone:</span>{" "}
                          <span className="text-[#86efac]">{user.phone}</span>
                        </div>
                      )}
                      {user.email && (
                        <div>
                          <span className="text-[#4b7a5a]">Email:</span>{" "}
                          <span className="text-[#86efac]">{user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-[#1a3d22]">
                    <button
                      onClick={() => deleteUser(user.id, user.fullName)}
                      className="w-full border border-red-500/20 hover:bg-red-500/10 rounded-lg py-2 text-xs text-red-400 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} /> Remove Account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM HEALTH */}
        {tab === "system" && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                ["Database Connection", "PostgreSQL / Prisma ORM", "Live Connection"],
                ["Serverless Runtime", "Vercel /api Functions", "Operational"],
                ["Authentication", "Enterprise Cryptographic Token (7-day)", "Protected"],
              ].map(([title, subtitle, status]) => (
                <div key={title} className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
                  <Activity size={18} className="text-[#4ade80] mb-3" />
                  <div className="text-white text-sm font-semibold">{title}</div>
                  <div className="text-[#4b7a5a] text-xs mt-0.5">{subtitle}</div>
                  <div className="text-[#4ade80] font-mono text-xs mt-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
                    {status}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0d2414] border border-[#1a3d22] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-700">Database Seeding & Deployment Check</h3>
                  <p className="text-[#4b7a5a] text-xs mt-1">
                    When deploying to Vercel, connect your Neon PostgreSQL DATABASE_URL and JWT_SECRET environment variables.
                  </p>
                </div>
                <button
                  onClick={handleSeedDatabase}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Sparkles size={14} /> Run Seed Script
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE / EDIT CITY CORPORATION MODAL */}
      {showCityModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={() => setShowCityModal(false)}>
          <div className="w-full max-w-md bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-700 text-lg">
                {editingCity ? "Edit City Corporation" : "Create City Corporation"}
              </h3>
              <button onClick={() => setShowCityModal(false)} className="text-[#4b7a5a] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">CITY CORPORATION NAME</label>
                <input
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  placeholder="e.g. Dhaka North City Corporation"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>

              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">CODE (ABBREVIATION)</label>
                <input
                  value={cityForm.code}
                  onChange={(e) => setCityForm({ ...cityForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. DNCC, DSCC, CCC"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#4ade80] outline-none focus:border-[#4ade80]"
                />
              </div>

              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">HEADQUARTERS ADDRESS</label>
                <input
                  value={cityForm.address}
                  onChange={(e) => setCityForm({ ...cityForm, address: e.target.value })}
                  placeholder="e.g. Nagar Bhaban, Gulshan-2, Dhaka"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">PHONE</label>
                  <input
                    value={cityForm.phone}
                    onChange={(e) => setCityForm({ ...cityForm, phone: e.target.value })}
                    placeholder="+880-2-XXXXXXX"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">OFFICIAL EMAIL</label>
                  <input
                    value={cityForm.email}
                    onChange={(e) => setCityForm({ ...cityForm, email: e.target.value })}
                    placeholder="info@dncc.gov.bd"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
              </div>

              {!editingCity && (
                <div className="pt-3 mt-3 border-t border-[#1a3d22] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#4ade80]">
                      INITIAL CITY ADMIN CREDENTIALS
                    </span>
                    <span className="text-[10px] text-[#4b7a5a]">Auto-creates login</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ADMIN FULL NAME</label>
                      <input
                        value={cityForm.adminName}
                        onChange={(e) => setCityForm({ ...cityForm, adminName: e.target.value })}
                        placeholder="e.g. Engr. Shafiq Rahman"
                        className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#4ade80]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ADMIN USERNAME</label>
                      <input
                        value={cityForm.adminUsername}
                        onChange={(e) => setCityForm({ ...cityForm, adminUsername: e.target.value })}
                        placeholder="e.g. dncc_admin"
                        className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2 text-xs font-mono text-[#4ade80] outline-none focus:border-[#4ade80]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ADMIN EMAIL</label>
                      <input
                        type="email"
                        value={cityForm.adminEmail}
                        onChange={(e) => setCityForm({ ...cityForm, adminEmail: e.target.value })}
                        placeholder="admin@dncc.gov.bd"
                        className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#4ade80]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#4b7a5a] text-xs font-mono mb-1">PASSWORD (HASHED)</label>
                      <div className="relative">
                        <input
                          type={showAdminPass ? "text" : "password"}
                          value={cityForm.adminPassword}
                          onChange={(e) => setCityForm({ ...cityForm, adminPassword: e.target.value })}
                          placeholder="Min 6 characters"
                          className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#4ade80] pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPass((s) => !s)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4b7a5a] hover:text-[#4ade80]"
                        >
                          {showAdminPass ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#4b7a5a]">
                    🔒 Password is cryptographically protected. Credentials and login portal link will be emailed via Brevo.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCityModal(false)}
                className="flex-1 border border-[#1a3d22] text-[#4b7a5a] py-2.5 rounded-xl text-xs hover:border-[#4ade80]/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCity}
                disabled={loading}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save City Corporation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / ASSIGN USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={() => setShowUserModal(false)}>
          <div className="w-full max-w-md bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-700 text-lg">
                {editingUser ? "Edit Account" : "Assign City Corporation Admin"}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-[#4b7a5a] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ASSIGN TO CITY CORPORATION</label>
                <select
                  value={userForm.cityCorpId}
                  onChange={(e) => setUserForm({ ...userForm, cityCorpId: e.target.value })}
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-[#86efac] outline-none focus:border-[#4ade80]"
                >
                  <option value="">Select City Corporation</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">FULL NAME & TITLE</label>
                <input
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  placeholder="e.g. Chief Waste Management Officer"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">USERNAME</label>
                  <input
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="city.admin"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">PASSWORD</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">PHONE NUMBER</label>
                  <input
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="017XX-XXXXXX"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">EMAIL</label>
                  <input
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="admin@corp.gov.bd"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 border border-[#1a3d22] text-[#4b7a5a] py-2.5 rounded-xl text-xs hover:border-[#4ade80]/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveUser}
                disabled={loading}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save & Assign Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
