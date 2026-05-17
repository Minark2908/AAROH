"use client";

import { motion } from "framer-motion";
import { Upload, Bot, ShieldCheck } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const STEPS = [
  {
    icon: Upload,
    num: "1",
    color: "text-[#3F7F5A] dark:text-emerald-400",
    bg: "bg-white dark:bg-zinc-900",
    numBg: "bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700",
    title: "Upload crop image",
    desc: "Snap a photo of the affected plant area directly from your phone or upload from your gallery.",
  },
  {
    icon: Bot,
    num: "2",
    color: "text-orange-500 dark:text-orange-400",
    bg: "bg-white dark:bg-zinc-900",
    numBg: "bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 border-slate-200 dark:border-zinc-700",
    title: "AI analyzes the image",
    desc: "Our deep learning model processes the image and identifies the disease with a confidence score.",
  },
  {
    icon: ShieldCheck,
    num: "3",
    color: "text-white",
    bg: "bg-[#3F7F5A] dark:bg-emerald-600",
    numBg: "bg-orange-500 text-white border-white dark:border-zinc-950",
    title: "Get treatment advisory",
    desc: "Receive organic and chemical treatment options tailored to the identified condition and your crop type.",
  },
];

const stepVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.15 + i * 0.2,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 bg-background relative scroll-mt-20">
      <div className="container mx-auto max-w-6xl">
        <AnimatedSection className="text-center mb-20">
          <span className="text-orange-600 dark:text-orange-500 font-bold tracking-wider uppercase text-sm mb-3 block">
            Simple Workflow
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            Actionable insights in three steps
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-12 md:gap-6 relative">
          <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-emerald-200 via-orange-200 to-emerald-200 dark:from-emerald-900/50 dark:via-orange-900/50 dark:to-emerald-900/50 z-0" />

          {STEPS.map(({ icon: Icon, num, color, bg, numBg, title, desc }, i) => (
            <motion.div
              key={num}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={stepVariants}
              className="flex flex-col items-center text-center relative z-10"
            >
              <div
                className={`w-24 h-24 rounded-3xl ${bg} shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-white/10 flex items-center justify-center mb-8 ${color} relative hover:-translate-y-2 transition-transform duration-300`}
              >
                <Icon className="h-10 w-10" />
                <div
                  className={`absolute -top-4 -right-4 w-9 h-9 ${numBg} border-2 rounded-full flex items-center justify-center text-sm font-bold shadow-sm`}
                >
                  {num}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-[260px] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
