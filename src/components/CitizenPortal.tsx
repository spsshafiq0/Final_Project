import { useState, useEffect } from "react";
import { Award, Recycle, Camera, MapPin, Calendar, TrendingUp, Gift, Star, ChevronRight, Upload, CheckCircle, AlertTriangle, Clock, Leaf, Users, Trophy, ArrowLeft, UserPlus, LogIn, LogOut, Wallet, ShieldCheck, RefreshCw, Banknote, CheckCircle2, Download, Building2, X, KeyRound, Copy, CreditCard, Landmark, Smartphone, Navigation } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import NearbyBinsMap from "./NearbyBinsMap";
import { addPickupRequest, getPickupRequests, completePickupRequest, type PickupRequest } from "../data/pickupStore";
import api, { WithdrawalItem, UserProfile, RankTierItem, RewardItem, userStorage, CityCorporationItem, WardItem, PickupScheduleItem, CityWasteItem, WalletTransaction } from "../lib/api";
import { wards } from "../data/cityData";
import ForgotPasswordModal from "./ForgotPasswordModal";

interface CitizenPortalProps {
  onNavigate: (page: string) => void;
}

const recyclingHistory = [
  { month: "Apr", kg: 12 }, { month: "May", kg: 18 }, { month: "Jun", kg: 14 },
  { month: "Jul", kg: 22 }, { month: "Aug", kg: 19 }, { month: "Sep", kg: 25 },
];

const guides = [
  { cat: "✅ Food & Kitchen Waste", icon: "🍌", color: "#4ade80", items: "Vegetable peels, fruit scraps, cooked food leftovers, eggshells, tea bags, coffee grounds — all go in the single smart bin.", allowed: true },
  { cat: "✅ Paper & Cardboard", icon: "📦", color: "#86efac", items: "Newspapers, cardboard boxes, egg cartons, paper bags — go straight in the bin.", allowed: true },
  { cat: "✅ Plastic Containers", icon: "🥤", color: "#60a5fa", items: "Bottles, containers, wrappers — just toss them in. The sorting machine handles classification.", allowed: true },
  { cat: "✅ Metal Cans & Glass", icon: "🫙", color: "#94a3b8", items: "Tin cans, glass bottles and jars, foil trays — all acceptable in the single bin.", allowed: true },
  { cat: "✅ Textiles & Soft Items", icon: "👕", color: "#f9a8d4", items: "Old clothing, fabrics, stuffed items — place in the bin. AI tactile sensors will detect soft materials on the belt.", allowed: true },
  { cat: "❌ Batteries & Electronics", icon: "🔋", color: "#fca5a5", items: "DO NOT put in the bin. Use designated e-waste & battery drop-off points. These trigger gas/chemical sensor alerts if placed in smart bins.", allowed: false },
  { cat: "❌ Medicines & Chemicals", icon: "🧪", color: "#fcd34d", items: "DO NOT put in the bin. Unused medicines, paints, solvents, pesticides — use certified hazardous drop-off sites.", allowed: false },
  { cat: "❌ Medical / Biohazard Waste", icon: "☢️", color: "#fca5a5", items: "Syringes, bandages, medical sharps — NEVER in the regular bin. Schedule a certified medical waste pickup.", allowed: false },
];

const pickupSlots: any[] = [];

const TABS = ["Dashboard", "Report Issue", "Schedule Pickup", "Bin Guide", "Rewards", "Leaderboard"];

export default function CitizenPortal({ onNavigate }: CitizenPortalProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ contact: "", username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [userPoints, setUserPoints] = useState(0);
  const [reportStep, setReportStep] = useState(1);
  const [reportType, setReportType] = useState("");
  const [reportLocation, setReportLocation] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [lastReportCode, setLastReportCode] = useState("");
  const [reportPhoto, setReportPhoto] = useState<string>("");
  const [reportPhotoError, setReportPhotoError] = useState<string>("");
  const [reportError, setReportError] = useState<string>("");
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportLocationLoading, setReportLocationLoading] = useState<boolean>(false);
  const [reportCoords, setReportCoords] = useState<{ lat: number; lng: number } | null>(null);

  // User & Business Wallet Balance & Deposits
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>("250");
  const [depositMethod, setDepositMethod] = useState<"BKASH" | "NAGAD" | "ROCKET" | "CARD" | "BANK">("BKASH");
  const [depositTrxId, setDepositTrxId] = useState<string>("");
  const [depositSenderNumber, setDepositSenderNumber] = useState<string>("");
  const [depositCardDetails, setDepositCardDetails] = useState({ number: "", holder: "", expiry: "", cvc: "" });
  const [depositBankDetails, setDepositBankDetails] = useState({ bankName: "City Bank", accNumber: "", branch: "" });
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string>("");
  const [depositErrorMsg, setDepositErrorMsg] = useState<string>("");

  // City Waste Items (Configured by City Corporation Admin)
  const [customWasteItems, setCustomWasteItems] = useState<CityWasteItem[]>([]);
  const [loadingWasteItems, setLoadingWasteItems] = useState<boolean>(false);

  // Exact Google Coordinates for On-Demand Pickup
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupGpsLoading, setPickupGpsLoading] = useState<boolean>(false);
  const [pickupCityCorpId, setPickupCityCorpId] = useState<string>("");
  const [pickupWardId, setPickupWardId] = useState<string>("");
  const [pickupFilteredWards, setPickupFilteredWards] = useState<WardItem[]>([]);
  const [selectedWasteItemId, setSelectedWasteItemId] = useState<string>("");

  const [bookedSlot, setBookedSlot] = useState<number | null>(null);
  const [redeemedReward, setRedeemedReward] = useState<string | null>(null);
  const [pickupForm, setPickupForm] = useState({ address: "", area: "", waste: "", date: "", deposit: "" });
  const [pickupRequested, setPickupRequested] = useState(false);
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>(getPickupRequests());
  const [codes, setCodes] = useState<Record<string | number, string>>({});
  const [pickupMessage, setPickupMessage] = useState("");

  // City Corporation & Ward Selection State (for Cash Out & Reports)
  const [cityCorps, setCityCorps] = useState<CityCorporationItem[]>([]);
  const [selectedCityCorpId, setSelectedCityCorpId] = useState<string>("");
  const [allWards, setAllWards] = useState<WardItem[]>([]);
  const [filteredWards, setFilteredWards] = useState<WardItem[]>([]);
  const [selectedWardData, setSelectedWardData] = useState<WardItem | null>(null);
  const [globalWithdrawEnabled, setGlobalWithdrawEnabled] = useState(true);
  const [globalCouponsEnabled, setGlobalCouponsEnabled] = useState(true);

  // Schedules from City/Ward Admin
  const [liveSchedules, setLiveSchedules] = useState<PickupScheduleItem[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Cash & Reward Policy State (Managed by City Corporation Admin)
  const [pointRate, setPointRate] = useState(0.20); // ৳0.20 per point default
  const [minWithdrawPoints, setMinWithdrawPoints] = useState(100);
  const [rewardActive, setRewardActive] = useState(true);

  // Cash Withdrawal modal & form
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawPoints, setWithdrawPoints] = useState(100);
  const [selectedWardId, setSelectedWardId] = useState<string>(wards[0]?.id ? String(wards[0].id) : "1");
  const [citizenName, setCitizenName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [withdrawNotes, setWithdrawNotes] = useState("");
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState("");
  const [activeVoucher, setActiveVoucher] = useState<WithdrawalItem | null>(null);

  // Cash Withdrawal History
  const [myWithdrawals, setMyWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  // Real Gamification, Real Leaderboard & Partner Rewards
  const [citizens, setCitizens] = useState<UserProfile[]>([]);
  const [rankTiers, setRankTiers] = useState<RankTierItem[]>([
    { id: "tier-1", level: 1, name: "Eco Beginner", minPoints: 0, maxPoints: 200, badge: "🌱" },
    { id: "tier-2", level: 2, name: "Green Scout", minPoints: 201, maxPoints: 600, badge: "🌿" },
    { id: "tier-3", level: 3, name: "Waste Warrior", minPoints: 601, maxPoints: 1500, badge: "⭐" },
    { id: "tier-4", level: 4, name: "Eco Champion", minPoints: 1501, maxPoints: 3000, badge: "🏅" },
    { id: "tier-5", level: 5, name: "Earth Guardian", minPoints: 3001, maxPoints: null, badge: "🏆" },
  ]);
  const [partnerRewards, setPartnerRewards] = useState<RewardItem[]>([]);
  const [myVouchers, setMyVouchers] = useState<{ id: string; code: string; rewardName: string; partner: string; redeemedAt: string }[]>([]);
  const [redeemedResult, setRedeemedResult] = useState<{ code: string; rewardName: string; partner: string; pointsDeducted: number } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchRewardPolicy = async () => {
    try {
      const policy = await api.rewards.getPolicy();
      if (policy) {
        if (typeof policy.pointRate === "number") setPointRate(policy.pointRate);
        if (typeof policy.minWithdrawPoints === "number") setMinWithdrawPoints(policy.minWithdrawPoints);
        if (typeof policy.rewardActive === "boolean") setRewardActive(policy.rewardActive);
      }
    } catch {
      // Keep defaults
    }
  };

  const fetchMyWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const res = await api.withdrawals.getAll();
      if (Array.isArray(res)) {
        setMyWithdrawals(res);
      } else {
        setMyWithdrawals([]);
      }
    } catch {
      setMyWithdrawals([]);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const loadCitizens = async () => {
    try {
      const res = await api.users.getAll({ role: "CITIZEN" });
      if (Array.isArray(res)) setCitizens(res);
    } catch {}
  };

  const loadRankTiers = async () => {
    try {
      const res = await api.ranks.getAll();
      if (Array.isArray(res) && res.length > 0) setRankTiers(res);
    } catch {}
  };

  const loadRewards = async (cId?: string) => {
    try {
      const targetId = cId || userStorage.get()?.id;
      const res = await api.rewards.getAll(targetId);
      if (Array.isArray(res)) {
        setPartnerRewards(res);
        const collected: any[] = [];
        res.forEach((r) => {
          if (r.myRedeemedCodes && r.myRedeemedCodes.length > 0) {
            collected.push(...r.myRedeemedCodes);
          }
        });
        setMyVouchers(collected);
      }
    } catch {}
  };

  const handleRedeemVoucher = async (reward: RewardItem) => {
    if (userPoints < reward.points) {
      alert(`You need ${reward.points - userPoints} more points to redeem this voucher.`);
      return;
    }
    if (!reward.available || reward.stockCount <= 0) {
      alert("This voucher is currently out of stock.");
      return;
    }

    setIsRedeeming(true);
    try {
      const cId = userStorage.get()?.id;
      const res = await api.rewards.redeem(reward.id, cId);
      if (res?.success) {
        setUserPoints(res.remainingPoints);
        const cu = userStorage.get();
        if (cu) userStorage.set({ ...cu, points: res.remainingPoints });

        setRedeemedResult({
          code: res.voucherCode,
          rewardName: res.rewardName,
          partner: res.partner,
          pointsDeducted: res.pointsDeducted,
        });

        setMyVouchers(prev => [
          {
            id: `v-${Date.now()}`,
            code: res.voucherCode,
            rewardName: res.rewardName,
            partner: res.partner,
            redeemedAt: res.redeemedAt || new Date().toISOString(),
          },
          ...prev,
        ]);

        loadRewards(cId);
        loadCitizens();
      }
    } catch (err: any) {
      alert(err.message || "Failed to redeem voucher. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await api.wallet.get();
      if (res && typeof res.walletBalance === "number") {
        setWalletBalance(res.walletBalance);
        setWalletTransactions(res.transactions || []);
      }
    } catch {}
  };

  const loadWasteItems = async (cityCorpId?: string) => {
    setLoadingWasteItems(true);
    try {
      const items = await api.wasteTypes.getAll({ cityCorpId, active: true });
      if (Array.isArray(items) && items.length > 0) {
        setCustomWasteItems(items);
        const currentSelected = items.find(i => i.id === selectedWasteItemId);
        if (!currentSelected) {
          setSelectedWasteItemId(items[0].id);
          setPickupForm(f => ({ ...f, waste: items[0].name, deposit: String(items[0].depositFee || 250) }));
        }
      }
    } catch {}
    finally {
      setLoadingWasteItems(false);
    }
  };

  const loadCityData = async () => {
    try {
      const [citiesList, wardsList, globalPolicy] = await Promise.all([
        api.cities.getAll().catch(() => []),
        api.wards.getAll().catch(() => []),
        api.rewards.getGlobalPolicy().catch(() => ({ couponsGloballyEnabled: true, withdrawGloballyEnabled: true })),
      ]);
      if (Array.isArray(citiesList) && citiesList.length > 0) {
        setCityCorps(citiesList);
        setSelectedCityCorpId(citiesList[0].id);
        setPickupCityCorpId(citiesList[0].id);
        loadWasteItems(citiesList[0].id);
      }
      if (Array.isArray(wardsList) && wardsList.length > 0) {
        setAllWards(wardsList);
        if (citiesList && citiesList.length > 0) {
          const matched = wardsList.filter(w => w.cityCorpId === citiesList[0].id);
          const activeFiltered = matched.length > 0 ? matched : wardsList;
          setFilteredWards(activeFiltered);
          setSelectedWardId(String(activeFiltered[0].id));
          setSelectedWardData(activeFiltered[0]);

          setPickupFilteredWards(activeFiltered);
          setPickupWardId(String(activeFiltered[0].id));
          setPickupForm(f => ({ ...f, area: activeFiltered[0].name }));
        } else {
          setFilteredWards(wardsList);
          setSelectedWardId(String(wardsList[0].id));
          setSelectedWardData(wardsList[0]);

          setPickupFilteredWards(wardsList);
          setPickupWardId(String(wardsList[0].id));
          setPickupForm(f => ({ ...f, area: wardsList[0].name }));
        }
      }
      if (globalPolicy) {
        setGlobalWithdrawEnabled(globalPolicy.withdrawGloballyEnabled !== false);
        setGlobalCouponsEnabled(globalPolicy.couponsGloballyEnabled !== false);
      }
    } catch (err) {
      console.warn("Could not load city data", err);
    }
  };

  const handleCityCorpChange = (cityId: string) => {
    setSelectedCityCorpId(cityId);
    const matched = allWards.filter(w => w.cityCorpId === cityId);
    setFilteredWards(matched);
    if (matched.length > 0) {
      setSelectedWardId(String(matched[0].id));
      setSelectedWardData(matched[0]);
    } else {
      setSelectedWardId("");
      setSelectedWardData(null);
    }
  };

  const handlePickupCityChange = (cityId: string) => {
    setPickupCityCorpId(cityId);
    const matched = allWards.filter(w => w.cityCorpId === cityId);
    setPickupFilteredWards(matched);
    if (matched.length > 0) {
      setPickupWardId(String(matched[0].id));
      setPickupForm(f => ({ ...f, area: matched[0].name }));
    } else {
      setPickupWardId("");
    }
    loadWasteItems(cityId);
  };

  const handlePickupWardChange = (wardId: string) => {
    setPickupWardId(wardId);
    const ward = allWards.find(w => String(w.id) === String(wardId));
    if (ward) {
      setPickupForm(f => ({ ...f, area: ward.name }));
    }
  };

  const handleWasteItemSelect = (wasteId: string) => {
    setSelectedWasteItemId(wasteId);
    const item = customWasteItems.find(w => w.id === wasteId);
    if (item) {
      setPickupForm(f => ({ ...f, waste: item.name, deposit: String(item.depositFee || 250) }));
    }
  };

  const handleDetectPickupGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setPickupGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPickupCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data?.display_name) {
            const shortAddr = data.display_name.split(",").slice(0, 4).join(", ");
            setPickupForm(f => ({ ...f, address: shortAddr }));
          } else {
            setPickupForm(f => ({ ...f, address: `Google Coords: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
          }
        } catch {
          setPickupForm(f => ({ ...f, address: `Google Coords: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
        } finally {
          setPickupGpsLoading(false);
        }
      },
      (err) => {
        setPickupGpsLoading(false);
        alert(`GPS detection note: ${err.message}. Accurate pickup coordinates set to default central position.`);
        setPickupCoords({ lat: 23.7542, lng: 90.3654 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleDepositSubmit = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt < 50) {
      setDepositErrorMsg("Minimum deposit amount is ৳50.");
      return;
    }
    if ((depositMethod === "BKASH" || depositMethod === "NAGAD" || depositMethod === "ROCKET") && !depositTrxId.trim()) {
      setDepositErrorMsg("Please enter your Transaction ID (TrxID) from your mobile banking app.");
      return;
    }
    setIsDepositing(true);
    setDepositErrorMsg("");
    setDepositSuccessMsg("");
    try {
      const res = await api.wallet.deposit({
        amount: amt,
        paymentMethod: depositMethod,
        trxId: depositTrxId || `TX-${Date.now().toString().slice(-8)}`,
        senderNumber: depositSenderNumber || citizenPhone,
        note: `Deposit via ${depositMethod}`,
      });
      if (res?.success) {
        setWalletBalance(res.walletBalance);
        if (res.transaction) {
          setWalletTransactions(prev => [res.transaction, ...prev]);
        }
        setDepositSuccessMsg(`৳${amt} deposited successfully to your account!`);
        setTimeout(() => {
          setDepositModalOpen(false);
          setDepositSuccessMsg("");
          setDepositTrxId("");
        }, 1500);
      }
    } catch (err: any) {
      setDepositErrorMsg(err?.message || "Failed to process deposit. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWardChange = (wardId: string) => {
    setSelectedWardId(wardId);
    const found = allWards.find(w => String(w.id) === String(wardId)) || null;
    setSelectedWardData(found);
  };

  const loadSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const res = await api.schedules.getAll({ public: true });
      if (Array.isArray(res) && res.length > 0) {
        setLiveSchedules(res);
      }
    } catch {
      // keep fallback
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleSelectReportType = (type: string) => {
    setReportType(type);
    setReportPhotoError("");
    setReportError("");
    setReportStep(2);

    // Auto-fill live GPS Google coordinates
    if (navigator.geolocation && !reportLocation) {
      setReportLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setReportCoords({ lat: latitude, lng: longitude });
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            if (data?.display_name) {
              const parts = data.display_name.split(",").slice(0, 3).map((s: string) => s.trim()).join(", ");
              setReportLocation(parts);
            } else {
              setReportLocation(`GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            }
          } catch {
            setReportLocation(`GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          } finally {
            setReportLocationLoading(false);
          }
        },
        () => {
          setReportLocationLoading(false);
          setReportCoords({ lat: 23.7542, lng: 90.3654 });
          if (!reportLocation) setReportLocation("Current Detected Location");
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setReportPhotoError("Image size exceeds 10MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setReportPhoto(b64);
      setReportPhotoError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReport = async () => {
    if (!reportPhoto) {
      setReportPhotoError("Photo upload is mandatory! Please upload or capture a photo of the waste issue.");
      return;
    }
    if (!reportLocation.trim()) {
      setReportError("Please specify the location of the waste issue.");
      return;
    }
    setIsSubmittingReport(true);
    setReportError("");
    try {
      const code = `RPT-${Date.now().toString().slice(-6)}`;
      setLastReportCode(code);
      const res = await api.reports.create({
        location: reportLocation,
        lat: reportCoords?.lat,
        lng: reportCoords?.lng,
        description: reportDescription || `Citizen reported ${reportType}`,
        imageUrl: reportPhoto,
        wasteType: reportType || "Mixed",
        priority: reportType === "Hazardous Waste" ? "high" : "normal",
        wardId: selectedWardId || undefined,
        citizenId: userStorage.get()?.id,
      });

      if (res?.report?.reportCode) {
        setLastReportCode(res.report.reportCode);
      }
      const pts = res?.pointsAwarded ?? (reportType === "Hazardous Waste" ? 200 : 150);
      setUserPoints(p => p + pts);
      const cu = userStorage.get();
      if (cu) userStorage.set({ ...cu, points: (cu.points || 0) + pts });
      setReportStep(3);
    } catch (err: any) {
      setReportError(err?.message || "Failed to submit report. Please check if this location was already reported.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    const cu = userStorage.get();
    if (cu) {
      setAuthenticated(true);
      setUserPoints(cu.points || 0);
      setCitizenName(cu.fullName || cu.username || "Citizen");
      if (cu.phone) setCitizenPhone(cu.phone);
      if (typeof cu.walletBalance === "number") setWalletBalance(cu.walletBalance);
    }
    fetchRewardPolicy();
    fetchMyWithdrawals();
    loadCitizens();
    loadRankTiers();
    loadRewards(cu?.id);
    loadCityData();
    loadSchedules();
    loadWallet();
  }, []);

  const handleRequestCashWithdrawal = async () => {
    if (!globalWithdrawEnabled) {
      setWithdrawalError("Cash withdrawals are temporarily paused system-wide by the Super Administrator.");
      return;
    }
    if (selectedWardData?.withdrawEnabled === false) {
      setWithdrawalError(`Cash withdrawals are currently disabled at ${selectedWardData.name || "this ward office"} by the Ward Admin.`);
      return;
    }
    if (!rewardActive) {
      setWithdrawalError("The cash reward program is currently inactive in your City Corporation.");
      return;
    }
    if (withdrawPoints < minWithdrawPoints) {
      setWithdrawalError(`Minimum withdrawal is ${minWithdrawPoints} points.`);
      return;
    }
    if (withdrawPoints > userPoints) {
      setWithdrawalError(`You do not have enough points. Current balance: ${userPoints} pts.`);
      return;
    }
    if (!citizenPhone.trim()) {
      setWithdrawalError("Please provide your phone number so the Ward Admin can identify you.");
      return;
    }

    setIsSubmittingWithdrawal(true);
    setWithdrawalError("");
    try {
      const res = await api.withdrawals.create({
        points: withdrawPoints,
        wardId: selectedWardId,
        citizenName,
        citizenPhone,
        notes: withdrawNotes,
      });

      const newVoucher = (res as any)?.withdrawal || {
        id: `wdr-${Date.now()}`,
        citizenId: "citizen-me",
        wardId: selectedWardId,
        points: withdrawPoints,
        amount: Math.round(withdrawPoints * pointRate * 100) / 100,
        pointRate,
        status: "pending",
        verificationCode: `WDR-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        ward: wards.find(w => String(w.id) === String(selectedWardId)) || wards[0],
      };

      setUserPoints(p => Math.max(0, p - withdrawPoints));
      setMyWithdrawals(prev => [newVoucher, ...prev]);
      setActiveVoucher(newVoucher);
      setWithdrawModal(false);
    } catch (err: any) {
      setWithdrawalError(err?.message || "Failed to submit cash withdrawal request.");
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const confirmPickup = (req: PickupRequest) => {
    const result = completePickupRequest(req.id, codes[req.id] ?? "");
    setPickupRequests(result.requests);
    if (result.success) {
      setPickupMessage(`Pickup confirmed. ৳${req.amount} was credited to the driver.`);
    } else {
      setPickupMessage("Incorrect security code. Please check and try again.");
    }
  };

  const submitAuth = async () => {
    if (!authForm.password || (authMode === "login" ? (!authForm.username && !authForm.contact) : (!authForm.username || !authForm.contact || !authForm.email))) {
      setAuthError("Please complete all required fields.");
      return;
    }
    setAuthError("");

    const targetUser = authForm.username || authForm.contact;
    try {
      if (authMode === "login") {
        const result = await api.auth.login(targetUser, authForm.password);
        if (result?.user) {
          userStorage.set(result.user);
          if (typeof result.user.points === "number") setUserPoints(result.user.points);
          if (result.user.fullName) setCitizenName(result.user.fullName);
          if (result.user.phone) setCitizenPhone(result.user.phone);
          loadRewards(result.user.id);
          loadCitizens();
        }
      } else {
        // Real Dynamic Registration in PostgreSQL (Starts with 0 points, no bonus)
        const result = await api.auth.register({
          username: authForm.username,
          password: authForm.password,
          fullName: authForm.username,
          email: authForm.email,
          phone: authForm.contact,
          role: "CITIZEN",
        });
        if (result?.user) {
          userStorage.set(result.user);
          setCitizenName(result.user.fullName || authForm.username);
          if (result.user.phone) setCitizenPhone(result.user.phone);
          setUserPoints(0);
          loadRewards(result.user.id);
          loadCitizens();
        }
      }
      setAuthenticated(true);
      fetchMyWithdrawals();
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed. Please verify your username and password.");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#052e16] px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <button onClick={() => onNavigate("landing")} className="text-[#86efac] text-sm flex items-center gap-2 mb-6"><ArrowLeft size={16} /> Back to home</button>
          <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-2xl">
            <div className="w-12 h-12 bg-[#16a34a] rounded-xl flex items-center justify-center mb-4"><Recycle size={22} className="text-white" /></div>
            <div className="font-display font-800 text-2xl text-[#052e16]">Citizen Portal</div>
            <div className="text-[#4b7a5a] text-sm mt-1 mb-6">Manage rewards, reports and paid pickup requests.</div>
            <div className="grid grid-cols-2 bg-[#f0fdf4] rounded-xl p-1 mb-5">
              {(["login", "register"] as const).map(mode => <button key={mode} onClick={() => { setAuthMode(mode); setAuthError(""); }} className={`py-2.5 rounded-lg text-sm font-semibold capitalize ${authMode === mode ? "bg-[#16a34a] text-white" : "text-[#4b7a5a]"}`}>{mode}</button>)}
            </div>
            <div className="space-y-3">
              {authMode === "register" && <input value={authForm.contact} onChange={e => setAuthForm(f => ({ ...f, contact: e.target.value }))} placeholder="Contact number" className="w-full border border-[#e2f5e9] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#16a34a]" />}
              <input value={authForm.username} onChange={e => setAuthForm(f => ({ ...f, username: e.target.value }))} placeholder={authMode === "login" ? "Username or contact number" : "Choose a username"} className="w-full border border-[#e2f5e9] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#16a34a]" />
              {authMode === "register" && <input type="email" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" className="w-full border border-[#e2f5e9] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#16a34a]" />}
              <input type="password" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && submitAuth()} placeholder="Password" className="w-full border border-[#e2f5e9] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#16a34a]" />
              {authMode === "login" && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs text-[#16a34a] hover:underline flex items-center gap-1 font-medium"
                  >
                    <KeyRound size={12} /> Forgot password?
                  </button>
                </div>
              )}
            </div>
            {authError && <div className="text-red-600 bg-red-50 rounded-lg px-3 py-2 text-xs mt-3">{authError}</div>}
            <button onClick={submitAuth} className="w-full bg-[#052e16] text-white rounded-xl py-3 mt-5 font-semibold flex items-center justify-center gap-2">
              {authMode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />} {authMode === "login" ? "Login" : "Create account"}
            </button>
          </div>
        </div>

        {/* Unified Brevo Email OTP Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={forgotOpen}
          onClose={() => setForgotOpen(false)}
          defaultIdentifier={authForm.email || authForm.username}
          role="CITIZEN"
          onSuccess={(newP) => {
            setAuthForm(f => ({ ...f, password: newP }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fdf9]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#052e16] to-[#0a3d1e] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate("landing")} className="text-[#86efac] hover:text-white transition-colors">
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="font-display font-700 text-lg">Citizen Portal</div>
                <div className="text-[#86efac] text-xs">IntelliWaste — {userStorage.get()?.ward?.area ? `${userStorage.get()?.ward?.name} (${userStorage.get()?.ward?.area})` : "Citizen Service Zone"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDepositModalOpen(true)}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 text-emerald-300 hover:text-white transition-all cursor-pointer shadow-xs"
                title="Wallet Balance & Deposit Money"
              >
                <Wallet size={15} className="text-emerald-400" />
                <span className="font-mono font-bold text-white text-xs sm:text-sm">৳{walletBalance.toFixed(0)}</span>
                <span className="bg-emerald-600 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded text-white font-medium ml-0.5">+ Deposit</span>
              </button>
              <div className="bg-[#4ade80]/20 border border-[#4ade80]/40 rounded-xl px-2.5 sm:px-4 py-2 flex items-center gap-1.5">
                <Award size={16} className="text-[#4ade80]" />
                <span className="font-mono font-bold text-[#4ade80]">{userPoints.toLocaleString()}</span>
                <span className="text-[#86efac] text-xs">pts</span>
              </div>
              <div className="w-8 h-8 bg-[#16a34a] rounded-full flex items-center justify-center font-bold text-xs text-white uppercase" title={citizenName}>
                {citizenName ? citizenName.slice(0, 1) : "C"}
              </div>
              <button
                onClick={() => {
                  api.auth.logout();
                  setAuthenticated(false);
                  onNavigate("landing");
                }}
                title="Sign out of Citizen Account"
                className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab ? "bg-[#f8fdf9] text-[#052e16]" : "text-[#86efac] hover:text-white"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* Dashboard */}
        {activeTab === "Dashboard" && (() => {
          // Dynamic Rank Tier computation from Super Admin configured tiers
          const currentTier = rankTiers.find(
            (t) => userPoints >= t.minPoints && (t.maxPoints === null || userPoints <= t.maxPoints)
          ) || rankTiers[0] || {
            id: "def",
            level: 1,
            name: "Eco Beginner",
            minPoints: 0,
            maxPoints: 200,
            badge: "🌱",
          };

          const nextTier = rankTiers.find((t) => t.level === currentTier.level + 1);
          const targetPts = currentTier.maxPoints || (nextTier ? nextTier.minPoints : currentTier.minPoints + 200);
          const tierProgress = currentTier.maxPoints
            ? Math.min(100, Math.max(0, Math.round(((userPoints - currentTier.minPoints) / Math.max(1, currentTier.maxPoints - currentTier.minPoints)) * 100)))
            : 100;

          // Real Leaderboard calculation
          const sortedCitizens = [...citizens].sort((a, b) => (b.points || 0) - (a.points || 0));
          const myRankIdx = sortedCitizens.findIndex(
            (c) => c.username === citizenName || c.fullName === citizenName || c.phone === citizenPhone || c.id === userStorage.get()?.id
          );
          const myRank = myRankIdx >= 0 ? myRankIdx + 1 : 1;
          const userZone = userStorage.get()?.ward?.area || userStorage.get()?.address || "Service Zone";

          return (
            <div className="space-y-6">
              {/* Welcome card */}
              <div className="bg-gradient-to-br from-[#052e16] to-[#0a3d1e] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 map-grid opacity-10" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[#4ade80] text-xs font-mono font-bold tracking-wider mb-1">
                        LEVEL {currentTier.level} — {currentTier.name.toUpperCase()}
                      </div>
                      <div className="font-display font-800 text-2xl mb-1">
                        Welcome back, {citizenName || "Citizen"}! 👋
                      </div>
                      <div className="text-[#86efac] text-sm">
                        You're ranked #{myRank} among {Math.max(1, sortedCitizens.length)} registered citizens in {userZone}. {nextTier ? `Keep recycling to climb to Level ${nextTier.level} (${nextTier.name})!` : "You have achieved the highest rank!"}
                      </div>
                    </div>
                    <div className="text-center shrink-0">
                      <div className="text-4xl drop-shadow">{currentTier.badge}</div>
                      <div className="text-[#4ade80] font-mono font-bold text-xs mt-1">
                        {currentTier.name.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[#86efac] mb-1">
                      <span>{nextTier ? `Progress to Level ${nextTier.level} (${nextTier.name})` : "Max Rank Achieved"}</span>
                      <span className="font-mono">{userPoints.toLocaleString()} / {targetPts.toLocaleString()} pts</span>
                    </div>
                    <div className="bg-[#1a3d22] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#16a34a] to-[#4ade80] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${tierProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <NearbyBinsMap area={userStorage.get()?.ward?.area || userStorage.get()?.address || "Nearby Sector"} />

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Points Earned", value: `${userPoints.toLocaleString()} pts`, icon: Star, color: "#facc15" },
                  { label: "Kg Recycled", value: `${(userPoints * 0.05).toFixed(1)} kg`, icon: Recycle, color: "#4ade80" },
                  { label: "Issues Reported", value: `${lastReportCode ? 1 : 0}`, icon: AlertTriangle, color: "#fb923c" },
                  { label: "CO₂ Saved", value: `${(userPoints * 0.02).toFixed(1)} kg`, icon: Leaf, color: "#86efac" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white border border-[#e2f5e9] rounded-xl p-4 shadow-xs">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: stat.color + "22" }}>
                      <stat.icon size={16} style={{ color: stat.color }} />
                    </div>
                    <div className="font-display font-700 text-lg text-[#052e16]">{stat.value}</div>
                    <div className="text-[#4b7a5a] text-xs">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recycling chart */}
              <div className="bg-white border border-[#e2f5e9] rounded-xl p-5">
                <div className="font-display font-600 text-[#052e16] mb-4">Your Recycling (kg/month)</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={recyclingHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2f5e9" />
                    <XAxis dataKey="month" stroke="#4b7a5a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#4b7a5a" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="kg" fill="#16a34a" radius={[4, 4, 0, 0]} name="Recycled (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick actions */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Report Illegal Dumping", desc: "+150 pts", icon: Camera, tab: "Report Issue", color: "#fb923c" },
                  { label: "Schedule Pickup", desc: "Next: Tue, Sep 12", icon: Calendar, tab: "Schedule Pickup", color: "#60a5fa" },
                  { label: "Bin Usage Guide", desc: "What goes in your bin", icon: Recycle, tab: "Bin Guide", color: "#a78bfa" },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={() => setActiveTab(action.tab)}
                    className="bg-white border border-[#e2f5e9] rounded-xl p-4 text-left hover:border-[#bbf7d0] hover:shadow-md transition-all flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: action.color + "22" }}>
                      <action.icon size={18} style={{ color: action.color }} />
                    </div>
                    <div>
                      <div className="font-display font-600 text-sm text-[#052e16]">{action.label}</div>
                      <div className="text-xs text-[#4b7a5a] mt-0.5">{action.desc}</div>
                    </div>
                    <ChevronRight size={14} className="text-[#4b7a5a] ml-auto mt-1" />
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Report Issue */}
        {activeTab === "Report Issue" && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white border border-[#e2f5e9] rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#fb923c]/20 rounded-xl flex items-center justify-center">
                  <Camera size={18} className="text-[#fb923c]" />
                </div>
                <div>
                  <div className="font-display font-700 text-[#052e16]">Report an Issue</div>
                  <div className="text-[#4b7a5a] text-xs">Earn 150–200 points per verified report</div>
                </div>
              </div>

              {selectedWardData && selectedWardData.reportEnabled === false && (
                <div className="mb-5 bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Issue Reporting Temporarily Paused</div>
                    <div>Reporting new waste issues is currently disabled in {selectedWardData.name || "this ward"} by the local Ward Admin.</div>
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${reportStep >= step ? "bg-[#16a34a] text-white" : "bg-[#dcfce7] text-[#4b7a5a]"}`}>{step}</div>
                    {step < 3 && <div className={`flex-1 h-0.5 w-8 ${reportStep > step ? "bg-[#16a34a]" : "bg-[#dcfce7]"}`} />}
                  </div>
                ))}
                <div className="ml-2 text-xs text-[#4b7a5a] font-medium">{reportStep === 1 ? "Select Issue Type" : reportStep === 2 ? "Location & Mandatory Photo" : "Confirm"}</div>
              </div>

              {reportStep === 1 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-[#052e16] mb-3">What are you reporting?</div>
                  {[
                    { type: "Illegal Dumping", pts: "+150 pts", icon: "⚠️", desc: "Overflowing piles on street corners or roadsides", isHazardous: false },
                    { type: "Hazardous Waste", pts: "+200 pts", icon: "☢️", desc: "Chemical, medical, battery or industrial toxins (Routed to Hazardous Truck)", isHazardous: true },
                    { type: "Bin Damage / Vandalism", pts: "+75 pts", icon: "🔧", desc: "Broken sensors, cracked container or damage", isHazardous: false },
                    { type: "Missed Collection", pts: "+50 pts", icon: "📅", desc: "Smart bin full but regular truck hasn't emptied", isHazardous: false },
                  ].map(r => (
                    <button
                      key={r.type}
                      disabled={selectedWardData?.reportEnabled === false}
                      onClick={() => handleSelectReportType(r.type)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                        selectedWardData?.reportEnabled === false
                          ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                          : reportType === r.type
                          ? "border-[#16a34a] bg-[#f0fdf4]"
                          : "border-[#e2f5e9] hover:border-[#bbf7d0] hover:bg-[#f8fdf9]"
                      }`}
                    >
                      <span className="text-2xl mt-0.5">{r.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-[#052e16]">{r.type}</span>
                          <span className="text-[#16a34a] text-xs font-mono font-bold bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-0.5 rounded-full">{r.pts}</span>
                        </div>
                        <div className="text-xs text-[#4b7a5a] mt-0.5">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {reportStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-[#16a34a]" />
                      <span className="text-sm text-[#052e16] font-semibold">{reportType}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#16a34a]">
                      {reportType === "Hazardous Waste" ? "+200 pts (Hazardous Unit)" : "+150 pts"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#052e16] mb-1.5 flex items-center justify-between">
                      <span>Accurate Issue Location</span>
                      {reportLocationLoading && <span className="text-xs text-[#16a34a] flex items-center gap-1 font-normal"><RefreshCw size={11} className="animate-spin" /> Detecting GPS...</span>}
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={reportLocation}
                        onChange={e => setReportLocation(e.target.value)}
                        className="flex-1 border border-[#e2f5e9] rounded-xl px-4 py-2.5 text-sm text-[#052e16] focus:border-[#16a34a] outline-none"
                        placeholder="Detecting GPS location or enter address..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            setReportLocationLoading(true);
                            navigator.geolocation.getCurrentPosition(
                              async pos => {
                                try {
                                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                                  const data = await res.json();
                                  setReportLocation(data.display_name?.split(",").slice(0, 3).join(",") || `GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
                                } catch {
                                  setReportLocation(`GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
                                } finally {
                                  setReportLocationLoading(false);
                                }
                              },
                              () => setReportLocationLoading(false)
                            );
                          }
                        }}
                        title="Detect My Location"
                        className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-3.5 text-[#16a34a] hover:bg-[#dcfce7] transition-colors flex items-center gap-1 text-xs font-semibold"
                      >
                        <MapPin size={15} />
                        <span className="hidden sm:inline">GPS</span>
                      </button>
                    </div>
                  </div>

                  {/* Mandatory Photo Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[#052e16]">
                        Upload Photo <span className="text-red-500 font-bold">* (Mandatory)</span>
                      </label>
                      <span className="text-[11px] text-[#4b7a5a]">Required to prevent point farming</span>
                    </div>

                    {reportPhoto ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-[#16a34a] bg-black/5">
                        <img src={reportPhoto} alt="Uploaded Waste Evidence" className="w-full h-44 object-cover" />
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <span className="bg-[#16a34a] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                            <CheckCircle2 size={12} /> Photo Attached
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setReportPhoto("");
                              setReportPhotoError("");
                            }}
                            className="bg-black/70 hover:bg-black text-white p-1 rounded-md text-xs"
                            title="Remove Photo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-[#bbf7d0] hover:border-[#16a34a] rounded-xl p-6 text-center transition-all cursor-pointer bg-[#f8fdf9] block">
                        <Upload size={24} className="text-[#16a34a] mx-auto mb-2" />
                        <div className="text-sm font-semibold text-[#052e16]">Click to upload or take a photo</div>
                        <div className="text-xs text-[#4b7a5a] mt-0.5">JPG, PNG or camera capture (Max 10MB)</div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {reportPhotoError && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 font-medium">
                        <AlertTriangle size={13} className="shrink-0" />
                        {reportPhotoError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#052e16] mb-1.5">Description (Optional)</label>
                    <textarea
                      value={reportDescription}
                      onChange={e => setReportDescription(e.target.value)}
                      className="w-full border border-[#e2f5e9] rounded-xl px-4 py-2.5 text-sm text-[#052e16] focus:border-[#16a34a] outline-none resize-none"
                      rows={2}
                      placeholder="Add any landmark or specific details for the collection truck..."
                    />
                  </div>

                  {reportError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Submission Error</span>
                        {reportError}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setReportStep(1)}
                      className="flex-1 border border-[#e2f5e9] rounded-xl py-2.5 text-sm text-[#4b7a5a] hover:border-[#bbf7d0] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      disabled={isSubmittingReport || !reportPhoto}
                      className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
                    >
                      {isSubmittingReport ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Submitting...
                        </>
                      ) : (
                        "Submit Verified Report"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {reportStep === 3 && (
                <div className="text-center space-y-4 py-3">
                  <div className="w-16 h-16 bg-[#4ade80]/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-[#16a34a]" />
                  </div>
                  <div className="font-display font-700 text-xl text-[#052e16]">Report Verified & Submitted!</div>
                  <div className="text-[#4b7a5a] text-sm max-w-sm mx-auto">
                    {reportType === "Hazardous Waste"
                      ? "Your report has been routed to the Dedicated Hazardous Waste Truck for safe handling."
                      : "Your report has been dispatched to the nearest collection truck in your ward."}
                  </div>
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 inline-block shadow-xs">
                    <div className="text-[#16a34a] font-mono font-bold text-2xl">
                      {reportType === "Hazardous Waste" ? "+200 pts" : "+150 pts"}
                    </div>
                    <div className="text-[#4b7a5a] text-xs">Credited immediately to your Eco Balance</div>
                  </div>
                  <div className="text-xs text-[#4b7a5a] font-mono">Report ID: {lastReportCode || `RPT-${Date.now().toString().slice(-6)}`}</div>
                  <button
                    onClick={() => {
                      setReportLocation("");
                      setReportDescription("");
                      setReportPhoto("");
                      setReportStep(1);
                    }}
                    className="w-full bg-[#16a34a] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#15803d] transition-colors"
                  >
                    Submit Another Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Pickup */}
        {activeTab === "Schedule Pickup" && (
          <div className="space-y-6">
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 flex items-start gap-3">
              <Clock size={16} className="text-[#16a34a] mt-0.5 shrink-0" />
              <div className="text-sm text-[#052e16]">
                <span className="font-semibold">Zone: {selectedWardData?.name || selectedWardData?.area || "All Municipal Sectors"}</span> — Scheduled routes are coordinated by City Corporation and Ward administration. Normal waste goes to standard trucks; toxic materials route to certified Hazardous trucks.
              </div>
            </div>

            {/* Live Schedules from City Corp / Ward Admin */}
            <div className="space-y-3">
              <div className="font-display font-bold text-sm text-[#052e16] flex items-center justify-between">
                <span>Official Municipal Pickup Schedules</span>
                <span className="text-xs text-[#4b7a5a] font-normal">Updated live</span>
              </div>

              {liveSchedules.length === 0 ? (
                <div className="bg-white border border-[#e2f5e9] rounded-xl p-8 text-center text-[#4b7a5a] text-sm">
                  <Calendar size={28} className="mx-auto mb-2 text-[#86efac]" />
                  No pickup schedules published yet by municipal administration for this sector.
                </div>
              ) : (
                liveSchedules.map((slot: any, i: number) => {
                const isHazardous = slot.wasteType === "Hazardous" || slot.type === "Hazardous";
                const displayType = slot.wasteType || slot.type || "General";
                const displayDate = slot.date;
                const displayTime = slot.time;
                const displayZone = slot.zone || (selectedWardData?.name || "Ward Zone");

                return (
                  <div
                    key={slot.id || i}
                    className={`bg-white border rounded-xl p-4 sm:p-5 transition-all ${
                      bookedSlot === i ? "border-[#16a34a] bg-[#f0fdf4]/40 shadow-xs" : "border-[#e2f5e9] hover:border-[#bbf7d0]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        isHazardous ? "bg-red-50 border-red-200 text-red-600" : "bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]"
                      }`}>
                        <Calendar size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-display font-600 text-[#052e16]">{displayDate}</div>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                            isHazardous
                              ? "bg-red-100 text-red-700 border-red-200"
                              : displayType === "Organic"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }`}>
                            {displayType} ({isHazardous ? "Hazardous Truck" : "Normal Truck"})
                          </span>
                        </div>
                        <div className="text-[#4b7a5a] text-xs mt-0.5">{displayTime} · {displayZone}</div>
                      </div>
                      <div>
                        <button
                          onClick={() => setBookedSlot(bookedSlot === i ? null : i)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            bookedSlot === i ? "bg-[#16a34a] text-white" : "border border-[#16a34a] text-[#16a34a] hover:bg-[#f0fdf4]"
                          }`}
                        >
                          {bookedSlot === i ? "✓ Slot Booked" : "Book Slot"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
            <div className="bg-white border border-[#e2f5e9] rounded-xl p-4 sm:p-5">
              <div className="font-display font-600 text-[#052e16] mb-1">Request On-Demand Pickup</div>
              <div className="text-[#4b7a5a] text-sm mb-4">Designed for restaurants, hotels and homes with extra waste. Your deposit is offered to the assigned area driver.</div>
              {pickupRequested ? <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-5 text-center">
                <CheckCircle size={30} className="text-[#16a34a] mx-auto mb-2" />
                <div className="font-display font-700 text-[#052e16]">Pickup request confirmed</div>
                <div className="text-[#4b7a5a] text-sm mt-1">A {pickupForm.area} driver can now accept this ৳{pickupForm.deposit} job.</div>
                <button onClick={() => setPickupRequested(false)} className="text-[#16a34a] text-sm font-semibold mt-4">Create another request</button>
              </div> : <>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  {/* Dynamic City Corporation Select */}
                  <div>
                    <label className="block text-xs font-semibold text-[#052e16] mb-1">City Corporation</label>
                    <select
                      value={pickupCityCorpId}
                      onChange={e => handlePickupCityChange(e.target.value)}
                      className="w-full border border-[#e2f5e9] rounded-xl px-4 py-2.5 text-sm text-[#052e16] focus:border-[#16a34a] outline-none bg-white"
                    >
                      {cityCorps.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Ward Select under chosen City Corporation */}
                  <div>
                    <label className="block text-xs font-semibold text-[#052e16] mb-1">Ward Zone</label>
                    <select
                      value={pickupWardId}
                      onChange={e => handlePickupWardChange(e.target.value)}
                      className="w-full border border-[#e2f5e9] rounded-xl px-4 py-2.5 text-sm text-[#052e16] focus:border-[#16a34a] outline-none bg-white"
                    >
                      {pickupFilteredWards.length === 0 ? (
                        <option value="">No wards in this City Corporation</option>
                      ) : (
                        pickupFilteredWards.map(w => (
                          <option key={w.id} value={w.id}>{w.name} — {w.area}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Dynamic Waste Category created by City Admin */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#052e16]">Waste Category & Rate (Configured by City Admin)</label>
                    {loadingWasteItems && <span className="text-[10px] text-[#16a34a] animate-pulse">Syncing items...</span>}
                  </div>
                  <select
                    value={selectedWasteItemId}
                    onChange={e => handleWasteItemSelect(e.target.value)}
                    className="w-full border border-[#e2f5e9] rounded-xl px-4 py-2.5 text-sm text-[#052e16] focus:border-[#16a34a] outline-none bg-white"
                  >
                    {customWasteItems.length === 0 ? (
                      <option value="">No items configured by City Admin</option>
                    ) : (
                      customWasteItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.category} (Min Deposit: ৳{item.depositFee} per {item.unit})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Accurate Google Coordinates & Address */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#052e16]">Accurate Google Coordinates & Address</label>
                    <button
                      type="button"
                      onClick={handleDetectPickupGps}
                      disabled={pickupGpsLoading}
                      className="text-xs text-[#16a34a] hover:text-[#052e16] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation size={12} className={pickupGpsLoading ? "animate-spin" : ""} />
                      {pickupGpsLoading ? "Detecting GPS..." : "📍 Detect Accurate GPS"}
                    </button>
                  </div>
                  <input
                    value={pickupForm.address}
                    onChange={e => setPickupForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Complete pickup street address or landmark"
                    className="w-full border border-[#e2f5e9] rounded-xl px-4 py-2.5 text-sm focus:border-[#16a34a] outline-none"
                  />
                  {pickupCoords && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#16a34a] font-mono bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-1 rounded-lg">
                      <MapPin size={12} />
                      <span>Google Coords: <strong>{pickupCoords.lat.toFixed(6)}, {pickupCoords.lng.toFixed(6)}</strong> (Nearest truck will route on pickup date)</span>
                    </div>
                  )}
                </div>

                {/* Scheduled Date & Deposit Fee */}
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#052e16] mb-1">Scheduled Pickup Date</label>
                    <input
                      type="date"
                      value={pickupForm.date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={e => setPickupForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full border border-[#e2f5e9] rounded-xl px-4 py-2.5 text-sm text-[#052e16] focus:border-[#16a34a] outline-none bg-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#052e16]">Deposit Fee (BDT)</label>
                      <span className="text-[11px] text-[#4b7a5a]">Wallet: <strong>৳{walletBalance.toFixed(0)}</strong></span>
                    </div>
                    <div className="relative">
                      <Wallet size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#16a34a]" />
                      <input
                        type="number"
                        min="50"
                        value={pickupForm.deposit}
                        onChange={e => setPickupForm(f => ({ ...f, deposit: e.target.value }))}
                        className="w-full border border-[#e2f5e9] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#052e16] focus:border-[#16a34a] outline-none bg-white font-mono"
                        aria-label="Deposit amount"
                      />
                    </div>
                  </div>
                </div>

                {/* Wallet Balance Check / Low Balance Warning */}
                {walletBalance < Number(pickupForm.deposit || 0) && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                      <span>Wallet balance (৳{walletBalance}) is lower than deposit fee (৳{pickupForm.deposit}).</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDepositModalOpen(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-1 rounded-lg shrink-0 cursor-pointer"
                    >
                      + Add Money
                    </button>
                  </div>
                )}

                <button
                  disabled={!pickupForm.address || !pickupForm.waste || !pickupForm.date || Number(pickupForm.deposit) < 50 || walletBalance < Number(pickupForm.deposit)}
                  onClick={async () => {
                    const depositAmt = Number(pickupForm.deposit);
                    try {
                      await api.pickups.create({
                        requesterType: "citizen",
                        area: pickupForm.area,
                        address: pickupForm.address,
                        wasteType: pickupForm.waste,
                        date: pickupForm.date,
                        amount: depositAmt,
                        lat: pickupCoords?.lat ?? 23.7542,
                        lng: pickupCoords?.lng ?? 90.3654,
                        cityCorpId: pickupCityCorpId,
                        wardId: pickupWardId,
                        wasteItemId: selectedWasteItemId,
                      });
                      addPickupRequest({
                        requesterType: "citizen",
                        requesterName: authForm.username || authForm.contact || "Citizen Account",
                        area: pickupForm.area,
                        address: pickupForm.address,
                        wasteType: pickupForm.waste,
                        date: pickupForm.date,
                        amount: depositAmt,
                        lat: pickupCoords?.lat ?? 23.7542,
                        lng: pickupCoords?.lng ?? 90.3654,
                        cityCorpId: pickupCityCorpId,
                        wardId: pickupWardId,
                        wasteItemId: selectedWasteItemId,
                      });
                      setPickupRequests(getPickupRequests());
                      setWalletBalance(b => Math.max(0, b - depositAmt));
                      setPickupRequested(true);
                      loadWallet();
                    } catch (err: any) {
                      alert(err?.message || "Failed to submit on-demand pickup request.");
                    }
                  }}
                  className="w-full bg-[#052e16] disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#0a3d1e] transition-colors cursor-pointer"
                >
                  Deposit ৳{pickupForm.deposit || "0"} & Request Pickup
                </button>
                <div className="text-center text-[#4b7a5a] text-xs mt-2">Deposit is held securely and transferred to the collecting truck driver upon QR/security verification.</div>
              </>}
            </div>

            {/* My Pickup Requests list */}
            <div className="bg-white border border-[#e2f5e9] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="font-display font-700 text-[#052e16]">Your On-Demand Pickups</div>
                  <div className="text-[#4b7a5a] text-xs">Share your security code with the driver or confirm below after collection.</div>
                </div>
                <button onClick={() => setPickupRequests(getPickupRequests())} className="text-[#16a34a] hover:rotate-180 transition-transform">
                  <RefreshCw size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {pickupRequests
                  .filter(r => r.requesterType === "citizen" || r.requesterName === (authForm.username || authForm.contact || "Citizen Account"))
                  .map(request => (
                    <div key={request.id} className="border border-[#e2f5e9] rounded-xl p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm text-[#052e16]">{request.wasteType}</div>
                          <div className="text-[#4b7a5a] text-xs mt-1">{request.address} · ৳{request.amount} · {request.date}</div>
                        </div>
                        <span className={`text-xs rounded-full px-2.5 py-1 font-semibold ${request.status === "completed" ? "bg-green-100 text-green-700" :
                          request.status === "accepted" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                      {request.status === "open" && (
                        <div className="text-[#4b7a5a] text-xs mt-3 flex items-center gap-1">
                          <Clock size={12} /> Awaiting an area driver to accept
                        </div>
                      )}
                      {request.status === "accepted" && (
                        <div className="mt-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3">
                          <div className="flex items-center gap-2 text-[#052e16] text-xs font-semibold mb-1">
                            <ShieldCheck size={14} className="text-[#16a34a]" /> Driver assigned: {request.driverName}
                          </div>
                          <div className="text-[#4b7a5a] text-xs mb-2">
                            Your security code is <span className="font-mono font-bold text-[#16a34a] text-sm">{request.securityCode}</span>. Share it with driver or confirm below.
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              value={codes[request.id] ?? ""}
                              onChange={e => setCodes(c => ({ ...c, [request.id]: e.target.value }))}
                              placeholder="Enter 6-digit code"
                              maxLength={6}
                              className="flex-1 border border-[#bbf7d0] rounded-lg px-3 py-2 text-xs outline-none"
                            />
                            <button
                              onClick={() => confirmPickup(request)}
                              className="bg-[#16a34a] text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-[#15803d]"
                            >
                              Confirm Pickup & Release ৳{request.amount}
                            </button>
                          </div>
                        </div>
                      )}
                      {request.status === "completed" && (
                        <div className="text-[#16a34a] text-xs mt-3 flex items-center gap-1 font-medium">
                          <CheckCircle size={13} /> Completed and driver credited ৳{request.amount}
                        </div>
                      )}
                    </div>
                  ))}
                {pickupRequests.filter(r => r.requesterType === "citizen" || r.requesterName === (authForm.username || authForm.contact || "Citizen Account")).length === 0 && (
                  <div className="text-center text-[#4b7a5a] text-xs py-6">
                    No active pickup requests yet.
                  </div>
                )}
              </div>
              {pickupMessage && (
                <div className="mt-3 p-2 bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#16a34a] rounded-lg flex items-center justify-between">
                  <span>{pickupMessage}</span>
                  <button onClick={() => setPickupMessage("")} className="font-bold ml-2">✕</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bin Usage Guide */}
        {activeTab === "Bin Guide" && (
          <div className="space-y-4">
            <div className="bg-[#052e16] rounded-2xl p-6 text-white">
              <div className="font-display font-800 text-2xl mb-2">🗑️ Your Single Smart Bin</div>
              <div className="text-[#86efac] text-sm leading-relaxed">
                IntelliWaste uses <span className="text-[#4ade80] font-semibold">one bin for all household waste</span>. You don't need to sort anything — just throw everything in. Our automated sorting machine at the facility handles the rest. Only a few items need special handling.
              </div>
            </div>

            {/* Visual bin flow */}
            <div className="bg-white border border-[#e2f5e9] rounded-xl p-5">
              <div className="font-display font-600 text-[#052e16] mb-4 text-center">How Your Waste Gets Sorted</div>
              <div className="flex items-center justify-center gap-2 flex-wrap text-center text-xs">
                {["Your Home 🏠", "→", "Single Smart Bin 🗑️", "→", "Collection Truck 🚛", "→", "Sorting Facility ⚙️", "→", "Recycling / Compost / Landfill ♻️"].map((step, i) => (
                  <span key={i} className={step === "→" ? "text-[#4b7a5a]" : "bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3 py-2 text-[#052e16] font-medium"}>
                    {step}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-sm font-semibold text-[#052e16] px-1 pt-2">What goes in your bin?</div>
            {guides.map(g => (
              <div key={g.cat} className={`border rounded-xl p-5 transition-all ${g.allowed ? "bg-white border-[#e2f5e9] hover:border-[#bbf7d0]" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: g.color + "33" }}>
                    {g.icon}
                  </div>
                  <div>
                    <div className={`font-display font-700 mb-1 ${g.allowed ? "text-[#052e16]" : "text-red-700"}`}>{g.cat}</div>
                    <div className={`text-sm ${g.allowed ? "text-[#4b7a5a]" : "text-red-600"}`}>{g.items}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rewards */}
        {activeTab === "Rewards" && (
          <div className="space-y-6">
            {/* Balance & Cash Valuation Banner */}
            <div className="bg-gradient-to-r from-[#052e16] via-[#0a3d1e] to-[#0d2414] rounded-2xl p-6 text-white border border-[#16a34a]/30 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#86efac] text-xs font-mono uppercase tracking-wider">RECYCLING POINT BALANCE</span>
                    <span className="bg-[#16a34a]/30 text-[#4ade80] border border-[#4ade80]/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                      Live City Policy
                    </span>
                  </div>
                  <div className="font-display font-black text-4xl text-white">
                    {userPoints.toLocaleString()} <span className="text-xl font-normal text-[#86efac]">pts</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="text-white font-semibold text-lg flex items-center gap-1.5">
                      <Banknote className="text-[#4ade80]" size={20} />
                      <span>Equivalent Cash: <strong className="text-[#4ade80]">৳{(userPoints * pointRate).toFixed(2)} BDT</strong></span>
                    </div>
                    <span className="text-xs text-[#86efac]/80 font-mono bg-black/30 px-2 py-1 rounded-md">
                      Official Rate: ৳{pointRate.toFixed(2)}/pt
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setWithdrawalError("");
                      setWithdrawPoints(Math.min(userPoints, Math.max(minWithdrawPoints, 500)));
                      setWithdrawModal(true);
                    }}
                    disabled={!rewardActive || userPoints < minWithdrawPoints}
                    className="bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20 transition-all text-sm"
                  >
                    <Banknote size={18} />
                    <span>Withdraw Cash at Ward Office</span>
                  </button>
                </div>
              </div>

              {!rewardActive && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-300 flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>Cash rewards are currently paused by the City Corporation Admin. Check back soon.</span>
                </div>
              )}
            </div>

            {/* How Cash Payout Works */}
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-5">
              <h3 className="font-display font-bold text-sm text-[#052e16] mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#16a34a]" />
                How to Collect Physical Cash from your Ward Admin
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white border border-[#bbf7d0] rounded-xl p-3.5">
                  <span className="font-mono font-bold text-[#16a34a] text-sm block mb-1">01. Request Online</span>
                  <p className="text-[#4b7a5a]">
                    Click Withdraw Cash, enter points (min {minWithdrawPoints} pts), and select your nearby Ward Office.
                  </p>
                </div>
                <div className="bg-white border border-[#bbf7d0] rounded-xl p-3.5">
                  <span className="font-mono font-bold text-[#16a34a] text-sm block mb-1">02. Get Voucher Code</span>
                  <p className="text-[#4b7a5a]">
                    A secure verification voucher (e.g. <span className="font-mono font-bold text-[#052e16]">WDR-XXXX</span>) is generated instantly for your claim.
                  </p>
                </div>
                <div className="bg-white border border-[#bbf7d0] rounded-xl p-3.5">
                  <span className="font-mono font-bold text-[#16a34a] text-sm block mb-1">03. Hand Over & Cash Out</span>
                  <p className="text-[#4b7a5a]">
                    Visit your selected Ward Admin office, present the voucher code, and receive physical Bangladeshi Taka in cash.
                  </p>
                </div>
              </div>
            </div>

            {/* My Cash Withdrawal Vouchers History */}
            <div className="bg-white border border-[#e2f5e9] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-[#052e16]">My Cash Withdrawal Claims</h3>
                  <p className="text-xs text-[#4b7a5a]">Track your cash pickup vouchers and collection statuses</p>
                </div>
                <button
                  onClick={fetchMyWithdrawals}
                  disabled={loadingWithdrawals}
                  className="text-xs text-[#16a34a] flex items-center gap-1 hover:underline"
                >
                  <RefreshCw size={12} className={loadingWithdrawals ? "animate-spin" : ""} /> Refresh
                </button>
              </div>

              <div className="space-y-3">
                {myWithdrawals.map(item => (
                  <div
                    key={item.id}
                    className="border border-[#e2f5e9] hover:border-[#bbf7d0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a] shrink-0">
                        <Banknote size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm bg-[#052e16] text-[#4ade80] px-2 py-0.5 rounded border border-[#16a34a]/30">
                            {item.verificationCode}
                          </span>
                          <span className="font-display font-bold text-base text-[#052e16]">
                            ৳{Number(item.amount).toFixed(2)} BDT
                          </span>
                        </div>
                        <div className="text-xs text-[#4b7a5a] mt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 size={12} /> {item.ward?.name || "Ward Office"} ({item.ward?.area || "Central Office"})
                          </span>
                          <span>•</span>
                          <span className="font-mono">{item.points} pts redeemed</span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                            <Clock size={12} /> Ready for Pickup
                          </span>
                          <button
                            onClick={() => setActiveVoucher(item)}
                            className="bg-[#16a34a] hover:bg-[#15803d] text-white text-xs px-3 py-1.5 rounded-lg font-semibold"
                          >
                            Show Voucher
                          </button>
                        </div>
                      )}
                      {item.status === "paid" && (
                        <span className="bg-green-100 text-green-800 border border-green-200 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-[#16a34a]" /> Cash Collected {item.paidAt ? `(${new Date(item.paidAt).toLocaleDateString()})` : ""}
                        </span>
                      )}
                      {item.status === "rejected" && (
                        <span className="bg-red-100 text-red-700 border border-red-200 text-xs px-3 py-1 rounded-full font-semibold">
                          Refunded
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {myWithdrawals.length === 0 && (
                  <div className="text-center py-8 text-[#4b7a5a] text-xs">
                    You haven't made any cash withdrawal claims yet. Convert your recycling points into real cash anytime!
                  </div>
                )}
              </div>
            </div>

            {/* Gift Vouchers (Alternative Rewards) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-base text-[#052e16]">Partner Gift Cards & Coupons</h3>
                <span className="text-xs bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  Balance: {userPoints.toLocaleString()} pts
                </span>
              </div>
              <p className="text-xs text-[#4b7a5a] mb-4">Redeem your earned points for guaranteed unique digital partner vouchers</p>

              {!globalCouponsEnabled && (
                <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Partner Coupons Temporarily Paused</div>
                    <div>Gift cards and coupon redemptions have been paused system-wide by the Super Administrator.</div>
                  </div>
                </div>
              )}

              {partnerRewards.length === 0 ? (
                <div className="bg-white border border-[#e2f5e9] rounded-xl p-8 text-center text-[#4b7a5a]">
                  <Gift size={32} className="mx-auto mb-2 opacity-40 text-[#16a34a]" />
                  <div className="font-semibold text-sm">No vouchers available right now</div>
                  <div className="text-xs mt-1">Super Admin is updating partner offers. Check back soon!</div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {partnerRewards.map(reward => {
                    const canRedeem = userPoints >= reward.points && reward.available && reward.stockCount > 0;
                    return (
                      <div
                        key={reward.id}
                        className={`bg-white border rounded-xl p-5 transition-all ${
                          !reward.available || reward.stockCount <= 0
                            ? "opacity-60 border-gray-200"
                            : "border-[#e2f5e9] hover:border-[#bbf7d0] shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-3xl">{reward.icon || "🎁"}</div>
                          <span
                            className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                              reward.stockCount > 0
                                ? "bg-green-500/10 text-green-700 border border-green-200"
                                : "bg-red-500/10 text-red-600 border border-red-200"
                            }`}
                          >
                            {reward.stockCount > 0 ? `${reward.stockCount} codes left` : "Out of stock"}
                          </span>
                        </div>
                        <div className="font-display font-700 text-[#052e16] text-base mb-0.5">{reward.name}</div>
                        <div className="text-xs text-[#4b7a5a] font-medium mb-1">Partner: {reward.partner}</div>
                        {reward.description && <div className="text-xs text-gray-500 mb-3">{reward.description}</div>}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <span className="font-mono font-bold text-[#16a34a] text-sm">{reward.points} pts</span>
                          <button
                            onClick={() => handleRedeemVoucher(reward)}
                            disabled={!canRedeem || isRedeeming}
                            className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all ${
                              canRedeem
                                ? "bg-[#16a34a] text-white hover:bg-[#15803d] shadow-xs cursor-pointer"
                                : "bg-[#e2f5e9] text-[#4b7a5a] cursor-not-allowed"
                            }`}
                          >
                            {reward.stockCount <= 0
                              ? "Out of stock"
                              : userPoints < reward.points
                              ? `Need ${(reward.points - userPoints)} more pts`
                              : isRedeeming
                              ? "Redeeming..."
                              : "Redeem Voucher"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* My Redeemed Vouchers History */}
              {myVouchers.length > 0 && (
                <div className="mt-8 bg-white border border-[#e2f5e9] rounded-2xl p-5 shadow-xs">
                  <h4 className="font-display font-700 text-sm text-[#052e16] mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#16a34a]" /> My Redeemed Vouchers ({myVouchers.length})
                  </h4>
                  <div className="space-y-2.5">
                    {myVouchers.map((v, i) => (
                      <div
                        key={v.id || v.code || i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl gap-2"
                      >
                        <div>
                          <div className="font-bold text-xs text-[#052e16]">{v.rewardName} · {v.partner}</div>
                          <div className="text-[11px] text-[#4b7a5a]">
                            {v.redeemedAt ? new Date(v.redeemedAt).toLocaleDateString() : "Active Voucher"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm bg-white border border-[#16a34a]/30 px-3 py-1 rounded-lg text-[#16a34a] select-all">
                            {v.code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(v.code);
                              alert(`Copied voucher code: ${v.code}`);
                            }}
                            className="text-xs bg-[#16a34a] text-white px-2.5 py-1 rounded-lg hover:bg-[#15803d] transition-colors flex items-center gap-1"
                          >
                            <Copy size={12} /> Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Unique Reward Redeemed Modal */}
            {redeemedResult && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <div className="text-5xl mb-4">🎉</div>
                  <div className="font-display font-800 text-xl text-[#052e16] mb-1">Voucher Redeemed!</div>
                  <div className="text-[#4b7a5a] text-xs mb-4">
                    {redeemedResult.rewardName} · {redeemedResult.pointsDeducted} pts deducted
                  </div>
                  
                  <div className="bg-[#f0fdf4] border-2 border-dashed border-[#16a34a] rounded-xl p-4 mb-4">
                    <div className="font-mono text-[11px] text-[#4b7a5a] uppercase tracking-wider mb-1">Your Exclusive Unique Code</div>
                    <div className="font-mono font-extrabold text-xl text-[#16a34a] tracking-wider select-all">
                      {redeemedResult.code}
                    </div>
                    <div className="text-[10px] text-[#4b7a5a] mt-1">This code is assigned exclusively to you and will not be given to anyone else.</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(redeemedResult.code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="flex-1 bg-[#f0fdf4] text-[#16a34a] border border-[#16a34a] rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#dcfce7]"
                    >
                      {copiedCode ? <CheckCircle size={14} /> : <Copy size={14} />}
                      {copiedCode ? "Copied!" : "Copy Code"}
                    </button>
                    <button
                      onClick={() => setRedeemedResult(null)}
                      className="flex-1 bg-[#16a34a] text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-[#15803d]"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Cash Withdrawal Request Modal ── */}
            {withdrawModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                  <button
                    onClick={() => setWithdrawModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a]">
                      <Banknote size={22} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[#052e16] text-base">Withdraw Cash at Ward Office</h3>
                      <p className="text-xs text-[#4b7a5a]">Exchange your points for physical Bangladeshi Taka</p>
                    </div>
                  </div>

                  {withdrawalError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{withdrawalError}</span>
                    </div>
                  )}

                  <div className="space-y-4 mb-5">
                    {/* Points to Redeem */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-[#052e16]">Points to Redeem</label>
                        <span className="text-[11px] font-mono text-[#4b7a5a]">
                          Balance: {userPoints.toLocaleString()} pts
                        </span>
                      </div>
                      <input
                        type="number"
                        min={minWithdrawPoints}
                        max={userPoints}
                        step={50}
                        value={withdrawPoints}
                        onChange={e => setWithdrawPoints(Number(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-base font-bold font-mono text-[#052e16] outline-none focus:border-[#16a34a]"
                      />
                      <div className="flex gap-2 mt-2">
                        {[100, 250, 500, 1000].filter(pts => pts <= userPoints).map(pts => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => setWithdrawPoints(pts)}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${withdrawPoints === pts ? "bg-[#16a34a] text-white border-[#16a34a]" : "bg-gray-50 text-gray-700 border-gray-200"}`}
                          >
                            {pts} pts
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculated Cash Value */}
                    <div className="bg-gradient-to-r from-[#f0fdf4] to-[#e2f5e9] border border-[#bbf7d0] rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-[#4b7a5a] uppercase block">You Will Receive in Cash</span>
                        <span className="font-mono text-xs text-[#4b7a5a]">Rate: ৳{pointRate.toFixed(2)}/pt</span>
                      </div>
                      <div className="font-display font-black text-2xl text-[#16a34a]">
                        ৳{(withdrawPoints * pointRate).toFixed(2)} BDT
                      </div>
                    </div>

                    {/* City Corporation Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-[#052e16] mb-1">
                        Select City Corporation
                      </label>
                      <select
                        value={selectedCityCorpId}
                        onChange={e => handleCityCorpChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-[#052e16] outline-none focus:border-[#16a34a] bg-white font-medium"
                      >
                        {cityCorps.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#4b7a5a] mt-0.5">
                        Ward offices are filtered dynamically for the selected City Corporation.
                      </p>
                    </div>

                    {/* Ward Office Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-[#052e16] mb-1">
                        Select Ward Office for Cash Pickup
                      </label>
                      <select
                        value={selectedWardId}
                        onChange={e => handleWardChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-[#052e16] outline-none focus:border-[#16a34a] bg-white font-medium"
                      >
                        {(filteredWards.length > 0 ? filteredWards : allWards).map(w => (
                          <option key={w.id} value={String(w.id)}>
                            {w.name} — {w.area} {w.withdrawEnabled === false ? "(Cash Payouts Paused)" : "(Ward Office)"}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#4b7a5a] mt-0.5">
                        You will collect cash in-person from this ward admin office.
                      </p>
                    </div>

                    {/* Warning if disabled globally or for selected ward */}
                    {(!globalWithdrawEnabled || selectedWardData?.withdrawEnabled === false) && (
                      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-900 text-xs flex items-start gap-2">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Cash Payouts Temporarily Paused</div>
                          <div>
                            {!globalWithdrawEnabled
                              ? "System-wide cash withdrawals are currently paused by the Super Administrator."
                              : `Cash withdrawals are temporarily disabled at ${selectedWardData?.name || "this ward office"} by the Ward Admin.`}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Citizen Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#052e16] mb-1">Your Full Name</label>
                        <input
                          value={citizenName}
                          onChange={e => setCitizenName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#052e16] outline-none focus:border-[#16a34a]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#052e16] mb-1">Mobile Phone</label>
                        <input
                          value={citizenPhone}
                          onChange={e => setCitizenPhone(e.target.value)}
                          placeholder="017XX-XXXXXX"
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#052e16] outline-none focus:border-[#16a34a]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setWithdrawModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestCashWithdrawal}
                      disabled={isSubmittingWithdrawal || !globalWithdrawEnabled || selectedWardData?.withdrawEnabled === false}
                      className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingWithdrawal ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Banknote size={14} />
                      )}
                      <span>Confirm & Get Voucher</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Active Cash Pickup Voucher Popup ── */}
            {activeVoucher && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative border-t-4 border-[#16a34a]">
                  <button
                    onClick={() => setActiveVoucher(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>

                  <div className="text-center pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 size={26} />
                    </div>
                    <h3 className="font-display font-bold text-lg text-[#052e16]">Cash Withdrawal Voucher Ready!</h3>
                    <p className="text-xs text-[#4b7a5a] mt-0.5">Present this code at your selected Ward Admin office</p>
                  </div>

                  {/* Voucher Card Box */}
                  <div className="my-5 bg-[#052e16] rounded-2xl p-5 text-white shadow-inner text-center">
                    <span className="text-[11px] font-mono text-[#86efac] uppercase tracking-wider block">
                      OFFICIAL VERIFICATION CODE
                    </span>
                    <div className="my-2 py-2 px-4 bg-black/40 border border-[#16a34a]/40 rounded-xl inline-block">
                      <span className="font-mono font-black text-2xl sm:text-3xl tracking-widest text-[#4ade80]">
                        {activeVoucher.verificationCode}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">
                      Cash to Collect: <strong className="text-[#4ade80] text-lg font-bold">৳{Number(activeVoucher.amount).toFixed(2)} BDT</strong>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-[#052e16] bg-[#f9fafb] p-3.5 rounded-xl border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ward Office:</span>
                      <span className="font-semibold">{activeVoucher.ward?.name || "Ward Office"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Office Location:</span>
                      <span className="font-semibold">{activeVoucher.ward?.area || "Central Office"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Points Redeemed:</span>
                      <span className="font-mono">{activeVoucher.points} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="text-yellow-600 font-bold">Ready for Pickup</span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Download size={14} /> Print Voucher
                    </button>
                    <button
                      onClick={() => setActiveVoucher(null)}
                      className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold"
                    >
                      Got It
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === "Leaderboard" && (() => {
          const sortedCitizens = [...citizens].sort((a, b) => (b.points || 0) - (a.points || 0));
          const userZone = userStorage.get()?.ward?.area || userStorage.get()?.address || "Service Zone";

          return (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🏆</div>
                <div className="font-display font-800 text-2xl text-[#052e16]">{userZone} Citizens Leaderboard</div>
                <div className="text-[#4b7a5a] text-sm">Ranked live by real earned recycling & eco points</div>
              </div>

              {sortedCitizens.length === 0 ? (
                <div className="bg-white border border-[#e2f5e9] rounded-2xl p-12 text-center shadow-xs">
                  <Trophy size={48} className="text-[#4ade80] mx-auto mb-3 opacity-50" />
                  <div className="font-display font-bold text-lg text-[#052e16]">No other citizens registered yet</div>
                  <div className="text-sm text-[#4b7a5a] mt-1">Start recycling and reporting waste issues to earn points and claim the #1 rank!</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedCitizens.map((citizen, idx) => {
                    const rankNum = idx + 1;
                    const isCurrentUser =
                      citizen.username === citizenName ||
                      citizen.fullName === citizenName ||
                      citizen.id === userStorage.get()?.id;
                    const badgeIcon =
                      rankNum === 1 ? "🏆" : rankNum === 2 ? "🥈" : rankNum === 3 ? "🥉" : "⭐";

                    const citizenTier = rankTiers.find(
                      (t) => (citizen.points || 0) >= t.minPoints && (t.maxPoints === null || (citizen.points || 0) <= t.maxPoints)
                    ) || rankTiers[0];

                    return (
                      <div
                        key={citizen.id || citizen.username}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isCurrentUser
                            ? "bg-[#f0fdf4] border-[#16a34a] shadow-xs ring-1 ring-[#16a34a]/30"
                            : "bg-white border-[#e2f5e9]"
                        }`}
                      >
                        <div className="text-2xl w-8 text-center">{badgeIcon}</div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-display font-700 flex items-center gap-2 ${isCurrentUser ? "text-[#16a34a]" : "text-[#052e16]"}`}>
                            <span>{citizen.fullName || citizen.username}</span>
                            {isCurrentUser && (
                              <span className="bg-[#16a34a] text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                                YOU
                              </span>
                            )}
                            {citizenTier && (
                              <span className="text-xs text-[#4b7a5a] font-normal hidden sm:inline">
                                · {citizenTier.name} {citizenTier.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[#4b7a5a] text-xs">
                            {citizen.ward?.area || citizen.address || userZone}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-[#16a34a]">
                          {(citizen.points || 0).toLocaleString()} pts
                        </div>
                        <div className="text-[#4b7a5a] text-xs font-mono font-semibold w-8 text-right">
                          #{rankNum}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>
      {/* Deposit Money / Wallet Modal */}
      {depositModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setDepositModalOpen(false)}>
          <div className="bg-white border border-[#e2f5e9] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-[#e2f5e9] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="font-display font-700 text-lg text-[#052e16]">Add Money to Wallet</h3>
                  <p className="text-xs text-[#4b7a5a]">Balance: <strong className="text-emerald-700 font-mono">৳{walletBalance.toFixed(2)}</strong></p>
                </div>
              </div>
              <button onClick={() => setDepositModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {depositSuccessMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{depositSuccessMsg}</span>
              </div>
            )}

            {depositErrorMsg && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                <span>{depositErrorMsg}</span>
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#052e16] mb-2">Select Amount (BDT)</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {["100", "250", "500", "1000"].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all ${
                      depositAmount === amt
                        ? "bg-[#052e16] text-white border-[#052e16]"
                        : "bg-white text-[#052e16] border-[#e2f5e9] hover:border-[#16a34a]"
                    }`}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#4b7a5a]">৳</span>
                <input
                  type="number"
                  min="50"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Custom amount"
                  className="w-full border border-[#e2f5e9] rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-[#052e16] focus:border-[#16a34a] outline-none"
                />
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#052e16] mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDepositMethod("BKASH")}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    depositMethod === "BKASH" || depositMethod === "NAGAD" || depositMethod === "ROCKET"
                      ? "border-[#16a34a] bg-emerald-50/60 text-[#052e16]"
                      : "border-[#e2f5e9] text-[#4b7a5a] hover:border-[#16a34a]"
                  }`}
                >
                  <Smartphone size={18} className="text-pink-600" />
                  <span className="text-[11px] font-semibold">Mobile Banking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositMethod("CARD")}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    depositMethod === "CARD"
                      ? "border-[#16a34a] bg-emerald-50/60 text-[#052e16]"
                      : "border-[#e2f5e9] text-[#4b7a5a] hover:border-[#16a34a]"
                  }`}
                >
                  <CreditCard size={18} className="text-blue-600" />
                  <span className="text-[11px] font-semibold">Debit / Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositMethod("BANK")}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    depositMethod === "BANK"
                      ? "border-[#16a34a] bg-emerald-50/60 text-[#052e16]"
                      : "border-[#e2f5e9] text-[#4b7a5a] hover:border-[#16a34a]"
                  }`}
                >
                  <Landmark size={18} className="text-amber-600" />
                  <span className="text-[11px] font-semibold">Bank Transfer</span>
                </button>
              </div>
            </div>

            {/* Sub-form based on method */}
            {(depositMethod === "BKASH" || depositMethod === "NAGAD" || depositMethod === "ROCKET") && (
              <div className="space-y-3 bg-[#f8fdf9] border border-[#e2f5e9] rounded-xl p-3.5 mb-4">
                <div className="flex gap-2">
                  {(["BKASH", "NAGAD", "ROCKET"] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDepositMethod(m)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        depositMethod === m
                          ? "bg-white shadow-xs border border-[#16a34a] text-[#16a34a]"
                          : "text-[#4b7a5a] hover:text-[#052e16]"
                      }`}
                    >
                      {m === "BKASH" ? "bKash" : m === "NAGAD" ? "Nagad" : "Rocket"}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-[#4b7a5a]">
                  Send <strong>৳{depositAmount || "0"}</strong> to IntelliWaste Merchant Number: <strong className="text-[#052e16] font-mono">01700-112233</strong>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#052e16] mb-1">Your Mobile Number</label>
                  <input
                    value={depositSenderNumber}
                    onChange={e => setDepositSenderNumber(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full bg-white border border-[#e2f5e9] rounded-lg px-3 py-2 text-xs text-[#052e16] outline-none focus:border-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#052e16] mb-1">Transaction ID (TrxID) *</label>
                  <input
                    value={depositTrxId}
                    onChange={e => setDepositTrxId(e.target.value)}
                    placeholder="e.g. 9J3K82LA7Q"
                    className="w-full bg-white border border-[#e2f5e9] rounded-lg px-3 py-2 text-xs font-mono uppercase text-[#052e16] outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>
            )}

            {depositMethod === "CARD" && (
              <div className="space-y-3 bg-[#f8fdf9] border border-[#e2f5e9] rounded-xl p-3.5 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#052e16] mb-1">Card Number</label>
                  <input
                    value={depositCardDetails.number}
                    onChange={e => setDepositCardDetails(c => ({ ...c, number: e.target.value }))}
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    className="w-full bg-white border border-[#e2f5e9] rounded-lg px-3 py-2 text-xs font-mono text-[#052e16] outline-none focus:border-[#16a34a]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#052e16] mb-1">Cardholder Name</label>
                    <input
                      value={depositCardDetails.holder}
                      onChange={e => setDepositCardDetails(c => ({ ...c, holder: e.target.value }))}
                      placeholder="NAME ON CARD"
                      className="w-full bg-white border border-[#e2f5e9] rounded-lg px-3 py-2 text-xs text-[#052e16] outline-none focus:border-[#16a34a]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#052e16] mb-1">Expiry / CVC</label>
                    <div className="flex gap-2">
                      <input
                        value={depositCardDetails.expiry}
                        onChange={e => setDepositCardDetails(c => ({ ...c, expiry: e.target.value }))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-1/2 bg-white border border-[#e2f5e9] rounded-lg px-2 py-2 text-xs font-mono text-[#052e16] outline-none focus:border-[#16a34a]"
                      />
                      <input
                        value={depositCardDetails.cvc}
                        onChange={e => setDepositCardDetails(c => ({ ...c, cvc: e.target.value }))}
                        placeholder="CVC"
                        maxLength={4}
                        className="w-1/2 bg-white border border-[#e2f5e9] rounded-lg px-2 py-2 text-xs font-mono text-[#052e16] outline-none focus:border-[#16a34a]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {depositMethod === "BANK" && (
              <div className="space-y-3 bg-[#f8fdf9] border border-[#e2f5e9] rounded-xl p-3.5 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#052e16] mb-1">Select Bank</label>
                  <select
                    value={depositBankDetails.bankName}
                    onChange={e => setDepositBankDetails(b => ({ ...b, bankName: e.target.value }))}
                    className="w-full bg-white border border-[#e2f5e9] rounded-lg px-3 py-2 text-xs text-[#052e16] outline-none focus:border-[#16a34a]"
                  >
                    <option>City Bank Limited</option>
                    <option>BRAC Bank PLC</option>
                    <option>Islami Bank Bangladesh</option>
                    <option>Dutch-Bangla Bank (DBBL)</option>
                    <option>Eastern Bank Limited (EBL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#052e16] mb-1">Account Number / Reference</label>
                  <input
                    value={depositBankDetails.accNumber}
                    onChange={e => setDepositBankDetails(b => ({ ...b, accNumber: e.target.value }))}
                    placeholder="Enter deposit slip or A/C reference"
                    className="w-full bg-white border border-[#e2f5e9] rounded-lg px-3 py-2 text-xs font-mono text-[#052e16] outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDepositModalOpen(false)}
                className="flex-1 border border-[#e2f5e9] hover:bg-slate-50 text-[#4b7a5a] py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDepositing || Number(depositAmount) < 50}
                onClick={handleDepositSubmit}
                className="flex-2 bg-[#052e16] hover:bg-[#0a3d1e] disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                {isDepositing ? "Processing..." : `Deposit ৳${depositAmount || "0"} Now`}
              </button>
            </div>

            {/* Recent Transaction History */}
            {walletTransactions.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#e2f5e9]">
                <h4 className="text-xs font-semibold text-[#052e16] mb-2">Recent Wallet Transactions</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {walletTransactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                      <div>
                        <span className="font-semibold text-[#052e16]">{tx.type}</span>
                        <span className="text-[#4b7a5a] text-[11px] ml-1.5">({tx.paymentMethod || "Direct"})</span>
                      </div>
                      <div className="font-mono font-bold text-emerald-700">
                        +৳{tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
