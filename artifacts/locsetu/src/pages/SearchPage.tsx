import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WorkerCard from "@/components/WorkerCard";
import { useListWorkers, useListSkills } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, MapPin, SlidersHorizontal, X, Users, Zap, Droplets, Hammer, Paintbrush, Scissors, Home, Car, Wrench, BookOpen, Monitor } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Droplets, Hammer, Paintbrush, Scissors, Home, Car, Wrench, BookOpen, Monitor,
};

const SKILL_COLORS: Record<string, string> = {
  electrician: "from-amber-400 to-orange-500",
  plumber: "from-blue-400 to-cyan-500",
  carpenter: "from-green-400 to-emerald-500",
  painter: "from-purple-400 to-violet-500",
  tailor: "from-rose-400 to-pink-500",
  maid: "from-teal-400 to-green-500",
  driver: "from-orange-400 to-red-500",
  mechanic: "from-indigo-400 to-blue-500",
  tutor: "from-yellow-400 to-amber-500",
  technician: "from-cyan-400 to-teal-500",
};

export default function SearchPage() {
  const { t } = useLanguage();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [skill, setSkill] = useState(params.get("skill") ?? "");
  const [city, setCity] = useState(params.get("location") ?? "");
  const [minRating, setMinRating] = useState<string>("");
  const [available, setAvailable] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: skills } = useListSkills();
  const { data, isLoading } = useListWorkers({
    skill: skill || undefined,
    location: city || undefined,
    available: available === "true" ? true : available === "false" ? false : undefined,
  });

  const allWorkers = data ?? [];
  const minRatingNum = minRating ? parseFloat(minRating) : 0;
  const filtered = minRatingNum > 0 ? allWorkers.filter(w => (w.rating ?? 0) >= minRatingNum) : allWorkers;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const workers = filtered.slice((page - 1) * pageSize, page * pageSize);
  const total = filtered.length;

  const clearFilters = () => { setSkill(""); setCity(""); setMinRating(""); setAvailable(""); setPage(1); };
  const hasFilters = !!(skill || city || minRating || available);

  return (
    <div className="min-h-screen bg-background">

      {/* Sticky search bar */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Skill search */}
            <div className="flex-1 flex items-center gap-3 bg-muted/80 border border-border focus-within:border-primary focus-within:bg-background rounded-2xl px-4 transition-all duration-200">
              <Search className="w-4 h-4 text-primary flex-shrink-0" />
              <input
                type="text"
                placeholder={t("searchWorkers")}
                value={skill}
                onChange={e => { setSkill(e.target.value); setPage(1); }}
                className="flex-1 bg-transparent outline-none text-sm py-3 text-foreground placeholder:text-muted-foreground font-medium"
              />
              {skill && (
                <button onClick={() => setSkill("")} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City search */}
            <div className="flex items-center gap-3 bg-muted/80 border border-border focus-within:border-primary focus-within:bg-background rounded-2xl px-4 sm:w-56 transition-all duration-200">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <input
                type="text"
                placeholder={t("filterCity")}
                value={city}
                onChange={e => { setCity(e.target.value); setPage(1); }}
                className="flex-1 bg-transparent outline-none text-sm py-3 text-foreground placeholder:text-muted-foreground font-medium"
              />
              {city && (
                <button onClick={() => setCity("")} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 flex-shrink-0 rounded-2xl font-medium transition-all ${
                showFilters || hasFilters
                  ? "border-primary text-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t("showFilters")}
              {hasFilters && (
                <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                  {[skill, city, minRating, available].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Advanced filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
                  <Select value={available} onValueChange={v => { setAvailable(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="w-44 rounded-xl">
                      <SelectValue placeholder="Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("anyAvailability")}</SelectItem>
                      <SelectItem value="true">{t("availableOnly")}</SelectItem>
                      <SelectItem value="false">{t("busy")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={minRating} onValueChange={v => { setMinRating(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="w-40 rounded-xl">
                      <SelectValue placeholder="Min Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allRatings")}</SelectItem>
                      <SelectItem value="4">{t("rating4Plus")}</SelectItem>
                      <SelectItem value="3">{t("rating3Plus")}</SelectItem>
                      <SelectItem value="2">{t("rating2Plus")}</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl"
                    >
                      <X className="w-3.5 h-3.5" /> {t("clearFilters")}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Skill category pills */}
      {skills && (
        <div className="bg-background border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSkill(""); setPage(1); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                !skill
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              All
            </motion.button>
            {skills.map((s, i) => {
              const Icon = ICON_MAP[s.icon] ?? Wrench;
              const active = skill === s.id;
              return (
                <motion.button
                  key={s.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSkill(active ? "" : s.id); setPage(1); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-card"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.name}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">
              {isLoading ? (
                <span className="text-muted-foreground">Searching...</span>
              ) : (
                <><strong>{total}</strong> worker{total !== 1 ? "s" : ""} found{skill ? ` for "${skill}"` : ""}{city ? ` in ${city}` : ""}</>
              )}
            </span>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 bg-muted rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Search className="w-9 h-9 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-xl mb-2">No workers found</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Try a different skill, city, or clear your filters to see all workers
            </p>
            {hasFilters && (
              <Button onClick={clearFilters} variant="outline" className="rounded-xl gap-2">
                <X className="w-4 h-4" /> Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {workers.map((worker, i) => (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <WorkerCard worker={worker} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-xl"
                >
                  ← Previous
                </Button>
                <span className="text-sm text-muted-foreground font-medium px-4 py-2 bg-muted rounded-xl">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-xl"
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
