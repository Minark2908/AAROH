"use client";

import { useDetections, useUpdateDetectionStatus } from "@/hooks/useDetections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Bug, CheckCircle2, Clock, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicAssetBase } from "@/lib/publicAssetBase";

function statusBadge(status: string) {
  if (status === "Treated") {
    return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
  }
  return "bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/20";
}

export default function HistoryPage() {
  const assetBase = getPublicAssetBase();
  const { data, isLoading, error } = useDetections();
  const updateStatus = useUpdateDetectionStatus();
  const items = data?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        badgeIcon={ImageIcon}
        badgeText="Case Tracking"
        badgeVariant="primary"
        title="Image History"
        description="All pest detection scans, severity, and treatment status in one place."
      />

      {isLoading && (
        <div className="text-center py-20 text-muted-foreground animate-pulse">
          Loading detection history...
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center py-20 text-red-500">
          Failed to load history. Ensure you are signed in.
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          icon={Bug}
          title="No detections yet"
          description="Run your first scan in Pest Detection to start building your case history."
          action={
            <Button asChild className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white">
              <a href="/dashboard/pest-detection">Start a scan</a>
            </Button>
          }
        />
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((d) => (
            <Card key={d.id} className="glass-card hover-lift border-none shadow-soft rounded-2xl overflow-hidden">
              <div className="relative h-44 bg-muted/30">
                {d.image_url ? (
                  // Backend serves /uploads/... ; frontend axios baseURL handles API, but images are direct URL.
                  <img
                    src={`${assetBase}${d.image_url}`}
                    alt={d.pest_name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusBadge(d.status)}`}>
                    {d.status === "Treated" ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Treated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Pending
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-muted/20">
                <CardTitle className="text-base font-serif font-bold flex items-center gap-2">
                  <Bug className="h-5 w-5 text-[var(--color-primary)]" />
                  <span className="line-clamp-1">{d.pest_name}</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Confidence</span>
                  <span className="font-semibold">{Math.round(d.confidence * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Severity</span>
                  <span className="font-semibold">{d.severity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Risk Index</span>
                  <span className="font-semibold">{typeof d.risk_index === "number" ? d.risk_index : "-"}</span>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={updateStatus.isPending || d.status === "Pending"}
                    onClick={() => updateStatus.mutate({ id: d.id, status: "Pending" })}
                    isLoading={updateStatus.isPending && d.status !== "Pending"}
                  >
                    Mark Pending
                  </Button>
                  <Button
                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
                    disabled={updateStatus.isPending || d.status === "Treated"}
                    onClick={() => updateStatus.mutate({ id: d.id, status: "Treated" })}
                    isLoading={updateStatus.isPending && d.status !== "Treated"}
                  >
                    Mark Treated
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

