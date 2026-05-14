"use client";

import { useFarm } from "@/hooks/useFarm";
import { useIoTData } from "@/hooks/useIoTData";
import { Sprout, MapPin, Thermometer, Droplets, Activity, Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export function ContextBar() {
  const { data: farm } = useFarm();
  const { data: iot } = useIoTData();
  const { language } = useLanguage();

  if (!farm && !iot) return null;

  const label = language === "hi" ? "AI इस संदर्भ का उपयोग कर रहा है" : language === "gu" ? "AI આ સંદર્ભનો ઉપયોગ કરી રહ્યું છે" : "AI is using this context";

  return (
    <div className="px-6 py-2 bg-muted/30 backdrop-blur-md border-b border-border/50 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-semibold animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-2 text-muted-foreground/60 mr-2 border-r border-border/50 pr-4">
        <Info className="h-3 w-3" />
        <span className="uppercase tracking-tight">{label}</span>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground">
        {farm?.crops && farm.crops.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sprout className="h-3 w-3" />
            <span>{farm.crops[0]}</span>
          </div>
        )}
        {farm?.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            <span>{farm.location}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 ml-auto text-muted-foreground">
        {iot && (
          <>
            <div className="flex items-center gap-1.5" title="Temperature">
              <Thermometer className="h-3 w-3 text-orange-500" />
              <span>{iot.temperature}°C</span>
            </div>
            <div className="flex items-center gap-1.5" title="Humidity">
              <Droplets className="h-3 w-3 text-blue-500" />
              <span>{iot.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5" title="Soil Moisture">
              <Activity className="h-3 w-3 text-green-500" />
              <span>{iot.soil_moisture}% Moisture</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
