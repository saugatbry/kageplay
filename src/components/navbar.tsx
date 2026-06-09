"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import Container from "./container";
import { Separator } from "./ui/separator";

import { ROUTES } from "@/constants/routes";
import React, { ReactNode, useEffect, useState } from "react";

import SearchBar from "./search-bar";
import { Crown, MenuIcon, SearchIcon, X } from "lucide-react";
import useScrollPosition from "@/hooks/use-scroll-position";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";
import LoginPopoverButton from "./login-popover-button";
import PremiumButton from "./premium-button";
import { useAuthStore } from "@/store/auth-store";
import { useProviderStore } from "@/store/provider-store";
import NavbarAvatar from "./navbar-avatar";

const menuItems: Array<{ title: string; href?: string; premium?: boolean }> = [
  {
    title: "Anime",
    href: ROUTES.SEARCH,
  },
  {
    title: "Manga",
    href: ROUTES.MANGA,
  },
  {
    title: "Premium",
    href: "/premium",
    premium: true,
  },
];

const NavBar = () => {
  const auth = useAuthStore();
  const { provider, setProvider } = useProviderStore();
  const { y } = useScrollPosition();
  const isHeaderSticky = y > 0;
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showTip, setShowTip] = useState(true);

  return (
    <nav
      className={cn([
        "h-fit w-full",
        "sticky top-0 z-[100]",
        "bg-slate-950/80 backdrop-blur-xl border-b border-white/5",
        isHeaderSticky ? "shadow-lg shadow-black/20" : "",
      ])}
      aria-label="Main navigation"
    >
      <Container className="flex items-center justify-between py-2 gap-2 sm:gap-4 md:gap-10 lg:gap-20 ">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-1 cursor-pointer shrink-0"
          aria-label="KagePlay - Home"
        >
          <Image src="/logo.png" alt="KagePlay logo" width={90} height={39} className="w-[90px] h-[39px] sm:w-[115px] sm:h-[50px] md:w-[160px] md:h-[70px]" />
        </Link>

        <div className="relative">
          {showTip && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max z-50">
              <div className="bg-slate-800 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg border border-blue-500/30 whitespace-nowrap flex items-center gap-2">
                Click to switch between Hindi &amp; Sub/Dub
                <button
                  onClick={() => setShowTip(false)}
                  className="text-gray-400 hover:text-white hover:bg-slate-700 rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none"
                  aria-label="Dismiss tip"
                >
                  x
                </button>
              </div>
              <div className="flex justify-center -mt-px">
                <div className="w-2 h-2 bg-slate-800 border-l border-t border-blue-500/30 rotate-45 translate-y-1/2"></div>
              </div>
            </div>
          )}
          <button
            onClick={() => setProvider(provider === "subdub" ? "hindi" : "subdub")}
            className={cn([
              "text-xs sm:text-sm font-bold px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 transition-all duration-300 shrink-0",
              "hover:scale-105 active:scale-95",
              provider === "hindi"
                ? "border-orange-500 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 hover:shadow-lg hover:shadow-orange-500/20"
                : "border-blue-500 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20",
            ])}
          >
            <span className="flex items-center gap-1.5">
              <span className={cn("inline-block w-2 h-2 rounded-full animate-pulse", provider === "hindi" ? "bg-orange-400" : "bg-blue-400")} />
              {provider === "subdub" ? "Sub/Dub" : "Hindi"}
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-10 ml-20">
          {menuItems.map((menu, idx) =>
            menu.premium ? (
              <Link
                key={idx}
                href={menu.href || "#"}
                className="flex items-center gap-1.5 text-amber-400 font-bold hover:text-amber-300 transition-colors"
              >
                <Crown className="h-4 w-4" />
                {menu.title}
              </Link>
            ) : (
              <Link href={menu.href || "#"} key={idx}>
                {menu.title}
              </Link>
            )
          )}
        </div>
        <div className="w-1/3 hidden lg:flex items-center gap-5">
          <SearchBar />
          {auth.auth ? <NavbarAvatar auth={auth} /> : <LoginPopoverButton />}
        </div>
        <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
          <PremiumButton />
          <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label={mobileSearchOpen ? "Close search" : "Open search"} aria-expanded={mobileSearchOpen}>
            <SearchIcon suppressHydrationWarning className="h-5 w-5" />
          </button>
          <MobileMenuSheet trigger={<MenuIcon suppressHydrationWarning aria-label="Open menu" />} />
          {auth.auth && <NavbarAvatar auth={auth} />}
        </div>
      </Container>
      {mobileSearchOpen && (
        <div className="lg:hidden px-4 pb-3">
          <SearchBar onAnimeClick={() => setMobileSearchOpen(false)} />
        </div>
      )}
    </nav>
  );
};

const MobileMenuSheet = ({ trigger }: { trigger: ReactNode }) => {
  const [open, setOpen] = useState<boolean>(false);
  const { provider, setProvider } = useProviderStore();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent
        className="flex flex-col w-[80vw] z-[150]"
        hideCloseButton
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="w-full h-full relative">
          <SheetClose className="absolute top-0 right-0" aria-label="Close menu">
            <X />
          </SheetClose>
          <div className="flex flex-col gap-5 mt-10">
            {menuItems.map((menu, idx) =>
              menu.premium ? (
                <Link
                  href={menu.href || "#"}
                  key={idx}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 text-amber-400 font-bold"
                >
                  <Crown className="h-4 w-4" />
                  {menu.title}
                </Link>
              ) : (
                <Link
                  href={menu.href || "#"}
                  key={idx}
                  onClick={() => setOpen(false)}
                >
                  {menu.title}
                </Link>
              )
            )}
            <button
              onClick={() => {
                setProvider(provider === "subdub" ? "hindi" : "subdub");
                setOpen(false);
              }}
              className={cn([
                "text-sm font-bold px-4 py-2 rounded-full border-2 transition-all duration-300 w-fit",
                provider === "hindi"
                  ? "border-orange-500 text-orange-400 bg-orange-500/10"
                  : "border-blue-500 text-blue-400 bg-blue-500/10",
              ])}
            >
              {provider === "subdub" ? "Sub/Dub" : "Hindi"}
            </button>
            <Separator />
            <SearchBar onAnimeClick={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavBar;
