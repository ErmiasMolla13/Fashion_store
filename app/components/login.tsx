"use client";

import { useState } from "react";
import { User, X, Mail, Lock, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import useAuth from "./context/AuthContext";

/** Renders the AuthModal whenever the shared auth context says it should be open.
 * Lives once in the root layout so any component (navbar, cart drawer, checkout
 * redirect, etc.) can trigger login/signup via `openAuth()` from AuthContext. */
export function AuthModalGate() {
  const { isAuthOpen, closeAuth } = useAuth();
  if (!isAuthOpen) return null;
  return <AuthModal onClose={closeAuth} />;
}

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { refreshUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Helper to safely parse API responses (handles both JSON and HTML error pages)
  const safeFetch = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const textError = await res.text();
      console.error("HTML Error Page:", textError);
      throw new Error("Server error (500). Please check your terminal console.");
    }

    if (!res.ok) {
      throw new Error(data?.error || "Request failed");
    }

    return data;
  };

  // Submit Sign In or Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (isSignUp) {
        await safeFetch("/api/auth/register", { name, email, password });
        setStep("otp");
      } else {
        await safeFetch("/api/auth/login", { email, password });
        await refreshUser();
        setStatusMessage("Login successful! Welcome back.");
        setStep("success");
        setTimeout(() => onClose(), 2000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await safeFetch("/api/auth/verify-otp", { email, otp });
      await refreshUser();
      setStatusMessage("Account registered & verified successfully!");
      setStep("success");
      setTimeout(() => onClose(), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid OTP code";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 z-10 overflow-hidden transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* SCREEN 3: SUCCESS SCREEN */}
        {step === "success" && (
          <div className="py-6 text-center animate-in zoom-in-95 duration-200">
            <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              {statusMessage}
            </h3>
            <p className="text-xs text-slate-500">Redirecting to your session...</p>
          </div>
        )}

        {/* SCREEN 2: OTP VERIFICATION */}
        {step === "otp" && (
          <div className="animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Enter OTP Code
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                We sent a 6-digit verification code to: <br />
                <strong className="text-slate-800">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center tracking-[0.5em] text-lg font-bold py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? "Verifying..." : "Verify Code"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* SCREEN 1: LOGIN / REGISTER FORM */}
        {step === "form" && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isSignUp ? "Create an account" : "Welcome back"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-indigo-600 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2 disabled:opacity-50"
              >
                <span>
                  {isSubmitting
                    ? "Processing..."
                    : isSignUp
                    ? "Send OTP Code"
                    : "Sign In"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 text-center pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}