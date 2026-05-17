"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const FAQS = [
  {
    q: "What crops and diseases does AAROH support?",
    a: "AAROH's AI model is trained on a wide range of common Indian crops including tomato, potato, rice, wheat, and more. It can identify dozens of diseases and pest conditions. We're continuously expanding our training data to cover more crops and regional disease patterns.",
  },
  {
    q: "How accurate is the pest detection?",
    a: "Our deep learning model provides a confidence score with every detection. Accuracy varies by crop and disease type, and we always show you the confidence level so you can make informed decisions. The model is regularly retrained to improve performance.",
  },
  {
    q: "Do I need internet to use AAROH?",
    a: "You need an internet connection to upload images for analysis and to use the AI advisor. The platform is optimized for Indian mobile networks and works well even on slower connections. Once results are generated, you can download reports for offline reference.",
  },
  {
    q: "Is my farm data secure?",
    a: "Yes. AAROH uses role-based access control, encrypted data storage, and secure API communication. Your detection history and farm data are private to your account and are never shared with third parties.",
  },
  {
    q: "Is AAROH free to use?",
    a: "Yes, AAROH is currently free to use. You can sign up, scan crops, use the AI advisor, and generate reports at no cost. Our goal is to make agricultural AI accessible to every Indian farmer.",
  },
  {
    q: "How is AAROH different from other agricultural apps?",
    a: "AAROH combines computer vision-based pest detection with a conversational AI advisor, integrated weather data, and comprehensive reporting — all in one platform specifically designed for Indian agriculture and Indian crop varieties.",
  },
];

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-slate-100 dark:border-white/[0.06] rounded-2xl overflow-hidden transition-colors hover:border-slate-200 dark:hover:border-white/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left cursor-pointer group"
        id={`faq-toggle-${q.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
      >
        <span className="font-semibold text-slate-800 dark:text-white text-base pr-4 group-hover:text-[#3F7F5A] dark:group-hover:text-emerald-400 transition-colors">
          {q}
        </span>
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? "bg-[#3F7F5A] text-white rotate-0" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400"}`}>
          {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28 px-6 relative bg-white dark:bg-zinc-950 scroll-mt-20">
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

      <div className="container mx-auto max-w-3xl">
        <AnimatedSection className="text-center mb-16">
          <span className="text-orange-600 dark:text-orange-500 font-bold tracking-wider uppercase text-sm mb-3 block">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            Common questions
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                q={faq.q}
                a={faq.a}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
