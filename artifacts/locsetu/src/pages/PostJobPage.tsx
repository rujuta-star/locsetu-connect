import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateJob, useListSkills, useGetWorker, getListJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle, Briefcase } from "lucide-react";
import TrustBadge from "@/components/TrustBadge";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Please describe the job in more detail"),
  skill: z.string().min(1, "Please select a skill"),
  location: z.string().min(2, "Location is required"),
  budget: z.string().optional(),
  scheduledAt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Surat", "Jaipur"];

export default function PostJobPage() {
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const qc = useQueryClient();
  const { t } = useLanguage();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const preselectedWorkerProfileId = params.get("workerId");
  const preselectedProfileIdNum = preselectedWorkerProfileId ? parseInt(preselectedWorkerProfileId, 10) : 0;

  const { data: skills } = useListSkills();
  const { data: preselectedWorker } = useGetWorker(preselectedProfileIdNum, {
    query: { enabled: !!preselectedWorkerProfileId && !isNaN(preselectedProfileIdNum) }
  });

  const createJob = useCreateJob({
    mutation: {
      onSuccess: (job) => {
        qc.invalidateQueries({ queryKey: getListJobsQueryKey() });
        navigate(`/jobs/${job.id}`);
      },
      onError: (err: any) => {
        setError(err?.data?.error ?? "Failed to post job. Please try again.");
      },
    }
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedSkill = watch("skill");

  const onSubmit = (data: FormData) => {
    setError("");
    createJob.mutate({
      data: {
        title: data.title,
        description: data.description,
        skill: data.skill,
        location: data.location,
        workerId: preselectedWorker ? preselectedWorker.userId : undefined,
        budget: data.budget ? parseFloat(data.budget) : undefined,
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("postAJob")}</h1>
            <p className="text-sm text-muted-foreground">{t("describeJobNeed")}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label>{t("serviceType")}</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {skills?.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setValue("skill", s.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all capitalize ${
                        selectedSkill === s.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                {errors.skill && <p className="text-xs text-destructive">{errors.skill.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">{t("jobTitle")}</Label>
                <Input id="title" placeholder={t("jobTitlePlaceholder")} {...register("title")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">{t("jobDescription")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("jobDescriptionPlaceholder")}
                  rows={4}
                  {...register("description")}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("cityLocation")}</Label>
                  <Select onValueChange={v => setValue("location", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectCity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="budget">{t("budgetOptionalLabel")}</Label>
                  <Input id="budget" type="number" placeholder={t("budgetPlaceholder")} {...register("budget")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="scheduledAt">{t("preferredDateOptional")}</Label>
                <Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} />
              </div>

              {preselectedWorker && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <p className="text-sm font-medium text-primary">{t("workerPreselectedNotice")}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {preselectedWorker.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{preselectedWorker.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{preselectedWorker.skills.slice(0, 2).join(", ")}</p>
                    </div>
                    <TrustBadge score={(preselectedWorker as any).trustScore ?? 0} size="sm" showScore showLabel />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex-1">
                  {t("cancel")}
                </Button>
                <Button type="submit" className="flex-1" disabled={createJob.isPending}>
                  {createJob.isPending ? t("posting") : t("postJob")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
