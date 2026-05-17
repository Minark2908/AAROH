"use client";

import Link from "next/link";
import { Sprout, Github, Mail, ExternalLink } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Pest Detection", href: "/dashboard/pest-detection" },
  { label: "AI Advisor", href: "/dashboard/advisor" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Weather", href: "/dashboard" },
];

const RESOURCE_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Technology", href: "#technology" },
  { label: "FAQ", href: "#faq" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Contact", href: "#" },
];

export default function Footer() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-white/[0.06] relative overflow-hidden">
      <div className="absolute bottom-0 right-0 opacity-[0.02] pointer-events-none">
        <svg width="280" height="280" viewBox="0 0 100 100" fill="#3F7F5A">
          <path d="M50 100 Q60 70 80 40 Q60 40 50 20 Q40 40 20 40 Q40 70 50 100Z" />
        </svg>
      </div>

      <div className="container mx-auto max-w-7xl px-6 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3F7F5A] to-emerald-500 flex items-center justify-center">
                <Sprout className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 dark:text-white tracking-tight block leading-tight text-lg">
                  AAROH
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Roots of Indian Farming
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px]">
              AI-powered crop protection platform designed for Indian agriculture.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-4 tracking-wide uppercase">Product</h4>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#3F7F5A] dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"
                  >
                    {label}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-4 tracking-wide uppercase">Resources</h4>
            <ul className="space-y-2.5">
              {RESOURCE_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    onClick={(e) => scrollToSection(e, href)}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#3F7F5A] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-4 tracking-wide uppercase">Legal</h4>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#3F7F5A] dark:hover:text-emerald-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
            © {new Date().getFullYear()} AAROH. Inspired by the soil.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#3F7F5A] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="mailto:contact@aaroh.in"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#3F7F5A] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
