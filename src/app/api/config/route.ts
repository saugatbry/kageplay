import { NextResponse } from "next/server";

export async function GET() {
  const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || process.env.UPI_ID || "psyflowz@fam";
  const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || process.env.UPI_NAME || "KagePlay";
  const QR_IMAGE = process.env.NEXT_PUBLIC_QR_IMAGE || process.env.QR_IMAGE || "/famPayQr.png";
  const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL || "";

  return NextResponse.json({
    UPI_ID,
    UPI_NAME,
    QR_IMAGE,
    GOOGLE_SCRIPT_URL,
    _debug: {
      hasNEXT_PUBLIC_UPI_ID: !!process.env.NEXT_PUBLIC_UPI_ID,
      hasUPI_ID: !!process.env.UPI_ID,
      hasNEXT_PUBLIC_GOOGLE_SCRIPT_URL: !!process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL,
    },
  });
}
