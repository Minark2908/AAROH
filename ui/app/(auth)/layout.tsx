import { Sprout } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="fixed top-0 left-0 w-full h-0.5 bg-[var(--color-primary)] z-50 pointer-events-none"
        aria-hidden
      />
      <div className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-br from-[#FDF9F2] via-[#F8F9F7] to-[#F1F6F2] dark:from-zinc-950 dark:via-zinc-950/50 dark:to-zinc-900/50" />
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.018] dark:opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[700px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(251,146,60,0.18) 0%, rgba(251,191,36,0.06) 45%, transparent 75%)" }} />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#3F7F5A]/8 rounded-full blur-3xl -z-10" />

      <Link href="/" className="mb-8 z-10 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="h-16 w-16 bg-gradient-to-br from-[#3F7F5A] to-emerald-500 border border-emerald-300/30 rounded-2xl shadow-lg shadow-emerald-900/15 flex items-center justify-center">
          <Sprout className="h-8 w-8 text-white" />
        </div>
        <div className="text-center">
          <div className="text-[1.4rem] font-black tracking-tight text-slate-900 dark:text-white leading-none">AAROH</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tracking-wide font-medium mt-0.5">Roots of Indian Farming</p>
        </div>
      </Link>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        {children}
      </div>
    </div>
  );
}
