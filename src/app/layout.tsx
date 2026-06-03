import "./globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import NavBar from "@/components/navbar";
import Footer from "@/components/footer";
import Script from "next/script";
import QueryProvider from "@/providers/query-provider";
import { PublicEnvScript } from "next-runtime-env";

import { ThemeProvider } from "@/components/theme-provider";

import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const APP_NAME = "KagePlay";
const APP_DEFAULT_TITLE = "KagePlay - Watch Free Anime Online in HD";
const APP_DESCRIPTION = "KagePlay - Watch Free Anime Online in HD Quality. Stream anime free in HD with sub & dub options. Browse thousands of titles by genre, year, studio, and more. No ads, no bullshit.";
const APP_KEYWORDS = ["free anime website", "watch anime online free", "anime streaming", "anime online hd", "sub and dub anime", "free anime no ads", "best free anime website", "anime website online", "anime streaming free hd", "watch anime free"];

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#282A36",
};

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: "%s | KagePlay",
  },
  description: APP_DESCRIPTION,
  keywords: APP_KEYWORDS,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  manifest: "/manifest.json",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    url: "https://kageplay.vercel.app",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 192,
        height: 192,
        alt: "KagePlay",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "NDKw4kEDMG0csBWqBqRTxTf7-W2jNHa02F9D8siDzn8",
  },
  category: "entertainment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://api.jikan.moe" />
        <link rel="preconnect" href="https://cdn.myanimelist.net" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://piratexplay.cc" />
        <link rel="dns-prefetch" href="https://api-js.piratexplay.cc" />
        <link rel="dns-prefetch" href="https://megaplay.buzz" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C5ES6E3GFP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-C5ES6E3GFP');`}
        </Script>
        <PublicEnvScript />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192" />
      </head>
      <body
        className={`${geistSans.className} antialiased max-w-[100vw] overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <NavBar />
            <main id="main-content" role="main">
              {children}
            </main>
            <Footer />
          </QueryProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
