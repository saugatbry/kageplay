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
const APP_KEYWORDS = [
  "free anime streaming sites", "free anime online", "free anime apps", "free anime app",
  "free anime watch", "free anime watch site", "free anime website", "free anime websites",
  "free anime site", "free anime sites", "free anime streaming", "watch free anime",
  "watch free anime online", "free anime websites to watch", "best free anime sites",
  "best free anime websites", "where to watch free anime", "where can i watch anime for free",
  "where can i watch free anime", "where to watch anime for free", "where to watch anime free",
  "where to watch anime online free", "where to watch anime online for free",
  "where to watch anime for free online", "how to watch anime for free", "how to watch free anime",
  "is crunchyroll free to watch anime", "where to watch dubbed anime free",
  "where can i watch anime for free online", "what are some free anime websites",
  "hianime", "hi anime", "hianime website", "hianime safe", "is hianime safe",
  "hianime app", "hianime apk", "hianime login", "hianime discord", "hianime to",
  "hianime not working", "hianime not loading", "hianime down", "is hianime down",
  "hianime subtitles not working", "what happened to hianime", "hianime replacement",
  "hianime shutdown", "hianime shut down",
  "aniwatch", "aniwatch tv", "aniwatch apk", "aniwatch discord", "aniwatch alternatives",
  "aniwatch alternative", "sites like aniwatch", "websites like aniwatch", "is aniwatch safe",
  "is aniwatch down", "aniwatch down", "aniwatch not working", "aniwatch not loading",
  "aniwatch is down", "aniwatch not working 2025", "is aniwatch broken right now",
  "why is aniwatch not working",
  "anime", "anime world", "anime planet", "anime dekho", "anime wallpaper",
  "anime wallpaper 4k", "anime photo", "anime drawing",
  "hindi anime", "hindi anime zone", "animeflix hindi anime", "hindi anime website",
  "hindi anime dub", "hindi anime dubbed", "how to watch anime in hindi",
  "where to watch anime in hindi", "where can i watch anime in hindi",
  "where to watch anime in hindi for free", "how to watch anime in hindi for free",
  "how to watch anime for free in hindi", "where can i watch attack on titan anime in hindi",
  "which anime is available in hindi on netflix", "where to download anime in hindi",
  "crunchyroll free anime",
];

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
    google: "c5KhVMd8GyPu1HuYMdWWXlyiYNlpFz2qrJ6LjEGFA2k",
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
