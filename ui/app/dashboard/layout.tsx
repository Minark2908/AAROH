import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh min-h-0 overflow-hidden bg-background flex flex-col relative overflow-x-hidden selection:bg-orange-500/20 text-foreground">
      
      {/* Single brand accent — avoids stacked tricolour with sidebar / header */}
      <div
        className="fixed top-0 left-0 w-full h-0.5 bg-[var(--color-primary)] z-[60] pointer-events-none"
        aria-hidden
      />

      <div className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-br from-[#FAF9F6] via-[#F8F9F7] to-[#F1F6F2] dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/50" />
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <div className="relative z-10 flex flex-1 min-h-0 flex-row w-full pt-0.5">
        <Sidebar className="z-20 w-64 flex-shrink-0" />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col z-10">
          <TopNavbar />
          <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 w-full relative">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
