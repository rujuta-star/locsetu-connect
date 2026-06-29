import { Link } from "wouter";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle, Briefcase, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import TrustBadge, { TrustMeter } from "./TrustBadge";

const AVATAR_GRADIENTS = [
  "from-orange-400 to-rose-500",
  "from-blue-400 to-violet-500",
  "from-green-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-purple-400 to-pink-500",
  "from-cyan-400 to-blue-500",
  "from-emerald-400 to-green-500",
  "from-red-400 to-orange-500",
];

interface Worker {
  id: number;
  userId: number;
  name: string;
  avatarUrl?: string | null;
  skills: string[];
  location: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isVerified: boolean;
  completedJobs: number;
  trustScore?: number;
  cancellationRate?: number;
  experience?: string | null;
  languages: string[];
  bio?: string | null;
  gender?: string | null;
  phone?: string | null;
  hourlyRate?: number | null;
}

export default function WorkerCard({ worker }: { worker: Worker }) {
  const { t } = useLanguage();
  const initials = worker.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const gradient = AVATAR_GRADIENTS[worker.id % AVATAR_GRADIENTS.length];
  const stars = Math.round(worker.rating);
  const score = worker.trustScore ?? 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-card border border-border hover:border-primary/30 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl" />

      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shadow-md`}>
              {worker.avatarUrl ? (
                <img src={worker.avatarUrl} alt={worker.name} className="w-full h-full object-cover rounded-2xl" />
              ) : initials}
            </div>
            {worker.isAvailable && (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-bold text-foreground truncate text-base">{worker.name}</h3>
                {worker.isVerified && (
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
              <Badge
                className={`flex-shrink-0 text-xs rounded-lg px-2 py-0 ${
                  worker.isAvailable
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {worker.isAvailable ? (
                  <><Zap className="w-2.5 h-2.5 mr-1" />{t("available")}</>
                ) : t("busy")}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">{worker.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({worker.reviewCount} {t("reviews")})</span>
            </div>
          </div>
        </div>

        {/* Trust score row */}
        <div className="flex items-center gap-2 mt-3">
          <TrustBadge score={score} size="sm" showScore showLabel={false} />
          <div className="flex-1">
            <TrustMeter score={score} />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">{score}/100</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {worker.skills.slice(0, 3).map(skill => (
            <span
              key={skill}
              className="text-xs font-medium bg-primary/8 text-primary border border-primary/15 rounded-lg px-2.5 py-0.5 capitalize"
            >
              {skill}
            </span>
          ))}
          {worker.skills.length > 3 && (
            <span className="text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-0.5">
              +{worker.skills.length - 3} {t("more")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate max-w-[100px]">{worker.location || "India"}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{worker.completedJobs} {t("jobsDone")}</span>
          </div>
          {worker.experience && (
            <div className="ml-auto text-xs font-medium text-primary">{worker.experience}</div>
          )}
        </div>

        <Link href={`/workers/${worker.id}`} className="block mt-3">
          <Button
            size="sm"
            className="w-full rounded-xl font-semibold bg-gradient-to-r from-primary to-orange-600 text-white hover:shadow-md transition-shadow"
          >
            {t("viewProfile")}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
