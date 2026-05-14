"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Droplets, Thermometer, Battery, Signal, ArrowDownRight, ArrowUpRight, Sprout, AlertTriangle, CheckCircle2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useIoTData } from "@/hooks/useIoTData";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function SensorsPage() {
  const { t } = useLanguage();
  const [sensorId, setSensorId] = useState<string | undefined>(undefined);
  const { data, isLoading } = useIoTData(sensorId);
  const hasData = !!data && !isLoading;

  const sensors = data?.sensors?.length ? data.sensors : [];
  const selectedSensorId = data?.sensor_id ?? sensorId ?? sensors[0];

  const lastUpdatedLabel = (() => {
    if (!data?.timestamp) return "—";
    const dt = new Date(data.timestamp);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleString();
  })();

  const history = data?.history ?? [];
  const prev = history.length >= 2 ? history[history.length - 2] : undefined;
  const deltas = {
    soil: prev ? data!.soil_moisture - prev.soil_moisture : 0,
    temp: prev ? data!.temperature - prev.temperature : 0,
    humidity: prev ? data!.humidity - prev.humidity : 0,
    light: prev ? data!.light_intensity - prev.light_intensity : 0,
  };

  const chartData: Array<{ time: string; soil_moisture: number; temperature: number }> = history.map((h) => ({
    time: h.timestamp ? new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
    soil_moisture: h.soil_moisture,
    temperature: h.temperature,
  }));

  const statusDotClass =
    data?.status === "online"
      ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"
      : data?.status === "warning"
        ? "bg-yellow-500 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.55)]"
        : data?.status === "offline"
          ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.45)]"
          : "bg-muted-foreground";

  const summary = data?.summary;
  const overallText = summary
    ? `${summary.online} Online • ${summary.warning} Warning • ${summary.offline} Offline`
    : hasData
      ? "Live telemetry connected"
      : "No Sensors Detected";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          badgeIcon={Activity}
          badgeText={t("sensors.badge_hardware_telemetry")}
          badgeVariant="primary"
          title={t("sensors.title_monitor")}
          description={t("sensors.desc_monitor")}
        />
        <div className="flex items-center gap-2">
           <span className={`h-3 w-3 rounded-full ${hasData ? statusDotClass : 'bg-muted-foreground'}`}></span>
           <span className={`text-sm font-semibold ${hasData ? 'text-foreground' : 'text-muted-foreground'}`}>
             {overallText}
           </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mb-4"></div>
          <p className="font-medium text-muted-foreground">Connecting to IoT array...</p>
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-32 mt-8 text-center rounded-[2rem] border border-dashed border-border/80 bg-muted/10 relative overflow-hidden shadow-[var(--shadow-soft)]">
          <div className="absolute inset-0 bg-contour-pattern opacity-[0.02] pointer-events-none"></div>
          <div className="absolute inset-0 bg-sunrise-glow opacity-30 pointer-events-none"></div>
          <div className="h-24 w-24 mb-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center relative z-10 ring-[12px] ring-[var(--primary)]/5">
            <Sprout className="h-12 w-12 text-[var(--primary)] opacity-90" />
          </div>
          <h3 className="font-serif text-4xl font-bold mb-4 relative z-10 text-foreground tracking-tight">Your farm data will begin growing here.</h3>
          <p className="text-muted-foreground text-xl max-w-xl mx-auto mb-10 relative z-10 leading-relaxed">Hardware nodes are standing by. Connect your sensors to see real-time soil telemetry and rich field matrix data.</p>
          <Button size="lg" className="relative z-10 rounded-full px-10 py-6 text-lg shadow-[var(--shadow-soft)] transition-all hover:scale-105">Initialize Sensors</Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Sensor node</div>
              <Select value={selectedSensorId} onValueChange={(v) => setSensorId(v)}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select a sensor node" />
                </SelectTrigger>
                <SelectContent>
                  {(sensors.length ? sensors : [selectedSensorId]).map((sid) => (
                    <SelectItem key={sid} value={sid}>
                      {sid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Last updated: <span className="font-semibold text-foreground">{lastUpdatedLabel}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: "soil", title: "Soil Moisture", value: `${data!.soil_moisture.toFixed(1)}%`, icon: Droplets, color: "text-blue-500", bg: "bg-blue-50", delta: deltas.soil },
          { key: "temp", title: "Temperature", value: `${data!.temperature.toFixed(1)}°C`, icon: Thermometer, color: "text-orange-500", bg: "bg-orange-50", delta: deltas.temp },
          { key: "humidity", title: "Humidity", value: `${data!.humidity.toFixed(1)}%`, icon: Activity, color: "text-cyan-500", bg: "bg-cyan-50", delta: deltas.humidity },
          { key: "light", title: "Light Intensity", value: `${data!.light_intensity.toFixed(0)} lx`, icon: Signal, color: "text-purple-500", bg: "bg-purple-50", delta: deltas.light },
        ].map((sensor) => {
          const isUp = sensor.delta > 0.05;
          const isDown = sensor.delta < -0.05;
          const deltaLabel = isUp ? `+${sensor.delta.toFixed(1)}` : isDown ? sensor.delta.toFixed(1) : "0.0";
          const DeltaIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : ArrowUpRight;
          const deltaColor = isUp ? "text-green-500" : isDown ? "text-red-500" : "text-muted-foreground";

          const badge =
            data?.status === "offline"
              ? { text: "Offline", icon: WifiOff, className: "text-red-600 bg-red-50 dark:bg-muted/50 dark:border-white/5 dark:border" }
              : data?.status === "warning"
                ? { text: "Warning", icon: AlertTriangle, className: "text-yellow-700 bg-yellow-50 dark:bg-muted/50 dark:border-white/5 dark:border" }
                : { text: "Online", icon: CheckCircle2, className: "text-green-700 bg-green-50 dark:bg-muted/50 dark:border-white/5 dark:border" };
          const BadgeIcon = badge.icon;

          return (
          <Card key={sensor.title} className="glass-card border-none hover-lift relative overflow-hidden group shadow-soft">
            <CardContent className="p-6">
              <div className={`absolute top-0 right-0 p-4 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.08] dark:opacity-[0.05] dark:group-hover:opacity-[0.1] ${sensor.color}`}>
                <sensor.icon className="h-24 w-24 -mt-4 -mr-4" />
              </div>
              
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2 flex items-center justify-between">
                <span>{sensor.title}</span>
                <Battery className="h-4 w-4 text-green-500" />
              </p>
              
              <div className="flex items-end gap-3 mb-2 relative z-10">
                <span className="text-3xl font-bold font-sans">{sensor.value}</span>
                <span className={`text-sm font-medium flex items-center mb-1 ${deltaColor}`}>
                  <DeltaIcon className="h-3 w-3 mr-0.5" />
                  {deltaLabel}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${badge.className}`}>
                  <BadgeIcon className="h-3 w-3" />
                  {badge.text}
                </div>
                <span className="text-[10px] text-muted-foreground">{selectedSensorId}</span>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      <Card className="glass-card hover-lift border-none shadow-soft">
        <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-gradient-farm rounded-t-[14px]">
          <CardTitle className="font-serif">Historical Moisture & Temperature ({selectedSensorId})</CardTitle>
          <CardDescription className="font-medium">24 Hour sliding window telemetry.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#166534" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#78350f" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#78350f" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="soil_moisture" stroke="#166534" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" isAnimationActive />
              <Area yAxisId="right" type="monotone" dataKey="temperature" stroke="#78350f" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass-card hover-lift border-none shadow-soft">
          <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5">
            <CardTitle className="font-serif flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Active Alerts
            </CardTitle>
            <CardDescription className="font-medium">Threshold-based warnings from the last reading stream.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {!data?.alerts?.length ? (
              <div className="text-sm text-muted-foreground">No active alerts for this sensor.</div>
            ) : (
              data.alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/10 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{a.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.sensor_id} • {a.type} • {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${a.level === "critical" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
                    {a.level?.toUpperCase?.() ?? "WARNING"}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-none shadow-soft">
          <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5">
            <CardTitle className="font-serif flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              Smart Irrigation Trigger
            </CardTitle>
            <CardDescription className="font-medium">Automatic irrigation suggestion based on moisture threshold.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {data?.smart_irrigation?.should_irrigate ? (
              <div className="rounded-2xl border border-blue-200/60 bg-blue-50/50 p-4 dark:bg-muted/10 dark:border-white/5">
                <div className="text-sm font-semibold text-foreground">
                  Suggest irrigation ({data.smart_irrigation.urgency.toUpperCase()})
                </div>
                <div className="text-sm text-muted-foreground mt-1">{data.smart_irrigation.reason}</div>
                <div className="text-sm font-medium text-foreground mt-3">
                  Suggested volume: {data.smart_irrigation.suggested_volume_liters_per_acre} L/acre
                </div>
                {data.smart_irrigation.notes ? (
                  <div className="text-xs text-muted-foreground mt-1">{data.smart_irrigation.notes}</div>
                ) : null}
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="rounded-full">Acknowledge</Button>
                  <Button size="sm" variant="outline" className="rounded-full">Snooze</Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                <div className="text-sm font-semibold text-foreground">No irrigation needed right now.</div>
                <div className="text-sm text-muted-foreground mt-1">Soil moisture is above the configured threshold.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
