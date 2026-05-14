"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Search,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";

const adminLinks = [
  { name: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "All Predictions", href: "/admin/predictions", icon: Search },
  { name: "System Logs", href: "/admin/logs", icon: ShieldCheck },
  { name: "Admin Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  const handleLogout = () => {
    // Clear all auth data from localStorage
    localStorage.removeItem("aaroh_token");
    localStorage.removeItem("aaroh_role");
    localStorage.removeItem("aaroh_user_name");
    localStorage.removeItem("aaroh_user_id");
    
    // Clear cookies for middleware with proper path/SameSite alignment
    const cookies = ["aaroh_token", "aaroh_role"];
    cookies.forEach(c => {
      document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; domain=${window.location.hostname}`;
    });
    
    console.log("[AdminSidebar] Session cleared. Redirecting to /login");
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-slate-200/60 dark:border-white/10 glass-panel",
        className
      )}
    >
      <div className="h-16 flex items-center px-5 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
            <ShieldCheck className="h-[22px] w-[22px] text-white" />
          </div>
          <div>
            <span className="font-sans text-[1.1rem] font-black tracking-tight text-slate-900 dark:text-white leading-none block uppercase">AAROH Admin</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium tracking-widest uppercase">System Control</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        {adminLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <span
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors relative overflow-hidden",
                  isActive
                    ? "text-indigo-600 dark:text-white bg-indigo-50 dark:bg-indigo-900/20 shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-indigo-500 rounded-r-full z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <item.icon className={cn("h-5 w-5 z-10", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-current")} />
                <span className="z-10">{item.name}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-white/10">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
