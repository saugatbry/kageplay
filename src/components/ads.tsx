"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { usePremiumStore } from "@/store/premium-store";
import { usePathname } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";

const POPADS_SCRIPT = "https://pl29632930.effectivecpmnetwork.com/8a/25/8a/8a258a2cffda14fcdc96a465e718f1e2.js";
const INSTAGRAM = "https://instagram.com/psyflowz";

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

const Ads = () => {
  const pathname = usePathname();
  const { isPremium } = usePremiumStore();
  const [adblockDetected, setAdblockDetected] = useState(false);
  const [dismissBlock, setDismissBlock] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  const isWatchPage = pathname?.startsWith("/anime/watch");
  const isExcluded = pathname?.startsWith("/psy");

  useEffect(() => { setMounted(true); }, []);

  const loadPopad = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const s = document.createElement("script");
    s.src = POPADS_SCRIPT;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  const scheduleNext = useCallback(() => {
    const min = isWatchPage ? 420 : 180;
    const max = isWatchPage ? 900 : 480;
    const delay = randomDelay(min, max);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      loadPopad();
      scheduleNext();
    }, delay);
  }, [isWatchPage, loadPopad]);

  useEffect(() => {
    if (isPremium || !mounted || isExcluded) return;
    loadPopad();
    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPremium, mounted, isExcluded, loadPopad, scheduleNext]);

  useEffect(() => {
    const bait = document.createElement("script");
    bait.src = POPADS_SCRIPT;
    bait.async = true;
    bait.onerror = () => setAdblockDetected(true);
    document.head.appendChild(bait);
    return () => { bait.remove(); };
  }, []);

  if (!mounted || isExcluded) return null;

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
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setDismissBlock(true); loadPopad(); }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
              >
                I turned it off
              </button>
              <button
                onClick={() => window.open(INSTAGRAM, "_blank")}
                className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg text-sm font-semibold transition-colors"
              >
                Get Premium
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad banner container for display ads */}
      {!isPremium && !adblockDetected && (
        <div
          id="kage-ad"
          className="w-full max-w-4xl mx-auto my-4 min-h-[100px] bg-slate-800/30 rounded-xl border border-white/5 flex items-center justify-center text-xs text-gray-600 relative overflow-hidden"
        >
          <span className="absolute top-1 left-2 text-[10px] text-gray-600">ad</span>
        </div>
      )}
    </>
  );
};

export default Ads;
