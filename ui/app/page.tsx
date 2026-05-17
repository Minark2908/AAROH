"use client";

import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import TechShowcase from "@/components/landing/TechShowcase";
import WhyAaroh from "@/components/landing/WhyAaroh";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Navbar />

      <main>
        <HeroSection />
        <FeaturesGrid />
        <HowItWorks />
        <TechShowcase />
        <WhyAaroh />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
