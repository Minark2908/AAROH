"use client";

import { useLanguage } from "@/i18n/LanguageProvider";
import { AlertCircle, Beaker, Leaf, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo } from "react";

interface StructuredResponseProps {
  content: string;
}

interface Section {
  type: "diagnosis" | "treatment" | "organic" | "precautions" | "general";
  title: string;
  items: string[];
}

export function StructuredResponse({ content }: StructuredResponseProps) {
  const { language } = useLanguage();

  const sections = useMemo(() => {
    // Use a more efficient parsing approach
    const headers = {
      en: {
        diagnosis: ["problem", "diagnosis", "issue", "condition"],
        treatment: ["treatment", "remedy", "recommendation", "action plan", "solution"],
        organic: ["organic solution", "organic", "natural", "biological"],
        precautions: ["precaution", "safety", "warning", "note"],
      },
      hi: {
        diagnosis: ["निदान", "समस्या", "स्थिति"],
        treatment: ["उपचार", "समाधान", "सिफारिश"],
        organic: ["जैविक", "प्राकृतिक"],
        precautions: ["सावधानी", "चेतावनी"],
      },
      gu: {
        diagnosis: ["નિદાન", "સમસ્યા"],
        treatment: ["સારવાર", "ઉપાય"],
        organic: ["જૈવિક", "કુદરતી"],
        precautions: ["સાવચેતી", "ચેતવણી"],
      },
    };

    const currentHeaders = headers[language as keyof typeof headers] || headers.en;

    const getSectionType = (line: string): Section["type"] | null => {
      const cleanLine = line.replace(/[#*•:-]/g, "").trim().toLowerCase();
      if (!cleanLine) return null;

      if (currentHeaders.diagnosis.some(h => cleanLine === h || cleanLine.startsWith(h))) return "diagnosis";
      if (currentHeaders.treatment.some(h => cleanLine === h || cleanLine.startsWith(h))) return "treatment";
      if (currentHeaders.organic.some(h => cleanLine === h || cleanLine.startsWith(h))) return "organic";
      if (currentHeaders.precautions.some(h => cleanLine === h || cleanLine.startsWith(h))) return "precautions";
      return null;
    };

    const lines = content.split("\n");
    const result: Section[] = [];
    let currentSection: Section | null = null;
    const headerPattern = /^[#*•:-]+\s*/;

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

      const type = getSectionType(line);
      const isListItem = /^[*-•\d.]+\s+/.test(line);
      // Faster check for header markers
      const isHeaderMarker = line.length > 4 && (line.startsWith("#") || (line.startsWith("**") && line.endsWith("**")));

      if (type) {
        if (currentSection) result.push(currentSection);
        currentSection = {
          type,
          title: line.replace(/[#*:]/g, "").trim(),
          items: [],
        };
      } else if (isHeaderMarker && !isListItem) {
        if (currentSection) result.push(currentSection);
        currentSection = {
          type: "general",
          title: line.replace(/[#*:]/g, "").trim(),
          items: [],
        };
      } else if (currentSection) {
        currentSection.items.push(line.replace(headerPattern, ""));
      } else {
        currentSection = { type: "general", title: "", items: [line] };
      }
    });

    if (currentSection) result.push(currentSection);
    return result;
  }, [content, language]);

  const getIcon = (type: Section["type"]) => {
    switch (type) {
      case "diagnosis": return <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "treatment": return <Beaker className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "organic": return <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "precautions": return <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default: return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  const getStyle = (type: Section["type"]) => {
    switch (type) {
      case "diagnosis": return "bg-amber-500/[0.08] border-amber-500/20";
      case "treatment": return "bg-blue-500/[0.08] border-blue-500/20";
      case "organic": return "bg-green-500/[0.08] border-green-500/20";
      case "precautions": return "bg-red-500/[0.08] border-red-500/20";
      default: return "bg-primary/[0.08] border-primary/20";
    }
  };

  // Improved fallback condition
  if (sections.length === 0 || (sections.length === 1 && sections[0].type === "general" && !sections[0].title && sections[0].items.length < 2)) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => (
        <div key={idx} className={`rounded-xl border px-5 py-4 space-y-3 transition-all duration-300 hover:shadow-md ${getStyle(section.type)}`}>
          {section.title && (
            <div className="flex items-center gap-2.5 font-black text-[12px] uppercase tracking-widest text-foreground/70">
              {getIcon(section.type)}
              {section.title}
            </div>
          )}
          <div className="space-y-2">
            {section.items.map((item, i) => (
              <div key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/90 font-medium">
                {section.items.length > 1 && <div className="h-1.5 w-1.5 rounded-full bg-current/30 mt-2 shrink-0" />}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
