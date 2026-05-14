"use client";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userName, setUserName] = useState<string>("Administrator");
  const [isClient, setIsClient] = useState(false);

  // NOTE: The middleware handles admin auth protection.
  // No need for client-side re-verification; server already validated it.

  useEffect(() => {
    setIsClient(true);
    const storedName = localStorage.getItem("aaroh_user_name");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  return (
    <div className="h-dvh min-h-0 overflow-hidden bg-background flex flex-col relative overflow-x-hidden selection:bg-indigo-500/20 text-foreground">
      <div
        className="fixed top-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-500 z-[60] pointer-events-none"
        aria-hidden
      />

      <div className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-zinc-950 dark:via-zinc-950 dark:to-indigo-950/20" />
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <div className="relative z-10 flex flex-1 min-h-0 flex-row w-full pt-0.5">
        <AdminSidebar className="z-20 w-64 flex-shrink-0" />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col z-10">
          <header className="h-16 border-b border-slate-200/60 dark:border-white/10 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
             <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Admin Portal</h2>
                <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-xs font-medium">Production Environment</span>
                </div>
             </div>
             {isClient && (
               <div className="flex items-center gap-3">
                  <div className="text-right">
                     <p className="text-sm font-bold">{userName}</p>
                     <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Chief System Admin</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-white dark:border-zinc-800 shadow-sm">
                     {(userName?.[0] || "A").toUpperCase()}
                  </div>
               </div>
             )}
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 w-full relative">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
