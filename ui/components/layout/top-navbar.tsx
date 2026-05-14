"use client";
import { useEffect, useState, useRef } from "react";
import { Bell, Globe, Search, User, Moon, Sun, LogOut, Settings, Check, Sprout, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { refreshAlerts } from "@/api/alertsApi";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageProvider";

export function TopNavbar() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const { data: profile } = useUserProfile();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
    // Read role for badge
    const role = localStorage.getItem("aaroh_role") || "";
    setUserRole(role);
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

  // Close dropdowns on outside click
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  type SearchSuggestion = { id: string; type: string; title: string; desc: string; url: string };
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLanguage(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Allow other UI (e.g. dashboard cards) to open the notification panel.
  useEffect(() => {
    function onOpen() {
      setShowNotifications(true);
      setShowProfile(false);
      setShowLanguage(false);
      setShowSearchDropdown(false);
    }
    window.addEventListener("aaroh:openNotifications", onOpen as EventListener);
    return () => window.removeEventListener("aaroh:openNotifications", onOpen as EventListener);
  }, []);

  // Search logic with 300ms debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    setShowSearchDropdown(true);

    const timer = setTimeout(async () => {
       try {
         const mockSource = [
           { id: "p1", type: "pest", title: "Fall Armyworm", desc: "Common corn and maize pest", url: "/dashboard/pest-detection" },
           { id: "p2", type: "pest", title: "Aphids", desc: "Sap-sucking insects", url: "/dashboard/pest-detection" },
           { id: "p3", type: "pest", title: "Whitefly", desc: "Active in warm climates", url: "/dashboard/pest-detection" },
           { id: "c1", type: "crop", title: "Wheat", desc: "Winter cycle crop", url: "/dashboard/crop-health" },
           { id: "c2", type: "crop", title: "Cotton", desc: "Cash crop, currently monitored", url: "/dashboard/crop-health" },
           { id: "c3", type: "crop", title: "Rice", desc: "Kharif season crop", url: "/dashboard/crop-health" },
           { id: "h1", type: "history", title: "Leaf Blight Detection", desc: "Detected 2 days ago in Zone B", url: "/dashboard/history" },
           { id: "h2", type: "history", title: "Rust Warning", desc: "Detected last week", url: "/dashboard/history" },
           { id: "a1", type: "alert", title: "Heavy Rain Alert", desc: "Expected within 24hrs", url: "/dashboard/notifications" }
         ];

         const q = searchQuery.toLowerCase();
         // Simulate filtering
         const results = mockSource.filter(item => 
            item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)
         );
         
         setSearchSuggestions(results);
       } catch {
         setSearchSuggestions([]);
       } finally {
         setIsSearching(false);
       }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Simulated "real-time" alerts: evaluate conditions on an interval.
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("aaroh_token") : null;
    if (!token) return;

    const id = window.setInterval(() => {
      refreshAlerts().catch(() => {
        // keep silent; alerts should not break navigation
      });
    }, 45_000);

    return () => window.clearInterval(id);
  }, []);

  const timeAgo = (iso: string | null | undefined) => {
    if (!iso) return "";
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return "";
    const diffMs = Date.now() - ts;
    if (diffMs < 45_000) return t("time.just_now");
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return t("time.minutes_ago", { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("time.hours_ago", { count: hrs });
    const days = Math.floor(hrs / 24);
    return t("time.days_ago", { count: days });
  };

  const isNew = (iso: string | null | undefined) => {
    if (!iso) return false;
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < 10 * 60_000; // 10 minutes
  };

  const displayLevel = (n: { level?: string | null; type?: string | null }) => {
    const lvl = (n.level || "").toLowerCase();
    if (lvl === "critical") return "alert";
    if (lvl === "warning") return "warning";
    if (lvl === "info") return "info";
    const tpe = (n.type || "").toLowerCase();
    if (tpe.includes("alert")) return "alert";
    return tpe || "info";
  };

  return (
    <header className="h-16 border-b border-slate-200/60 dark:border-white/10 glass-panel sticky top-0 z-40 flex items-center justify-between px-6 transition-colors duration-300 relative overflow-hidden">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-farm flex items-center justify-center shadow-soft shrink-0">
          <Sprout className="h-4 w-4 text-[var(--color-primary)] dark:text-white" />
        </div>
        <span className="font-sans text-[1.1rem] font-black tracking-tight text-slate-900 dark:text-white">AAROH</span>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full" ref={searchRef}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder={t("common.search_placeholder") || "Search pests, crops, history..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true); }}
            className="w-full bg-muted/50 pl-9 border-none h-10 rounded-full"
          />
          
          <AnimatePresence>
            {showSearchDropdown && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute left-0 right-0 mt-2 bg-white dark:bg-card border border-border/50 shadow-card-hover rounded-xl z-50 overflow-hidden"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    Searching...
                  </div>
                ) : searchSuggestions.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto py-2">
                    {searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery("");
                          router.push(item.url);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex flex-col transition-colors border-b border-border/30 last:border-0"
                      >
                         <div className="flex items-center justify-between pointer-events-none">
                           <span className="text-sm font-semibold text-foreground">{item.title}</span>
                           <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md bg-muted/80 text-muted-foreground">
                             {item.type}
                           </span>
                         </div>
                         <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1 pointer-events-none">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="relative hidden sm:block" ref={langRef}>
          <button
            onClick={() => {
              setShowLanguage(!showLanguage);
              setShowNotifications(false);
              setShowProfile(false);
            }}
            className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-muted/80"
            type="button"
          >
            <Globe className="h-3 w-3" />
            <span>
              {language === "hi" ? t("language.hindi") : language === "gu" ? t("language.gujarati") : t("language.english")}
            </span>
          </button>

          <AnimatePresence>
            {showLanguage && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="absolute right-0 mt-2 w-44 glass-card shadow-card-hover rounded-xl z-50 overflow-hidden"
              >
                {([
                  { code: "en", label: t("language.english") },
                  { code: "hi", label: t("language.hindi") },
                  { code: "gu", label: t("language.gujarati") },
                ] as const).map((opt) => {
                  const selected = language === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        setLanguage(opt.code);
                        setShowLanguage(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted/40 transition-colors ${
                        selected ? "bg-muted/40 font-semibold" : ""
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {selected ? <Check className="h-4 w-4 text-[var(--color-primary)]" /> : <span className="h-4 w-4" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={toggleTheme}
          className="relative h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {userRole && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border transition-all select-none ${
              userRole === "admin"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50"
            }`}
          >
            <Shield className="h-3 w-3" />
            {userRole === "admin" ? "Admin Access" : "User Access"}
          </div>
        )}

        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => { router.push("/dashboard/notifications"); }}
            className="relative h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            type="button"
            aria-label={t("common.notifications")}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[var(--color-accent)] rounded-full border-2 border-card text-[10px] flex items-center justify-center font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 glass-card shadow-card-hover rounded-xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-border/50 font-semibold flex justify-between items-center">
                   {t("common.notifications")}
                   {unreadCount === 0 && (
                     <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
                       <Check className="h-4 w-4" />
                       {t("common.mark_all_read")}
                     </span>
                   )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {(notifications || []).length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      {t("common.no_notifications")}
                    </div>
                  ) : (
                    (notifications || []).slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.is_read) markRead.mutate(n.id);
                        }}
                        className="w-full text-left p-4 border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium line-clamp-1">{n.message}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            {isNew(n.created_at) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 font-semibold">
                                {t("notifications.new")}
                              </span>
                            )}
                            {!n.is_read && <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {displayLevel(n)}{" "}
                          {n.created_at ? <span className="opacity-70">• {timeAgo(n.created_at)}</span> : null}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="h-9 w-9 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)]/20 transition-all border border-[var(--color-primary)]/20 shadow-soft overflow-hidden"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profile avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>
          
          <AnimatePresence>
            {showProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 glass-card shadow-card-hover rounded-xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-border/50">
                  <p className="font-semibold text-sm line-clamp-1">{profile?.name || "Farmer Profile"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{profile?.email || "Account"}</p>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <Link href="/dashboard/settings" className="flex items-center gap-2 p-2 w-full text-left text-sm rounded-md hover:bg-muted/50 transition-colors">
                    <Settings className="h-4 w-4 text-muted-foreground" /> {t("common.settings")}
                  </Link>
                  <button
                    onClick={() => {
                      // Robust clearing of all auth data
                      localStorage.removeItem("aaroh_token");
                      localStorage.removeItem("aaroh_role");
                      localStorage.removeItem("aaroh_user_name");
                      localStorage.removeItem("aaroh_user_id");

                      // Clear cookies for middleware with path/SameSite alignment
                      const cookies = ["aaroh_token", "aaroh_role"];
                      cookies.forEach(c => {
                        document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
                        document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; domain=${window.location.hostname}`;
                      });

                      console.log('[Logout] Session cleared. Redirecting to /login');
                      router.push("/login");
                    }}
                    className="flex items-center gap-2 p-2 w-full text-left text-sm rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> {t("common.logout")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
