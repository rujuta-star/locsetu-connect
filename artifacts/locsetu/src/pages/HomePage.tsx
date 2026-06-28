import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WorkerCard from "@/components/WorkerCard";
import { useListSkills, useGetTopWorkers } from "@workspace/api-client-react";
import {
  Search, MapPin, Zap, Droplets, Hammer, Paintbrush, Scissors,
  Home, Car, Wrench, BookOpen, Monitor, Star, Shield, CheckCircle,
  ArrowRight, Sparkles, TrendingUp, Users, Clock, AlertTriangle,
  IndianRupee, GraduationCap, Phone, BookOpenCheck, Mic
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Droplets, Hammer, Paintbrush, Scissors, Home, Car, Wrench, BookOpen, Monitor,
};

const SKILL_COLORS = [
  "from-amber-400 to-orange-500", "from-blue-400 to-cyan-500", "from-green-400 to-emerald-500",
  "from-purple-400 to-violet-500", "from-rose-400 to-pink-500", "from-teal-400 to-green-500",
  "from-orange-400 to-red-500", "from-indigo-400 to-blue-500", "from-yellow-400 to-amber-500", "from-cyan-400 to-teal-500",
];

const STATS = [
  { value: 10000, suffix: "+", label: "Customers Served", icon: Users },
  { value: 500, suffix: "+", label: "Skilled Workers", icon: Hammer },
  { value: 4.8, suffix: "★", label: "Average Rating", icon: Star, isDecimal: true },
  { value: 48, suffix: "h", label: "Avg Response Time", icon: Clock },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Search & Filter", desc: "Find skilled workers by service type and your city in seconds.", icon: Search, color: "from-orange-400 to-primary" },
  { step: "02", title: "View & Compare", desc: "Check verified ratings, reviews, experience, and portfolio.", icon: Star, color: "from-blue-400 to-indigo-500" },
  { step: "03", title: "Hire & Relax", desc: "Post a job request and let the expert handle everything.", icon: CheckCircle, color: "from-green-400 to-emerald-500" },
];

const FEATURE_LINKS = [
  { href: "/emergency", label: "Emergency Help", labelHi: "आपातकालीन सहायता", icon: AlertTriangle, color: "from-red-500 to-rose-600", bg: "bg-red-50 border-red-200", textColor: "text-red-700" },
  { href: "/pricing", label: "Price Guide", labelHi: "मूल्य मार्गदर्शिका", icon: IndianRupee, color: "from-green-500 to-emerald-600", bg: "bg-green-50 border-green-200", textColor: "text-green-700" },
  { href: "/learn", label: "Skill Learning", labelHi: "कौशल सीखें", icon: GraduationCap, color: "from-violet-500 to-purple-600", bg: "bg-violet-50 border-violet-200", textColor: "text-violet-700" },
  { href: "/community", label: "Community Help", labelHi: "सामुदायिक सहायता", icon: Phone, color: "from-blue-500 to-indigo-600", bg: "bg-blue-50 border-blue-200", textColor: "text-blue-700" },
  { href: "/yojana", label: "Govt Schemes", labelHi: "सरकारी योजनाएं", icon: BookOpenCheck, color: "from-amber-500 to-orange-600", bg: "bg-amber-50 border-amber-200", textColor: "text-amber-700" },
  { href: "/sos", label: "SOS Alert", labelHi: "SOS अलर्ट", icon: Shield, color: "from-red-600 to-red-700", bg: "bg-red-50 border-red-200", textColor: "text-red-700" },
];

const FLOATING_WORKERS = [
  { name: "Raju", skill: "Electrician", rating: 4.9, color: "from-amber-400 to-orange-500", delay: 0 },
  { name: "Priya", skill: "Plumber", rating: 4.8, color: "from-blue-400 to-cyan-500", delay: 0.3 },
  { name: "Suresh", skill: "Carpenter", rating: 4.7, color: "from-green-400 to-emerald-500", delay: 0.6 },
];

function AnimatedCounter({ value, suffix, isDecimal }: { value: number; suffix: string; isDecimal?: boolean }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(current);
    }, 1800 / steps);
    return () => clearInterval(timer);
  }, [inView, value]);
  return <span ref={ref}>{isDecimal ? display.toFixed(1) : Math.floor(display).toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [listening, setListening] = useState(false);
  const [, navigate] = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);
  const { data: skills } = useListSkills();
  const { data: topWorkers, isLoading: workersLoading } = useGetTopWorkers();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (skill) params.set("skill", skill);
    if (location) params.set("location", location);
    navigate(`/search?${params.toString()}`);
  };

  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice search not supported in your browser");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSkill(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#0f0f0f]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px]" />
          <motion.div animate={{ x: [0, -50, 0], y: [0, 40, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-600/20 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 w-full py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white/90 text-sm font-medium">India's #1 Hyperlocal Marketplace</span>
                </div>
                <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.05] mb-6">
                  Find Skilled{" "}
                  <span className="relative">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400">Workers</span>
                    <motion.div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary to-amber-400 rounded-full"
                      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6 }} />
                  </span>
                  <br /><span className="text-white/90">Near You</span>
                </h1>
                <p className="text-white/60 text-lg mb-8 max-w-lg leading-relaxed">
                  Connect with verified electricians, plumbers, carpenters and more — right in your neighborhood, instantly.
                </p>

                {/* Search box */}
                <motion.form onSubmit={handleSearch} animate={{ scale: searchFocused ? 1.01 : 1 }} transition={{ duration: 0.2 }} className="relative">
                  <div className="bg-white rounded-2xl shadow-[0_0_60px_rgba(249,115,22,0.3)] flex flex-col sm:flex-row overflow-hidden">
                    <div className="flex-1 flex items-center gap-3 px-5 py-4">
                      <Search className="w-5 h-5 text-primary flex-shrink-0" />
                      <input type="text" placeholder="What service do you need?" value={skill}
                        onChange={e => setSkill(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                        className="flex-1 outline-none text-foreground bg-transparent placeholder:text-muted-foreground text-sm font-medium" />
                      <button type="button" onClick={startVoiceSearch}
                        className={`p-1.5 rounded-full transition-all ${listening ? "bg-red-100 text-red-600 animate-pulse" : "hover:bg-muted text-muted-foreground"}`}
                        title="Voice search">
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-4 border-t sm:border-t-0 sm:border-l border-border/40">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                      <input type="text" placeholder="Your city or area" value={location}
                        onChange={e => setLocation(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                        className="flex-1 outline-none text-foreground bg-transparent placeholder:text-muted-foreground text-sm font-medium" />
                    </div>
                    <div className="p-2">
                      <Button type="submit" size="lg" className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white font-bold px-8 h-full shadow-none border-0">
                        Search
                      </Button>
                    </div>
                  </div>
                </motion.form>

                {/* Emergency CTA */}
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                  onClick={() => navigate("/emergency")}
                  className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors shadow-lg shadow-red-900/30">
                  <AlertTriangle className="w-4 h-4 animate-pulse" /> Emergency Help — Get Worker in Minutes
                </motion.button>

                <div className="flex flex-wrap gap-2 mt-4">
                  {["Electrician", "Plumber", "Carpenter", "Painter"].map((s, i) => (
                    <motion.button key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.1 }}
                      onClick={() => navigate(`/search?skill=${s.toLowerCase()}`)}
                      className="text-xs text-white/70 border border-white/20 hover:border-primary hover:text-white rounded-full px-3 py-1 transition-all hover:bg-white/10">
                      {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="relative hidden lg:flex items-center justify-center h-[420px]">
              {FLOATING_WORKERS.map((w, i) => (
                <motion.div key={w.name}
                  initial={{ opacity: 0, y: 40, x: i === 1 ? 0 : i === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, y: [0, -12, 0], x: i === 1 ? 0 : i === 0 ? -20 : 20 }}
                  transition={{ opacity: { delay: w.delay + 0.4, duration: 0.6 }, y: { delay: w.delay + 0.4, duration: 3 + i, repeat: Infinity, ease: "easeInOut" }, x: { delay: w.delay + 0.4, duration: 0.6 } }}
                  className={`absolute ${i === 0 ? "top-10 left-8" : i === 1 ? "top-1/2 -translate-y-1/2 right-4" : "bottom-16 left-16"}`}>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 shadow-xl min-w-[180px]">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${w.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {w.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{w.name}</p>
                      <p className="text-white/60 text-xs">{w.skill}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400 text-xs font-medium">{w.rating}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border border-primary/30 border-dashed absolute" />
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                className="w-20 h-20 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.5)]">
                <span className="text-white font-black text-lg">L</span>
              </motion.div>
            </div>
          </div>

          {/* Stats bar */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} isDecimal={stat.isDecimal} />
                  </div>
                  <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── QUICK FEATURE LINKS ───────────────────────────────── */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 rounded-full px-4">Platform Features</Badge>
            <h2 className="text-3xl font-black">Everything You Need</h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {FEATURE_LINKS.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.button key={feat.href} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(feat.href)}
                  className={`flex items-center gap-3 p-4 border-2 rounded-2xl hover:shadow-md transition-all text-left ${feat.bg}`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${feat.textColor}`}>{feat.label}</p>
                    <p className="text-xs text-muted-foreground">{feat.labelHi}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SERVICE CATEGORIES ───────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 rounded-full px-4">Services</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">Browse by Service</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Every skill you need, one click away</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {(skills ?? []).map((s, i) => {
              const Icon = ICON_MAP[s.icon] ?? Wrench;
              const gradient = SKILL_COLORS[i % SKILL_COLORS.length];
              return (
                <motion.button key={s.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }} whileHover={{ y: -6, scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/search?skill=${s.id}`)}
                  className="group relative flex flex-col items-center gap-3 p-5 bg-card rounded-2xl border border-border hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{s.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-background relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 rounded-full px-4">How it works</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">Get Help in 3 Steps</h2>
            <p className="text-muted-foreground">Simple, fast, reliable</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.18 }}
                  className="relative bg-card border border-border rounded-3xl p-8 text-center group hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background border border-border rounded-full px-3 py-0.5 text-xs font-bold text-muted-foreground">{step.step}</div>
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg group-hover:scale-105 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TOP WORKERS ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 rounded-full px-4">Top Rated</Badge>
              <h2 className="text-3xl sm:text-4xl font-black">Verified Professionals</h2>
              <p className="text-muted-foreground mt-1">Trusted by thousands of customers</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/search")} className="gap-2 self-start sm:self-auto rounded-xl font-semibold hover:border-primary hover:text-primary transition-colors">
              View All Workers <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
          {workersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 bg-muted rounded-3xl animate-pulse" />)}
            </div>
          ) : topWorkers && topWorkers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {topWorkers.slice(0, 6).map((worker, i) => (
                <motion.div key={worker.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <WorkerCard worker={worker} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No workers yet. Be the first!</p>
              <Button onClick={() => navigate("/register")}>Join as Worker</Button>
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST BADGES ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "ID Verified", desc: "Every worker passes identity verification", color: "from-blue-400 to-indigo-500" },
              { icon: Star, title: "Real Reviews", desc: "Authentic ratings from verified customers", color: "from-amber-400 to-orange-500" },
              { icon: TrendingUp, title: "Guaranteed Quality", desc: "We stand behind every service booked", color: "from-green-400 to-emerald-500" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="flex flex-col items-center text-center gap-4 bg-card border border-border rounded-3xl p-8 hover:shadow-lg transition-shadow">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WORKER CTA ───────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[#0f0f0f]" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-6 rounded-full px-4">Join LocSetu</Badge>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Are You a Skilled Worker?</h2>
            <p className="text-white/60 text-lg mb-8">Join thousands of workers earning more by connecting with customers near you. Free to join — start earning today.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/register")}
                className="bg-gradient-to-r from-primary to-orange-600 text-white font-bold px-8 rounded-xl text-base shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)]">
                Register as Worker
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/learn")}
                className="border-white/20 text-white hover:bg-white/10 rounded-xl px-8 text-base gap-2">
                <GraduationCap className="w-5 h-5" /> Learn New Skills
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
