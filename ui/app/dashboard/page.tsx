"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, CloudSun, Sprout, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/api/settingsApi";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDashboard } from "@/hooks/useDashboard";
import { useAiInsights } from "@/hooks/useAiInsights";
import { Skeleton } from "@/components/ui/skeleton";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const dashboard = useDashboard();
  const aiInsights = useAiInsights();

  const userName = settings?.user?.name ? settings.user.name.split(" ")[0] : "Farmer";

  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setSecondsSinceUpdate((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (dashboard.data) setSecondsSinceUpdate(0);
  }, [dashboard.data]);

  const metrics = dashboard.data?.metrics;
  const cropHealthText =
    metrics?.crop_health_pct == null ? t("common.no_data_available") : `${Math.round(metrics.crop_health_pct)}%`;
  const soilMoistureText =
    metrics?.soil_moisture_pct == null ? t("common.no_data_available") : `${Math.round(metrics.soil_moisture_pct)}%`;
  const activeAlerts = metrics?.active_alerts ?? 0;
  const nextRainText = metrics?.next_rain?.day ? metrics.next_rain.day : t("common.no_data_available");
  const rainProbText =
    metrics?.next_rain?.probability_pct == null ? t("common.no_data_available") : `${Math.round(metrics.next_rain.probability_pct)}%`;

  const perf = dashboard.data?.performance_30d || [];
  const perfChartData = useMemo(() => {
    return perf.map((p) => ({
      date: p.date.slice(5),
      crop: p.crop_health_pct ?? null,
      soil: p.soil_moisture_pct ?? null,
    }));
  }, [perf]);

  const openNotifications = () => {
    window.dispatchEvent(new Event("aaroh:openNotifications"));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <PageHeader
          badgeIcon={Sprout}
          badgeText={t("dashboard.badge_farm_analytics")}
          badgeVariant="primary"
          title={t("dashboard.title_farm_overview")}
          description={t("dashboard.desc_farm_overview", { name: userName })}
        />
        <Link href="/dashboard/pest-detection">
          <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300 rounded-xl px-6">
            <Bug className="mr-2 h-4 w-4" /> {t("dashboard.scan_for_pests")}
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-500/30" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span>
            {t("common.last_updated")} {secondsSinceUpdate}s {t("common.ago")}
          </span>
        </div>
        {dashboard.isFetching ? (
          <span className="text-xs text-muted-foreground">{t("common.updating")}…</span>
        ) : (
          <span className="text-xs text-muted-foreground">{t("common.live")}</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Crop Health", value: cropHealthText, desc: t("dashboard.from_latest_detections"), icon: Sprout, color: "text-green-500", href: "/dashboard/crop-health" },
          { title: "Soil Moisture", value: soilMoistureText, desc: t("dashboard.live_sensor_data"), icon: Activity, color: "text-blue-500", href: "/dashboard/sensors" },
          { title: "Active Alerts", value: activeAlerts.toString(), desc: t("dashboard.unread_notifications"), icon: AlertTriangle, color: "text-orange-500", onClick: openNotifications },
          { title: "Next Rain", value: nextRainText, desc: `${rainProbText} ${t("dashboard.probability")}`, icon: CloudSun, color: "text-cyan-500", href: "/dashboard/weather" },
        ].map((metric, i) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card
              className="h-full glass-card border-white/40 dark:border-white/10 relative overflow-hidden group hover:scale-[1.01] transition-transform cursor-pointer"
              onClick={() => {
                if (metric.onClick) return metric.onClick();
                if (metric.href) router.push(metric.href);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-sm font-semibold font-sans text-muted-foreground">{metric.title}</CardTitle>
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${metric.color.replace("text-", "bg-").replace("-500", "-500/10")} ${metric.color}`}
                >
                  <metric.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {dashboard.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold font-serif bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                      {metric.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium bg-muted/50 dark:bg-muted/30 px-2 py-0.5 rounded-md inline-block border border-black/5 dark:border-white/5">
                      {metric.desc}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 glass-card hover-lift border-white/40 dark:border-white/10">
          <CardHeader>
             <CardTitle className="font-serif">Farm Performance (30 Days)</CardTitle>
             <CardDescription>NDVI health score and soil moisture trends.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] border-t border-black/5 dark:border-white/5 bg-gradient-to-b from-transparent to-muted/20">
            {dashboard.isLoading ? (
              <div className="h-full w-full p-4">
                <Skeleton className="h-full w-full" />
              </div>
            ) : perfChartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                {t("common.no_data_available")}
              </div>
            ) : (
              <div className="h-full w-full px-3 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfChartData} margin={{ top: 10, right: 12, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="cropGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(15, 23, 42, 0.08)",
                        borderRadius: 12,
                      }}
                      labelStyle={{ fontWeight: 700 }}
                      formatter={(value: any, name: any) => {
                        const v = value == null ? t("common.no_data_available") : `${Math.round(value)}%`;
                        const label = name === "soil" ? "Soil Moisture" : "Crop Health";
                        return [v, label];
                      }}
                    />
                    <Area type="monotone" dataKey="soil" stroke="var(--color-primary)" strokeWidth={2} fill="url(#soilGrad)" isAnimationActive />
                    <Area type="monotone" dataKey="crop" stroke="#22c55e" strokeWidth={2} fill="url(#cropGrad)" isAnimationActive />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 glass-card hover-lift border-white/40 dark:border-white/10 flex flex-col">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Sprout className="h-5 w-5 text-[var(--color-primary)]" /> Recent AI Insights
            </CardTitle>
            <CardDescription>Latest advisory generated for your fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {aiInsights.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (aiInsights.data || []).length === 0 ? (
              <div className="bg-muted/40 border border-border/50 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground font-bold mb-2">
                  <Sprout className="h-4 w-4" />
                  {t("common.no_data_available")}
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.ai_insights_unavailable")}
                </p>
              </div>
            ) : (
              (aiInsights.data || []).slice(0, 3).map((ins) => (
                <div
                  key={ins.id}
                  className={
                    ins.level === "alert"
                      ? "bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 shadow-sm"
                      : ins.level === "warning"
                      ? "bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 shadow-sm"
                      : "bg-gradient-farm border border-[var(--color-primary)]/20 rounded-xl p-4 shadow-sm"
                  }
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="text-sm font-bold">{ins.title}</div>
                    {ins.source ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground font-semibold">
                        {ins.source}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed">{ins.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
