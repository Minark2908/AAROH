"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sprout,
  ScanSearch,
  Activity,
  CloudSun,
  Cpu,
  Upload,
  Bot,
  CheckCircle2,
  Droplets,
  ShieldCheck,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">

      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-[0.018]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div
        className="fixed top-0 left-0 w-full h-0.5 bg-[var(--color-primary)] z-[60] pointer-events-none"
        aria-hidden
      />

      <nav
        className={`fixed top-0.5 left-0 right-0 z-50 transition-all duration-400 ${
          scrolled
            ? "bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/10 py-3 shadow-sm"
            : "bg-transparent border-b border-transparent py-5"
        }`}
      >
        <div className="container mx-auto max-w-7xl flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3F7F5A] to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Sprout className="h-[22px] w-[22px] text-white" />
            </div>
            <span className="font-sans text-[1.35rem] font-black tracking-tight text-slate-900 dark:text-white leading-none">
              AAROH
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex rounded-full px-5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium"
              >
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full px-6 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:-translate-y-0.5 border-none font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div
        className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none transition-all duration-400"
        style={{ top: scrolled ? "51px" : "63px" }}
      >
        <p className="text-[11px] font-semibold tracking-[0.10em] select-none">
          <span className="font-black text-slate-800 dark:text-slate-200">AAROH</span>
          <span className="mx-2 text-slate-300 dark:text-slate-600">—</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium normal-case tracking-normal">Roots of Indian Farming</span>
        </p>
      </div>

      {/* ============================================================ */}
      {/* ============================================================ */}
      <section className="relative pt-36 pb-28 md:pt-48 md:pb-32 px-6 overflow-hidden">

        <div className="absolute inset-0 -z-30 bg-gradient-to-br from-[#FDF9F2] via-[#F8F9F5] to-[#EEF6EE] dark:from-zinc-950 dark:via-zinc-950/50 dark:to-zinc-900/50" />

        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -z-20 w-[900px] h-[550px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(251,146,60,0.22) 0%, rgba(251,191,36,0.08) 45%, transparent 75%)",
          }}
        />

        <div
          className="absolute top-[-5%] right-[-8%] -z-20 w-[640px] h-[640px] rounded-full pointer-events-none blur-[120px]"
          style={{ background: "rgba(249,115,22,0.16)" }}
        />

        <div
          className="absolute bottom-[5%] left-[-8%] -z-20 w-[480px] h-[480px] rounded-full pointer-events-none blur-[100px]"
          style={{ background: "rgba(63,127,90,0.13)" }}
        />

        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.035) 100%)",
          }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 -z-10 pointer-events-none"
          style={{ opacity: 0.03 }}
        >
          <svg
            viewBox="0 0 1440 110"
            fill="currentColor"
            className="w-full text-amber-900"
            preserveAspectRatio="none"
          >
            <path d="M0,55 Q180,15 360,55 T720,55 T1080,55 T1440,35 L1440,110 L0,110 Z" />
            {[80, 200, 340, 500, 680, 860, 1040, 1200, 1360].map((cx, i) => (
              <g key={i} transform={`translate(${cx}, ${35 + (i % 3) * 6})`}>
                <ellipse cx="0" cy="0" rx="5" ry="14" />
                <ellipse cx="0" cy="-14" rx="8" ry="4" />
                <ellipse cx="8" cy="-8" rx="7" ry="3" transform="rotate(20 8 -8)" />
                <ellipse cx="-8" cy="-8" rx="7" ry="3" transform="rotate(-20 -8 -8)" />
              </g>
            ))}
          </svg>
        </div>

        <div
          className="absolute top-[12%] right-[1%] -z-10 pointer-events-none"
          style={{ opacity: 0.04 }}
        >
          <svg width="160" height="160" viewBox="0 0 100 100" fill="#3F7F5A">
            <path d="M50 5 Q85 30 80 70 Q60 80 50 95 Q40 80 20 70 Q15 30 50 5Z" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="#3F7F5A" strokeWidth="1.5" />
            <path d="M50 30 Q65 40 72 55M50 30 Q35 40 28 55M50 55 Q60 63 65 73M50 55 Q40 63 35 73"
              stroke="#3F7F5A" strokeWidth="1" fill="none" />
          </svg>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">

            <div
              className="max-w-xl"
              style={{ animation: "heroFadeUp 0.85s cubic-bezier(0.22,1,0.36,1) both" }}
            >

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50/80 dark:bg-[#3F7F5A]/10 border border-[#3F7F5A]/20 dark:border-[#3F7F5A]/30 text-[#3F7F5A] dark:text-emerald-400 text-xs font-semibold mb-5 tracking-[0.06em] shadow-sm">
                <span>🌱</span>
                <span className="font-black text-[#3F7F5A] dark:text-emerald-400">AAROH</span>
                <span className="text-[#3F7F5A]/40 font-light">•</span>
                <span className="font-medium text-slate-500 dark:text-slate-400 tracking-normal">AI Agriculture Platform</span>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm font-semibold mb-8 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-70" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                Empowering the hands that feed the nation
              </div>

              <h1 className="font-sans text-5xl sm:text-[3.5rem] lg:text-[4rem] font-extrabold leading-[1.10] mb-5 tracking-tight text-slate-800 dark:text-white">
                From the roots of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400">
                  Indian soil
                </span>{" "}
                <br />
                to the{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-[#3F7F5A] to-emerald-500">
                  future of farming.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-3 max-w-lg leading-relaxed">
                AI-powered pest detection, real-time insights, and intelligent
                crop protection built for modern Indian farmers.
              </p>

              <p className="text-sm italic text-slate-400 dark:text-slate-500 mb-9 font-medium tracking-wide">
                "Built for the hands that feed the nation."
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
                <Link href="/dashboard/pest-detection" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full h-14 text-white px-8 rounded-full font-semibold text-base group border-none transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg,#F97316 0%,#F59E0B 100%)",
                      boxShadow:
                        "0 8px 24px rgba(249,115,22,0.32),0 2px 6px rgba(249,115,22,0.20)",
                    }}
                  >
                    Start Scanning Crops
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-14 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm border-2 border-[#3F7F5A]/30 dark:border-[#3F7F5A]/60 text-[#3F7F5A] dark:text-emerald-400 px-8 rounded-full font-semibold text-base transition-all duration-300 hover:-translate-y-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-[#3F7F5A]/60 hover:shadow-xl hover:shadow-emerald-500/20"
                  >
                    Explore Dashboard
                  </Button>
                </Link>
              </div>

              <div
                className="h-1 w-36 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-emerald-600/90"
                aria-hidden
              />
            </div>

            <div
              className="relative w-full lg:h-[560px] h-[400px]"
              style={{ animation: "heroFadeRight 0.95s cubic-bezier(0.22,1,0.36,1) 0.15s both" }}
            >
              <div
                className="absolute inset-[8%] -z-10 rounded-[2.5rem] blur-3xl"
                style={{
                  background:
                    "radial-gradient(ellipse at center,rgba(249,115,22,0.28) 0%,rgba(63,127,90,0.22) 55%,transparent 80%)",
                  opacity: 0.55,
                }}
              />

              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 400 400"
                fill="none"
                style={{ opacity: 0.05 }}
              >
                {[150, 200, 250, 300].map((y, i) => (
                  <path
                    key={i}
                    d={`M10 ${y} Q100 ${y - 80} 200 ${y} T400 ${y}`}
                    stroke="#3F7F5A"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              <div
                className="absolute inset-0 rounded-[2.5rem] overflow-hidden"
                style={{
                  border: "1.5px solid rgba(255,255,255,0.40)",
                  boxShadow:
                    "0 32px 80px rgba(0,0,0,0.17),0 8px 24px rgba(63,127,90,0.13),inset 0 1.5px 0 rgba(255,255,255,0.60)",
                  animation: "floatCard 7s ease-in-out infinite",
                }}
              >
                <Image
                  src="/farm-sunrise.jpg"
                  alt="Indian farmland at golden sunrise — lush green paddy fields with a glowing orange sky"
                  fill
                  priority
                  style={{ objectFit: "cover", objectPosition: "center 35%" }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top,rgba(30,60,30,0.30) 0%,transparent 45%),linear-gradient(to bottom,rgba(249,115,22,0.07) 0%,transparent 30%)",
                  }}
                />

                <div
                  className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
                  style={{
                    border: "1px solid rgba(255,255,255,0.22)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                  }}
                />

                <div
                  className="absolute bottom-5 left-5 right-5 rounded-2xl p-4 flex items-center gap-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-[18px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.13)]"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <ScanSearch className="h-5 w-5 text-[#3F7F5A] dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">Early Blight Detected</p>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 mt-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: "88%",
                          background: "linear-gradient(90deg,#F97316,#F59E0B)",
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      AI Confidence: 88% — Action Required
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-full text-[10px] font-bold border border-orange-200/60 dark:border-orange-500/30 shrink-0">
                    Live
                  </span>
                </div>
              </div>

              <div
                className="absolute top-[6%] right-[-3%] w-44 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-md rounded-xl p-3.5 shadow-xl border border-slate-100 dark:border-white/10 z-10"
                style={{ animation: "floatPill 5s ease-in-out 1s infinite" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Droplets className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Soil Moisture</p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">64% — Optimal</p>
                  </div>
                </div>
              </div>

              <div
                className="absolute bottom-[24%] left-[-4%] w-48 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-md rounded-xl p-3.5 shadow-xl border border-slate-100 dark:border-white/10 z-10"
                style={{ animation: "floatPill 4.5s ease-in-out 0.5s infinite" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Treatment Saved</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">View advisory plan</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeRight {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatCard {
          0%,100% { transform: perspective(1200px) rotateY(-4deg) rotateX(1.5deg) translateY(0px); }
          50%      { transform: perspective(1200px) rotateY(-4deg) rotateX(1.5deg) translateY(-10px); }
        }
        @keyframes floatPill {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
      `}</style>

      {/* ============================================================ */}
      {/* ============================================================ */}
      <section className="py-24 px-6 relative bg-white dark:bg-zinc-950">
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              Intelligence for every acre
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Equipping Indian agriculture with cutting-edge data and actionable insights.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ScanSearch, color: "emerald", label: "AI Pest Detection", desc: "Instantly identify crop diseases with high-accuracy computer vision." },
              { icon: Activity, color: "orange", label: "Risk Intelligence", desc: "Anticipate threats with predictive models analyzing farm vulnerability." },
              { icon: CloudSun, color: "blue", label: "Local Weather", desc: "Hyper-local forecasts to optimize spraying and watering schedules." },
              { icon: Cpu, color: "indigo", label: "IoT Monitoring", desc: "Connect sensors to track soil and farm conditions 24/7." },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div
                key={label}
                className={`p-8 rounded-3xl bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-300 group hover:-translate-y-1.5 relative overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 p-4 opacity-[0.07] group-hover:opacity-[0.15] transition-opacity`}>
                  <Icon className={`h-24 w-24 text-${color}-500`} />
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-500/10 border border-${color}-100/50 dark:border-${color}-500/20 flex items-center justify-center mb-6 text-${color === "emerald" ? "[#3F7F5A] dark:text-emerald-400" : color + "-600 dark:text-" + color + "-400"} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 relative z-10">{label}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed relative z-10">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============================================================ */}
      <section className="py-24 px-6 bg-background relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <span className="text-orange-600 dark:text-orange-500 font-bold tracking-wider uppercase text-sm mb-2 block">
              Simple Workflow
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              Actionable insights in three steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-6 relative">
            <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-emerald-100 via-orange-100 to-emerald-100 dark:from-emerald-900/50 dark:via-orange-900/50 dark:to-emerald-900/50 z-0" />
            {[
              { icon: Upload, num: "1", color: "text-[#3F7F5A] dark:text-emerald-400", bg: "bg-white dark:bg-zinc-900", numBg: "bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-zinc-700", title: "Upload crop image", desc: "Snap a photo of the affected plant area directly from your phone." },
              { icon: Bot, num: "2", color: "text-orange-500 dark:text-orange-400", bg: "bg-white dark:bg-zinc-900", numBg: "bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 border-slate-100 dark:border-zinc-700", title: "AI detects pest", desc: "Our advanced vision models pinpoint the disease with high accuracy." },
              { icon: ShieldCheck, num: "3", color: "text-white", bg: "bg-[#3F7F5A] dark:bg-emerald-600", numBg: "bg-orange-500 text-white border-white dark:border-zinc-950", title: "Get treatment", desc: "Receive organic and chemical advisory tailored to your crop format." },
            ].map(({ icon: Icon, num, color, bg, numBg, title, desc }) => (
              <div key={num} className="flex flex-col items-center text-center relative z-10">
                <div className={`w-24 h-24 rounded-3xl ${bg} shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-white/10 flex items-center justify-center mb-8 ${color} relative hover:-translate-y-2 transition-transform duration-300`}>
                  <Icon className="h-10 w-10" />
                  <div className={`absolute -top-4 -right-4 w-9 h-9 ${numBg} border-2 rounded-full flex items-center justify-center text-sm font-bold shadow-sm`}>
                    {num}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-[250px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============================================================ */}
      <section className="py-24 px-6 bg-white dark:bg-zinc-950 relative">
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-16 tracking-tight">
            Why farm with AAROH?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {[
              { icon: Leaf, color: "emerald", title: "Protect crops early", desc: "Identify issues before they spread, saving yield and minimizing overall damage." },
              { icon: ScanSearch, color: "orange", title: "Reduce chemical usage", desc: "Apply targeted treatments instead of blanket spraying — save money, protect soil." },
              { icon: Activity, color: "blue", title: "Make data-driven decisions", desc: "Leverage enterprise-grade intelligence right on your mobile device." },
              { icon: CheckCircle2, color: "indigo", title: "Build a safer yield", desc: "Get alerts on regional pest outbreaks and ensure a bountiful harvest." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className={`shrink-0 mt-1 w-10 h-10 rounded-full bg-${color}-50 dark:bg-${color}-500/10 flex items-center justify-center text-${color === "emerald" ? "[#3F7F5A] dark:text-emerald-400" : color + "-500 dark:text-" + color + "-400"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">{title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============================================================ */}
      <section className="py-32 px-6 relative overflow-hidden bg-background border-t border-slate-100 dark:border-white/10">
        <div className="absolute inset-0 pointer-events-none -z-10 flex justify-center">
          <div className="w-[800px] h-[500px] bg-gradient-to-t from-orange-50/60 to-transparent rounded-full blur-3xl opacity-60 translate-y-[50%]" />
        </div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
            Ready to protect your fields?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-xl mx-auto">
            Join the community of forward-thinking Indian farmers ensuring healthier crops and better yields.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 bg-gradient-to-r from-[#3F7F5A] to-emerald-600 hover:from-[#2e6244] hover:to-emerald-700 text-white px-10 rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-1 font-bold text-base border-none"
              >
                Join AAROH Free
              </Button>
            </Link>
            <Link href="/dashboard/pest-detection">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 bg-white/50 dark:bg-zinc-900/50 border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 px-10 rounded-full font-bold text-base transition-all hover:-translate-y-1"
              >
                Try Scanner Without Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ============================================================ */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-white/10 py-12 px-6 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 opacity-[0.025] pointer-events-none">
          <svg width="220" height="220" viewBox="0 0 100 100" fill="#3F7F5A">
            <path d="M50 100 Q60 70 80 40 Q60 40 50 20 Q40 40 20 40 Q40 70 50 100Z" />
          </svg>
        </div>
        <div className="container mx-auto max-w-7xl border-t border-slate-200/50 dark:border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3F7F5A] to-emerald-500 flex items-center justify-center">
              <Sprout className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-slate-800 dark:text-white tracking-tight block leading-tight">AAROH</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Agritech for India</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Link href="#" className="hover:text-[#3F7F5A] dark:hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#3F7F5A] dark:hover:text-emerald-400 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[#3F7F5A] dark:hover:text-emerald-400 transition-colors">Contact</Link>
          </div>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500">© 2026 AAROH. Inspired by the soil.</p>
        </div>
      </footer>
    </div>
  );
}
