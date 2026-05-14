"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bug,
  Activity,
  MessageSquareHeart,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";

const bottomNavLinks = [
  { key: "nav.home", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.pest", href: "/dashboard/pest-detection", icon: Bug },
  { key: "nav.sensors", href: "/dashboard/sensors", icon: Activity },
  { key: "nav.advisor", href: "/dashboard/advisor", icon: MessageSquareHeart },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-200/60 dark:border-white/10 pb-safe z-50 relative overflow-hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-20">
        {bottomNavLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.key} 
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 relative h-full py-2 hover:bg-muted/50 transition-colors"
            >
              <item.icon 
                className={cn("h-6 w-6 z-10 transition-colors", isActive ? "text-[var(--color-primary)]" : "text-muted-foreground")} 
              />
              <span className={cn("text-[11px] font-semibold z-10 transition-colors", isActive ? "text-[var(--color-primary)]" : "text-muted-foreground")}>
                {t(item.key)}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute top-0 w-16 h-1 bg-[var(--color-primary)] rounded-b-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
