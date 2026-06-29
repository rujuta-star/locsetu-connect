import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetTopWorkers } from "@workspace/api-client-react";
import { useGetAdminStats, useListPendingVerifications, useVerifyWorker, getListPendingVerificationsQueryKey, getGetAdminStatsQueryKey } from "@/lib/api-compat";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Briefcase, CheckCircle, TrendingUp, Shield, Star, UserCheck } from "lucide-react";

export default function AdminDashboardPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { t } = useLanguage();

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: topWorkers } = useGetTopWorkers();
  const { data: pendingWorkers, isLoading: pendingLoading } = useListPendingVerifications();

  const verifyWorker = useVerifyWorker({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPendingVerificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      }
    }
  });

  const STATS = stats ? [
    { label: t("totalUsersLabel"), value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t("workers"), value: stats.totalWorkers, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: t("customers"), value: stats.totalCustomers, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: t("totalJobs"), value: stats.totalJobs, icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50" },
    { label: t("status_completed"), value: stats.completedJobs, icon: CheckCircle, color: "text-green-700", bg: "bg-green-50" },
    { label: t("completionRate"), value: `${stats.completionRate}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: t("pendingVerify"), value: stats.pendingVerifications, icon: Shield, color: "text-amber-600", bg: "bg-amber-50" },
    { label: t("activeJobsLabel"), value: stats.activeJobs, icon: Briefcase, color: "text-cyan-600", bg: "bg-cyan-50" },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("adminDashboard")}</h1>
          <p className="text-muted-foreground text-sm">{t("platformOverview")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/users")}>{t("manageUsers")}</Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/workers")}>{t("adminVerifications")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          STATS.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              {t("pendingVerifications")}
              {(pendingWorkers?.length ?? 0) > 0 && (
                <Badge className="bg-amber-500 text-white">{pendingWorkers?.length}</Badge>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/workers")}>{t("viewAll")}</Button>
          </div>

          {pendingLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          ) : !pendingWorkers || pendingWorkers.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("allVerificationsProcessed")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingWorkers.slice(0, 4).map((worker: Record<string, any>) => (
                <Card key={worker.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={worker.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{worker.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{worker.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{worker.skills.slice(0, 2).join(", ")} · {worker.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => verifyWorker.mutate({ workerId: worker.userId, status: "approved" })}
                        disabled={verifyWorker.isPending}>
                        {t("approve")}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => verifyWorker.mutate({ workerId: worker.userId, status: "rejected" })}
                        disabled={verifyWorker.isPending}>
                        {t("reject")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> {t("topRatedWorkers")}
          </h2>
          <div className="space-y-2">
            {topWorkers?.slice(0, 8).map((worker, i) => (
              <Card key={worker.id} className="cursor-pointer hover:shadow-sm" onClick={() => navigate(`/workers/${worker.id}`)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={worker.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{worker.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm truncate">{worker.name}</p>
                      {worker.isVerified && <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize truncate">{worker.skills.slice(0, 2).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{worker.rating.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
