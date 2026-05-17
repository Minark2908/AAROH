"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sprout,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Technology", href: "#technology" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("aaroh_token");
    const name = localStorage.getItem("aaroh_user_name");
    const role = localStorage.getItem("aaroh_role");
    if (token && token !== "undefined" && token !== "null" && token.trim().length > 0) {
      setIsLoggedIn(true);
      setUserName(name || role || "User");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("aaroh_token");
    localStorage.removeItem("aaroh_role");
    localStorage.removeItem("aaroh_user_name");
    localStorage.removeItem("aaroh_user_id");
    ["aaroh_token", "aaroh_role"].forEach((name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
    setIsLoggedIn(false);
    setUserName(null);
    router.refresh();
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMobileOpen(false);
      }
    }
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 w-full h-[3px] z-[60] pointer-events-none"
        style={{ background: "linear-gradient(90deg, #3F7F5A, #F97316, #3F7F5A)" }}
        aria-hidden
      />

      <nav
        className={`fixed top-[3px] left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/10 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            : "bg-transparent border-b border-transparent py-5"
        }`}
      >
        <div className="container mx-auto max-w-7xl flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3F7F5A] to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:shadow-emerald-500/30 transition-shadow duration-300">
              <Sprout className="h-[22px] w-[22px] text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[1.3rem] font-black tracking-tight text-slate-900 dark:text-white leading-none">
                AAROH
              </span>
              <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 tracking-[0.08em] leading-tight mt-0.5">
                Roots of Indian Farming
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={(e) => scrollToSection(e, href)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100/70 dark:hover:bg-zinc-800/70 transition-all duration-200"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="hidden sm:inline-flex">
                  <button className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </button>
                </Link>
                <div className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-700/40">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3F7F5A] to-emerald-500 flex items-center justify-center shadow-sm">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                    {userName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Log out"
                    id="navbar-logout-btn"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex">
                  <button className="rounded-full px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition-colors">
                    Log in
                  </button>
                </Link>
                <Link href="/signup">
                  <button
                    className="text-white rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:-translate-y-0.5 border-none"
                    style={{ background: "linear-gradient(135deg, #F97316, #F59E0B)" }}
                    id="navbar-get-started-btn"
                  >
                    Get Started
                  </button>
                </Link>
              </>
            )}

            <button
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              id="navbar-mobile-toggle"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/10 shadow-xl py-4 px-6">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => scrollToSection(e, href)}
                  className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {label}
                </a>
              ))}
              {!isLoggedIn && (
                <Link
                  href="/login"
                  className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors sm:hidden"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
