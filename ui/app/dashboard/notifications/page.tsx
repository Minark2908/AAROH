"use client";

import { useMemo } from "react";
import { Bell, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { useLanguage } from "@/i18n/LanguageProvider";

function timeAgo(iso: string | null | undefined, t: (k: string, vars?: any) => string) {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diffMs = Date.now() - ts;
  if (diffMs < 45_000) return t("time.just_now");
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return t("time.minutes_ago", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("time.hours_ago", { count: hrs });
  const days = Math.floor(hrs / 24);
  return t("time.days_ago", { count: days });
}

function displayLevel(n: { level?: string | null; type?: string | null }) {
  const lvl = (n.level || "").toLowerCase();
  if (lvl === "critical") return "alert";
  if (lvl === "warning") return "warning";
  if (lvl === "info") return "info";
  const tpe = (n.type || "").toLowerCase();
  if (tpe.includes("alert")) return "alert";
  return tpe || "info";
}

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { data, isLoading, isFetching } = useNotifications();
  const markRead = useMarkNotificationRead();

  const notifications = data || [];
  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-4">
        <PageHeader
          badgeIcon={Bell}
          badgeText={t("common.notifications")}
          badgeVariant="primary"
          title={t("common.notifications")}
          description={unreadCount > 0 ? `${unreadCount} unread` : t("common.mark_all_read")}
        />
        {isFetching ? <span className="text-xs text-muted-foreground">{t("common.updating")}…</span> : null}
      </div>

      <Card className="glass-card border-white/40 dark:border-white/10 overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Inbox</span>
            {unreadCount === 0 ? (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
                <Check className="h-4 w-4" />
                {t("common.mark_all_read")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("common.no_notifications")}</div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.is_read) markRead.mutate(n.id);
                  }}
                  className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.is_read ? <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" /> : null}
                        <p className="text-sm font-semibold line-clamp-1">{n.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {displayLevel(n)}
                        {n.created_at ? <span className="opacity-70"> • {timeAgo(n.created_at, t)}</span> : null}
                      </p>
                    </div>
                    {!n.is_read ? (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 font-semibold">
                        Unread
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-muted/50 text-muted-foreground border border-border/50 font-semibold">
                        Read
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

