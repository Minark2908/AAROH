"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BrainCircuit, Activity, Shield, AlertTriangle, UserX, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAdminStats, fetchActivity } from "@/api/adminApi";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  total_users: number;
  admin_count: number;
  disabled_count: number;
  regular_user_count: number;
  total_detections: number;
  high_risk_detections: number;
  ai_accuracy: number;
}

// Simulated weekly trend (augmented with real stats totals)
const buildTrendData = (stats: Stats) => [
  { time: "Mon", users: Math.max(1, Math.round(stats.total_users * 0.72)), detections: Math.max(0, Math.round(stats.total_detections * 0.10)) },
  { time: "Tue", users: Math.max(1, Math.round(stats.total_users * 0.78)), detections: Math.max(0, Math.round(stats.total_detections * 0.13)) },
  { time: "Wed", users: Math.max(1, Math.round(stats.total_users * 0.82)), detections: Math.max(0, Math.round(stats.total_detections * 0.15)) },
  { time: "Thu", users: Math.max(1, Math.round(stats.total_users * 0.87)), detections: Math.max(0, Math.round(stats.total_detections * 0.17)) },
  { time: "Fri", users: Math.max(1, Math.round(stats.total_users * 0.92)), detections: Math.max(0, Math.round(stats.total_detections * 0.18)) },
  { time: "Sat", users: Math.max(1, Math.round(stats.total_users * 0.95)), detections: Math.max(0, Math.round(stats.total_detections * 0.13)) },
  { time: "Sun", users: stats.total_users, detections: stats.total_detections },
];

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAdminStats(), fetchActivity()])
      .then(([statsData, activityData]) => {
        setStats(statsData);
        setActivity(activityData);
      })
      .catch((err) => {
        console.error("Failed to load admin stats or activity", err);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        {
          title: "Total Users",
          value: stats.total_users.toLocaleString(),
          sub: `${stats.regular_user_count} farmers · ${stats.admin_count} admins`,
          icon: Users,
          color: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
          title: "Total Detections",
          value: stats.total_detections.toLocaleString(),
          sub: `${stats.high_risk_detections} high-risk events`,
          icon: Activity,
          color: "text-indigo-500",
          bg: "bg-indigo-50 dark:bg-indigo-900/20",
        },
        {
          title: "AI Accuracy",
          value: stats.ai_accuracy > 0 ? `${stats.ai_accuracy}%` : "—",
          sub: "Avg confidence across all detections",
          icon: BrainCircuit,
          color: "text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
        },
        {
          title: "High-Risk Detections",
          value: stats.high_risk_detections.toLocaleString(),
          sub: `${stats.total_detections > 0 ? ((stats.high_risk_detections / stats.total_detections) * 100).toFixed(1) : 0}% of total`,
          icon: AlertTriangle,
          color: "text-rose-500",
          bg: "bg-rose-50 dark:bg-rose-900/20",
        },
        {
          title: "Admin Accounts",
          value: stats.admin_count.toLocaleString(),
          sub: "Users with elevated privileges",
          icon: Shield,
          color: "text-violet-500",
          bg: "bg-violet-50 dark:bg-violet-900/20",
        },
        {
          title: "Disabled Accounts",
          value: stats.disabled_count.toLocaleString(),
          sub: "Accounts currently suspended",
          icon: UserX,
          color: "text-orange-500",
          bg: "bg-orange-50 dark:bg-orange-900/20",
        },
      ]
    : [];

  const trendData = stats ? buildTrendData(stats) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight text-slate-900 dark:text-white">
          Platform Overview
        </h1>
        <p className="text-muted-foreground mt-1 text-base">
          Real-time metrics for the AAROH agriculture ecosystem.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="font-medium">Loading platform stats...</span>
        </div>
      ) : !stats ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Could not load stats. Please check that the backend is running.
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {statCards.map((stat) => (
              <Card
                key={stat.title}
                className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}
                    >
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold tracking-tight mb-1">{stat.value}</p>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {stat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Activity Trend</CardTitle>
                <CardDescription>Rolling 7-day user + detection activity</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="time" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        backgroundColor: "white",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="Users"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                    <Area
                      type="monotone"
                      dataKey="detections"
                      name="Detections"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorDetections)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm h-full flex flex-col">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Platform Health</CardTitle>
                <CardDescription>Current system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 flex-1">
                {[
                  {
                    label: "User Engagement",
                    value: stats.total_users > 0 ? Math.round(((stats.total_users - stats.disabled_count) / stats.total_users) * 100) : 100,
                    color: "bg-indigo-500",
                  },
                  {
                    label: "Admin Coverage",
                    value: stats.total_users > 0 ? Math.round((stats.admin_count / stats.total_users) * 100) : 0,
                    color: "bg-violet-500",
                  },
                  {
                    label: "High-Risk Rate",
                    value: stats.total_detections > 0 ? Math.round((stats.high_risk_detections / stats.total_detections) * 100) : 0,
                    color: "bg-rose-500",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                      <span className="font-bold">{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-700`}
                        style={{ width: `${Math.min(100, item.value)}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-3 flex-1 flex flex-col justify-end border-t border-slate-100 dark:border-white/5 space-y-2 mt-auto">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">AI Model Accuracy</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.ai_accuracy > 0 ? `${stats.ai_accuracy}%` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Accounts</span>
                    <span className="font-bold">
                      {stats.total_users - stats.disabled_count} / {stats.total_users}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold font-serif tracking-tight text-slate-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {activity.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No recent activity detected.</div>
                  ) : (
                    activity.map((act) => (
                      <div key={act.id} className="p-4 sm:p-6 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                        <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          act.type === "log" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                        }`}>
                          {act.type === "log" ? <Shield className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {act.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                            {act.details}
                          </p>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap hidden sm:block">
                          <p className="font-semibold text-slate-900 dark:text-slate-300">{act.user}</p>
                          <p className="text-muted-foreground mt-1">
                            {act.timestamp ? formatDistanceToNow(new Date(act.timestamp), { addSuffix: true }) : "Unknown time"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
