import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useListNotifications } from "@workspace/api-client-react";
import { useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/api-compat";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell, CheckCheck, Briefcase, Star, CheckCircle, AlertCircle, Info } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  job_request: <Briefcase className="w-4 h-4 text-blue-500" />,
  job_accepted: <CheckCircle className="w-4 h-4 text-green-500" />,
  job_completed: <CheckCircle className="w-4 h-4 text-green-600" />,
  job_cancelled: <AlertCircle className="w-4 h-4 text-red-500" />,
  review: <Star className="w-4 h-4 text-amber-500" />,
  general: <Info className="w-4 h-4 text-muted-foreground" />,
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { t } = useLanguage();
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) }
  });
  const markAllRead = useMarkAllNotificationsRead({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) }
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t("notifications")}</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
              {unreadCount} {t("newBadge")}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"
            onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck className="w-4 h-4" /> {t("markAllReadBtn")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t("noNotifications")}</h2>
          <p className="text-sm text-muted-foreground">{t("allCaughtUp")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className={`cursor-pointer transition-all ${!notif.isRead ? "border-primary/30 bg-primary/5" : "opacity-70 hover:opacity-100"}`}
                onClick={() => { if (!notif.isRead) markRead.mutate(notif.id); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      {TYPE_ICONS[notif.type] ?? TYPE_ICONS.general}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        }) : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
