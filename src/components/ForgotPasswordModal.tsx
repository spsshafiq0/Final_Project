import { useState } from "react";
import { KeyRound, Mail, Lock, CheckCircle, AlertCircle, Loader2, X, Eye, EyeOff, ArrowRight } from "lucide-react";
import api from "../lib/api";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIdentifier?: string;
  onSuccess?: (newPassword: string, identifier: string) => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultIdentifier = "",
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSendCode = async () => {
    if (!identifier.trim()) {
      setError("Please enter your registered email address or username.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.auth.forgotPassword(identifier.trim());
      setMaskedEmail(res.emailMasked);
      if (res.previewCode) setPreviewCode(res.previewCode);
      setSuccessMsg(res.message);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to send reset code. Please verify your email or username.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || code.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.auth.resetPassword(identifier.trim(), code.trim(), newPassword);
      setStep(3);
      if (onSuccess) {
        onSuccess(newPassword, identifier.trim());
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Code may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setStep(1);
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccessMsg("");
    setPreviewCode(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-[#0d2414] border border-[#1a3d22] rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-[#4b7a5a] hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 bg-[#16a34a]/20 border border-[#16a34a]/30 rounded-xl flex items-center justify-center text-[#4ade80]">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="font-display font-700 text-white text-lg">Reset Password</h3>
            <p className="text-[#4b7a5a] text-xs">Email-verified secure password recovery</p>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? "bg-[#16a34a]" : "bg-[#1a3d22]"}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? "bg-[#16a34a]" : "bg-[#1a3d22]"}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 3 ? "bg-[#16a34a]" : "bg-[#1a3d22]"}`} />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Enter Email / Username */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">
                REGISTERED EMAIL OR USERNAME
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  placeholder="e.g. spsshafiq95@gmail.com or spsshafiq"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-[#4ade80] placeholder-[#4b7a5a]"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-[#4b7a5a] mt-2">
                We will send an automated 6-digit verification code to the email address registered with this account.
              </p>
            </div>

            {/* Quick Test Fill */}
            <div className="p-2.5 bg-[#061309] border border-[#1a3d22] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#86efac]/80 font-mono text-[11px]">Primary Test Email:</span>
              <button
                type="button"
                onClick={() => setIdentifier("spsshafiq95@gmail.com")}
                className="text-[11px] text-[#4ade80] hover:underline font-medium"
              >
                Use spsshafiq95@gmail.com
              </button>
            </div>

            <button
              onClick={handleSendCode}
              disabled={loading || !identifier.trim()}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-40 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending code via Brevo...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Enter OTP & New Password */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-[#061309] border border-[#1a3d22] rounded-xl text-xs text-[#86efac]">
              {successMsg || `A 6-digit verification code was sent to ${maskedEmail}.`}
              {previewCode && (
                <div className="mt-1 text-[11px] text-[#4ade80] font-mono">
                  [Dev / Test Code Preview: <strong>{previewCode}</strong>]
                </div>
              )}
            </div>

            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5 text-center">
                ENTER 6-DIGIT VERIFICATION CODE
              </label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full bg-[#061309] border-2 border-[#16a34a]/60 rounded-xl py-3 text-center text-2xl font-mono tracking-widest text-[#4ade80] outline-none focus:border-[#4ade80]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">NEW PASSWORD</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl pl-10 pr-10 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4b7a5a] hover:text-[#86efac]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#4b7a5a] text-xs font-mono mb-1.5">CONFIRM NEW PASSWORD</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b7a5a]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  placeholder="Re-enter new password"
                  className="w-full bg-[#061309] border border-[#1a3d22] rounded-xl pl-10 pr-10 py-2.5 text-white text-sm outline-none focus:border-[#4ade80]"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 border border-[#1a3d22] text-[#4b7a5a] hover:text-white rounded-xl py-2.5 text-xs transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || code.length !== 6 || newPassword.length < 6}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-40 text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                <span>Reset & Save Password</span>
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSendCode}
                className="text-[11px] text-[#4b7a5a] hover:text-[#86efac] underline"
              >
                Didn't receive email? Click to resend code
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-[#16a34a]/20 border border-[#16a34a]/30 rounded-2xl flex items-center justify-center text-[#4ade80] mx-auto">
              <CheckCircle size={32} />
            </div>

            <div>
              <h4 className="font-display font-700 text-white text-lg">Password Reset Successful!</h4>
              <p className="text-[#86efac] text-xs mt-1">
                Your new password has been safely updated in the database. You can now log into your portal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl py-3 text-sm font-semibold transition-all shadow"
            >
              Continue to Login →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
