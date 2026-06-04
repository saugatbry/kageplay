"use client";
import { useEffect, useState, useCallback } from "react";
import { usePremiumStore } from "@/store/premium-store";
import { useAuthStore } from "@/store/auth-store";
import { X, ShieldAlert } from "lucide-react";

const POPADS_SCRIPT = "https://pl29632930.effectivecpmnetwork.com/8a/25/8a/8a258a2cffda14fcdc96a465e718f1e2.js";
const AD_INTERVAL = 4 * 60 * 1000;
const UPSELL_INTERVAL = 8 * 60 * 1000;
const STORAGE_KEY = "kage_ad_last_shown";

const Ads = () => {
  const { isPremium } = usePremiumStore();
  const { auth } = useAuthStore();
  const [adblockDetected, setAdblockDetected] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isPremium || dismissed) return;
    const timer = setInterval(() => {
      const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      if (Date.now() - last > AD_INTERVAL) {
        loadPopad();
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [isPremium, dismissed]);

  useEffect(() => {
    if (isPremium) return;
    const timer = setTimeout(() => {
      setShowUpsell(true);
    }, UPSELL_INTERVAL);
    return () => clearTimeout(timer);
  }, [isPremium]);

  useEffect(() => {
    const bait = document.createElement("div");
    bait.id = "kage-ad-bait";
    bait.style.position = "absolute";
    bait.style.height = "1px";
    bait.style.width = "1px";
    bait.style.opacity = "0";
    bait.style.pointerEvents = "none";
    document.body.appendChild(bait);

    const check = setTimeout(() => {
      const rect = bait.getBoundingClientRect();
      if (rect.height === 0 || rect.width === 0) {
        setAdblockDetected(true);
      }
    }, 2000);

    return () => {
      clearTimeout(check);
      bait.remove();
    };
  }, []);

  const loadPopad = useCallback(() => {
    if (document.querySelector('script[src*="effectivecpmnetwork"]')) return;
    const s = document.createElement("script");
    s.src = POPADS_SCRIPT;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return (
    <>
      {adblockDetected && !isPremium && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
          <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-8 max-w-md text-center relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setAdblockDetected(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <ShieldAlert className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">AdBlock Detected</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Kindly turn off your AdBlock. Ads help me fund server costs and keep this site running for free.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setAdblockDetected(false);
                  loadPopad();
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
              >
                I turned it off
              </button>
              <button
                onClick={() => window.location.href = "/premium"}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Get Premium (₹9)
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpsell && !isPremium && !adblockDetected && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-2xl relative">
            <button
              onClick={() => setShowUpsell(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-bold text-lg mb-1">Wanna get rid of annoying ads?</h3>
            <p className="text-amber-400 text-2xl font-black mb-1">Get Premium</p>
            <p className="text-gray-400 text-sm mb-3">
              Only <span className="text-green-400 font-bold">₹9</span> / month &mdash; less than a cup of coffee!
            </p>
            <button
              onClick={() => {
                if (auth) {
                  window.location.href = "/premium";
                } else {
                  window.location.href = "/?login=true";
                }
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg font-bold text-sm transition-all duration-300 shadow-lg shadow-amber-600/20"
            >
              {auth ? "Get Premium Now" : "Login & Get Premium"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Ads;
