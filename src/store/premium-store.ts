"use client";
import { create } from "zustand";

export type PlanId = "weekly" | "monthly" | "yearly";

export const PLANS = {
  weekly: { price: 19, label: "1 Week", days: 7 },
  monthly: { price: 69, label: "1 Month", days: 30 },
  yearly: { price: 699, label: "1 Year", days: 365 },
} as const;

export type Payment = {
  id: string;
  username: string;
  email: string;
  utr: string;
  amount: number;
  plan: PlanId;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type PremiumUser = {
  username: string;
  email: string;
  premiumUntil: string;
  plan: PlanId;
  active: boolean;
  grantedBy: string;
  grantedAt: string;
};

const PAYMENTS_KEY = "kage_payments";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

interface PremiumStore {
  isPremium: boolean;
  premiumUser: PremiumUser | null;
  allPremiumUsers: PremiumUser[];
  payments: Payment[];
  loading: boolean;
  loadPremiumUsers: () => Promise<void>;
  checkPremium: (username: string) => Promise<void>;
  grantPremium: (username: string, email: string, plan: PlanId, grantedBy: string) => Promise<void>;
  revokePremium: (username: string) => Promise<void>;
  addPayment: (p: Omit<Payment, "id" | "createdAt">) => void;
  approvePayment: (id: string) => void;
  rejectPayment: (id: string) => void;
  getPendingPayments: () => Payment[];
}

export const usePremiumStore = create<PremiumStore>((set, get) => ({
  isPremium: false,
  premiumUser: null,
  allPremiumUsers: [],
  payments: loadJSON<Payment[]>(PAYMENTS_KEY, []),
  loading: false,

  loadPremiumUsers: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/premium/list");
      const data = await res.json();
      set({ allPremiumUsers: data.users || [] });
    } catch {
      set({ allPremiumUsers: [] });
    }
    set({ loading: false });
  },

  checkPremium: async (username: string) => {
    if (!username) return;
    try {
      const res = await fetch(`/api/premium/check?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      set({
        isPremium: data.premium,
        premiumUser: data.user
          ? {
              username: data.user.username,
              email: data.user.email || "",
              premiumUntil: data.user.premium_until,
              plan: data.user.plan || "monthly",
              active: data.user.active,
              grantedBy: data.user.granted_by || "",
              grantedAt: data.user.granted_at,
            }
          : null,
      });
    } catch {
      set({ isPremium: false, premiumUser: null });
    }
  },

  grantPremium: async (username: string, email: string, plan: PlanId, grantedBy: string) => {
    try {
      await fetch("/api/premium/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, plan, grantedBy }),
      });
      await get().loadPremiumUsers();
      await get().checkPremium(username);
    } catch {}
  },

  revokePremium: async (username: string) => {
    try {
      await fetch("/api/premium/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      await get().loadPremiumUsers();
      set({ isPremium: false, premiumUser: null });
    } catch {}
  },

  addPayment: (p) => {
    const payment: Payment = { ...p, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const payments = [...get().payments, payment];
    saveJSON(PAYMENTS_KEY, payments);
    set({ payments });
  },

  approvePayment: async (id: string) => {
    const payments = get().payments.map((p) =>
      p.id === id ? { ...p, status: "approved" as const } : p,
    );
    saveJSON(PAYMENTS_KEY, payments);
    set({ payments });
    const payment = payments.find((p) => p.id === id);
    if (payment) {
      await get().grantPremium(payment.username, payment.email, payment.plan, "payment-auto");
    }
  },

  rejectPayment: async (id: string) => {
    const payments = get().payments.map((p) =>
      p.id === id ? { ...p, status: "rejected" as const } : p,
    );
    saveJSON(PAYMENTS_KEY, payments);
    set({ payments });
    const payment = payments.find((p) => p.id === id);
    if (payment) {
      await get().revokePremium(payment.username);
    }
  },

  getPendingPayments: () => get().payments.filter((p) => p.status === "pending"),
}));
