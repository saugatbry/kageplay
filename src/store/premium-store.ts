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

const PREMIUM_KEY = "kage_premium_users";
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

function calcExpiry(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

interface PremiumStore {
  isPremium: boolean;
  premiumUser: PremiumUser | null;
  allPremiumUsers: PremiumUser[];
  payments: Payment[];
  checkPremium: (username: string) => void;
  grantPremium: (username: string, email: string, plan: PlanId, grantedBy: string) => void;
  revokePremium: (username: string) => void;
  addPayment: (p: Omit<Payment, "id" | "createdAt">) => void;
  approvePayment: (id: string) => void;
  rejectPayment: (id: string) => void;
  getPendingPayments: () => Payment[];
}

export const usePremiumStore = create<PremiumStore>((set, get) => ({
  isPremium: false,
  premiumUser: null,
  allPremiumUsers: loadJSON<PremiumUser[]>(PREMIUM_KEY, []),
  payments: loadJSON<Payment[]>(PAYMENTS_KEY, []),

  checkPremium: (username: string) => {
    const users = get().allPremiumUsers;
    const found = users.find(
      (u) => u.username === username && u.active && new Date(u.premiumUntil) > new Date(),
    );
    set({ isPremium: !!found, premiumUser: found || null });
  },

  grantPremium: (username: string, email: string, plan: PlanId, grantedBy: string) => {
    const users = get().allPremiumUsers;
    const days = PLANS[plan].days;
    const existing = users.findIndex((u) => u.username === username);
    const entry: PremiumUser = {
      username,
      email,
      premiumUntil: calcExpiry(days),
      plan,
      active: true,
      grantedBy,
      grantedAt: new Date().toISOString(),
    };
    let updated: PremiumUser[];
    if (existing >= 0) {
      updated = [...users];
      updated[existing] = entry;
    } else {
      updated = [...users, entry];
    }
    saveJSON(PREMIUM_KEY, updated);
    set({ allPremiumUsers: updated });
  },

  revokePremium: (username: string) => {
    const users = get().allPremiumUsers.map((u) =>
      u.username === username ? { ...u, active: false } : u,
    );
    saveJSON(PREMIUM_KEY, users);
    set({ allPremiumUsers: users, isPremium: false, premiumUser: null });
  },

  addPayment: (p) => {
    const payment: Payment = { ...p, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const payments = [...get().payments, payment];
    saveJSON(PAYMENTS_KEY, payments);
    set({ payments });
  },

  approvePayment: (id: string) => {
    const payments = get().payments.map((p) =>
      p.id === id ? { ...p, status: "approved" as const } : p,
    );
    saveJSON(PAYMENTS_KEY, payments);
    set({ payments });
    const payment = payments.find((p) => p.id === id);
    if (payment) {
      get().grantPremium(payment.username, payment.email, payment.plan, "payment-auto");
    }
  },

  rejectPayment: (id: string) => {
    const payments = get().payments.map((p) =>
      p.id === id ? { ...p, status: "rejected" as const } : p,
    );
    saveJSON(PAYMENTS_KEY, payments);
    set({ payments });
    const payment = payments.find((p) => p.id === id);
    if (payment) {
      get().revokePremium(payment.username);
    }
  },

  getPendingPayments: () => get().payments.filter((p) => p.status === "pending"),
}));
