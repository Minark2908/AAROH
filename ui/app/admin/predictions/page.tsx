"use client";
import React, { useEffect, useState } from "react";
import { fetchAllPredictions, overrideTreatment } from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bug, 
  Clock, 
  MessageSquare, 
  User,
  Thermometer,
  Droplets,
  ShieldAlert,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface Prediction {
  id: number;
  user_id: number;
  pest_name: string;
  confidence: number;
  severity: string;
  risk_index: number;
  risk_level: string;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  conditions: string;
  treatment_override: string | null;
  timestamp: string;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [overrideText, setOverrideText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const data = await fetchAllPredictions();
      setPredictions(data);
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  const handleSaveOverride = async (id: number) => {
    try {
      setIsSubmitting(true);
      await overrideTreatment(id, overrideText);
      setPredictions(predictions.map(p => 
        p.id === id ? { ...p, treatment_override: overrideText } : p
      ));
      setEditingId(null);
      setOverrideText("");
      alert("Advisory overridden successfully.");
    } catch (error: any) {
      alert("Failed to save override: " + (error.response?.data?.detail || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30';
      case 'medium': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30';
      default: return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight text-slate-900 dark:text-white">Prediction Moderation</h1>
        <p className="text-muted-foreground mt-1 text-base">Monitor and override AI-generated agricultural advisories.</p>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
             <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
             <p className="font-medium">Fetching predictions...</p>
          </div>
        ) : predictions.length === 0 ? (
          <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/20">
             <ShieldAlert className="h-12 w-12 mb-4 opacity-20" />
             <p className="text-lg font-medium">No predictions found in the system log.</p>
          </Card>
        ) : (
          predictions.map((p) => (
            <Card key={p.id} className="border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-950 hover:shadow-md transition-all group">
               <CardHeader className="flex flex-row items-center border-b border-slate-50 dark:border-white/5 py-4 px-6 bg-slate-50/30 dark:bg-zinc-900/20 justify-between">
                  <div className="flex items-center gap-3">
                     <span className="text-xs font-bold text-muted-foreground tracking-tighter uppercase">ID #{p.id}</span>
                     <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
                     <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(p.timestamp).toLocaleString()}
                     </span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getSeverityColor(p.severity)}`}>
                     {p.severity} RISK
                  </div>
               </CardHeader>
               
               <CardContent className="p-6">
                  <div className="grid lg:grid-cols-12 gap-8 text-sm">
                     <div className="lg:col-span-4 space-y-5">
                        <div className="flex items-center gap-4">
                           <div className="h-14 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100/50 dark:border-indigo-800/30">
                              <Bug className="h-7 w-7" />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{p.pest_name}</h3>
                              <p className="text-xs font-semibold text-muted-foreground mt-1">AI Confidence: {(p.confidence * 100).toFixed(1)}%</p>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                           <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 flex flex-col gap-1 border border-slate-100/50 dark:border-white/5">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                 <Thermometer className="h-3 w-3 text-orange-500" /> Temp
                              </span>
                              <p className="font-bold text-slate-900 dark:text-white">{p.temperature}°C</p>
                           </div>
                           <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 flex flex-col gap-1 border border-slate-100/50 dark:border-white/5">
                               <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                 <Droplets className="h-3 w-3 text-blue-500" /> Humidity
                              </span>
                              <p className="font-bold text-slate-900 dark:text-white">{p.humidity}%</p>
                           </div>
                        </div>
                     </div>

                     <div className="lg:col-span-8 border-l border-slate-100 dark:border-white/5 pl-0 lg:pl-8 space-y-5">
                        <div>
                           <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                                 <MessageSquare className="h-4 w-4 text-indigo-500" />
                                 Treatment Advisory
                              </h4>
                              {p.treatment_override && (
                                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-tight border border-amber-100 dark:border-amber-900/30">
                                    <CheckCircle2 className="h-3 w-3" />
                                    OVERRIDDEN BY EXPERT
                                 </div>
                              )}
                           </div>
                           
                           <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 min-h-[90px] shadow-inner text-slate-700 dark:text-slate-300">
                              {p.treatment_override ? (
                                 <p className="leading-relaxed">"{p.treatment_override}"</p>
                              ) : (
                                 <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40 grayscale py-4">
                                     <ShieldAlert className="h-6 w-6" />
                                     <p className="text-xs font-medium italic">No manual override. System delivering automated GenAI guidance.</p>
                                 </div>
                              )}
                           </div>
                        </div>

                        {editingId === p.id ? (
                           <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-lg shadow-indigo-500/5">
                              <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Expert Guidance Input</label>
                              <textarea 
                                 className="w-full min-h-[100px] p-3 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all resize-none"
                                 placeholder="Type your manual treatment instructions or advisory override here..."
                                 value={overrideText}
                                 onChange={(e) => setOverrideText(e.target.value)}
                              />
                              <div className="flex justify-end gap-2">
                                 <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} disabled={isSubmitting}>Cancel</Button>
                                 <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20" onClick={() => handleSaveOverride(p.id)} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                                    Apply Override
                                 </Button>
                              </div>
                           </div>
                        ) : (
                           <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 h-10 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all rounded-lg group"
                              onClick={() => {
                                 setEditingId(p.id);
                                 setOverrideText(p.treatment_override || "");
                              }}
                           >
                              <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {p.treatment_override ? "Edit Advisory Override" : "Override Advisory"}
                              </span>
                           </Button>
                        )}
                     </div>
                  </div>
               </CardContent>
               <CardFooter className="bg-slate-50/30 dark:bg-zinc-900/20 py-3 px-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                     <User className="h-3 w-3" />
                     Requester: <span className="text-slate-600 dark:text-slate-400">Farmer-#{p.user_id}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium italic">
                    Source: Mobile Vision App v2.1
                  </div>
               </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
