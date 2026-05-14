"use client";
import React, { useEffect, useState } from "react";
import { X, Bug, Loader2, Calendar, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { fetchUserHistory } from "@/api/adminApi";
import { AnimatePresence, motion } from "framer-motion";

interface Detection {
  id: number;
  pest_name: string;
  confidence: number;
  severity: string;
  risk_index: number;
  risk_level: string;
  timestamp: string;
  image_url?: string | null;
}

interface Props {
  userId: number;
  userName: string;
  open: boolean;
  onClose: () => void;
}

const SeverityIcon = ({ severity }: { severity: string }) => {
  const s = severity.toLowerCase();
  if (s === "high") return <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />;
  if (s === "medium") return <Info className="h-3.5 w-3.5 text-amber-500" />;
  return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
};

const severityBadge = (severity: string) => {
  const s = severity.toLowerCase();
  if (s === "high") return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
  if (s === "medium") return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
  return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30";
};

export function UserHistoryModal({ userId, userName, open, onClose }: Props) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchUserHistory(userId)
      .then(setDetections)
      .catch(() => setDetections([]))
      .finally(() => setLoading(false));
  }, [open, userId]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-zinc-950 shadow-2xl z-50 flex flex-col"
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Detection History</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{userName}</p>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Loading history...</p>
                </div>
              ) : detections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Bug className="h-12 w-12 opacity-20" />
                  <p className="text-sm font-medium">No detections found for this user.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    {detections.length} detection{detections.length !== 1 ? "s" : ""} found
                  </p>
                  {detections.map((d) => (
                    <div
                      key={d.id}
                      className="border border-slate-100 dark:border-white/8 rounded-xl p-4 hover:shadow-sm transition-shadow bg-white dark:bg-zinc-900/60 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                            <Bug className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white leading-none">
                              {d.pest_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Confidence: {(d.confidence * 100).toFixed(1)}% · Risk: {d.risk_index}
                            </p>
                          </div>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide shrink-0 ${severityBadge(d.severity)}`}>
                          <SeverityIcon severity={d.severity} />
                          {d.severity}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(d.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
