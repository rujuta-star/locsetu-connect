import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Briefcase, Star, IndianRupee, Clock, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function IncomeDashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const token = localStorage.getItem("auth_token");
    Promise.all([
      fetch("/api/jobs", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/workers/me", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([j, w]) => {
      setJobs(Array.isArray(j) ? j : []);
      setWorkerProfile(w);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== "worker") {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">{t("workersOnlyTitle")}</h2>
          <p className="text-muted-foreground">{t("incomeDashboardWorkersOnly")}</p>
        </div>
      </div>
    );
  }

  const completed = jobs.filter(j => j.status === "completed");
  const inProgress = jobs.filter(j => j.status === "in_progress");
  const totalEarnings = completed.reduce((sum, j) => sum + (j.budget ?? 0), 0);

  const now = new Date();
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthJobs = completed.filter(j => {
      const jd = new Date(j.completedAt ?? j.createdAt);
      return jd.getFullYear() === d.getFullYear() && jd.getMonth() === d.getMonth();
    });
    return {
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      earnings: monthJobs.reduce((s, j) => s + (j.budget ?? 0), 0),
      jobs: monthJobs.length,
    };
  });

  const skillCount: Record<string, number> = {};
  completed.forEach(j => { skillCount[j.skill] = (skillCount[j.skill] ?? 0) + 1; });
  const topSkill = Object.entries(skillCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const weeklyData = Array.from({ length: 4 }).map((_, i) => {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 3600 * 1000);
    const weekJobs = completed.filter(j => {
      const d = new Date(j.completedAt ?? j.createdAt);
      return d >= weekStart && d <= weekEnd;
    });
    return {
      week: `W${4 - i}`,
      earnings: weekJobs.reduce((s, j) => s + (j.budget ?? 0), 0),
      jobs: weekJobs.length,
    };
  }).reverse();

  const STATS = [
    { label: t("incomeTotalJobsDone"), value: completed.length, icon: Briefcase, color: "from-blue-500 to-indigo-600" },
    { label: t("incomeTotalEarnings"), value: `₹${totalEarnings.toLocaleString()}`, icon: IndianRupee, color: "from-green-500 to-emerald-600" },
    { label: t("incomeActiveJobs"), value: inProgress.length, icon: Clock, color: "from-amber-500 to-orange-600" },
    { label: t("incomeAvgRating"), value: workerProfile?.rating?.toFixed(1) ?? "—", icon: Star, color: "from-rose-500 to-pink-600" },
    { label: t("incomeTopSkill"), value: topSkill, icon: Award, color: "from-violet-500 to-purple-600", small: true },
    { label: t("incomeReviews"), value: workerProfile?.reviewCount ?? 0, icon: TrendingUp, color: "from-teal-500 to-cyan-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-green-700 to-emerald-800 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <TrendingUp className="w-8 h-8 mb-3" />
          <h1 className="text-3xl font-black mb-1">{t("incomeDashboard")}</h1>
          <p className="text-green-100">{t("trackEarningsPerformance")}</p>
          {workerProfile && (
            <Badge className="mt-3 bg-white/20 text-white border-white/30 capitalize">{workerProfile.verificationStatus}</Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={`font-black text-foreground mb-0.5 ${stat.small ? "text-lg" : "text-2xl"} capitalize`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Monthly Chart */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold mb-1">{t("monthlyEarningsLabel")}</h3>
              <p className="text-xs text-muted-foreground mb-5">{t("last6MonthsLabel")}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => [`₹${v}`, t("incomeTotalEarnings")]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Chart */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold mb-1">{t("weeklyJobsLabel")}</h3>
              <p className="text-xs text-muted-foreground mb-5">{t("last4WeeksLabel")}</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => [v, t("incomeActiveJobs")]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Bar dataKey="jobs" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Jobs */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold mb-4">{t("recentCompletedJobsTitle")}</h3>
              {completed.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {completed.slice(0, 5).map(job => (
                    <div key={job.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="font-semibold text-sm">{job.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{job.skill} · {job.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-sm">{job.budget ? `₹${job.budget}` : "—"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(job.completedAt ?? job.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">{t("noCompletedJobsYet")}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
