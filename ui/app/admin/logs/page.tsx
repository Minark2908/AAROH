"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Search, 
  Loader2, 
  RefreshCcw, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  AlertCircle,
  Info,
  AlertTriangle,
  History,
  Calendar,
  Clock
} from "lucide-react";
import { fetchLogs, fetchActivity } from "@/api/adminApi";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AdminLog {
  id: number;
  user_id: number;
  target: string | null;
  target_user_id: number | null;
  action: string;
  details: string | null;
  level: string;
  timestamp: string;
}

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  details: string;
  user: string;
  level: string;
  timestamp: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(15);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLogs = useCallback(async (pageNum = page) => {
    try {
      setLoading(true);
      const params: any = {
        page: pageNum,
        limit,
        search: searchQuery || undefined,
        level: levelFilter !== "ALL" ? levelFilter : undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      
      const data = await fetchLogs(params);
      setLogs(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || 1);
    } catch (error) {
      console.error("Failed to load admin logs", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, levelFilter, actionFilter, startDate, endDate]);

  const loadRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const data = await fetchActivity();
      setActivity(data || []);
    } catch (error) {
      console.error("Failed to load activity", error);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, [searchQuery, levelFilter, actionFilter, startDate, endDate, loadLogs]);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadLogs();
      loadRecentActivity();
    }, 15000); // every 15 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, loadLogs]);

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "ERROR":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800";
      case "WARNING":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "INFO":
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case "ERROR":
        return <AlertCircle className="h-3 w-3" />;
      case "WARNING":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-500" />
            System Audit Log
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            Track and monitor all administrative actions and system events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-white/5">
            <span className="text-xs font-medium text-slate-500">Auto-refresh</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                autoRefresh ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
              )}
            >
              <span className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                autoRefresh ? "translate-x-4" : "translate-x-1"
              )} />
            </button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              loadLogs();
              loadRecentActivity();
            }}
            className="gap-2 h-9"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Action, ID, or user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-white/5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Severity Level</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-white/5">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="INFO">Information</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Critical Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Range</label>
                <div className="grid gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-9 h-9 text-xs bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-white/5"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-9 h-9 text-xs bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200 dark:border-white/5"
                    />
                  </div>
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full text-xs text-indigo-600 dark:text-indigo-400 h-8"
                onClick={() => {
                  setSearchQuery("");
                  setLevelFilter("ALL");
                  setActionFilter("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear all filters
              </Button>
            </CardContent>
          </Card>

          {/* Activity Feed (Visible on Mobile here, or stays on right for desktop) */}
          <Card className="border-none shadow-sm lg:hidden h-[400px] overflow-hidden flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 px-4 pb-4">
              {activityLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                ))
              ) : activity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs italic">
                  No activity captured yet.
                </div>
              ) : (
                activity.slice(0, 10).map((item) => (
                  <div key={item.id} className="relative pl-6 pb-4 last:pb-0 border-l border-slate-100 dark:border-white/5">
                    <div className={cn(
                      "absolute -left-1.5 top-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-950",
                      item.level === "ERROR" ? "bg-red-500" : item.level === "WARNING" ? "bg-amber-500" : "bg-blue-500"
                    )} />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {item.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {item.timestamp ? format(new Date(item.timestamp), "HH:mm") : ""}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.details}
                      </p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        by {item.user}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-none shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50/50 dark:bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none">
                        Log ID
                      </th>
                      <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none">
                        Event / Action
                      </th>
                      <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none">
                        Severity
                      </th>
                      <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none">
                        Target / Details
                      </th>
                      <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none text-right">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {loading && logs.length === 0 ? (
                      Array(10).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} className="py-4 px-6 border-none">
                            <Skeleton className="h-6 w-full opacity-50" />
                          </td>
                        </tr>
                      ))
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="h-96 text-center">
                          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground px-4">
                            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                              <History className="h-6 w-6 opacity-20" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">No logs discovered</p>
                              <p className="text-xs max-w-[250px]">Adjust your filters or wait for system activity to be recorded.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr
                          key={log.id}
                          className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <td className="py-4 px-6 border-none font-medium text-slate-400 text-xs">
                            #{log.id}
                          </td>
                          <td className="py-4 px-6 border-none">
                            <div className="flex flex-col">
                              <span className="font-bold text-xs tracking-wide text-slate-900 dark:text-slate-100">
                                {log.action.replace(/_/g, " ")}
                              </span>
                              <span className="text-[10px] text-muted-foreground dark:text-slate-500">
                                User ID #{log.user_id}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 border-none">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              getLevelColor(log.level)
                            )}>
                              {getLevelIcon(log.level)}
                              {log.level}
                            </span>
                          </td>
                          <td className="py-4 px-6 border-none">
                            <div className="flex flex-col gap-0.5 max-w-[300px]">
                              {log.target && (
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">
                                  <span>{log.target}</span>
                                  {log.target_user_id && <span className="opacity-60 text-slate-500">(User #{log.target_user_id})</span>}
                                </div>
                              )}
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                                "{log.details || "No further details"}"
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-6 border-none text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                {format(new Date(log.timestamp), "MMM dd, yyyy")}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(log.timestamp), "HH:mm:ss")}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            
            {pages > 1 && (
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  Showing <span className="text-slate-900 dark:text-slate-100">{logs.length}</span> of <span className="text-slate-900 dark:text-slate-100">{total}</span> events
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={page === 1 || loading}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                      // Logic for showing pages near current page
                      let p = page;
                      if (page <= 3) p = i + 1;
                      else if (page >= pages - 2) p = pages - 4 + i;
                      else p = page - 2 + i;
                      
                      if (p <= 0 || p > pages) return null;

                      return (
                        <Button
                          key={p}
                          variant={page === p ? "primary" : "outline"}
                          size="icon"
                          className={cn("h-8 w-8 rounded-lg text-xs", page === p && "bg-indigo-600 hover:bg-indigo-700")}
                          onClick={() => setPage(p)}
                          disabled={loading}
                        >
                          {p}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={page === pages || loading}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm h-[750px] overflow-hidden flex flex-col sticky top-6">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-50 dark:border-white/5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                Live Activity Feed
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-6 p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
              {activityLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))
              ) : activity.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                  <Activity className="h-10 w-10 text-slate-200 dark:text-zinc-800" />
                  <p className="text-xs text-muted-foreground italic">No live activity detected.</p>
                </div>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="relative pl-7 pb-6 last:pb-0 border-l-2 border-slate-100 dark:border-white/5">
                    <div className={cn(
                      "absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center",
                      item.level === "ERROR" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                      item.level === "WARNING" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : 
                      "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    )} />
                    <div className="space-y-1.5 transition-all hover:translate-x-1 duration-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                          {item.action.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                          <Clock className="h-2.5 w-2.5" />
                          {item.timestamp ? format(new Date(item.timestamp), "HH:mm") : ""}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                        {item.details}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="h-5 w-5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                            {item.user.charAt(0).toUpperCase()}
                         </div>
                         <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {item.user}
                         </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <div className="p-4 border-t border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-zinc-900/30">
               <Button variant="ghost" className="w-full text-xs gap-2 group hover:bg-white dark:hover:bg-zinc-900" onClick={loadRecentActivity}>
                  <RefreshCcw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />
                  Force Update Feed
               </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
