import { useState, useEffect } from "react";
import { Shield, CheckCircle, AlertCircle, Loader2, ArrowRight, Mail, Lock, UserCheck, Eye, EyeOff } from "lucide-react";
import api, { tokenStorage, userStorage } from "../lib/api";

interface SystemSetupPageProps {
  onSetupSuccess: () => void;
  onNavigate: (page: string) => void;
}

export default function SystemSetupPage({ onSetupSuccess, onNavigate }: SystemSetupPageProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [checking, setChecking] = useState(true);

  // Form State - Empty defaults, user enters own credentials
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if browser has permanently recorded setup completion
    const localLocked = localStorage.getItem("intelliwaste_setup_locked") === "true";
    if (localLocked) {
      setIsLocked(true);
      setChecking(false);
      return;
    }

    // 2. Query backend to verify if Super Admin is already initialized
    async function checkStatus() {
      try {
        const res = await api.setup.getStatus();
        if (res.isSetupComplete) {
          localStorage.setItem("intelliwaste_setup_locked", "true");
          setIsLocked(true);
        }
      } catch (e) {
        // If status cannot be retrieved, fallback to local check
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, []);

  const handleInitialize = async () => {
    if (!fullName || !username || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPass) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.setup.initialize({
        fullName: fullName.trim(),
        username: username.toLowerCase().trim(),
        email: email.trim(),
        password,
      });

      if (res?.user && res?.token) {
        tokenStorage.set(res.token);
        userStorage.set(res.user);
      } else {
        throw new Error(res?.error || "Setup initialization failed");
      }

      // Permanently seal the installer locally and globally
      localStorage.setItem("intelliwaste_setup_locked", "true");
      setSuccess(true);
      setTimeout(() => {
        setIsLocked(true);
        onSetupSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Setup failed. Please check connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#051408] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-[#4ade80] font-mono text-sm">
          <Loader2 size={18} className="animate-spin" />
          <span>Verifying system installation status...</span>
        </div>
      </div>
    );
  }

  // If already locked after initial setup
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#051408] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-14 h-14 bg-[#16a34a]/20 border border-[#16a34a]/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#4ade80]">
            <Shield size={28} />
          </div>
          <h2 className="font-display font-800 text-xl text-white">System Setup Completed</h2>
          <div className="inline-block px-3 py-1 bg-[#16a34a]/20 border border-[#16a34a]/40 rounded-full text-[11px] font-mono text-[#4ade80] mt-2 mb-4">
            🔒 INSTALLER PERMANENTLY DISABLED
          </div>
          <p className="text-xs text-[#a7f3d0] leading-relaxed mb-6">
            প্রথমবার সফলভাবে সুপার অ্যাডমিন তৈরি করার পর এই সেটআপ পেইজটির অ্যাক্সেস নিরাপত্তার স্বার্থে স্থায়ীভাবে বন্ধ করে দেওয়া হয়েছে। দয়া করে স্ট্যান্ডার্ড লগইন পোর্টালে গিয়ে লগইন করুন।
          </p>
          <button
            onClick={() => onNavigate("login")}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Go to Admin Login</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#051408] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 bg-[#16a34a]/20 border border-[#16a34a]/40 rounded-xl flex items-center justify-center text-[#4ade80]">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-800 text-white text-xl">System Setup & Installation</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#16a34a] text-white">V1.0</span>
            </div>
            <p className="text-[#86efac] text-xs mt-0.5">ফার্স্ট-টাইম রুট সুপার অ্যাডমিন প্রভিশনিং ও ইনিশিয়ালাইজার</p>
          </div>
        </div>

        {/* System Diagnostics Badges */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#061309] border border-[#1a3d22] rounded-xl mb-6 text-center">
          <div>
            <div className="text-[10px] text-[#4b7a5a] font-mono">DATABASE</div>
            <div className="text-xs text-[#4ade80] font-semibold flex items-center justify-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" /> Resilient
            </div>
          </div>
          <div className="border-x border-[#1a3d22]">
            <div className="text-[10px] text-[#4b7a5a] font-mono">BREVO SMTP</div>
            <div className="text-xs text-[#4ade80] font-semibold flex items-center justify-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" /> Active
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#4b7a5a] font-mono">SECURITY ENGINE</div>
            <div className="text-xs text-[#4ade80] font-semibold flex items-center justify-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" /> Secured
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-8 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 bg-[#16a34a]/20 border border-[#16a34a]/40 rounded-2xl flex items-center justify-center mx-auto text-[#4ade80]">
              <CheckCircle size={36} />
            </div>
            <h3 className="font-display font-800 text-xl text-white">Super Admin Initialized!</h3>
            <p className="text-xs text-[#86efac] max-w-sm mx-auto">
              সুপার অ্যাডমিন একাউন্ট সফলভাবে তৈরি হয়েছে এবং ক্রেডেনশিয়াল ইমেইল পাঠিয়ে এই সেটআপ সুরক্ষিতভাবে বন্ধ করা হয়েছে।
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-[#4b7a5a] font-mono">
              <Loader2 size={14} className="animate-spin text-[#4ade80]" />
              <span>Redirecting to Super Admin Dashboard...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-[#4ade80] font-mono font-semibold flex items-center gap-1.5 border-b border-[#1a3d22] pb-2">
              <UserCheck size={14} /> STEP 1: ROOT SUPER ADMIN CREDENTIALS
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">FULL NAME</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. System Administrator"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">USERNAME</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. superadmin"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl px-3.5 py-2.5 text-sm text-[#4ade80] font-mono outline-none focus:border-[#4ade80]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1">OFFICIAL EMAIL (FOR BREVO CREDENTIALS)</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@city.gov.bd"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">SUPER ADMIN PASSWORD</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl pl-9 pr-9 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4b7a5a] hover:text-white"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[#4b7a5a] text-xs font-mono mb-1">CONFIRM PASSWORD</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#061309] border border-[#1a3d22] rounded-xl text-[11px] text-[#86efac] leading-relaxed">
              🛡️ <strong>সিকিউরিটি প্রটোকল:</strong> এই অ্যাকাউন্টটি তৈরি হওয়ার পর এই সেটআপ পেইজটি স্থায়ীভাবে নিষ্ক্রিয় হয়ে যাবে। পাসওয়ার্ডটি সম্পূর্ণ গোপন ও সুরক্ষিত এনক্রিপশনে ডাটাবেজে সংরক্ষিত থাকবে। সিটি কর্পোরেশন ও ওয়ার্ড অ্যাডমিন পরবর্তীতে সুপার অ্যাডমিন ড্যাশবোর্ড থেকে যুক্ত করা যাবে।
            </div>

            <button
              onClick={handleInitialize}
              disabled={loading}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Securing & Initializing System...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup & Create Super Admin</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
