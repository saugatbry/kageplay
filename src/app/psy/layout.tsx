"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePremiumStore } from "@/store/premium-store";
import {
  LayoutDashboard, Users, Banknote, LogOut, ShieldCheck, X, ChevronRight,
} from "lucide-react";
import Link from "next/link";

const ADMIN_USER = "psyflowz";
const ADMIN_PASS = "shreya";

export default function PsyLayout({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = sessionStorage.getItem("kage_admin");
    if (stored === ADMIN_USER) setLoggedIn(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setLoggedIn(true);
      sessionStorage.setItem("kage_admin", ADMIN_USER);
      setError("");
    } else {
      setError("Invalid credentials");
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm">
          <ShieldCheck className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-center mb-6">Admin Login</h1>
          <div className="space-y-3">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm transition-colors"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  const navItems = [
    { href: "/psy", label: "Dashboard", icon: LayoutDashboard },
    { href: "/psy", label: "Premium Users", icon: Users, exact: true },
    { href: "/psy/payments", label: "Payments", icon: Banknote },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 bg-slate-900 border-r border-white/5 p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          <span className="font-bold">KagePlay Admin</span>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href + label}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => { sessionStorage.removeItem("kage_admin"); setLoggedIn(false); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors mt-auto"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-white/5 p-3 flex items-center justify-between">
        <span className="font-bold text-sm">KagePlay Admin</span>
        <button
          onClick={() => { sessionStorage.removeItem("kage_admin"); setLoggedIn(false); }}
          className="text-red-400 text-sm"
        >
          Logout
        </button>
      </div>

      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
