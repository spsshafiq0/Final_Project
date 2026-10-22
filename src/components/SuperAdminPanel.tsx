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
  Gift,
  Award,
  Ticket,
  Copy,
  CheckSquare,
} from "lucide-react";
import api, { CityCorporationItem, UserProfile, RankTierItem, RewardItem, VoucherCodeItem } from "../lib/api";

interface SuperAdminPanelProps {
  onLogout: () => void;
}

export default function SuperAdminPanel({ onLogout }: SuperAdminPanelProps) {
  const [tab, setTab] = useState<"overview" | "cities" | "accounts" | "rewards" | "system">("overview");
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
  const [cityForm, setCityForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    pointRate: 0.20,
    minWithdrawPoints: 100,
  });

  // Dedicated City Corporation Admin Modal state
  const [showCityAdminModal, setShowCityAdminModal] = useState(false);
  const [showCityAdminPass, setShowCityAdminPass] = useState(false);
  const [cityAdminForm, setCityAdminForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    cityCorpId: "",
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
  // Rank Tiers & Partner Rewards State
  const [rankTiers, setRankTiers] = useState<RankTierItem[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);

  // Rank Modal State
  const [showRankModal, setShowRankModal] = useState(false);
  const [editingRank, setEditingRank] = useState<RankTierItem | null>(null);
  const [rankForm, setRankForm] = useState({
    level: 1,
    name: "",
    minPoints: 0,
    maxPoints: "200",
    badge: "🌱",
  });

  // Reward Modal State
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    partner: "",
    points: 500,
    icon: "🛍️",
    category: "Shopping",
    description: "",
    codes: "",
    generateCount: 5,
    codePrefix: "",
  });

  // Manage Codes / Restock Modal State
  const [activeCodesReward, setActiveCodesReward] = useState<RewardItem | null>(null);
  const [restockCodes, setRestockCodes] = useState("");
  const [restockGenerateCount, setRestockGenerateCount] = useState(5);

  // Master Global Policies (Simple ON/OFF for non-tech users)
  const [globalWithdrawEnabled, setGlobalWithdrawEnabled] = useState(true);
  const [globalCouponsEnabled, setGlobalCouponsEnabled] = useState(true);
  const [togglingPolicy, setTogglingPolicy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [citiesData, usersData, statsData, ranksData, rewardsData, policyData] = await Promise.all([
        api.cities.getAll().catch(() => []),
        api.users.getAll().catch(() => []),
        api.dashboard.getStats().catch(() => null),
        api.ranks.getAll().catch(() => []),
        api.rewards.getAll().catch(() => []),
        api.rewards.getGlobalPolicy().catch(() => ({ couponsGloballyEnabled: true, withdrawGloballyEnabled: true })),
      ]);
      setCities(citiesData || []);
      setUsers(usersData || []);
      setStats(statsData);
      setRankTiers(ranksData || []);
      setRewards(rewardsData || []);
      if (policyData) {
        setGlobalWithdrawEnabled(policyData.withdrawGloballyEnabled !== false);
        setGlobalCouponsEnabled(policyData.couponsGloballyEnabled !== false);
      }
    } catch (err: any) {
      console.error("Failed to load super admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGlobalWithdraw = async () => {
    const nextVal = !globalWithdrawEnabled;
    setGlobalWithdrawEnabled(nextVal);
    setTogglingPolicy(true);
    try {
      await api.rewards.toggleGlobalWithdraw(nextVal);
      showNotify("success", `System-wide cash withdrawals are now ${nextVal ? "ENABLED (ON)" : "PAUSED (OFF)"}`);
    } catch {
      setGlobalWithdrawEnabled(!nextVal);
      showNotify("error", "Failed to update global cash withdrawal policy");
    } finally {
      setTogglingPolicy(false);
    }
  };

  const handleToggleGlobalCoupons = async () => {
    const nextVal = !globalCouponsEnabled;
    setGlobalCouponsEnabled(nextVal);
    setTogglingPolicy(true);
    try {
      await api.rewards.toggleGlobalCoupons(nextVal);
      showNotify("success", `Partner digital vouchers are now ${nextVal ? "ENABLED (ON)" : "PAUSED (OFF)"}`);
    } catch {
      setGlobalCouponsEnabled(!nextVal);
      showNotify("error", "Failed to update global vouchers policy");
    } finally {
      setTogglingPolicy(false);
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
    setCityForm({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      pointRate: 0.20,
      minWithdrawPoints: 100,
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
      pointRate: city.pointRate || 0.20,
      minWithdrawPoints: city.minWithdrawPoints || 100,
    });
    setShowCityModal(true);
  };

  const saveCity = async () => {
    if (!cityForm.name.trim() || !cityForm.code.trim()) {
      showNotify("error", "Name and Code (e.g. DNCC) are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: cityForm.name.trim(),
        code: cityForm.code.toUpperCase().trim(),
        address: cityForm.address.trim() || null,
        phone: cityForm.phone.trim() || null,
        email: cityForm.email.trim() || null,
        pointRate: Number(cityForm.pointRate) || 0.20,
        minWithdrawPoints: Number(cityForm.minWithdrawPoints) || 100,
      };

      if (editingCity) {
        await api.cities.update(editingCity.id, payload);
        showNotify("success", "City Corporation updated successfully");
      } else {
        await api.cities.create(payload);
        showNotify("success", "City Corporation created successfully (No admin assigned yet)");
      }
      setShowCityModal(false);
      await loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Failed to save City Corporation");
    } finally {
      setLoading(false);
    }
  };

  // Dedicated City Admin actions
  const openCreateCityAdmin = (presetCityCorpId?: string) => {
    setShowCityAdminPass(false);
    setCityAdminForm({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      cityCorpId: presetCityCorpId || (cities[0]?.id || ""),
    });
    setShowCityAdminModal(true);
  };

  const saveCityAdmin = async () => {
    if (!cityAdminForm.fullName.trim() || !cityAdminForm.username.trim()) {
      showNotify("error", "Full Name and Username are required");
      return;
    }
    if (!cityAdminForm.password || cityAdminForm.password.length < 6) {
      showNotify("error", "Password must be at least 6 characters long");
      return;
    }
    if (!cityAdminForm.cityCorpId) {
      showNotify("error", "Please select an assigned City Corporation");
      return;
    }

    setLoading(true);
    try {
      await api.users.create({
        fullName: cityAdminForm.fullName.trim(),
        username: cityAdminForm.username.toLowerCase().trim(),
        email: cityAdminForm.email.trim() || null,
        phone: cityAdminForm.phone.trim() || null,
        password: cityAdminForm.password,
        role: "CITY_ADMIN",
        cityCorpId: cityAdminForm.cityCorpId,
      });

      showNotify(
        "success",
        `City Admin account "${cityAdminForm.fullName}" created successfully! Login credentials dispatched to email.`
      );
      setShowCityAdminModal(false);
      await loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Failed to create City Corporation Admin");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCityAdmin = async (cityId: string, adminUserId: string) => {
    if (!adminUserId) return;
    setLoading(true);
    try {
      if (adminUserId === "none") {
        const currentAdmins = users.filter((u) => u.role === "CITY_ADMIN" && u.cityCorpId === cityId);
        for (const adm of currentAdmins) {
          await api.users.update(adm.id, { cityCorpId: null });
        }
        showNotify("success", "City Corporation Admin unassigned");
      } else {
        await api.users.update(adminUserId, { cityCorpId: cityId });
        const adm = users.find((u) => u.id === adminUserId);
        showNotify("success", `Assigned "${adm?.fullName || adminUserId}" as City Corporation Admin`);
      }
      await loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Failed to update admin assignment");
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
      setCities((prev) => prev.filter((c) => c.id !== id));
      showNotify("success", "City Corporation deleted");
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
        await api.users.update(editingUser.id, {
          ...userForm,
          cityCorpId: userForm.cityCorpId || null,
        });
        showNotify("success", "Account updated successfully");
      } else {
        await api.users.create({
          ...userForm,
          cityCorpId: userForm.cityCorpId || null,
        });
        showNotify("success", "Account created successfully and credentials sent to email!");
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

  // Rank Tiers & Rewards Handlers
  const openCreateRank = () => {
    setEditingRank(null);
    const nextLevel = rankTiers.length > 0 ? Math.max(...rankTiers.map((r) => r.level)) + 1 : 1;
    const lastTier = rankTiers[rankTiers.length - 1];
    const nextMin = lastTier && lastTier.maxPoints !== null ? lastTier.maxPoints + 1 : 0;
    setRankForm({
      level: nextLevel,
      name: "",
      minPoints: nextMin,
      maxPoints: String(nextMin + 500),
      badge: "🏅",
    });
    setShowRankModal(true);
  };

  const openEditRank = (tier: RankTierItem) => {
    setEditingRank(tier);
    setRankForm({
      level: tier.level,
      name: tier.name,
      minPoints: tier.minPoints,
      maxPoints: tier.maxPoints === null ? "" : String(tier.maxPoints),
      badge: tier.badge,
    });
    setShowRankModal(true);
  };

  const handleSaveRank = async () => {
    if (!rankForm.name.trim()) {
      showNotify("error", "Rank tier name is required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        level: Number(rankForm.level) || 1,
        name: rankForm.name.trim(),
        minPoints: Number(rankForm.minPoints) || 0,
        maxPoints: rankForm.maxPoints.trim() === "" ? null : Number(rankForm.maxPoints),
        badge: rankForm.badge || "🏅",
      };

      if (editingRank) {
        await api.ranks.update(editingRank.id, payload);
        showNotify("success", `Updated rank tier "${payload.name}"`);
      } else {
        await api.ranks.create(payload);
        showNotify("success", `Created new rank tier "${payload.name}"`);
      }
      setShowRankModal(false);
      const updated = await api.ranks.getAll();
      setRankTiers(updated || []);
    } catch (err: any) {
      showNotify("error", err.message || "Failed to save rank tier");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRank = async (id: string, name: string) => {
    if (!confirm(`Delete rank tier "${name}"?`)) return;
    setLoading(true);
    try {
      await api.ranks.delete(id);
      showNotify("success", `Rank tier "${name}" deleted`);
      setRankTiers((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      showNotify("error", err.message || "Failed to delete rank tier");
    } finally {
      setLoading(false);
    }
  };

  const openCreateReward = () => {
    setEditingReward(null);
    setRewardForm({
      name: "",
      partner: "",
      points: 500,
      icon: "🛍️",
      category: "Shopping",
      description: "",
      codes: "",
      generateCount: 5,
      codePrefix: "",
    });
    setShowRewardModal(true);
  };

  const openEditReward = (reward: RewardItem) => {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      partner: reward.partner,
      points: reward.points,
      icon: reward.icon || "🎁",
      category: reward.category || "General",
      description: reward.description || "",
      codes: "",
      generateCount: 0,
      codePrefix: "",
    });
    setShowRewardModal(true);
  };

  const handleSaveReward = async () => {
    if (!rewardForm.name.trim() || !rewardForm.partner.trim()) {
      showNotify("error", "Reward title and partner name are required");
      return;
    }
    setLoading(true);
    try {
      if (editingReward) {
        await api.rewards.update(editingReward.id, {
          name: rewardForm.name,
          partner: rewardForm.partner,
          points: Number(rewardForm.points) || 100,
          icon: rewardForm.icon,
          category: rewardForm.category,
          description: rewardForm.description,
          addCodes: rewardForm.codes,
          generateCount: Number(rewardForm.generateCount) || 0,
          codePrefix: rewardForm.codePrefix,
        });
        showNotify("success", `Updated reward voucher "${rewardForm.name}"`);
      } else {
        await api.rewards.create({
          name: rewardForm.name,
          partner: rewardForm.partner,
          points: Number(rewardForm.points) || 100,
          icon: rewardForm.icon,
          category: rewardForm.category,
          description: rewardForm.description,
          codes: rewardForm.codes,
          generateCount: Number(rewardForm.generateCount) || 0,
          codePrefix: rewardForm.codePrefix,
        });
        showNotify("success", `Created reward voucher "${rewardForm.name}" with unique codes`);
      }
      setShowRewardModal(false);
      const updated = await api.rewards.getAll();
      setRewards(updated || []);
    } catch (err: any) {
      showNotify("error", err.message || "Failed to save reward");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete reward "${name}"? All codes will be removed.`)) return;
    setLoading(true);
    try {
      await api.rewards.delete(id);
      showNotify("success", `Reward "${name}" deleted`);
      setRewards((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      showNotify("error", err.message || "Failed to delete reward");
    } finally {
      setLoading(false);
    }
  };

  const handleRestockCodes = async () => {
    if (!activeCodesReward) return;
    setLoading(true);
    try {
      await api.rewards.update(activeCodesReward.id, {
        addCodes: restockCodes,
        generateCount: Number(restockGenerateCount) || 0,
        codePrefix: activeCodesReward.partner.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase(),
      });
      showNotify("success", `Added more unique codes to "${activeCodesReward.name}"`);
      setRestockCodes("");
      setRestockGenerateCount(0);
      const updated = await api.rewards.getAll();
      setRewards(updated || []);
      const ref = updated.find((r) => r.id === activeCodesReward.id);
      if (ref) setActiveCodesReward(ref);
    } catch (err: any) {
      showNotify("error", err.message || "Failed to restock codes");
    } finally {
      setLoading(false);
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
            { id: "rewards", label: `Ranks & Rewards (${rewards.length})`, icon: Gift },
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
                          onClick={() => openCreateCityAdmin(city.id)}
                          className="flex-1 bg-[#1a3d22] hover:bg-[#16a34a] text-[#86efac] hover:text-white rounded-lg py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus size={12} /> Assign / Create Admin
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
              <div className="flex gap-2">
                <button
                  onClick={() => openCreateCityAdmin()}
                  className="bg-[#0d2414] border border-[#16a34a] hover:bg-[#16a34a]/20 text-[#4ade80] rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow transition-all whitespace-nowrap"
                >
                  <Plus size={15} /> Create City Admin
                </button>
                <button
                  onClick={openCreateCity}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow transition-all whitespace-nowrap"
                >
                  <Plus size={15} /> Add City Corporation
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCities.map((city) => {
                const assignedAdmins = users.filter((u) => u.role === "CITY_ADMIN" && u.cityCorpId === city.id);
                const allCityAdmins = users.filter((u) => u.role === "CITY_ADMIN");
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

                      {/* Assigned City Corporation Admin Section */}
                      <div className="mt-4 p-3.5 bg-[#061309] border border-[#1a3d22] rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#4b7a5a]">CITY CORPORATION ADMIN</span>
                          <span className={assignedAdmins.length > 0 ? "text-[#4ade80] font-semibold" : "text-yellow-500 font-semibold"}>
                            {assignedAdmins.length > 0 ? "ASSIGNED" : "UNASSIGNED"}
                          </span>
                        </div>

                        {assignedAdmins.length > 0 ? (
                          <div className="space-y-1.5 pt-0.5">
                            {assignedAdmins.map((admin) => (
                              <div key={admin.id} className="text-xs bg-[#0d2414] border border-[#1a3d22]/80 rounded-lg p-2.5">
                                <div className="font-semibold text-white flex items-center justify-between">
                                  <span>{admin.fullName}</span>
                                  <span className="text-[#4ade80] font-mono text-[11px]">@{admin.username}</span>
                                </div>
                                {admin.email && (
                                  <div className="text-[#4b7a5a] text-[11px] truncate flex items-center gap-1.5 mt-1">
                                    <Mail size={11} className="text-[#4ade80]" /> {admin.email}
                                  </div>
                                )}
                                {admin.phone && (
                                  <div className="text-[#4b7a5a] text-[11px] flex items-center gap-1.5 mt-0.5">
                                    <Phone size={11} className="text-[#4ade80]" /> {admin.phone}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-yellow-400/90 font-mono py-1">
                            No admin assigned to this city corporation yet.
                          </div>
                        )}

                        {/* Admin Selector Dropdown */}
                        <div className="pt-2 border-t border-[#1a3d22]">
                          <label className="block text-[10px] text-[#4b7a5a] font-mono mb-1">
                            SELECT / REASSIGN ADMIN:
                          </label>
                          <select
                            value={assignedAdmins[0]?.id || ""}
                            onChange={(e) => handleAssignCityAdmin(city.id, e.target.value)}
                            className="w-full bg-[#0d2414] border border-[#1a3d22] text-[#86efac] text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#4ade80]"
                          >
                            <option value="">-- Choose City Corporation Admin --</option>
                            <option value="none">None (Unassign current)</option>
                            {allCityAdmins.map((admin) => (
                              <option key={admin.id} value={admin.id}>
                                {admin.fullName} (@{admin.username}){admin.cityCorpId === city.id ? " (Current)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5 pt-4 border-t border-[#1a3d22]">
                      <button
                        onClick={() => openCreateCityAdmin(city.id)}
                        className="flex-1 bg-[#1a3d22] hover:bg-[#16a34a] text-[#86efac] hover:text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus size={13} /> Create City Admin
                      </button>
                      <button
                        onClick={() => openEditCity(city)}
                        className="border border-[#1a3d22] rounded-lg px-3 py-2 text-xs text-[#4ade80] hover:border-[#4ade80] transition-colors"
                        title="Edit City Details"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => deleteCity(city.id, city.name)}
                        className="border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete City Corporation"
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

        {/* TAB 4: RANKS & REWARDS CONFIGURATION (SUPER ADMIN) */}
        {tab === "rewards" && (
          <div className="space-y-8">
            {/* Header Description */}
            <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-800 text-xl text-white flex items-center gap-2">
                    <Award size={22} className="text-[#4ade80]" /> Citizen Ranks & Reward Vouchers
                  </h2>
                  <p className="text-[#4b7a5a] text-xs mt-1">
                    Configure citizen level point thresholds and manage exclusive partner gift vouchers with guaranteed unique codes.
                  </p>
                </div>
              </div>
            </div>

            {/* MASTER SYSTEM-WIDE SWITCHES (NON-TECH FRIENDLY) */}
            <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 shadow-md">
              <div className="mb-4">
                <span className="text-[11px] font-mono text-[#86efac] uppercase tracking-wider block">SUPER ADMIN MASTER SWITCHES</span>
                <h3 className="font-display font-bold text-white text-lg mt-0.5">Global Program Controls</h3>
                <p className="text-xs text-[#4b7a5a] mt-0.5">Toggle system-wide access to cash withdrawals and partner digital vouchers across all City Corporations with one click.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Master Cash Withdrawals Switch */}
                <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">System-Wide Cash Withdrawals</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${globalWithdrawEnabled ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                        {globalWithdrawEnabled ? "ACTIVE (ON)" : "PAUSED (OFF)"}
                      </span>
                    </div>
                    <p className="text-xs text-[#4b7a5a] mt-1.5">
                      {globalWithdrawEnabled
                        ? "Citizens in authorized wards can redeem their points for cash pickup vouchers."
                        : "All cash payouts are paused system-wide. Citizens will see that cash withdrawals are temporarily disabled."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleGlobalWithdraw}
                    disabled={togglingPolicy}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      globalWithdrawEnabled ? "bg-[#16a34a]" : "bg-gray-700"
                    }`}
                    role="switch"
                    aria-checked={globalWithdrawEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        globalWithdrawEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Master Partner Coupons Switch */}
                <div className="bg-[#061309] border border-[#1a3d22] rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">Partner Gift Cards & Coupons</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${globalCouponsEnabled ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                        {globalCouponsEnabled ? "ACTIVE (ON)" : "PAUSED (OFF)"}
                      </span>
                    </div>
                    <p className="text-xs text-[#4b7a5a] mt-1.5">
                      {globalCouponsEnabled
                        ? "Citizens can browse and redeem digital partner gift cards using their earned points."
                        : "Partner coupons are hidden/paused system-wide for maintenance or stock replenishment."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleGlobalCoupons}
                    disabled={togglingPolicy}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      globalCouponsEnabled ? "bg-[#16a34a]" : "bg-gray-700"
                    }`}
                    role="switch"
                    aria-checked={globalCouponsEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        globalCouponsEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 1: RANK TIERS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Citizen Rank Levels & Point Ranges</h3>
                  <p className="text-[#4b7a5a] text-xs">Define what rank level and title a citizen gets based on their points</p>
                </div>
                <button
                  onClick={openCreateRank}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
                >
                  <Plus size={14} /> Add Rank Level
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rankTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="bg-[#0d2414] border border-[#1a3d22] hover:border-[#4ade80]/40 rounded-xl p-5 transition-all relative group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{tier.badge}</div>
                        <div>
                          <div className="text-[11px] font-mono text-[#4ade80]">LEVEL {tier.level}</div>
                          <div className="font-display font-bold text-white text-base">{tier.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditRank(tier)}
                          className="p-1.5 text-[#4b7a5a] hover:text-[#4ade80] rounded-lg hover:bg-[#1a3d22]"
                          title="Edit Tier"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRank(tier.id, tier.name)}
                          className="p-1.5 text-[#4b7a5a] hover:text-red-400 rounded-lg hover:bg-red-500/10"
                          title="Delete Tier"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#061309] border border-[#1a3d22] rounded-lg p-3 text-xs">
                      <div className="text-[#4b7a5a] font-mono mb-0.5">POINT RANGE</div>
                      <div className="text-white font-mono font-bold text-sm">
                        {tier.minPoints.toLocaleString()} pts {tier.maxPoints !== null ? `— ${tier.maxPoints.toLocaleString()} pts` : "+ (Max Rank)"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: PARTNER REWARDS & UNIQUE VOUCHERS */}
            <div className="space-y-4 pt-4 border-t border-[#1a3d22]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Partner Gift Cards & Coupons</h3>
                  <p className="text-[#4b7a5a] text-xs">
                    Manage digital rewards. Each voucher has its own unique code and is never given to more than one citizen.
                  </p>
                </div>
                <button
                  onClick={openCreateReward}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
                >
                  <Plus size={14} /> Add New Voucher Offer
                </button>
              </div>

              {rewards.length === 0 ? (
                <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-12 text-center text-[#4b7a5a]">
                  <Gift size={40} className="mx-auto mb-3 opacity-40 text-[#4ade80]" />
                  <div className="font-bold text-base text-white">No partner vouchers created yet</div>
                  <div className="text-xs mt-1">Click "Add New Voucher Offer" to add discounts from Shajgoj, Pathao, etc.</div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="bg-[#0d2414] border border-[#1a3d22] hover:border-[#4ade80]/40 rounded-xl p-5 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-3xl">{reward.icon || "🎁"}</div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                (reward.availableCodes || 0) > 0
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {(reward.availableCodes || 0) > 0
                                ? `${reward.availableCodes} codes available`
                                : "Out of stock"}
                            </span>
                            <button
                              onClick={() => openEditReward(reward)}
                              className="p-1 text-[#4b7a5a] hover:text-[#4ade80]"
                              title="Edit"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteReward(reward.id, reward.name)}
                              className="p-1 text-[#4b7a5a] hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="font-display font-bold text-white text-base mb-0.5">{reward.name}</div>
                        <div className="text-xs text-[#4ade80] font-mono mb-2">Partner: {reward.partner}</div>
                        {reward.description && (
                          <p className="text-xs text-[#4b7a5a] mb-4 line-clamp-2">{reward.description}</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#1a3d22]/80 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#4b7a5a]">POINTS COST</span>
                          <span className="font-bold text-[#4ade80]">{reward.points} pts</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#4b7a5a]">REDEEMED</span>
                          <span className="text-white">{reward.redeemedCodes || 0} users</span>
                        </div>

                        <button
                          onClick={() => setActiveCodesReward(reward)}
                          className="w-full bg-[#061309] hover:bg-[#1a3d22] border border-[#1a3d22] text-[#86efac] py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Ticket size={13} /> Manage Codes & Inventory
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM HEALTH */}
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
          <div className="w-full max-w-md bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">POINT RATE (BDT / POINT)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={cityForm.pointRate}
                    onChange={(e) => setCityForm({ ...cityForm, pointRate: parseFloat(e.target.value) || 0.2 })}
                    placeholder="0.20"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">MIN CASH WITHDRAWAL (PTS)</label>
                  <input
                    type="number"
                    value={cityForm.minWithdrawPoints}
                    onChange={(e) => setCityForm({ ...cityForm, minWithdrawPoints: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#061309] border border-[#1a3d22] rounded-xl text-[11px] text-[#4b7a5a]">
                ℹ️ <span className="text-[#86efac]">Note:</span> This form creates the City Corporation profile only. No email is sent here. You can create City Corporation Admins and assign them separately via the dedicated option.
              </div>
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

      {/* DEDICATED CREATE CITY CORPORATION ADMIN MODAL */}
      {showCityAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={() => setShowCityAdminModal(false)}>
          <div className="w-full max-w-md bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-700 text-lg">
                Create City Corporation Admin
              </h3>
              <button onClick={() => setShowCityAdminModal(false)} className="text-[#4b7a5a] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#86efac]/80 mb-4">
              Register a City Corporation Admin and assign them to an official City Corporation. Login credentials will be dispatched to their email address.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ASSIGNED CITY CORPORATION *</label>
                <select
                  value={cityAdminForm.cityCorpId}
                  onChange={(e) => setCityAdminForm({ ...cityAdminForm, cityCorpId: e.target.value })}
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-[#86efac] outline-none focus:border-[#4ade80]"
                >
                  <option value="">-- Select City Corporation --</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ADMIN FULL NAME *</label>
                <input
                  value={cityAdminForm.fullName}
                  onChange={(e) => setCityAdminForm({ ...cityAdminForm, fullName: e.target.value })}
                  placeholder="e.g. Engr. Tanvir Ahmed"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">USERNAME *</label>
                  <input
                    value={cityAdminForm.username}
                    onChange={(e) => setCityAdminForm({ ...cityAdminForm, username: e.target.value })}
                    placeholder="e.g. dncc_admin"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#4ade80] outline-none focus:border-[#4ade80]"
                  />
                </div>
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">PHONE NUMBER</label>
                  <input
                    value={cityAdminForm.phone}
                    onChange={(e) => setCityAdminForm({ ...cityAdminForm, phone: e.target.value })}
                    placeholder="+8801700000000"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">OFFICIAL EMAIL (FOR CREDENTIALS) *</label>
                <input
                  type="email"
                  value={cityAdminForm.email}
                  onChange={(e) => setCityAdminForm({ ...cityAdminForm, email: e.target.value })}
                  placeholder="admin@dncc.gov.bd"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>

              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">PASSWORD *</label>
                <div className="relative">
                  <input
                    type={showCityAdminPass ? "text" : "password"}
                    value={cityAdminForm.password}
                    onChange={(e) => setCityAdminForm({ ...cityAdminForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCityAdminPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4b7a5a] hover:text-[#4ade80]"
                  >
                    {showCityAdminPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#061309] border border-[#1a3d22] rounded-xl text-[11px] text-[#4b7a5a] space-y-1">
                <div>✉️ An automated email containing the login credentials and portal URL will be sent to the admin.</div>
                <div>🔒 Password is encrypted with industry-standard bcrypt hashing.</div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCityAdminModal(false)}
                className="flex-1 border border-[#1a3d22] text-[#4b7a5a] py-2.5 rounded-xl text-xs hover:border-[#4ade80]/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCityAdmin}
                disabled={loading}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Create & Save Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / ASSIGN USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={() => setShowUserModal(false)}>
          <div className="w-full max-w-md bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

      {/* ── MODAL: ADD / EDIT RANK TIER ── */}
      {showRankModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={() => setShowRankModal(false)}>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-white text-base">
                  {editingRank ? "Edit Rank Level" : "Create New Citizen Rank Level"}
                </h3>
                <p className="text-xs text-[#4b7a5a]">Set point range and level title</p>
              </div>
              <button onClick={() => setShowRankModal(false)} className="text-[#4b7a5a] hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">LEVEL NUMBER</label>
                  <input
                    type="number"
                    min="1"
                    value={rankForm.level}
                    onChange={e => setRankForm({ ...rankForm, level: Number(e.target.value) })}
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">EMOJI BADGE</label>
                  <select
                    value={rankForm.badge}
                    onChange={e => setRankForm({ ...rankForm, badge: e.target.value })}
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                  >
                    <option value="🌱">🌱 Sprout</option>
                    <option value="🌿">🌿 Leaf</option>
                    <option value="⭐">⭐ Star</option>
                    <option value="🏅">🏅 Medal</option>
                    <option value="🏆">🏆 Trophy</option>
                    <option value="👑">👑 Crown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">RANK TITLE / NAME</label>
                <input
                  value={rankForm.name}
                  onChange={e => setRankForm({ ...rankForm, name: e.target.value })}
                  placeholder="e.g. Eco Beginner, Waste Warrior"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">MIN POINTS</label>
                  <input
                    type="number"
                    min="0"
                    value={rankForm.minPoints}
                    onChange={e => setRankForm({ ...rankForm, minPoints: Number(e.target.value) })}
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">MAX POINTS</label>
                  <input
                    type="text"
                    value={rankForm.maxPoints}
                    onChange={e => setRankForm({ ...rankForm, maxPoints: e.target.value })}
                    placeholder="Leave blank for max"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRankModal(false)}
                className="flex-1 border border-[#1a3d22] text-[#4b7a5a] py-2.5 rounded-xl text-xs hover:border-[#4ade80]/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRank}
                disabled={loading}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow"
              >
                <Save size={14} /> Save Rank Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT REWARD OFFER ── */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={() => setShowRewardModal(false)}>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-white text-base">
                  {editingReward ? "Edit Reward Voucher" : "Add New Partner Voucher Offer"}
                </h3>
                <p className="text-xs text-[#4b7a5a]">Super Admin control: configure digital gift vouchers and unique codes</p>
              </div>
              <button onClick={() => setShowRewardModal(false)} className="text-[#4b7a5a] hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">PARTNER BRAND</label>
                  <input
                    value={rewardForm.partner}
                    onChange={e => setRewardForm({ ...rewardForm, partner: e.target.value })}
                    placeholder="e.g. Shajgoj, Pathao, Shohoz"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">ICON</label>
                  <select
                    value={rewardForm.icon}
                    onChange={e => setRewardForm({ ...rewardForm, icon: e.target.value })}
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                  >
                    <option value="🛍️">🛍️ Shopping</option>
                    <option value="🛵">🛵 Ride / Transport</option>
                    <option value="🎬">🎬 Movie / Entertainment</option>
                    <option value="🛒">🛒 Grocery / Supermarket</option>
                    <option value="📱">📱 Mobile / Data</option>
                    <option value="🌳">🌳 Tree Planting / Eco</option>
                    <option value="🍔">🍔 Food / Restaurant</option>
                    <option value="🎁">🎁 Special Gift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">VOUCHER TITLE / OFFER</label>
                <input
                  value={rewardForm.name}
                  onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="e.g. 20% Off Skincare, ৳100 Ride Credit"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">REQUIRED POINTS</label>
                  <input
                    type="number"
                    min="10"
                    value={rewardForm.points}
                    onChange={e => setRewardForm({ ...rewardForm, points: Number(e.target.value) })}
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
                <div>
                  <label className="block text-[#4b7a5a] text-xs font-mono mb-1">CATEGORY</label>
                  <input
                    value={rewardForm.category}
                    onChange={e => setRewardForm({ ...rewardForm, category: e.target.value })}
                    placeholder="e.g. Shopping, Rides"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">DESCRIPTION</label>
                <textarea
                  rows={2}
                  value={rewardForm.description}
                  onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Terms or redemption description..."
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>

              <div className="p-4 bg-[#061309] border border-[#1a3d22] rounded-xl space-y-3">
                <div className="text-xs font-mono text-[#4ade80] font-bold">UNIQUE VOUCHER CODES INVENTORY</div>
                <p className="text-[11px] text-[#4b7a5a]">
                  Each code is single-use only. When a user redeems, one unique code is permanently assigned to them so it is never reused.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#4b7a5a] text-[11px] font-mono mb-1">AUTO-GENERATE CODES</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={rewardForm.generateCount}
                      onChange={e => setRewardForm({ ...rewardForm, generateCount: Number(e.target.value) })}
                      placeholder="e.g. 5"
                      className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#4ade80]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#4b7a5a] text-[11px] font-mono mb-1">CODE PREFIX</label>
                    <input
                      value={rewardForm.codePrefix}
                      onChange={e => setRewardForm({ ...rewardForm, codePrefix: e.target.value })}
                      placeholder="e.g. SHAJ-"
                      className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#4ade80]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#4b7a5a] text-[11px] font-mono mb-1">OR PASTE CUSTOM CODES (COMMA OR LINE SEPARATED)</label>
                  <textarea
                    rows={2}
                    value={rewardForm.codes}
                    onChange={e => setRewardForm({ ...rewardForm, codes: e.target.value })}
                    placeholder="CODE-1, CODE-2, CODE-3"
                    className="w-full bg-[#0d2414] border border-[#1a3d22] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#4ade80] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRewardModal(false)}
                className="flex-1 border border-[#1a3d22] text-[#4b7a5a] py-2.5 rounded-xl text-xs hover:border-[#4ade80]/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReward}
                disabled={loading}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow"
              >
                <Save size={14} /> Save Reward Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MANAGE CODES & RESTOCK FOR A REWARD ── */}
      {activeCodesReward && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={() => setActiveCodesReward(null)}>
          <div className="bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-[#1a3d22]">
              <div>
                <h3 className="font-display font-bold text-white text-base">
                  Voucher Inventory: {activeCodesReward.name}
                </h3>
                <p className="text-xs text-[#4b7a5a]">
                  Partner: {activeCodesReward.partner} · {activeCodesReward.availableCodes || 0} available of {activeCodesReward.totalCodes || 0} total codes
                </p>
              </div>
              <button onClick={() => setActiveCodesReward(null)} className="text-[#4b7a5a] hover:text-white"><X size={18} /></button>
            </div>

            {/* List of codes */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {(activeCodesReward.codes || []).length === 0 ? (
                <div className="text-center py-8 text-xs text-[#4b7a5a]">No voucher codes in inventory. Restock below!</div>
              ) : (
                (activeCodesReward.codes || []).map((code) => (
                  <div
                    key={code.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                      code.isRedeemed
                        ? "bg-[#061309]/60 border-[#1a3d22] opacity-75"
                        : "bg-[#061309] border-[#4ade80]/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white tracking-wider">{code.code}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          code.isRedeemed
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {code.isRedeemed ? "REDEEMED" : "AVAILABLE"}
                      </span>
                    </div>

                    {code.isRedeemed ? (
                      <div className="text-[11px] text-[#4b7a5a] text-right font-mono">
                        by {code.redeemedByUserName || "User"} on {code.redeemedAt ? new Date(code.redeemedAt).toLocaleDateString() : ""}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#4ade80] font-mono">Guaranteed Unique</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Restock Section */}
            <div className="pt-4 border-t border-[#1a3d22] space-y-3">
              <div className="text-xs font-mono text-[#4ade80] font-bold">ADD MORE CODES TO RESTOCK</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={restockGenerateCount}
                  onChange={e => setRestockGenerateCount(Number(e.target.value))}
                  placeholder="Qty"
                  className="w-24 bg-[#061309] border border-[#1a3d22] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#4ade80]"
                />
                <button
                  onClick={handleRestockCodes}
                  disabled={loading}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Plus size={14} /> Auto-Generate {restockGenerateCount} Unique Codes
                </button>
              </div>

              <div>
                <input
                  value={restockCodes}
                  onChange={e => setRestockCodes(e.target.value)}
                  placeholder="Or paste custom codes (comma separated)..."
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#4ade80]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
