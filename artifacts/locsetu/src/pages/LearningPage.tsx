import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Play, CheckCircle, Award, Clock, Zap, Droplets, Hammer, Smartphone, Scissors, CreditCard, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "electrician", label: "Electrician", icon: Zap },
  { id: "plumber", label: "Plumbing", icon: Droplets },
  { id: "carpenter", label: "Carpentry", icon: Hammer },
  { id: "mobile_repair", label: "Mobile Repair", icon: Smartphone },
  { id: "tailoring", label: "Tailoring", icon: Scissors },
  { id: "digital_payments", label: "Digital Payments", icon: CreditCard },
  { id: "small_business", label: "Business Skills", icon: TrendingUp },
];

const CAT_COLORS: Record<string, string> = {
  electrician: "from-amber-500 to-orange-600",
  plumber: "from-blue-500 to-cyan-600",
  carpenter: "from-green-500 to-emerald-600",
  mobile_repair: "from-violet-500 to-purple-600",
  tailoring: "from-rose-500 to-pink-600",
  digital_payments: "from-teal-500 to-green-600",
  small_business: "from-indigo-500 to-blue-600",
};

const LANG_LABELS: Record<string, string> = { en: "English", hi: "हिंदी", mr: "मराठी" };

export default function LearningPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeLang, setActiveLang] = useState("all");
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const [coursesRes, progressRes] = await Promise.all([
        fetch("/api/learning/courses"),
        user && token ? fetch("/api/learning/progress", { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
      ]);
      const coursesData = await coursesRes.json();
      setCourses(coursesData);
      if (progressRes) {
        const progressData = await progressRes.json();
        setProgress(progressData);
      }
      setLoaded(true);
    } catch {
      toast({ title: "Error loading courses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!loaded && !loading) loadCourses();

  const updateProgress = async (courseId: number, pct: number) => {
    if (!user) { toast({ title: "Login to track progress", variant: "destructive" }); return; }
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/learning/progress/${courseId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ progressPercent: pct }),
    });
    const data = await res.json();
    setProgress(prev => {
      const existing = prev.find(p => p.courseId === courseId);
      if (existing) return prev.map(p => p.courseId === courseId ? data : p);
      return [...prev, data];
    });
    if (pct >= 100) toast({ title: "Course Completed!", description: "Certificate has been issued." });
  };

  const getProgress = (courseId: number) => progress.find(p => p.courseId === courseId);

  const filtered = courses.filter(c => {
    if (activeCategory !== "all" && c.category !== activeCategory) return false;
    if (activeLang !== "all" && c.language !== activeLang) return false;
    return true;
  });

  const completedCount = progress.filter(p => p.progressPercent >= 100).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-violet-700 to-purple-800 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-black">Skill Learning Center</h1>
              <p className="text-violet-100 text-sm">Free courses · Certificates · Track progress</p>
            </div>
          </div>
          {user && (
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-black">{courses.length}</div>
                <div className="text-violet-200 text-xs">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black">{progress.filter(p => p.progressPercent > 0).length}</div>
                <div className="text-violet-200 text-xs">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black">{completedCount}</div>
                <div className="text-violet-200 text-xs">Completed</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  activeCategory === cat.id
                    ? "bg-violet-700 text-white shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-violet-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {["all", "en", "hi", "mr"].map(lang => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeLang === lang ? "bg-violet-700 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {lang === "all" ? "All Languages" : LANG_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Courses */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((course, i) => {
              const prog = getProgress(course.id);
              const pct = prog?.progressPercent ?? 0;
              const isComplete = pct >= 100;
              const color = CAT_COLORS[course.category] ?? "from-gray-500 to-gray-600";

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`h-2 bg-gradient-to-r ${color}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-base leading-tight">{course.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-xs rounded-full capitalize bg-violet-100 text-violet-700 border-violet-200">{course.category.replace("_", " ")}</Badge>
                          <span className="text-xs text-muted-foreground">{LANG_LABELS[course.language] ?? course.language}</span>
                        </div>
                      </div>
                      {isComplete && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{course.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{course.duration} min</span>
                      {course.isFree && <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full ml-1">Free</Badge>}
                    </div>

                    {pct > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-primary">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    )}

                    {isComplete ? (
                      <div className="flex items-center justify-center gap-2 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold">
                        <Award className="w-4 h-4" /> Certificate Earned
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateProgress(course.id, Math.min(100, pct + 25))}
                          className={`flex-1 rounded-xl bg-gradient-to-r ${color} text-white gap-1.5 text-xs`}
                        >
                          <Play className="w-3 h-3" /> {pct > 0 ? "Continue" : "Start"}
                        </Button>
                        {pct > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateProgress(course.id, 100)}
                            className="rounded-xl text-xs gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="w-3 h-3" /> Complete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
