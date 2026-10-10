"use client";

import React, { useState, useEffect } from "react";
import { MapPin, ArrowRight, ArrowLeft, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { loginThunk, clearAuthError } from "@/redux/slices/authSlice";
import { dashboardApi } from "@/services/dashboardApi";

interface LoginViewProps {
  onLoginSuccess: () => void;
}

type AuthMode = "login" | "forgot" | "otp" | "reset";

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const dispatch = useAppDispatch();
  const { loading, error: authError } = useAppSelector((state) => state.auth);

  const REMEMBER_KEY = "treasurebox_remember_credentials";
  const REMEMBER_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(60);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Auto pre-fill credentials if remembered within 30 days
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.expiresAt && Date.now() < data.expiresAt) {
          if (data.email) setEmail(data.email);
          if (data.password) setPassword(data.password);
          setRememberMe(true);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    dispatch(clearAuthError());

    const resultAction = await dispatch(
      loginThunk({
        email: email.trim().toLowerCase(),
        password,
        role: "ADMIN",
      })
    );

    if (loginThunk.fulfilled.match(resultAction)) {
      if (rememberMe) {
        const expiresAt = Date.now() + REMEMBER_DURATION_MS;
        localStorage.setItem(
          REMEMBER_KEY,
          JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            expiresAt,
          })
        );
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      onLoginSuccess();
    } else if (resultAction.payload) {
      setErrorMessage(resultAction.payload as string);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your operator email address.");
      return;
    }
    setErrorMessage("");
    setActionLoading(true);

    try {
      await dashboardApi.sendForgotPasswordOtp(email.trim().toLowerCase(), "ADMIN");
      setTimer(60);
      setOtp(["", "", "", "", "", ""]);
      setMode("otp");
      setSuccessMessage(`A 6-digit verification code has been dispatched to ${email.trim()}`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to dispatch verification code. Please verify email.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length > 1) {
      // Allow pasting full 6 digits
      const chars = cleanValue.slice(0, 6).split("");
      const updated = [...otp];
      chars.forEach((c, i) => {
        if (i < 6) updated[i] = c;
      });
      setOtp(updated);
      const targetIdx = Math.min(chars.length, 5);
      const targetInput = document.getElementById(`otp-input-${targetIdx}`);
      if (targetInput) targetInput.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = cleanValue;
    setOtp(updated);

    // Auto-focus next input field
    if (cleanValue && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const chars = pastedData.split("");
      const updated = [...otp];
      chars.forEach((c, i) => {
        if (i < 6) updated[i] = c;
      });
      setOtp(updated);
      const targetIdx = Math.min(chars.length, 5);
      const targetInput = document.getElementById(`otp-input-${targetIdx}`);
      if (targetInput) targetInput.focus();
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0 || actionLoading) return;
    setErrorMessage("");
    setActionLoading(true);

    try {
      await dashboardApi.sendForgotPasswordOtp(email.trim().toLowerCase(), "ADMIN");
      setTimer(60);
      setSuccessMessage("A fresh 6-digit verification code has been dispatched to your email.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("").trim();
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }
    setErrorMessage("");
    setActionLoading(true);

    try {
      await dashboardApi.verifyResetOtp(email.trim().toLowerCase(), fullOtp, "ADMIN");
      setMode("reset");
      setSuccessMessage("Code confirmed. Please set your new operator password.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid or expired verification code.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }
    setErrorMessage("");
    setActionLoading(true);

    try {
      const fullOtp = otp.join("").trim();
      await dashboardApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
        newPassword,
        role: "ADMIN",
      });
      setSuccessMessage("Password successfully reset! You can now sign in with your new password.");
      setMode("login");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => setSuccessMessage(""), 6000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to reset password. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="w-full min-h-screen bg-[#061814] flex items-center justify-center p-4 md:p-8">
      {/* Outer Rounded Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl rounded-[28px] overflow-hidden shadow-2xl border border-emerald-900/30 grid grid-cols-1 md:grid-cols-2 min-h-[620px]"
      >
        {/* Left Side - Mustard Gold Brand Art Panel */}
        <div className="bg-[#E1BF62] text-[#0D2823] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Concentric Circles Art */}
          <div className="absolute -top-24 -left-24 w-80 h-80 border border-[#0D2823]/15 rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 border border-[#0D2823]/15 rounded-full pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-64 h-64 border border-[#0D2823]/10 rounded-full pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl border border-[#0D2823]/30 flex items-center justify-center bg-[#E1BF62] shadow-sm">
              <div className="w-4 h-4 border-2 border-[#0D2823] rotate-45 flex items-center justify-center">
                <div className="w-1 h-1 bg-[#0D2823] rounded-full" />
              </div>
            </div>
          </div>

          {/* Middle Typography */}
          <div className="relative z-10 my-auto py-12 max-w-md">
            <h1 className="font-serif text-4xl lg:text-5xl font-normal leading-[1.15] text-[#0D2823] tracking-tight mb-6">
              Every hunt begins with a secret.
            </h1>
            <p className="text-[#0D2823]/75 text-sm lg:text-base leading-relaxed font-normal">
              The private command room for Treasure Box operators — tend the map, set the cipher, release the prize.
            </p>
          </div>

          {/* Bottom Location Tag */}
          <div className="relative z-10 flex items-center gap-2 text-xs font-mono text-[#0D2823]/70">
            <MapPin className="w-3.5 h-3.5" />
            <span>Riyadh, Saudi Arabia · 2026</span>
          </div>
        </div>

        {/* Right Side - Dark Forest Auth Form Panel */}
        <div className="bg-[#0D2823] text-white p-8 md:p-14 flex flex-col justify-center relative">
          <div className="max-w-sm w-full mx-auto">
            {/* Success Message Banner */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3.5 rounded-xl bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* Error Message Banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* MODE 1: LOGIN FORM */}
              {mode === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-xs font-mono tracking-widest text-[#E1BF62] uppercase mb-2 font-medium">
                    OPERATOR ACCESS
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl font-normal text-white mb-2">
                    Welcome back.
                  </h2>
                  <p className="text-emerald-100/60 text-sm mb-6">
                    Sign in to manage today&apos;s hunts and claims.
                  </p>

                  {authError && !errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-5 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{authError}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono text-emerald-100/70 mb-2">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@treasurebox.app"
                        required
                        className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-sm transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-mono text-emerald-100/70">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage("");
                            setMode("forgot");
                          }}
                          className="text-xs text-[#E1BF62] hover:underline font-mono cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full bg-white text-gray-900 text-sm rounded-xl pl-4 pr-11 py-3 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-sm transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember me for 30 days */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-emerald-100/80 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-emerald-700/60 bg-emerald-950/60 text-[#E1BF62] focus:ring-[#E1BF62] focus:ring-offset-0 accent-[#E1BF62] cursor-pointer"
                        />
                        <span className="font-sans font-medium">Remember me for 30 days</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#E1BF62] hover:bg-[#D4AF37] disabled:opacity-60 text-[#0D2823] font-medium text-sm rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 shadow-md transition-all transform active:scale-[0.99] mt-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Unlock command room</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* MODE 2: FORGOT PASSWORD */}
              {mode === "forgot" && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setMode("login");
                    }}
                    className="flex items-center gap-1.5 text-xs text-emerald-200/70 hover:text-white mb-6 font-mono transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to sign in</span>
                  </button>

                  <p className="text-xs font-mono tracking-widest text-[#E1BF62] uppercase mb-2 font-medium">
                    PASSWORD RECOVERY
                  </p>
                  <h2 className="font-serif text-3xl font-normal text-white mb-2">
                    Forgot password?
                  </h2>
                  <p className="text-emerald-100/60 text-sm mb-8">
                    Enter your operator email address to receive a 6-digit verification code.
                  </p>

                  <form onSubmit={handleForgotSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono text-emerald-100/70 mb-2">
                        Operator email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@treasurebox.app"
                        required
                        className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-sm transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-[#E1BF62] hover:bg-[#D4AF37] disabled:opacity-60 text-[#0D2823] font-medium text-sm rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 shadow-md transition-all transform active:scale-[0.99] cursor-pointer"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending verification OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send verification OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* MODE 3: OTP VERIFICATION */}
              {mode === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setMode("forgot");
                    }}
                    className="flex items-center gap-1.5 text-xs text-emerald-200/70 hover:text-white mb-6 font-mono transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to email step</span>
                  </button>

                  <p className="text-xs font-mono tracking-widest text-[#E1BF62] uppercase mb-2 font-medium">
                    VERIFY IDENTITY
                  </p>
                  <h2 className="font-serif text-3xl font-normal text-white mb-2">
                    Enter OTP code
                  </h2>
                  <p className="text-emerald-100/60 text-xs mb-6">
                    Enter the 6-digit verification code sent to <span className="text-[#E1BF62] font-mono">{email}</span>
                  </p>

                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    {/* 6 Digit OTP Inputs */}
                    <div className="flex items-center justify-between gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          onPaste={handlePaste}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                              const prev = document.getElementById(`otp-input-${idx - 1}`);
                              if (prev) prev.focus();
                            }
                          }}
                          className="w-11 h-12 text-center text-lg font-mono font-bold bg-white text-gray-900 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-sm"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-emerald-200/60">
                      <span>Resend code:</span>
                      {timer > 0 ? (
                        <span className="text-[#E1BF62] font-semibold">
                          00:{timer < 10 ? `0${timer}` : timer}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={handleResendOtp}
                          className="text-[#E1BF62] hover:underline font-semibold cursor-pointer disabled:opacity-60"
                        >
                          Resend Code Now
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading || otp.join("").trim().length !== 6}
                      className="w-full bg-[#E1BF62] hover:bg-[#D4AF37] disabled:opacity-60 text-[#0D2823] font-medium text-sm rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 shadow-md transition-all transform active:scale-[0.99] cursor-pointer"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying OTP code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify OTP code</span>
                          <ShieldCheck className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* MODE 4: RESET PASSWORD */}
              {mode === "reset" && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-xs font-mono tracking-widest text-[#E1BF62] uppercase mb-2 font-medium">
                    NEW CREDENTIALS
                  </p>
                  <h2 className="font-serif text-3xl font-normal text-white mb-2">
                    Reset password
                  </h2>
                  <p className="text-emerald-100/60 text-sm mb-6">
                    Set your new secure operator password (minimum 6 characters).
                  </p>

                  <form onSubmit={handleResetSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono text-emerald-100/70 mb-2">
                        New password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full bg-white text-gray-900 text-sm rounded-xl pl-4 pr-11 py-3 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-sm transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-emerald-100/70 mb-2">
                        Confirm new password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full bg-white text-gray-900 text-sm rounded-xl pl-4 pr-11 py-3 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-sm transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-[#E1BF62] hover:bg-[#D4AF37] disabled:opacity-60 text-[#0D2823] font-medium text-sm rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 shadow-md transition-all transform active:scale-[0.99] cursor-pointer"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating password...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset password</span>
                          <KeyRound className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
