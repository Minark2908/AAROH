"use client";

import { Leaf, ScanSearch, Activity, CheckCircle2 } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const BENEFITS = [
  {
    icon: Leaf,
    iconColor: "text-[#3F7F5A] dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    title: "Protect crops early",
    desc: "Identify issues before they spread across your field, saving yield and reducing overall crop damage.",
  },
  {
    icon: ScanSearch,
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-50 dark:bg-orange-500/10",
    title: "Reduce chemical usage",
    desc: "Apply targeted treatments instead of blanket spraying — save money and protect your soil health.",
  },
  {
    icon: Activity,
    iconColor: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-50 dark:bg-sky-500/10",
    title: "Make data-driven decisions",
    desc: "Leverage AI-powered intelligence on your mobile device to make informed farming decisions.",
  },
  {
    icon: CheckCircle2,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-500/10",
    title: "Build a safer yield",
    desc: "Stay aware of regional pest patterns and take preventive action to ensure a healthier harvest.",
  },
];

export default function WhyAaroh() {
  return (
    <section className="py-28 px-6 bg-background relative">
      <div className="container mx-auto max-w-5xl text-center relative z-10">
        <AnimatedSection>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-5 tracking-tight">
            Why farm with AAROH?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-16 leading-relaxed">
            Purpose-built for Indian agriculture — designed to be simple, fast, and genuinely useful in the field.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-5 text-left">
          {BENEFITS.map(({ icon: Icon, iconColor, iconBg, title, desc }, i) => (
            <AnimatedSection key={title} delay={i * 0.1}>
              <div className="flex items-start gap-4 bg-white dark:bg-zinc-900/50 p-7 rounded-2xl border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`shrink-0 mt-0.5 w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-lg">{title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
