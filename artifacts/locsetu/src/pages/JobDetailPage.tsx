import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useGetJob } from "@workspace/api-client-react";
import { useCancelJob, useAcceptJob, useRejectJob, useCompleteJob, useCreateReview } from "@/lib/api-compat";
import { getGetJobQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin, Calendar, Briefcase, CheckCircle, XCircle, Clock,
  Star, ArrowLeft
} from "lucide-react";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id ?? "0", 10);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReview, setShowReview] = useState(false);

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    open: { label: t("status_open"), color: "bg-blue-100 text-blue-700", icon: <Clock className="w-4 h-4" /> },
    assigned: { label: t("status_assigned"), color: "bg-yellow-100 text-yellow-700", icon: <Briefcase className="w-4 h-4" /> },
    in_progress: { label: t("status_in_progress"), color: "bg-orange-100 text-orange-700", icon: <Briefcase className="w-4 h-4" /> },
    completed: { label: t("status_completed"), color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-4 h-4" /> },
    cancelled: { label: t("status_cancelled"), color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" /> },
  };

  const { data: job, isLoading } = useGetJob(jobId);
  const cancelJob = useCancelJob({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) }) } });
  const acceptJob = useAcceptJob({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) }) } });
  const rejectJob = useRejectJob({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) }) } });
  const completeJob = useCompleteJob({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) }) } });
  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        setShowReview(false);
        qc.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">{t("jobNotFound")}</p>
        <Button onClick={() => navigate("/dashboard")}>{t("backToDashboard")}</Button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[job.status];
  const isCustomer = user?.id === job.customerId;
  const isWorker = user?.id === job.workerId;
  const canCancel = isCustomer && ["open", "assigned", "in_progress"].includes(job.status);
  const canAccept = isWorker && job.status === "assigned";
  const canComplete = isWorker && job.status === "in_progress";
  const canReview = isCustomer && job.status === "completed";

  const handleSubmitReview = () => {
    if (!job.workerId) return;
    createReview.mutate({
      workerId: job.workerId,
      rating: reviewRating,
      comment: reviewComment || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2 mb-4 -ml-2">
        <ArrowLeft className="w-4 h-4" /> {t("back")}
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-xl font-bold">{job.title}</h1>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ${cfg.color}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>

            <p className="text-muted-foreground text-sm mb-4">{job.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="capitalize">{job.skill}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-IN") : ""}</span>
              </div>
              {job.budget && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary">{t("budgetLabel")}: ₹{job.budget}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("people")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">C</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{t("customer")} #{job.customerId}</p>
                <p className="text-xs text-muted-foreground">{t("customer")}</p>
              </div>
            </div>
            {job.workerId && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">W</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{t("worker")} #{job.workerId}</p>
                    <p className="text-xs text-muted-foreground">{t("worker")}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          {canAccept && (
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => acceptJob.mutate(job.id)} disabled={acceptJob.isPending}>
                <CheckCircle className="w-4 h-4 mr-2" /> {t("acceptJobBtn")}
              </Button>
              <Button variant="outline" className="flex-1 text-destructive" onClick={() => rejectJob.mutate(job.id)} disabled={rejectJob.isPending}>
                <XCircle className="w-4 h-4 mr-2" /> {t("rejectJob")}
              </Button>
            </div>
          )}
          {canComplete && (
            <Button onClick={() => completeJob.mutate(job.id)} disabled={completeJob.isPending}>
              <CheckCircle className="w-4 h-4 mr-2" /> {t("markAsComplete")}
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" className="text-destructive hover:text-destructive"
              onClick={() => cancelJob.mutate(job.id)} disabled={cancelJob.isPending}>
              <XCircle className="w-4 h-4 mr-2" /> {t("cancelJob")}
            </Button>
          )}
          {canReview && !showReview && (
            <Button variant="outline" onClick={() => setShowReview(true)}>
              <Star className="w-4 h-4 mr-2" /> {t("leaveReview")}
            </Button>
          )}
        </div>

        {showReview && (
          <Card>
            <CardHeader><CardTitle className="text-base">{t("leaveReview")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("rating")}</Label>
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} type="button" onClick={() => setReviewRating(i)}>
                      <Star className={`w-7 h-7 transition-colors ${i <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>{t("commentOptional")}</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder={t("howWasExperience")}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} disabled={createReview.isPending} className="flex-1">
                  {createReview.isPending ? t("submitting") : t("submitReview")}
                </Button>
                <Button variant="outline" onClick={() => setShowReview(false)}>{t("cancel")}</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
