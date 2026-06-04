"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { usePremiumStore } from "@/store/premium-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2, Upload, ShieldCheck, QrCode } from "lucide-react";
import { toast } from "sonner";

const UPI_ID = "saugat@fam";
const AMOUNT = 9;

const PremiumPage = () => {
  const { auth } = useAuthStore();
  const { isPremium, addPayment } = usePremiumStore();
  const router = useRouter();
  const [step, setStep] = useState<"info" | "payment" | "verify" | "success">("info");
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [counter, setCounter] = useState(3);

  useEffect(() => {
    if (!auth) {
      router.push("/");
    }
  }, [auth, router]);

  if (!auth) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!utr.trim() || !screenshot) return;
    setVerifying(true);
    addPayment({
      username: auth.username,
      email: auth.email || "",
      utr: utr.trim(),
      screenshot,
      amount: AMOUNT,
      status: "pending",
    });
    setTimeout(() => {
      setVerifying(false);
      setStep("success");
      const interval = setInterval(() => {
        setCounter((c) => {
          if (c <= 1) {
            clearInterval(interval);
            router.push("/");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, 3000);
  };

  if (isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-green-500/30 rounded-2xl p-10 max-w-md text-center">
          <ShieldCheck className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">You&apos;re Premium!</h1>
          <p className="text-gray-400 mb-6">Enjoy ad-free browsing. Thank you for your support!</p>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="w-full max-w-lg">
        {step === "info" && (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-black mb-2">Go Premium</h1>
            <p className="text-amber-400 text-2xl font-bold mb-1">₹9 / month</p>
            <p className="text-gray-400 text-sm mb-6">That&apos;s less than a cup of coffee ☕</p>
            <ul className="text-left space-y-3 mb-8">
              {["No more popup ads", "Support the server costs", "Early access to new features"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => setStep("payment")}
              className="w-full py-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-lg font-bold"
            >
              Continue &mdash; ₹9
            </Button>
            <button onClick={() => router.push("/")} className="mt-4 text-sm text-gray-500 hover:text-gray-300">
              Maybe later
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Pay via UPI</h2>
            <div className="bg-slate-800 rounded-xl p-6 inline-block mb-4">
              {screenshot ? (
                <img src={screenshot} alt="Screenshot preview" className="w-48 h-48 object-contain mx-auto" />
              ) : (
                <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
                  <QrCode className="h-20 w-20 text-gray-400" />
                  <div className="text-center">
                    <p className="text-lg font-mono text-green-400 font-bold">{UPI_ID}</p>
                    <p className="text-xs text-gray-500 mt-1">UPI ID</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-1">UPI ID: <span className="font-mono text-green-400">{UPI_ID}</span></p>
            <p className="text-xs text-gray-500 mb-4">For international payment, contact <a href="https://instagram.com/psyflowz" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">psyflowz on Instagram</a></p>
            {!screenshot && (
              <>
                <p className="text-sm text-gray-400 mb-2">Send exactly <span className="font-bold text-amber-400">₹{AMOUNT}</span> to the UPI above</p>
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="mb-4">
                  <Upload className="h-4 w-4 mr-1" /> Upload payment screenshot
                </Button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </>
            )}
            {screenshot && (
              <div className="space-y-3">
                <Input
                  placeholder="Enter UTR number"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="bg-slate-800 border-white/10"
                />
                <Button onClick={handleSubmit} disabled={!utr.trim()} className="w-full bg-green-600 hover:bg-green-700">
                  Submit Payment
                </Button>
                <button onClick={() => { setScreenshot(null); setUtr(""); }} className="text-xs text-gray-500 hover:text-gray-300">
                  Upload different screenshot
                </button>
              </div>
            )}
          </div>
        )}

        {step === "verify" && (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-10 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-gray-400 text-sm">Please wait while we verify your transaction...</p>
          </div>
        )}

        {step === "success" && (
          <div className="bg-slate-900 border border-green-500/30 rounded-2xl p-10 text-center">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h2>
            <p className="text-gray-400 mb-2">Your premium will be activated once the admin approves your payment.</p>
            <p className="text-gray-500 text-sm mb-6">Redirecting to home in {counter}s...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumPage;
