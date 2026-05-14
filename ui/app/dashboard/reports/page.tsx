"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Eye, FileText, Filter, PieChart as PieIcon, Sprout, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { usePredictionHistory } from "@/hooks/usePredictionHistory";
import { useDetections } from "@/hooks/useDetections";
import { useIoTData } from "@/hooks/useIoTData";
import { useWeather } from "@/hooks/useWeather";
import { useReports } from "@/hooks/useReports";
import { exportReport } from "@/api/reportsApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let u = 0;
  while (size >= 1024 && u < units.length - 1) {
    size /= 1024;
    u += 1;
  }
  return `${size.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
}

export default function ReportsPage() {
  const { data, isLoading, error } = usePredictionHistory();
  const historyList = data?.history || [];

  // Live data sources for dynamic analytics
  const detectionsQ = useDetections();
  const iotQ = useIoTData();
  const weatherQ = useWeather();
  const reportsQ = useReports();
  const [downloading, setDownloading] = useState<Record<number, "csv" | "pdf" | null>>({});
  const [exportError, setExportError] = useState<string | null>(null);

  const downloadFile = async (reportId: number, format: "csv" | "pdf") => {
    setExportError(null);
    setDownloading((m) => ({ ...m, [reportId]: format }));
    try {
      const res = await exportReport(reportId, format);
      const blob = new Blob([res.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aaroh-report-${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const status =
        typeof e === "object" && e !== null && "response" in e
          ? // axios-style error
            // @ts-expect-error - runtime shape from axios
            (e.response?.status as number | undefined)
          : undefined;
      if (status === 401) {
        setExportError("You are not authenticated. Please sign in again.");
      } else if (status === 404) {
        setExportError("Report not found.");
      } else {
        setExportError("Failed to export report. Please try again.");
      }
      toast.error("Export failed. Please try again.");
    } finally {
      setDownloading((m) => ({ ...m, [reportId]: null }));
    }
  };

  const detections = detectionsQ.data?.items ?? [];
  const treatedCount = detections.filter((d) => d.status === "Treated").length;
  const avgRisk =
    detections.length > 0
      ? detections.reduce((acc, d) => acc + (typeof d.risk_index === "number" ? d.risk_index : 0), 0) /
        Math.max(1, detections.filter((d) => typeof d.risk_index === "number").length)
      : 0;

  // Simple heuristic metrics based on actual data
  const yieldImpactPct = Math.max(0, Math.min(25, (treatedCount / Math.max(1, detections.length)) * 18));
  const waterSavingsPct = iotQ.data?.smart_irrigation?.should_irrigate === false ? 15 : 0;
  const threatResolved = treatedCount;
  const threatTotal = detections.length;

  // Chart data
  const pestTrend = [...detections]
    .slice(0, 30)
    .reverse()
    .map((d, idx) => ({
      name: d.timestamp ? new Date(d.timestamp).toLocaleDateString() : `#${idx + 1}`,
      risk: typeof d.risk_index === "number" ? d.risk_index : 0,
    }));

  const waterTrend =
    (iotQ.data?.history ?? []).slice(-30).map((p, idx) => ({
      name: p.timestamp ? new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : `t${idx + 1}`,
      soil: p.soil_moisture,
    })) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          badgeIcon={FileText}
          badgeText="Farm Records"
          badgeVariant="primary"
          title="Reports & Analytics"
          description="Generate, view, and export detailed insights about your farm."
        />
        <div className="flex gap-2">
           <Button variant="outline" className="bg-white dark:bg-black">
             <Filter className="mr-2 h-4 w-4" /> Filter
           </Button>
           <Button
             onClick={() => reportsQ.refresh()}
             disabled={reportsQ.isRefreshing}
           >
             <Download className="mr-2 h-4 w-4" /> {reportsQ.isRefreshing ? "Generating..." : "Generate Report"}
           </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mb-4"></div>
          <p className="font-medium text-muted-foreground">Gathering historical analytics...</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {exportError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {exportError}
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card hover-lift border-none shadow-soft rounded-2xl">
          <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-2xl">
            <CardTitle className="text-base font-serif font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[var(--color-primary)]" /> Yield Impact</CardTitle>
            <CardDescription className="font-medium">Estimated yield vs actual yield</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
             <div className="text-4xl font-bold font-sans tracking-tighter mb-2 text-foreground">
               +{yieldImpactPct.toFixed(1)}%
             </div>
             <p className="text-sm font-semibold bg-green-500/10 text-green-600 dark:text-green-400 inline-block px-2 py-0.5 rounded-sm">
               Based on treated vs pending detections
             </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card hover-lift border-none shadow-soft rounded-2xl">
          <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-2xl">
            <CardTitle className="text-base font-serif font-bold flex items-center gap-2"><PieIcon className="h-5 w-5 text-[var(--color-accent)]" /> Resource Usage</CardTitle>
            <CardDescription className="font-medium">Water and fertilizer allocation</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
             <div className="text-4xl font-bold font-sans tracking-tighter mb-2 text-foreground">
               {waterSavingsPct > 0 ? `-${waterSavingsPct}%` : "—"}
             </div>
             <p className="text-sm font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-sm inline-block">
               {iotQ.isLoading
                 ? "Loading IoT insights..."
                 : iotQ.data?.smart_irrigation
                   ? iotQ.data.smart_irrigation.should_irrigate
                     ? "Irrigation recommended by smart assistant."
                     : "Water saved by skipping irrigation today."
                   : "Connect IoT sensors to enable resource insights."}
             </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1 border-none bg-red-50 dark:bg-red-950/20 shadow-soft rounded-2xl hover-lift glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400"><FileText className="h-5 w-5" /> Threat Logs</CardTitle>
            <CardDescription>Resolved vs active pest threats</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-end gap-2 mb-2">
               <div className="text-4xl font-bold font-sans tracking-tighter text-red-600 dark:text-red-400">{threatResolved}</div>
               <div className="text-xl text-muted-foreground mb-1">/ {threatTotal}</div>
             </div>
             <p className="text-sm font-medium text-muted-foreground">
               Avg risk index: {Number.isFinite(avgRisk) ? avgRisk.toFixed(1) : "—"} / 100
             </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="glass-card hover-lift border-none shadow-soft rounded-2xl lg:col-span-2">
          <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-2xl">
            <CardTitle className="font-serif text-xl border-none">Smart Insights</CardTitle>
            <CardDescription className="font-medium">Actionable signals computed from live data.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-black/5 dark:border-white/5 p-4 bg-muted/10">
              <div className="text-sm font-semibold mb-1">Reduced pest activity</div>
              <div className="text-2xl font-bold">
                {detections.length === 0 ? "—" : `${Math.max(0, Math.round((treatedCount / Math.max(1, detections.length)) * 100))}%`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Based on treated cases in your history.</div>
            </div>
            <div className="rounded-xl border border-black/5 dark:border-white/5 p-4 bg-muted/10">
              <div className="text-sm font-semibold mb-1">Water savings</div>
              <div className="text-2xl font-bold">{waterSavingsPct > 0 ? `${waterSavingsPct}%` : "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {iotQ.data?.smart_irrigation?.reason || "Enable IoT to get savings suggestions."}
              </div>
            </div>
            <div className="rounded-xl border border-black/5 dark:border-white/5 p-4 bg-muted/10">
              <div className="text-sm font-semibold mb-1">Weather risk</div>
              <div className="text-2xl font-bold">
                {weatherQ.isLoading ? "…" : `${weatherQ.data?.rain_probability ?? "—"}%`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {weatherQ.data?.advisory?.recommendation || "Weather insights unavailable."}
              </div>
            </div>
            <div className="rounded-xl border border-black/5 dark:border-white/5 p-4 bg-muted/10">
              <div className="text-sm font-semibold mb-1">Next best action</div>
              <div className="text-sm font-medium">
                {detections.length === 0
                  ? "Run a pest scan to start analytics."
                  : avgRisk >= 75
                    ? "Prioritize treatment for critical risk cases."
                    : avgRisk >= 45
                      ? "Monitor and rescan high-risk areas within 48 hours."
                      : "Maintain routine scouting and irrigation schedule."}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-none shadow-soft rounded-2xl">
          <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-2xl">
            <CardTitle className="font-serif text-xl border-none">Recent Activity</CardTitle>
            <CardDescription className="font-medium">Latest items from `/dashboard/history`.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {historyList.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Run your first pest scan or generate a report to see recent items here."
                action={
                  <Button asChild className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white">
                    <a href="/dashboard/pest-detection">Run pest scan</a>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {historyList.slice(0, 6).map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border border-black/5 dark:border-white/5 p-3 hover:bg-muted/20 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{h.report_name}</div>
                      <div className="text-xs text-muted-foreground">{h.category}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{h.date || "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card hover-lift border-none shadow-soft rounded-2xl">
        <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-2xl">
          <CardTitle className="font-serif text-xl border-none">Trends</CardTitle>
          <CardDescription className="font-medium">Live analytics from detections and IoT sensors.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-black/5 dark:border-white/5 p-4">
            <div className="text-sm font-semibold mb-3">Pest detection risk trend</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pestTrend}>
                  <defs>
                    <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    cursor={{ stroke: "rgba(0,0,0,0.08)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(231,229,228,0.9)",
                      borderRadius: 12,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                      backdropFilter: "blur(8px)",
                    }}
                    labelStyle={{ color: "rgba(28,25,23,0.7)", fontWeight: 600 }}
                    itemStyle={{ color: "var(--color-primary)", fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="none" fill="url(#riskFill)" />
                  <Line type="monotone" dataKey="risk" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-black/5 dark:border-white/5 p-4">
            <div className="text-sm font-semibold mb-3">Water usage proxy (soil moisture)</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waterTrend}>
                  <defs>
                    <linearGradient id="soilFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip
                    cursor={{ stroke: "rgba(0,0,0,0.08)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(231,229,228,0.9)",
                      borderRadius: 12,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                      backdropFilter: "blur(8px)",
                    }}
                    labelStyle={{ color: "rgba(28,25,23,0.7)", fontWeight: 600 }}
                    itemStyle={{ color: "var(--color-soil)", fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="soil" stroke="none" fill="url(#soilFill)" />
                  <Line type="monotone" dataKey="soil" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card hover-lift border-none shadow-soft rounded-2xl">
        <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-2xl">
           <CardTitle className="font-serif text-xl border-none">Generated Documents</CardTitle>
           <CardDescription className="font-medium">Download official AAROH detailed reports for auditing or financing.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="rounded-xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm">
             <div className="grid grid-cols-12 gap-4 bg-muted/50 dark:bg-muted/20 p-4 font-semibold text-sm text-foreground border-b border-border">
               <div className="col-span-6 md:col-span-5">Report Name</div>
               <div className="col-span-3 hidden md:block">Category</div>
               <div className="col-span-4 md:col-span-2 text-right md:text-left">Date</div>
               <div className="col-span-2 text-right hidden lg:block">Size</div>
               <div className="col-span-2 text-right hidden md:block">Action</div>
             </div>
             <div className="divide-y divide-border min-h-[300px] flex flex-col justify-center">
                {reportsQ.items.length > 0 ? reportsQ.items.map((doc) => (
                  <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/20 transition-colors">
                     <div className="col-span-8 md:col-span-5 flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                         <FileText className="h-5 w-5" />
                       </div>
                      <span className="font-medium text-sm line-clamp-1">{doc.name}</span>
                     </div>
                     <div className="col-span-3 hidden md:block">
                      <span className="bg-muted px-2 py-1 rounded text-xs font-semibold">{doc.category}</span>
                     </div>
                     <div className="col-span-4 md:col-span-2 text-right md:text-left text-sm text-muted-foreground">
                      {doc.date || "—"}
                     </div>
                     <div className="col-span-2 text-right hidden lg:block text-sm text-muted-foreground">
                      {formatBytes(doc.file_size_bytes)}
                     </div>
                     <div className="col-span-4 text-right md:hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--color-primary)]"
                        disabled={downloading[doc.id] !== undefined && downloading[doc.id] !== null}
                        onClick={() => downloadFile(doc.id, "csv")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                     </div>
                     <div className="col-span-2 text-right hidden md:block">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:bg-muted/40"
                          disabled
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:bg-[var(--color-primary)]/10"
                          disabled={downloading[doc.id] !== undefined && downloading[doc.id] !== null}
                          onClick={() => downloadFile(doc.id, "pdf")}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloading[doc.id] === "pdf" ? "Downloading..." : "Download PDF"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white dark:bg-black"
                          disabled={downloading[doc.id] !== undefined && downloading[doc.id] !== null}
                          onClick={() => downloadFile(doc.id, "csv")}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloading[doc.id] === "csv" ? "Downloading..." : "CSV"}
                        </Button>
                      </div>
                     </div>
                  </div>
                )) : (
                  <EmptyState
                    icon={Sprout}
                    title="No reports yet"
                    description="Generate your first report to start tracking yield signals, pest trends, and water usage analytics."
                    action={
                      <>
                        <Button
                          onClick={() => reportsQ.refresh()}
                          disabled={reportsQ.isRefreshing}
                          isLoading={reportsQ.isRefreshing}
                          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
                        >
                          Generate report
                        </Button>
                        <Button variant="outline" className="bg-white dark:bg-black" asChild>
                          <a href="/dashboard/sensors">Connect sensors</a>
                        </Button>
                      </>
                    }
                  />
                )}
             </div>
           </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
