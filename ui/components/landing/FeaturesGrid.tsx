"use client";

import { motion } from "framer-motion";
import {
  ScanSearch,
  Activity,
  CloudSun,
  Cpu,
  Bot,
  FileBarChart,
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const FEATURES = [
  {
    icon: ScanSearch,
    label: "AI Pest Detection",
    desc: "Upload a photo of your crop and get instant disease identification powered by deep learning computer vision models.",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    iconColor: "text-[#3F7F5A] dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100/50 dark:border-emerald-500/20",
    span: "md:col-span-2",
  },
  {
    icon: Activity,
    label: "Risk Intelligence",
    desc: "Predictive risk scoring that analyzes environmental and crop conditions to anticipate pest threats before they strike.",
    gradient: "from-orange-500/10 to-amber-500/5",
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-50 dark:bg-orange-500/10 border-orange-100/50 dark:border-orange-500/20",
    span: "",
  },
  {
    icon: Bot,
    label: "AI Crop Advisor",
    desc: "Chat with an agricultural AI assistant that provides tailored treatment plans and organic alternatives for your specific crops.",
    gradient: "from-violet-500/10 to-purple-500/5",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-50 dark:bg-violet-500/10 border-violet-100/50 dark:border-violet-500/20",
    span: "",
  },
  {
    icon: CloudSun,
    label: "Local Weather Integration",
    desc: "Hyper-local weather data to optimize your spraying and irrigation schedules around actual field conditions.",
    gradient: "from-sky-500/10 to-blue-500/5",
    iconColor: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-50 dark:bg-sky-500/10 border-sky-100/50 dark:border-sky-500/20",
    span: "",
  },
  {
    icon: FileBarChart,
    label: "Detection Reports",
    desc: "Generate comprehensive PDF reports of every detection with treatment recommendations — perfect for record-keeping and advisory.",
    gradient: "from-amber-500/10 to-yellow-500/5",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-500/10 border-amber-100/50 dark:border-amber-500/20",
    span: "",
  },
  {
    icon: Cpu,
    label: "Smart Dashboard",
    desc: "A unified control center with detection history, regional pest maps, weather overlays, and actionable analytics — all in one place.",
    gradient: "from-indigo-500/10 to-blue-500/5",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100/50 dark:border-indigo-500/20",
    span: "md:col-span-2",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-28 px-6 relative bg-white dark:bg-zinc-950 scroll-mt-20">
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

      <div className="container mx-auto max-w-7xl">
        <AnimatedSection className="text-center mb-20">
          <span className="text-[#3F7F5A] dark:text-emerald-400 font-bold tracking-wider uppercase text-sm mb-3 block">
            Platform Capabilities
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-5 tracking-tight">
            Intelligence for every acre
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to detect, diagnose, and protect your crops — powered by AI and designed for Indian agriculture.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, label, desc, gradient, iconColor, iconBg, span }, i) => (
            <motion.div
              key={label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={cardVariants}
              className={`group relative p-8 rounded-3xl bg-gradient-to-br ${gradient} border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-black/40 transition-all duration-400 hover:-translate-y-1.5 overflow-hidden ${span}`}
            >
              <div className="absolute top-0 right-0 p-5 opacity-[0.04] group-hover:opacity-[0.10] transition-opacity duration-500">
                <Icon className="h-28 w-28" />
              </div>

              <div className={`w-14 h-14 rounded-2xl ${iconBg} border flex items-center justify-center mb-6 ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-7 w-7" />
              </div>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 relative z-10">
                {label}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed relative z-10">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
