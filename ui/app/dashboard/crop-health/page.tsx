"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Leaf, 
    LayoutGrid, 
    Calendar, 
    AlertTriangle, 
    CheckCircle2, 
    TrendingUp, 
    Bell, 
    Droplets, 
    Thermometer, 
    Info, 
    ArrowUpRight,
    Bug,
    ShieldCheck,
    Waves
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

import { getFields, getNDVIHistory, getCropHealthSummary } from "@/api/cropApi";

// Dynamically import the map to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map/MapComponent"), { 
    ssr: false, 
    loading: () => <div className="h-full w-full bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center text-white font-mono">Initializing Satellite Feed...</div>
});

const HealthScoreGauge = ({ score }: { score: number }) => {
    const color = score > 80 ? "text-green-500" : score > 60 ? "text-yellow-500" : "text-red-500";
    const bgColor = score > 80 ? "bg-green-500/10" : score > 60 ? "bg-yellow-500/10" : "bg-red-500/10";
    
    return (
        <div className={`relative flex items-center justify-center w-32 h-32 rounded-full ${bgColor} border-4 border-white/5 shadow-inner`}>
            <div className="text-center group">
                <p className={`text-4xl font-bold font-mono transition-transform duration-500 group-hover:scale-110 ${color}`}>{score}%</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Health</p>
            </div>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                    cx="50" cy="50" r="45"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${score * 2.82} 282`}
                    className={`${color} opacity-30`}
                />
            </svg>
        </div>
    );
};

export default function CropHealthPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "trends">("overview");
  const [activeField, setActiveField] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeField && activeTab === "trends") {
      fetchHistory(activeField.id);
    }
  }, [activeField, activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [fieldsData, summaryData] = await Promise.all([
        getFields(),
        getCropHealthSummary()
      ]);
      setFields(fieldsData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load crop health data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (fieldId: number) => {
    try {
      const data = await getNDVIHistory(fieldId, 30);
      const formatted = data.map((d: any) => ({
        ...d,
        date: format(new Date(d.recorded_at), "MMM dd")
      }));
      setHistoryData(formatted);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const activeHistory = activeField?.history?.[0] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          badgeIcon={Leaf}
          badgeText="Satellite Analysis"
          badgeVariant="primary"
          title="Crop Health & NDVI"
          description="Real-time vegetation monitoring combined with IoT sensor fusion and AI insights."
        />
        <div className="flex gap-2">
           <Button 
                onClick={() => setActiveTab("overview")}
                variant={activeTab === "overview" ? "primary" : "outline"}
                className={`rounded-full px-6 transition-all duration-300 ${activeTab === 'overview' ? 'bg-[var(--color-primary)] text-white shadow-soft' : 'glass-card text-foreground'}`}
            >
             Overview
           </Button>
           <Button 
                onClick={() => setActiveTab("trends")}
                variant={activeTab === "trends" ? "primary" : "outline"}
                disabled={!activeField}
                className={`rounded-full px-6 transition-all duration-300 ${activeTab === 'trends' ? 'bg-[var(--color-primary)] text-white shadow-soft' : 'glass-card text-foreground hover:bg-white/10'}`}
            >
             <TrendingUp className="mr-2 h-4 w-4" /> History
           </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden p-0 border border-white/20 dark:border-white/10 shadow-soft glass-card rounded-2xl group border-none flex flex-col h-[600px] relative">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground font-mono">Syncing Satellite Data...</p>
                    </div>
                ) : (
                    <div className="relative flex-1 bg-slate-900">
                        <MapComponent 
                            fields={fields} 
                            activeField={activeField} 
                            onFieldSelect={(field: any) => {
                                setActiveField(field);
                                setActiveTab("metrics");
                            }} 
                        />
                        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
                            <div className="bg-black/60 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10 text-white shadow-lg text-[10px] font-mono flex items-center uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" /> Live NDVI Feed
                            </div>
                            {activeField && (
                                <div className="bg-primary/90 backdrop-blur-md rounded-lg px-3 py-1.5 text-white shadow-lg text-xs font-bold animate-in slide-in-from-left-4">
                                    Focus: {activeField.name}
                                </div>
                            )}
                        </div>
                        
                        {summary?.average_ndvi !== undefined && (
                            <div className="absolute bottom-4 left-4 z-[400]">
                                <Card className="bg-black/80 backdrop-blur-xl border-white/10 text-white p-5 rounded-3xl shadow-2xl min-w-[200px]">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-green-500/20 p-3 rounded-2xl">
                                            <Leaf className="h-6 w-6 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Farm AVG NDVI</p>
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-3xl font-bold font-mono text-green-400">{summary.average_ndvi}</p>
                                                <span className="text-xs text-green-500/60 font-mono">/ 1.0</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Vegetation", val: activeHistory?.ndvi_value || summary?.average_ndvi || "--", icon: Leaf, color: "text-green-500", suffix: " NDVI" },
                    { label: "Soil Moisture", val: activeHistory?.soil_moisture || (summary?.active_alerts?.[0]?.soil_moisture) || 54, icon: Droplets, color: "text-blue-500", suffix: "%" },
                    { label: "Humidity", val: activeHistory?.humidity || 62, icon: Waves, color: "text-cyan-500", suffix: "%" },
                    { label: "Pest Risk", val: activeHistory?.health_status === 'Critical' ? "High" : "Low", icon: Bug, color: activeHistory?.health_status === 'Critical' ? "text-red-500" : "text-green-500" },
                ].map((stat, i) => (
                    <Card key={i} className="glass-card border-none shadow-soft p-4 hover-lift">
                        <div className="flex items-start justify-between mb-2">
                            <div className={`p-2 rounded-xl bg-muted/50 ${stat.color} bg-opacity-10`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-30" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        <p className="text-xl font-bold font-mono mt-1">
                            {stat.val}{stat.suffix}
                        </p>
                    </Card>
                ))}
            </div>
        </div>

        <AnimatePresence mode="wait">
            {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <Card className="glass-card border-none shadow-soft overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck className="h-24 w-24" />
                        </div>
                        <CardHeader className="pb-0">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" /> System Assessment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center py-8">
                            <HealthScoreGauge score={summary?.average_ndvi ? Math.round(summary.average_ndvi * 100) : 75} />
                            <div className="mt-6 text-center">
                                <p className="text-sm font-bold text-foreground">Operational Status: Optimal</p>
                                <p className="text-xs text-muted-foreground mt-1 px-8">Your fields are performing within expected historical parameters for this stage.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-soft border-white/20 dark:border-white/10 rounded-2xl glass-card border-none">
                        <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-gradient-farm rounded-t-2xl">
                        <CardTitle className="font-serif">Field Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-4">
                            {fields.map(f => (
                                <div key={f.id} className="space-y-1.5 cursor-pointer group" onClick={() => { setActiveField(f); setActiveTab("metrics"); }}>
                                    <div className="flex justify-between text-sm group-hover:text-primary transition-colors font-mono">
                                        <span className="font-bold">{f.name}</span>
                                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">{f.growth_stage}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" style={{ width: `${f.progress_percentage || 0}%` }}></div>
                                    </div>
                                </div>
                            ))}
                            {fields.length === 0 && !loading && (
                                <p className="text-sm text-muted-foreground">No active fields found.</p>
                            )}
                        </CardContent>
                    </Card>
                    
                    {summary?.active_alerts?.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-red-500 px-1">
                                <AlertTriangle className="h-4 w-4" />
                                <h3 className="font-bold text-xs uppercase tracking-widest">Action Required</h3>
                            </div>
                            {summary.active_alerts.map((alert: any, i: number) => (
                                <Card key={i} className="bg-red-500/5 border border-red-500/10 shadow-soft rounded-2xl overflow-hidden hover:bg-red-500/10 transition-colors">
                                    <CardContent className="p-4">
                                        <p className="font-mono text-[10px] text-red-500 font-bold mb-1 uppercase tracking-tighter">{alert.field_name} · Alert</p>
                                        <p className="text-sm font-bold mb-2 text-foreground">{alert.problem}</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic">{alert.recommendation}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {(activeTab === "metrics" || activeTab === "trends") && activeField && (
                 <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <Card className="border-none shadow-soft rounded-3xl glass-card hover-lift relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${activeHistory?.health_status === 'Healthy' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : activeHistory?.health_status === 'Moderate' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-serif font-bold text-2xl text-foreground tracking-tight">{activeField.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground font-mono">{activeField.crop_type}</span>
                                        <span className="w-1 h-1 rounded-full bg-muted"></span>
                                        <span className="text-xs text-muted-foreground font-mono">{activeField.area_acres} Acres</span>
                                    </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${activeHistory?.health_status === 'Healthy' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : activeHistory?.health_status === 'Moderate' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                    {activeHistory?.health_status || "Unknown"}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-muted/30 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">NDVI Value</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-3xl font-mono font-bold">{activeHistory?.ndvi_value || "N/A"}</p>
                                        <span className="text-[10px] text-muted-foreground opacity-50">/ 1.0</span>
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-2xl p-4 border border-white/5">
                                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Soil Moisture</p>
                                     <div className="flex items-baseline gap-1">
                                        <p className="text-3xl font-mono font-bold">{activeHistory?.soil_moisture || "54"}</p>
                                        <span className="text-[10px] text-muted-foreground opacity-50">%</span>
                                     </div>
                                </div>
                            </div>
                            
                            {activeHistory?.recommendation && (
                                <div className={`p-5 rounded-2xl relative overflow-hidden ${activeHistory.health_status === 'Critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-primary/10 border border-primary/20'}`}>
                                    <h4 className="flex items-center text-[10px] uppercase tracking-widest font-bold mb-3">
                                        <ShieldCheck className="h-3 w-3 mr-2" /> Agronomist Guidance
                                    </h4>
                                    <p className="text-sm leading-relaxed text-foreground font-medium">{activeHistory.recommendation}</p>
                                    <div className="absolute -bottom-2 -right-2 opacity-5">
                                        <ShieldCheck className="h-16 w-16" />
                                    </div>
                                </div>
                            )}

                            <Button 
                                variant="ghost" 
                                className="w-full mt-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-foreground"
                                onClick={() => setActiveTab("trends")}
                            >
                                <TrendingUp className="h-3 w-3 mr-2" /> View Detailed Trend Analysis
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 border-white/10 bg-transparent p-5 rounded-3xl group">
                        <div className="flex gap-4">
                            <div className="bg-primary/20 p-3 rounded-2xl group-hover:bg-primary/40 transition-colors h-fit">
                                <Info className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm mb-1">Understanding NDVI</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Normalized Difference Vegetation Index (NDVI) measures plant health by comparing reflected near-infrared and red light. 
                                    <span className="block mt-2 font-semibold text-foreground italic">Higher values (0.6 - 1.0) represent lush green vegetation.</span>
                                </p>
                            </div>
                        </div>
                    </Card>

                    {activeTab === "trends" && (
                         <Card className="border-none shadow-soft rounded-3xl glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-serif font-bold text-lg">NDVI Growth Trend</h4>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase flex gap-4">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Value</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted" /> Avg</span>
                                </div>
                            </div>
                            <div className="h-[240px] w-full">
                                {historyData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={historyData}>
                                            <defs>
                                                <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="date" fontSize={9} tickMargin={10} axisLine={false} tickLine={false} />
                                            <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} fontSize={9} axisLine={false} tickLine={false} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                                itemStyle={{ color: 'var(--color-primary)' }}
                                            />
                                            <Area type="monotone" dataKey="ndvi_value" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorNdvi)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">Processing historical layers...</div>
                                )}
                            </div>
                         </Card>
                    )}
                 </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
