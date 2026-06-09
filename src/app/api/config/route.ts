import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    UPI_ID: process.env.NEXT_PUBLIC_UPI_ID || "psyflowz@fam",
    UPI_NAME: process.env.NEXT_PUBLIC_UPI_NAME || "KagePlay",
    QR_IMAGE: process.env.NEXT_PUBLIC_QR_IMAGE || "/famPayQr.png",
    GOOGLE_SCRIPT_URL: process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "",
  });
}
