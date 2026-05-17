"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

export default function CTASection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("aaroh_token");
    if (token && token !== "undefined" && token !== "null" && token.trim().length > 0) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <section className="py-32 px-6 relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none -z-10 flex justify-center">
        <div className="w-[900px] h-[500px] bg-gradient-to-t from-orange-50/50 via-emerald-50/20 to-transparent rounded-full blur-3xl opacity-60 translate-y-[40%]" />
      </div>

      <div
        className="absolute inset-0 -z-10 pointer-events-none opacity-[0.012]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <AnimatedSection>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
            Ready to protect <br className="hidden sm:block" />
            your fields?
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-xl mx-auto leading-relaxed">
            Start scanning your crops today — it&apos;s free, instant, and built for Indian agriculture.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={isLoggedIn ? "/dashboard/pest-detection" : "/signup"}>
              <button
                className="h-14 text-white px-10 rounded-full font-bold text-base flex items-center gap-2 group border-none transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #3F7F5A, #22c55e)",
                  boxShadow: "0 8px 28px rgba(63,127,90,0.30), 0 2px 8px rgba(63,127,90,0.18)",
                }}
                id="cta-join-btn"
              >
                {isLoggedIn ? "Go to Scanner" : "Join AAROH — It's Free"}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href={isLoggedIn ? "/dashboard" : "/login"}>
              <button
                className="h-14 bg-white/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 px-10 rounded-full font-bold text-base transition-all hover:-translate-y-1 cursor-pointer"
                id="cta-explore-btn"
              >
                {isLoggedIn ? "Open Dashboard" : "Explore First"}
              </button>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
