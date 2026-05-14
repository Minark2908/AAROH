"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun, CloudRain, Wind, Droplets, ThermometerSun, Info, Sprout, MapPin, RefreshCw, AlertCircle, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { motion } from "framer-motion";
import { useWeather } from "@/hooks/useWeather";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/hooks/useFarm";
import { useLanguage } from "@/i18n/LanguageProvider";

// Helper to map string to lucide icons
const iconMap: Record<string, LucideIcon> = {
  CloudSun,
  CloudRain,
  ThermometerSun,
  Wind,
  Droplets
};

export default function WeatherPage() {
  const { t } = useLanguage();
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);
  const [locationName, setLocationName] = useState("Rajkot, Gujarat (Default)");
  const [isLocating, setIsLocating] = useState(true);
  const { data: farm } = useFarm();

  useEffect(() => {
    // Prefer saved farm coordinates (from Settings) if available.
    if (farm?.lat != null && farm?.lon != null && lat === undefined && lon === undefined) {
      setLat(Number(farm.lat));
      setLon(Number(farm.lon));
      if (farm.location) setLocationName(String(farm.location));
      setIsLocating(false);
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLon(position.coords.longitude);
          setLocationName("Your Current Location");
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation denied or failed, using default location.");
          // Default to Rajkot
          setLat(22.3039);
          setLon(70.8022);
          setIsLocating(false);
        }
      );
    } else {
      setLat(22.3039);
      setLon(70.8022);
      setIsLocating(false);
    }
  }, [farm, lat, lon]);

  const { data, isLoading, error, refetch, isRefetching } = useWeather(lat, lon);
  
  // Wait until we have decided on coordinates before resolving the weather call visually
  const loading = isLoading || isLocating;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-red-500 font-medium text-lg mb-2">Unavailable</p>
        <p className="text-muted-foreground mb-4">Weather intelligence failed to load. The meteorological service might be down.</p>
        <Button onClick={() => refetch()} variant="outline">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          badgeIcon={CloudSun}
          badgeText={t("weather.badge_weather_intelligence", undefined, "Meteorological Insights")}
          badgeVariant="accent"
          title={t("weather.title", undefined, "Weather Intelligence")}
          description={t("weather.desc", undefined, "Hyper-local forecasting tailored for your precise field coordinates.")}
        />
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => refetch()} 
            disabled={loading || isRefetching}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {t("common.refresh", undefined, "Refresh")}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 overflow-hidden glass-card hover-lift border-none shadow-soft relative rounded-2xl">
           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <CloudSun className="h-64 w-64 text-muted-foreground" />
           </div>
           <CardContent className="p-8 relative z-10 w-full">
             {loading ? (
                <div className="space-y-6 w-full">
                  <div className="flex justify-between items-end">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-48" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-24 w-24 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border/50">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="space-y-2">
                         <Skeleton className="h-4 w-16" />
                         <Skeleton className="h-6 w-12" />
                      </div>
                    ))}
                  </div>
                </div>
             ) : (
               <>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                 <div>
                   <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-widest mb-2 flex items-center gap-1.5 border-b border-primary/20 pb-1 max-w-fit">
                      <MapPin className="h-4 w-4" /> Current Location
                   </p>
                   <h2 className="text-4xl font-serif font-bold mb-1">{locationName}</h2>
                   <p className="text-muted-foreground">Updated practically real-time</p>
                 </div>
                 <div className="flex items-center gap-4">
                   <CloudSun className="h-20 w-20 text-[var(--color-accent)] animate-pulse" />
                   <span className="text-7xl font-light font-sans tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-soil)]">
                     {data?.temperature}°
                   </span>
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Droplets className="h-4 w-4" /> Humidity</div>
                    <div className="text-xl font-semibold">{data?.humidity}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Wind className="h-4 w-4" /> Wind</div>
                    <div className="text-xl font-semibold">{data?.wind_speed || 12} km/h</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><CloudRain className="h-4 w-4" /> Rain Prob.</div>
                    <div className="text-xl font-semibold">{data?.rain_probability}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><ThermometerSun className="h-4 w-4" /> Coordinates</div>
                    <div className="text-sm font-mono mt-1 text-muted-foreground">{lat?.toFixed(2)}°, {lon?.toFixed(2)}°</div>
                  </div>
               </div>
               </>
             )}
           </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-none shadow-soft rounded-2xl flex flex-col">
          <CardHeader className="pb-3 border-b border-border bg-muted/30 rounded-t-2xl">
             <CardTitle className="text-base font-bold font-serif text-primary flex items-center gap-2">
               <Sprout className="h-4 w-4" /> Smart Advisory
             </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 flex-1 flex flex-col justify-center">
            {loading ? (
               <div className="space-y-4">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-5/6" />
                 <Skeleton className="h-4 w-4/6" />
                 <Skeleton className="h-20 w-full mt-4 rounded-xl" />
               </div>
            ) : (
              <div className="space-y-5 flex flex-col h-full">
                 <p className="text-sm leading-relaxed font-medium text-foreground/90">
                   Based on {data?.advisory?.reason || `current soil moisture (${data?.advisory?.soil_moisture}%)`}, <strong className="font-bold border-b border-[var(--primary)] border-dashed text-[var(--primary)] uppercase text-[13px]">{data?.advisory?.recommendation || 'irrigation is optionally recommended'}</strong> for the next 48 hours.
                 </p>
                 
                 {data?.advisory?.savings && data.advisory.savings !== "0" && (
                 <div className="bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-[var(--primary)]/10 shadow-sm mt-auto">
                   <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center shrink-0">
                        <Info className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-foreground/80 font-medium leading-relaxed pt-0.5">
                        Holding off irrigation will save approximately <strong>{data.advisory.savings} liters</strong> of water and prevent surface runoff.
                      </p>
                   </div>
                 </div>
                 )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card hover-lift border-none shadow-soft">
        <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-[14px]">
          <CardTitle className="font-serif">7-Day Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl glass-card border border-transparent">
                  <Skeleton className="h-4 w-12 mb-3" />
                  <Skeleton className="h-8 w-8 mb-3 rounded-full" />
                  <Skeleton className="h-6 w-10 mb-2" />
                  <Skeleton className="h-4 w-14" />
                </div>
              ))
            ) : (
              data?.forecast_graph?.map((day: { day: string; temp: string; rain: string; icon?: string }, i: number) => {
                const IconComponent = (day.icon ? iconMap[day.icon] : undefined) || CloudSun;
                return (
                  <motion.div 
                    key={day.day + i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl glass-card border border-transparent hover:border-[var(--color-primary)]/20 shadow-none hover:shadow-soft transition-all hover:-translate-y-0.5"
                  >
                    <span className="text-sm font-medium mb-3">{day.day}</span>
                    <IconComponent className={`h-8 w-8 mb-3 ${i === 1 || i === 2 ? 'text-blue-500' : 'text-orange-500'}`} />
                    <span className="text-xl font-bold mb-1">{day.temp}</span>
                    <span className="text-xs font-medium text-blue-500 bg-blue-500/10 px-1.5 rounded flex items-center gap-1 w-max">
                      <Droplets className="h-3 w-3" /> {day.rain}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
