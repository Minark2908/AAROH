"use client";

import { motion } from "framer-motion";
import { Brain, Eye, Layers, Globe, Database, Zap } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const TECH = [
  {
    icon: Eye,
    title: "Computer Vision",
    desc: "Deep learning models trained on thousands of crop disease images for accurate visual diagnosis.",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  {
    icon: Brain,
    title: "Large Language Models",
    desc: "AI-powered conversational advisor that understands agriculture context and provides tailored guidance.",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-500/10",
  },
  {
    icon: Layers,
    title: "Multi-Model Pipeline",
    desc: "Ensemble approach combining classification, segmentation, and risk scoring for robust predictions.",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
  },
  {
    icon: Globe,
    title: "Weather API Integration",
    desc: "Real-time weather data fetched for your location to factor environmental conditions into risk assessment.",
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-500/10",
  },
  {
    icon: Database,
    title: "Secure Data Layer",
    desc: "Role-based access control, encrypted storage, and audit trails to keep your farm data private and safe.",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-500/10",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    desc: "Optimized inference pipeline delivers detection results in seconds, not minutes — even on mobile connections.",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-500/10",
  },
];

const techVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function TechShowcase() {
  return (
    <section id="technology" className="py-28 px-6 relative bg-white dark:bg-zinc-950 scroll-mt-20">
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none -z-10 blur-[150px]"
        style={{ background: "radial-gradient(circle, rgba(63,127,90,0.08) 0%, transparent 70%)" }}
      />

      <div className="container mx-auto max-w-6xl">
        <AnimatedSection className="text-center mb-20">
          <span className="text-violet-600 dark:text-violet-400 font-bold tracking-wider uppercase text-sm mb-3 block">
            Under the Hood
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-5 tracking-tight">
            Technology that powers AAROH
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Built on modern AI infrastructure — from computer vision to conversational AI — engineered for reliability and speed.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TECH.map(({ icon: Icon, title, desc, color, bgColor }, i) => (
            <motion.div
              key={title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={techVariants}
              className="group relative p-7 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-white/[0.06] hover:border-slate-200 dark:hover:border-white/10 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center mb-5 ${color} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
