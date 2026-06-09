import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export const PLANS = {
  weekly: { price: 19, label: "1 Week", days: 7, id: "weekly" },
  monthly: { price: 69, label: "1 Month", days: 30, id: "monthly" },
  yearly: { price: 699, label: "1 Year", days: 365, id: "yearly" },
} as const;

export type PlanId = keyof typeof PLANS;

export const GOOGLE_SCRIPT_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";

export const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "example@fam";
export const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "KagePlay";

export interface UTRVerificationResponse {
  success: boolean;
  utr?: string;
  amount?: string;
  used?: boolean;
}

export async function verifyUTR(
  utr: string
): Promise<UTRVerificationResponse> {
  if (!GOOGLE_SCRIPT_URL) {
    return { success: false };
  }
  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?utr=${encodeURIComponent(utr)}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch {
    return { success: false };
  }
}

export async function savePaymentToFirestore(data: {
  utr: string;
  amount: number;
  email: string;
  username: string;
  plan: PlanId;
}) {
  try {
    const ref = doc(db, "payments", data.utr);
    await setDoc(ref, {
      ...data,
      verified: true,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function createSubscription(data: {
  userId: string;
  plan: PlanId;
  purchaseDate: Date;
  expiryDate: Date;
}) {
  try {
    const ref = doc(db, "subscriptions", data.userId);
    await setDoc(ref, {
      ...data,
      active: true,
      purchaseDate: data.purchaseDate.toISOString(),
      expiryDate: data.expiryDate.toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function getSubscription(userId: string) {
  try {
    const ref = doc(db, "subscriptions", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
  } catch {
    return null;
  }
}

export async function isUTRUsed(utr: string): Promise<boolean> {
  try {
    const q = query(collection(db, "payments"), where("utr", "==", utr));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}
