import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { Calendar, Check, Coffee, X, ChevronLeft, ChevronRight, Loader2, AlertCircle, Trash2, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type Status = "available" | "busy" | "holiday";

interface AvailabilityEntry {
  id: number;
  workerId: number;
  date: string;
  status: Status;
  note?: string | null;
}

const STATUS_CONFIG: Record<Status, {
  label: string;
  labelHi: string;
  gradient: string;
  glow: string;
  ringColor: string;
  textColor: string;
  icon: typeof Check;
}> = {
  available: {
    label: "Available",
    labelHi: "उपलब्ध",
    gradient: "from-emerald-400 to-cyan-500",
    glow: "shadow-emerald-500/40",
    ringColor: "ring-emerald-400",
    textColor: "text-emerald-400",
    icon: Check,
  },
  busy: {
    label: "Busy",
    labelHi: "व्यस्त",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/40",
    ringColor: "ring-violet-400",
    textColor: "text-violet-400",
    icon: X,
  },
  holiday: {
    label: "Holiday",
    labelHi: "छुट्टी",
    gradient: "from-sky-400 to-blue-600",
    glow: "shadow-sky-500/40",
    ringColor: "ring-sky-400",
    textColor: "text-sky-400",
    icon: Coffee,
  },
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function FloatingOrb({ x, y, size, color, delay }: { x: string; y: string; size: string; color: string; delay: number }) {
  return (
    <motion.div
      className={`absolute rounded-full ${color} blur-3xl opacity-20 pointer-events-none`}
      style={{ left: x, top: y, width: size, height: size }}
      animate={{ scale: [1, 1.2, 1], x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
      transition={{ duration: 8 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

export default function AvailabilityPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [workerId, setWorkerId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const fetchAvailability = useCallback(async (wId: number) => {
    try {
      const res = await fetch(`/api/availability/${wId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data: AvailabilityEntry[] = await res.json();
      setAvailability(data);
    } catch {
      toast({ title: "Could not load availability", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !token) { setLoadingProfile(false); return; }
    if (user.role !== "worker") { setLoadingProfile(false); return; }

    setLoadingProfile(true);
    fetch("/api/workers/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error("Profile not found"); return r.json(); })
      .then(profile => { setWorkerId(profile.id); return fetchAvailability(profile.id); })
      .catch(err => setProfileError(err.message))
      .finally(() => setLoadingProfile(false));
  }, [user, token, fetchAvailability]);

  const setStatus = useCallback(async (date: string, status: Status) => {
    if (!token) return;
    setSaving(date);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date, status }),
      });
      if (!res.ok) throw new Error("Failed");
      if (workerId) await fetchAvailability(workerId);
      toast({ title: `✓ Marked ${STATUS_CONFIG[status].label}`, description: date });
      setSelected(null);
    } catch {
      toast({ title: "Could not update", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }, [token, workerId, fetchAvailability, toast]);

  const clearStatus = async (date: string) => {
    if (!token) return;
    setSaving(date);
    try {
      await fetch(`/api/availability/${date}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setAvailability(prev => prev.filter(a => a.date !== date));
      toast({ title: "Cleared", description: date });
      setSelected(null);
    } catch {
      toast({ title: "Could not clear", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const getDateStatus = (dateStr: string): Status | null =>
    availability.find(a => a.date === dateStr)?.status ?? null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const monthLabel = currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const counts = {
    available: availability.filter(a => a.status === "available").length,
    busy: availability.filter(a => a.status === "busy").length,
    holiday: availability.filter(a => a.status === "holiday").length,
  };

  const markNext7 = () => {
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const str = d.toISOString().split("T")[0];
      setTimeout(() => setStatus(str, "available"), i * 180);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a1a]">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Sign in to continue</h2>
          <p className="text-slate-400 mb-8">Availability calendar is for registered workers.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-semibold hover:border-violet-500/60 transition-colors">
                Log In
              </motion.button>
            </Link>
            <Link href="/register">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold shadow-lg shadow-violet-500/30">
                Sign Up as Worker
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (user.role !== "worker") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a] px-4">
        <div className="text-center">
          <Calendar className="w-14 h-14 mx-auto mb-4 text-slate-600" />
          <h2 className="text-2xl font-bold text-white mb-2">Workers Only</h2>
          <p className="text-slate-400">Only worker accounts can manage availability.</p>
        </div>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="w-10 h-10 text-violet-400" />
        </motion.div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a] px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
          <AlertCircle className="w-14 h-14 mx-auto mb-4 text-red-400/60" />
          <h2 className="text-xl font-bold text-white mb-2">Profile Missing</h2>
          <p className="text-slate-400 mb-6">Complete your worker profile first.</p>
          <Link href="/worker-dashboard">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold">
              Go to Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f] relative overflow-hidden">
      {/* Background orbs */}
      <FloatingOrb x="5%" y="10%" size="400px" color="bg-violet-600" delay={0} />
      <FloatingOrb x="60%" y="5%" size="350px" color="bg-cyan-600" delay={2} />
      <FloatingOrb x="80%" y="60%" size="300px" color="bg-blue-700" delay={4} />
      <FloatingOrb x="10%" y="70%" size="280px" color="bg-indigo-600" delay={1} />

      {/* Header */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-12 pb-10 px-4 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-violet-500/40"
          >
            <Calendar className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            My Calendar
          </h1>
          <p className="text-slate-400 text-sm">Tap any date to set your work status</p>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-16 space-y-5">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {(["available", "busy", "holiday"] as Status[]).map((s, i) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                whileHover={{ scale: 1.04, y: -2 }}
                className={`relative overflow-hidden rounded-2xl p-4 text-center border border-white/5 bg-white/5 backdrop-blur-sm shadow-xl ${cfg.glow}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-10`} />
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                  <Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div className="text-2xl font-black text-white">{counts[s]}</div>
                <div className="text-xs text-slate-400 mt-0.5">{cfg.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Calendar card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-white/8 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <div className="flex items-center gap-3">
              <h2 className="font-bold text-lg text-white">{monthLabel}</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const d = new Date();
                  setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  setSelected(d.toISOString().split("T")[0]);
                }}
                className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-400/30 text-violet-300 font-semibold hover:from-violet-500/30 hover:to-cyan-500/30 transition-all"
              >
                Today
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors text-slate-300"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="p-4">
            {/* Weekday labels */}
            <div className="grid grid-cols-7 mb-3">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="text-center text-xs font-bold text-slate-500 py-1">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`p-${i}`} />)}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = getDateStr(day);
                const status = getDateStatus(dateStr);
                const isToday = dateStr === today;
                const isPast = dateStr < today;
                const isSelected = selected === dateStr;
                const isHovered = hoveredDay === day;
                const cfg = status ? STATUS_CONFIG[status] : null;

                return (
                  <motion.button
                    key={day}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: isPast ? 0.3 : 1, scale: 1 }}
                    transition={{ delay: i * 0.01, type: "spring", stiffness: 300, damping: 20 }}
                    whileHover={!isPast ? { scale: 1.18, zIndex: 10 } : {}}
                    whileTap={!isPast ? { scale: 0.88 } : {}}
                    onHoverStart={() => !isPast && setHoveredDay(day)}
                    onHoverEnd={() => setHoveredDay(null)}
                    onClick={() => {
                      if (isPast) return;
                      setSelected(isSelected ? null : dateStr);
                    }}
                    disabled={isPast || !!saving}
                    className={[
                      "relative aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all select-none",
                      isPast ? "cursor-not-allowed" : "cursor-pointer",
                      isSelected ? `ring-2 ${cfg ? cfg.ringColor : "ring-violet-400"} ring-offset-1 ring-offset-transparent` : "",
                    ].join(" ")}
                    style={{
                      background: status
                        ? undefined
                        : isSelected
                        ? "rgba(139,92,246,0.25)"
                        : isToday
                        ? "rgba(99,102,241,0.2)"
                        : "rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* Status gradient fill */}
                    {status && (
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${cfg!.gradient} opacity-${isPast ? "60" : "90"}`} />
                    )}

                    {/* Ripple on hover */}
                    {isHovered && !isPast && !status && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-white/8"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}

                    <span className={`relative z-10 ${status ? "text-white" : isToday ? "text-indigo-300 font-black" : "text-slate-300"}`}>
                      {saving === dateStr
                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                            <Loader2 className="w-3.5 h-3.5" />
                          </motion.div>
                        : day
                      }
                    </span>

                    {/* Today dot */}
                    {isToday && (
                      <motion.span
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-violet-400 rounded-full border-2 border-[#08080f]"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-5 px-5 py-3 border-t border-white/5 bg-white/[0.02]">
            {(["available", "busy", "holiday"] as Status[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${cfg.gradient}`} />
                  <span className="text-xs text-slate-500">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Status picker */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key="picker"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Set status for</p>
                  <p className="text-lg font-black text-white">{selected}</p>
                </div>
                {getDateStatus(selected) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => clearStatus(selected)}
                    disabled={!!saving}
                    className="flex items-center gap-1.5 text-xs text-red-400/80 border border-red-400/20 rounded-lg px-3 py-2 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </motion.button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(["available", "busy", "holiday"] as Status[]).map((s, i) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  const isCurrent = getDateStatus(selected) === s;

                  return (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.94 }}
                      disabled={!!saving}
                      onClick={() => setStatus(selected, s)}
                      className={[
                        "relative overflow-hidden flex flex-col items-center gap-2.5 py-5 rounded-2xl border transition-all disabled:opacity-60",
                        isCurrent
                          ? `border-transparent shadow-lg ${cfg.glow}`
                          : "border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.07]",
                      ].join(" ")}
                    >
                      {isCurrent && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-25`} />
                      )}
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg`}
                      >
                        {saving === selected
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                              <Loader2 className="w-5 h-5 text-white" />
                            </motion.div>
                          : <Icon className="w-5 h-5 text-white" />
                        }
                      </motion.div>
                      <div className="relative text-center">
                        <div className={`text-xs font-bold ${isCurrent ? "text-white" : "text-slate-300"}`}>{cfg.label}</div>
                        <div className="text-[10px] text-slate-500">{cfg.labelHi}</div>
                      </div>
                      {isCurrent && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/90 flex items-center justify-center"
                        >
                          <Check className="w-2.5 h-2.5 text-slate-900" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-violet-400" />
            <p className="text-sm font-semibold text-slate-200">Quick Actions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                const d = new Date();
                setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelected(d.toISOString().split("T")[0]);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/15 text-slate-300 text-xs font-semibold border border-white/8 hover:border-white/20 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              Select Today
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={markNext7}
              disabled={!!saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/20 text-emerald-300 text-xs font-semibold hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Next 7 Days Available
            </motion.button>

            {selected && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-xl text-slate-500 text-xs font-semibold hover:text-slate-300 transition-colors"
              >
                Deselect
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
