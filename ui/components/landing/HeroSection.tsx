"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ScanSearch,
  Droplets,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("aaroh_token");
    if (token && token !== "undefined" && token !== "null" && token.trim().length > 0) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <section className="relative pt-36 pb-28 md:pt-48 md:pb-36 px-6 overflow-hidden">
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
        style={{ background: "rgba(249,115,22,0.14)" }}
      />
      <div
        className="absolute bottom-[5%] left-[-8%] -z-20 w-[480px] h-[480px] rounded-full pointer-events-none blur-[100px]"
        style={{ background: "rgba(63,127,90,0.12)" }}
      />

      <div
        className="absolute inset-0 -z-10 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/80 dark:bg-[#3F7F5A]/10 border border-[#3F7F5A]/20 dark:border-[#3F7F5A]/30 text-[#3F7F5A] dark:text-emerald-400 text-xs font-semibold mb-5 tracking-[0.06em] shadow-sm">
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

            <h1 className="font-sans text-5xl sm:text-[3.5rem] lg:text-[4rem] font-extrabold leading-[1.08] mb-6 tracking-tight text-slate-800 dark:text-white">
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

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-4 max-w-lg leading-relaxed">
              AI-powered pest detection, real-time insights, and intelligent
              crop protection — built for modern Indian agriculture.
            </p>

            <p className="text-sm italic text-slate-400 dark:text-slate-500 mb-10 font-medium tracking-wide">
              &ldquo;Built for the hands that feed the nation.&rdquo;
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <Link href={isLoggedIn ? "/dashboard/pest-detection" : "/login"} className="w-full sm:w-auto">
                <button
                  className="w-full h-14 text-white px-8 rounded-full font-semibold text-base flex items-center justify-center gap-2 group border-none transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg,#F97316 0%,#F59E0B 100%)",
                    boxShadow: "0 8px 24px rgba(249,115,22,0.32),0 2px 6px rgba(249,115,22,0.20)",
                  }}
                  id="hero-scan-btn"
                >
                  Start Scanning Crops
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </button>
              </Link>
              <Link href={isLoggedIn ? "/dashboard" : "/login"} className="w-full sm:w-auto">
                <button className="w-full h-14 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm border-2 border-[#3F7F5A]/30 dark:border-[#3F7F5A]/60 text-[#3F7F5A] dark:text-emerald-400 px-8 rounded-full font-semibold text-base transition-all duration-300 hover:-translate-y-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-[#3F7F5A]/60 hover:shadow-xl hover:shadow-emerald-500/20 cursor-pointer" id="hero-dashboard-btn">
                  Explore Dashboard
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Instant results</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative w-full lg:h-[560px] h-[400px]"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.95, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="absolute inset-[8%] -z-10 rounded-[2.5rem] blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse at center,rgba(249,115,22,0.28) 0%,rgba(63,127,90,0.22) 55%,transparent 80%)",
                opacity: 0.55,
              }}
            />

            <div
              className="absolute inset-0 rounded-[2.5rem] overflow-hidden"
              style={{
                border: "1.5px solid rgba(255,255,255,0.40)",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,0.17),0 8px 24px rgba(63,127,90,0.13),inset 0 1.5px 0 rgba(255,255,255,0.60)",
                transform: "perspective(1200px) rotateY(-4deg) rotateX(1.5deg)",
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

              <div className="absolute bottom-5 left-5 right-5 rounded-2xl p-4 flex items-center gap-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-[18px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.13)]">
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

            <motion.div
              className="absolute top-[6%] right-[-3%] w-44 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-md rounded-xl p-3.5 shadow-xl border border-slate-100 dark:border-white/10 z-10"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
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
            </motion.div>

            <motion.div
              className="absolute bottom-[24%] left-[-4%] w-48 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-md rounded-xl p-3.5 shadow-xl border border-slate-100 dark:border-white/10 z-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
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
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
