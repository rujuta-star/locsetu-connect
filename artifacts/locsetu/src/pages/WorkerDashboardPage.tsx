import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useListJobs, useGetMyWorkerProfile, useUpdateWorkerProfile } from "@workspace/api-client-react";
import { useAcceptJob, useRejectJob, useCompleteJob } from "@/lib/api-compat";
import { getGetMyWorkerProfileQueryKey, getListJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, Briefcase, CheckCircle, Clock, XCircle, User, TrendingUp, Shield } from "lucide-react";
import TrustBadge, { TrustMeter } from "@/components/TrustBadge";

export default function WorkerDashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { t } = useLanguage();

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    open: { label: t("status_open"), color: "bg-blue-100 text-blue-700" },
    assigned: { label: t("status_assigned"), color: "bg-yellow-100 text-yellow-700" },
    in_progress: { label: t("status_in_progress"), color: "bg-orange-100 text-orange-700" },
    completed: { label: t("status_completed"), color: "bg-green-100 text-green-700" },
    cancelled: { label: t("status_cancelled"), color: "bg-red-100 text-red-700" },
  };

  const { data: profile, isLoading: profileLoading } = useGetMyWorkerProfile();
  const { data: jobs, isLoading: jobsLoading } = useListJobs();

  const updateProfile = useUpdateWorkerProfile({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMyWorkerProfileQueryKey() }) }
  });
  const acceptJob = useAcceptJob({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListJobsQueryKey() }),
      onError: () => alert(t("jobAcceptError")),
    }
  });
  const rejectJob = useRejectJob({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListJobsQueryKey() }),
      onError: () => alert(t("jobRejectError")),
    }
  });
  const completeJob = useCompleteJob({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListJobsQueryKey() }),
      onError: () => alert(t("jobCompleteError")),
    }
  });

  const toggleAvailability = () => {
    if (!profile) return;
    updateProfile.mutate({ data: { isAvailable: !profile.isAvailable } });
  };

  const pendingJobs = jobs?.filter(j => j.status === "open" || j.status === "assigned") ?? [];
  const activeJobs = jobs?.filter(j => j.status === "in_progress") ?? [];
  const completedJobs = jobs?.filter(j => j.status === "completed") ?? [];

  const profileComplete = profile && profile.skills.length > 0 && profile.location && profile.bio;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("workerDashboard")}</h1>
          <p className="text-muted-foreground text-sm">{t("welcomeBack")}, {user?.name?.split(" ")[0]}</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="availability" className="text-sm text-muted-foreground">
            {profile?.isAvailable ? t("available") : t("busy")}
          </Label>
          <Switch
            id="availability"
            checked={profile?.isAvailable ?? false}
            onCheckedChange={toggleAvailability}
            disabled={updateProfile.isPending}
          />
        </div>
      </div>

      {/* Profile incomplete banner */}
      {!profileLoading && !profileComplete && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium text-sm text-orange-800">{t("completeProfileTitle")}</p>
                <p className="text-xs text-orange-600">{t("completeProfileDesc")}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/profile")}
              className="border-orange-300 text-orange-700 hover:bg-orange-100 flex-shrink-0">
              {t("goToProfile")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {[
          { label: t("rating"), value: profile?.rating.toFixed(1) ?? "-", icon: Star, color: "text-amber-500" },
          { label: t("reviews"), value: profile?.reviewCount ?? 0, icon: TrendingUp, color: "text-blue-600" },
          { label: t("status_completed"), value: profile?.completedJobs ?? 0, icon: CheckCircle, color: "text-green-600" },
          { label: t("activeJobsTab"), value: activeJobs.length, icon: Briefcase, color: "text-primary" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trust Score banner */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div>
                      <p className="font-semibold text-sm">{t("workerTrustTitle")}</p>
                      <p className="text-xs text-muted-foreground">{t("workerTrustDesc")}</p>
                    </div>
                    <TrustBadge score={(profile as any).trustScore ?? 0} size="md" showScore showLabel />
                  </div>
                  <TrustMeter score={(profile as any).trustScore ?? 0} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming requests */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">{t("newRequests")}</h2>
          {jobsLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          ) : pendingJobs.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("noNewRequests")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingJobs.map(job => (
                <motion.div key={job.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium">{job.title}</h3>
                          <p className="text-sm text-muted-foreground capitalize mt-0.5">
                            {job.skill} · {job.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{t("byCustomer")} #{job.customerId}</p>
                          {job.budget && <p className="text-sm font-medium text-primary mt-1">{t("budgetLabel")}: ₹{job.budget}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[job.status].color}`}>
                          {STATUS_CONFIG[job.status].label}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1"
                          onClick={() => acceptJob.mutate(job.id)}
                          disabled={acceptJob.isPending}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> {t("acceptJob")}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive"
                          onClick={() => rejectJob.mutate(job.id)}
                          disabled={rejectJob.isPending}>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> {t("rejectJob")}
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => navigate(`/jobs/${job.id}`)}>{ t("viewDetails")}</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Active jobs */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">{t("activeJobsTab")}</h2>
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("noActiveJobs")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeJobs.map(job => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-muted-foreground capitalize mt-0.5">{job.skill} · {job.location}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("byCustomer")} #{job.customerId}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1"
                        onClick={() => completeJob.mutate(job.id)}
                        disabled={completeJob.isPending}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> {t("markComplete")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/jobs/${job.id}`)}>{t("viewDetails")}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {completedJobs.length > 0 && (
            <>
              <h2 className="font-semibold text-lg pt-2">{t("recentCompleted")}</h2>
              <div className="space-y-2">
                {completedJobs.slice(0, 3).map(job => (
                  <Card key={job.id} className="opacity-70 cursor-pointer hover:opacity-100"
                    onClick={() => navigate(`/jobs/${job.id}`)}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{job.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{job.skill}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
