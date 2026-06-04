"use client";
import { create } from "zustand";

export type Payment = {
  id: string;
  username: string;
  email: string;
  utr: string;
  screenshot: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type PremiumUser = {
  username: string;
  email: string;
  premiumUntil: string;
  active: boolean;
  grantedBy: string;
  grantedAt: string;
};

const PREMIUM_KEY = "kage_premium_users";
const PAYMENTS_KEY = "kage_payments";
const TRAFFIC_KEY = "kage_traffic";

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
  checkPremium: (username: string) => void;
  grantPremium: (username: string, email: string, grantedBy: string) => void;
  revokePremium: (username: string) => void;
  addPayment: (p: Omit<Payment, "id" | "createdAt">) => void;
  approvePayment: (id: string) => void;
  rejectPayment: (id: string) => void;
  getPendingPayments: () => Payment[];
  logVisit: (page: string) => void;
  getTraffic: () => { page: string; count: number; lastVisit: string }[];
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

  grantPremium: (username: string, email: string, grantedBy: string) => {
    const users = get().allPremiumUsers;
    const until = new Date();
    until.setMonth(until.getMonth() + 1);
    const existing = users.findIndex((u) => u.username === username);
    const entry: PremiumUser = {
      username,
      email,
      premiumUntil: until.toISOString(),
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
      get().grantPremium(payment.username, payment.email, "payment-auto");
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

  logVisit: (page: string) => {
    const traffic = loadJSON<{ page: string; count: number; lastVisit: string }[]>(TRAFFIC_KEY, []);
    const existing = traffic.findIndex((t) => t.page === page);
    if (existing >= 0) {
      traffic[existing].count++;
      traffic[existing].lastVisit = new Date().toISOString();
    } else {
      traffic.push({ page, count: 1, lastVisit: new Date().toISOString() });
    }
    saveJSON(TRAFFIC_KEY, traffic);
  },

  getTraffic: () => loadJSON<{ page: string; count: number; lastVisit: string }[]>(TRAFFIC_KEY, []),
}));
