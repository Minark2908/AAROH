"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bug,
  Sprout,
  CloudSun,
  Activity,
  MessageSquareHeart,
  FileBarChart,
  Image as ImageIcon,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";

const sidebarLinks = [
  { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.pest_detection", href: "/dashboard/pest-detection", icon: Bug },
  { key: "nav.crop_health", href: "/dashboard/crop-health", icon: Sprout },
  { key: "nav.weather_intelligence", href: "/dashboard/weather", icon: CloudSun },
  { key: "nav.iot_sensors", href: "/dashboard/sensors", icon: Activity },
  { key: "nav.ai_advisor", href: "/dashboard/advisor", icon: MessageSquareHeart },
  { key: "nav.image_history", href: "/dashboard/history", icon: ImageIcon },
  { key: "nav.reports", href: "/dashboard/reports", icon: FileBarChart },
  { key: "nav.settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside
      className={cn(
        "hidden lg:flex h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-slate-200/60 dark:border-white/10 glass-panel",
        className
      )}
    >
      <div className="h-16 flex items-center px-5 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-farm flex items-center justify-center shadow-soft shrink-0">
            <Sprout className="h-[22px] w-[22px] text-[var(--color-primary)] dark:text-white" />
          </div>
          <div>
            <span className="font-sans text-[1.2rem] font-black tracking-tight text-slate-900 dark:text-white leading-none block">AAROH</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">{t("sidebar.tagline")}</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        {sidebarLinks.map((item) => {
          const isActive = pathname === item.href;
          const name = t(item.key);
          return (
            <Link key={item.key} href={item.href}>
              <span
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors relative overflow-hidden",
                  isActive
                    ? "text-[var(--color-primary-dark)] dark:text-white bg-gradient-farm shadow-soft font-semibold"
                    : "text-muted-foreground hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[var(--color-accent)] rounded-r-full z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <item.icon className={cn("h-5 w-5 z-10", isActive ? "text-[var(--color-primary)] dark:text-white" : "text-current")} />
                <span className="z-10">{name}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="bg-gradient-farm border border-[var(--color-primary)]/20 rounded-xl p-4 text-[var(--color-primary-dark)] dark:text-white shadow-soft relative overflow-hidden">
          <div className="absolute [-top-4] [-right-4] p-2 opacity-10">
            <Sprout className="h-20 w-20" />
          </div>
          <h4 className="font-semibold text-sm mb-1 z-10 relative">{t("sidebar.support_title")}</h4>
          <p className="text-xs opacity-80 mb-3 z-10 relative">{t("sidebar.support_desc")}</p>
          <button className="text-xs font-semibold bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-lg w-full hover:shadow-card-hover hover:-translate-y-0.5 transition-all z-10 relative">
            {t("sidebar.support_cta")}
          </button>
        </div>
      </div>
    </aside>
  );
}
