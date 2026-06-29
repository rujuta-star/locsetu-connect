import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useGetWorker, useGetWorkerReviews, useListSavedWorkers } from "@workspace/api-client-react";
import { useSaveWorker, useUnsaveWorker } from "@/lib/api-compat";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { getListSavedWorkersQueryKey } from "@workspace/api-client-react";
import {
  Star, MapPin, CheckCircle, Briefcase, Phone, MessageSquare,
  Heart, Plus, Calendar, Languages
} from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const workerId = parseInt(id ?? "0", 10);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: worker, isLoading } = useGetWorker(workerId);
  const { t } = useLanguage();
  const { data: reviews } = useGetWorkerReviews(workerId);
  const { data: savedWorkers } = useListSavedWorkers({ query: { enabled: !!user, queryKey: getListSavedWorkersQueryKey() } });

  const isSaved = savedWorkers?.some(w => w.id === workerId);
  const saveWorker = useSaveWorker({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListSavedWorkersQueryKey() }) } });
  const unsaveWorker = useUnsaveWorker({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListSavedWorkersQueryKey() }) } });

  const handleSave = () => {
    if (!user) { navigate("/login"); return; }
    if (isSaved) unsaveWorker.mutate({ workerId: worker!.userId });
    else saveWorker.mutate({ workerId: worker!.userId });
  };

  const handleHire = () => {
    if (!user) { navigate("/login"); return; }
    navigate(`/jobs/new?workerId=${worker?.userId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">{t("workerNotFound")}</h2>
        <Button onClick={() => navigate("/search")}>{t("backToSearch")}</Button>
      </div>
    );
  }

  const initials = worker.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="relative flex-shrink-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={worker.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {worker.isAvailable && (
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold">{worker.name}</h1>
                      {worker.isVerified && (
                        <div className="flex items-center gap-1 text-primary">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{t("workerVerified")}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">{worker.location || "Location not set"}</span>
                    </div>
                  </div>
                  <Badge variant={worker.isAvailable ? "default" : "secondary"}
                    className={worker.isAvailable ? "bg-green-500 hover:bg-green-600" : ""}>
                    {worker.isAvailable ? t("available") : t("busy")}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={worker.rating} />
                    <span className="font-semibold">{worker.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">({worker.reviewCount} {t("reviews")})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{worker.completedJobs} {t("jobsDone")}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {worker.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="capitalize">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={handleHire}>
                <Plus className="w-4 h-4 mr-2" />
                {t("hireNow")}
              </Button>
              {worker.phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${worker.phone}`} className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                </Button>
              )}
              {worker.phone && (
                <Button variant="outline" asChild>
                  <a href={`https://wa.me/91${worker.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </a>
                </Button>
              )}
              <Button
                variant={isSaved ? "default" : "outline"}
                onClick={handleSave}
                className={isSaved ? "bg-red-500 hover:bg-red-600 text-white" : ""}
              >
                <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? t("unsaveWorker") : t("saveWorker")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      {worker.bio && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("about")}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">{worker.bio}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Details */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("experience")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {worker.experience && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("experienceLabel")}</div>
                  <div className="text-sm">{worker.experience}</div>
                </div>
              </div>
            )}
            {worker.languages.length > 0 && (
              <div className="flex items-start gap-3">
                <Languages className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("spokenLanguages")}</div>
                  <div className="text-sm">{worker.languages.join(", ")}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Reviews */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("reviewsSection")} ({reviews?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!reviews || reviews.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">{t("noReviewsYet")}</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-muted">C</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">Customer #{review.customerId}</div>
                        <div className="flex items-center gap-1">
                          <StarRating rating={review.rating} />
                          <span className="text-xs text-muted-foreground">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-IN") : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground ml-11">{review.comment}</p>}
                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
