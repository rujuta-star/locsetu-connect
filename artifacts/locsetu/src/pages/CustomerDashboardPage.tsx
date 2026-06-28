import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useListJobs, useListSavedWorkers } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Heart, Briefcase, Clock, CheckCircle, XCircle, Star } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", icon: <Clock className="w-3 h-3" /> },
  assigned: { label: "Assigned", color: "bg-yellow-100 text-yellow-700", icon: <Briefcase className="w-3 h-3" /> },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-700", icon: <Briefcase className="w-3 h-3" /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
};

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: jobs, isLoading: jobsLoading } = useListJobs();
  const { data: savedWorkers } = useListSavedWorkers();

  const activeJobs = jobs?.filter(j => ["open", "assigned", "in_progress"].includes(j.status)) ?? [];
  const completedJobs = jobs?.filter(j => j.status === "completed") ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm">Manage your jobs and find workers</p>
        </div>
        <Button onClick={() => navigate("/jobs/new")} className="gap-2">
          <Plus className="w-4 h-4" /> Post a Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Jobs", value: jobs?.length ?? 0, icon: Briefcase, color: "text-blue-600" },
          { label: "Active", value: activeJobs.length, icon: Clock, color: "text-orange-600" },
          { label: "Completed", value: completedJobs.length, icon: CheckCircle, color: "text-green-600" },
          { label: "Saved Workers", value: savedWorkers?.length ?? 0, icon: Heart, color: "text-red-500" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Active Jobs</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/search")}>
              <Search className="w-4 h-4 mr-1" /> Find Workers
            </Button>
          </div>

          {jobsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : activeJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No active jobs yet</p>
                <Button onClick={() => navigate("/jobs/new")}>Post Your First Job</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeJobs.map(job => {
                const cfg = STATUS_CONFIG[job.status];
                return (
                  <motion.div key={job.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium truncate">{job.title}</h3>
                              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 capitalize">{job.skill} · {job.location}</p>
                            {job.workerId && (
                              <p className="text-sm text-primary mt-1">Worker assigned</p>
                            )}
                          </div>
                          {job.budget && (
                            <span className="font-semibold text-sm flex-shrink-0">₹{job.budget}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-IN") : ""}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Recent completed */}
          {completedJobs.length > 0 && (
            <>
              <h2 className="font-semibold text-lg pt-2">Recent Completed</h2>
              <div className="space-y-3">
                {completedJobs.slice(0, 3).map(job => (
                  <Card key={job.id} className="opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => navigate(`/jobs/${job.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm">{job.title}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{job.skill} · {job.location}</p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Saved Workers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Saved Workers</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/saved")}>View all</Button>
          </div>

          {!savedWorkers || savedWorkers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No saved workers</p>
                <Button size="sm" variant="outline" onClick={() => navigate("/search")}>Browse Workers</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {savedWorkers.slice(0, 5).map(w => (
                <Card key={w.id} className="cursor-pointer hover:shadow-sm" onClick={() => navigate(`/workers/${w.id}`)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={w.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {w.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground truncate capitalize">{w.skills.slice(0, 2).join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs">{w.rating.toFixed(1)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
