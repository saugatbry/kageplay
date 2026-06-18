"use client";
import { useEffect, useState, useRef } from "react";
import { usePremiumStore } from "@/store/premium-store";
import { useSettingsStore } from "@/store/settings-store";
import { useAuthHydrated, useAuthStore } from "@/store/auth-store";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";

const POPADS_SCRIPT = "https://pl29684527.effectivecpmnetwork.com/47/65/a3/4765a3a4b92dbb27c332caf217e2612e.js";
const SMARTLINK_URL = "https://www.effectivecpmnetwork.com/gu2n4yhb?key=375952c0a0d7bdd2466f752a9e53b970";
const SOCIALBAR_SCRIPT = "https://pl29684528.effectivecpmnetwork.com/23/ba/7f/23ba7fc3a137a0d1657183daf7b87caa.js";

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

const Ads = () => {
  const pathname = usePathname();
  const { isPremium, checkPremium } = usePremiumStore();
  const { adsEnabled, loaded: settingsLoaded, load: loadSettings } = useSettingsStore();
  const { auth } = useAuthStore();
  const hasHydrated = useAuthHydrated();
  const [adblockDetected, setAdblockDetected] = useState(false);
  const [dismissBlock, setDismissBlock] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [premiumConfirmed, setPremiumConfirmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socialLoadedRef = useRef(false);

  const isWatchPage = pathname?.startsWith("/anime/watch");
  const isExcluded = pathname?.startsWith("/psy") || pathname?.startsWith("/premium");

  useEffect(() => { setMounted(true); loadSettings(); }, [loadSettings]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (auth?.username) {
      checkPremium(auth.username).then(() => setPremiumConfirmed(true));
    } else {
      setPremiumConfirmed(true);
    }
  }, [hasHydrated, auth?.username, checkPremium]);

  useEffect(() => {
    if (!settingsLoaded || !premiumConfirmed || isPremium || isExcluded) return;
    if (!adsEnabled) return;
    const bait = document.createElement("script");
    bait.src = POPADS_SCRIPT;
    bait.async = true;
    bait.onerror = () => setAdblockDetected(true);
    document.head.appendChild(bait);
    return () => { bait.remove(); };
  }, [settingsLoaded, premiumConfirmed, isPremium, isExcluded, adsEnabled]);

  useEffect(() => {
    if (!settingsLoaded || !premiumConfirmed || isPremium || !mounted || isExcluded) return;
    if (!adsEnabled) return;
    const s = document.createElement("script");
    s.src = POPADS_SCRIPT;
    s.async = true;
    document.head.appendChild(s);
    const min = isWatchPage ? 420 : 180;
    const max = isWatchPage ? 900 : 480;
    const schedule = () => {
      const delay = randomDelay(min, max);
      timerRef.current = setTimeout(() => {
        const ss = document.createElement("script");
        ss.src = POPADS_SCRIPT;
        ss.async = true;
        document.head.appendChild(ss);
        schedule();
      }, delay);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [settingsLoaded, premiumConfirmed, isPremium, mounted, isExcluded, isWatchPage, adsEnabled]);

  useEffect(() => {
    if (!settingsLoaded || !premiumConfirmed || isPremium || isExcluded) return;
    if (!adsEnabled) return;
    if (!socialLoadedRef.current) {
      socialLoadedRef.current = true;
      const s = document.createElement("script");
      s.src = SOCIALBAR_SCRIPT;
      s.async = true;
      document.head.appendChild(s);
    }
  }, [settingsLoaded, premiumConfirmed, isPremium, isExcluded, adsEnabled]);

  if (!mounted || isExcluded) return null;
  if (!settingsLoaded) return null;
  if (!adsEnabled) return null;

  return (
    <>
      {adblockDetected && !isPremium && !dismissBlock && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
          <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-8 max-w-md text-center relative animate-in fade-in zoom-in duration-300">
            <ShieldAlert className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">AdBlock Detected</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Kindly turn off your AdBlock. Ads help me fund server costs and keep this site running for free.
            </p>
            <button
              onClick={() => { setDismissBlock(true); }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
            >
              I turned it off
            </button>
          </div>
        </div>
      )}

      {settingsLoaded && premiumConfirmed && !isPremium && !adblockDetected && (
        <a
          href={SMARTLINK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-4xl mx-auto my-4 min-h-[100px] bg-slate-800/30 rounded-xl border border-white/5 flex items-center justify-center text-xs text-gray-600 relative overflow-hidden hover:border-blue-500/30 hover:bg-slate-800/50 transition-colors"
        >
          <span className="absolute top-1 left-2 text-[10px] text-gray-600">ad</span>
          <span className="text-gray-400 text-sm">Advertisement</span>
        </a>
      )}
    </>
  );
};

export default Ads;
