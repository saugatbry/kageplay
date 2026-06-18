"use client";
import { create } from "zustand";

interface SettingsStore {
  adsEnabled: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  setAdsEnabled: (val: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  adsEnabled: true,
  loaded: false,

  load: async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      set({ adsEnabled: data.ads_enabled !== false, loaded: true });
    } catch {
      set({ adsEnabled: true, loaded: true });
    }
  },

  setAdsEnabled: async (val: boolean) => {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ads_enabled: val }),
      });
      set({ adsEnabled: val });
    } catch {}
  },
}));
