"use client";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  description: string;
  badgeText?: string;
  badgeIcon?: LucideIcon;
  badgeVariant?: "primary" | "accent" | "destructive" | "soil";
  className?: string;
}

export function PageHeader({
  title,
  description,
  badgeText,
  badgeIcon: BadgeIcon,
  badgeVariant = "primary",
  className,
}: PageHeaderProps) {
  const variants = {
    primary: "bg-emerald-50 dark:bg-[#3F7F5A]/10 border border-[#3F7F5A]/20 dark:border-[#3F7F5A]/30 text-[#3F7F5A] dark:text-emerald-400",
    accent:  "bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/30 text-orange-700 dark:text-orange-400",
    destructive: "bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/30 text-red-600 dark:text-red-400",
    soil: "bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/30 text-amber-700 dark:text-amber-400",
  };

  return (
    <div className={cn("mb-8", className)}>
      {badgeText && BadgeIcon && (
        <div className={cn("inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold mb-3 shadow-sm tracking-wide", variants[badgeVariant])}>
          <BadgeIcon className="h-3.5 w-3.5" /> {badgeText}
        </div>
      )}
      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">{description}</p>
    </div>
  );
}
