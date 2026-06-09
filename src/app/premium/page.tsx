"use client";

import { useState } from "react";
import { usePremiumStore, PLANS, type PlanId } from "@/store/premium-store";
import { useAuthStore } from "@/store/auth-store";
import { Crown, Zap, ShieldCheck, CheckCircle, Loader2, XCircle, CreditCard, Smartphone } from "lucide-react";
import Link from "next/link";

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "psyflowz@fam";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "KagePlay";
const QR_IMAGE = process.env.NEXT_PUBLIC_QR_IMAGE || "/famPayQr.png";

type Step = "plans" | "payment" | "verify" | "success";

export default function PremiumPage() {
  const auth = useAuthStore();
  const { isPremium, premiumUser, addPayment, checkPremium } = usePremiumStore();
  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(auth.auth?.username || "");
  const [utr, setUtr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const plan = selectedPlan ? PLANS[selectedPlan] : null;

  const handleSelectPlan = (id: PlanId) => {
    setSelectedPlan(id);
    setStep("payment");
    setError("");
  };

  const handleVerify = async () => {
    setError("");
    setSuccessMsg("");
    if (!username.trim()) return setError("Enter your username");
    if (!email.trim() || !email.includes("@")) return setError("Enter a valid email");
    if (!utr.trim() || utr.trim().length < 6) return setError("Enter a valid UTR / transaction ID");
    if (!plan) return;

    setVerifying(true);
    try {
      const res = await fetch(`/api/premium/verify?utr=${encodeURIComponent(utr.trim())}`);
      const data = await res.json();

      if (!data.success) {
        setError("UTR not found. Make sure you entered the correct transaction ID.");
        setVerifying(false);
        return;
      }

      if (data.used) {
        setError("This UTR has already been used.");
        setVerifying(false);
        return;
      }

      if (data.amount && parseInt(data.amount) !== plan.price) {
        setError(`Amount mismatch. Expected ₹${plan.price}, received ₹${data.amount}.`);
        setVerifying(false);
        return;
      }

      addPayment({
        username: username.trim(),
        email: email.trim(),
        utr: utr.trim(),
        amount: plan.price,
        plan: selectedPlan!,
        status: "pending",
      });

      checkPremium(username.trim());
      setStep("success");
      setSuccessMsg(`Payment verified! Your ${plan.label} premium plan is being activated.`);
    } catch {
      setError("Verification failed. Please try again.");
    }
    setVerifying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-purple-600/10 to-blue-600/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <Crown className="h-4 w-4" /> Premium
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
            Go Premium
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Unlock the full KagePlay experience. No ads, exclusive features, and priority support.
          </p>
          {isPremium && premiumUser && (
            <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <ShieldCheck className="h-5 w-5" />
              Premium active until {new Date(premiumUser.premiumUntil).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {step === "plans" && (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(PLANS).map(([id, p]) => (
                <button
                  key={id}
                  onClick={() => handleSelectPlan(id as PlanId)}
                  className="group relative bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left hover:border-amber-500/40 hover:bg-slate-900/80 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5"
                >
                  {id === "yearly" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-black">
                      BEST VALUE
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      {id === "weekly" ? <Zap className="h-5 w-5 text-amber-400" /> :
                       id === "monthly" ? <Crown className="h-5 w-5 text-amber-400" /> :
                       <ShieldCheck className="h-5 w-5 text-amber-400" />}
                    </div>
                    <span className="text-lg font-bold">{p.label}</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    ₹{p.price}
                  </div>
                  <div className="text-gray-500 text-sm mb-4">
                    ₹{(p.price / p.days).toFixed(1)} / day
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400 shrink-0" /> No ads
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400 shrink-0" /> Premium badge
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400 shrink-0" /> Priority support
                    </li>
                  </ul>
                  <div className="mt-6 w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold text-center group-hover:bg-amber-500/20 transition-colors">
                    Select {p.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-12 bg-slate-900/30 border border-white/5 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                All Premium Features
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {[
                  "Ad-free browsing",
                  "No pop-ups or interstitials",
                  "Premium badge on profile",
                  "Faster streaming",
                  "Priority email support",
                  "Early access to new features",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {step === "payment" && plan && (
          <div className="max-w-lg mx-auto space-y-6">
            <button
              onClick={() => setStep("plans")}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              &larr; Back to plans
            </button>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <h2 className="text-xl font-bold mb-1">Pay ₹{plan.price}</h2>
              <p className="text-gray-400 text-sm mb-6">{plan.label} Premium Plan</p>

              <div className="bg-white rounded-2xl p-4 mb-4 inline-block">
                <img
                  src={QR_IMAGE}
                  alt="FamPay QR"
                  width={200}
                  height={200}
                  className="mx-auto"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                  }}
                />
              </div>
              <div className="text-center space-y-1 mb-4">
                <div className="text-xs text-gray-400">Or pay via UPI ID:</div>
                <div className="font-mono text-lg text-amber-400 font-bold bg-amber-500/10 rounded-xl px-4 py-2 inline-block border border-amber-500/20">
                  {UPI_ID}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4 text-green-400" />
                  <span className="text-gray-300">UPI ID:</span>
                  <span className="font-mono text-amber-400 font-bold">{UPI_ID}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Pay exactly <span className="font-bold text-white">₹{plan.price}</span> via any UPI app
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-400" />
                Verify Payment
              </h3>
              <div className="space-y-4">
                <input
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 rounded-xl border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                />
                <input
                  placeholder="Your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 rounded-xl border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                />
                <input
                  placeholder="Transaction ID / UTR"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 rounded-xl border border-white/10 text-sm font-mono focus:outline-none focus:border-blue-500/50"
                />
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4" /> Verify Payment</>
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              After paying via UPI, enter the transaction ID / UTR above to verify.
              Premium activates instantly upon successful verification.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Submitted!</h2>
            <p className="text-gray-400 mb-8">{successMsg}</p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-6 py-4 mb-8 text-sm text-amber-400">
              Your premium will be activated manually within 24 hours.
              Contact support if you don&apos;t see the changes.
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition-colors"
              >
                Back to Home
              </Link>
              <Link
                href={`/profile/${username}`}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-sm font-semibold transition-colors"
              >
                View Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
