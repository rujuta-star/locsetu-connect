import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrustBadge, { TrustMeter, getTrustTier, type TrustTier } from "./TrustBadge";
import { Shield, Star, Briefcase, UserCheck, User, TrendingDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TrustScoreCardProps {
  score: number;
  rating: number;
  completedJobs: number;
  verificationStatus: string;
  cancellationRate: number;
  profileCompletion: number;
}

const TIER_LABELS: Record<TrustTier, string> = {
  new: "New",
  rising: "Rising",
  trusted: "Trusted",
  top: "Top Rated",
};

const TIER_COLORS: Record<TrustTier, string> = {
  new:     "text-slate-500",
  rising:  "text-blue-600",
  trusted: "text-emerald-600",
  top:     "text-amber-500",
};

const TIER_BG: Record<TrustTier, string> = {
  new:     "from-slate-500/10",
  rising:  "from-blue-500/10",
  trusted: "from-emerald-500/10",
  top:     "from-amber-500/10",
};

export default function TrustScoreCard({
  score,
  rating,
  completedJobs,
  verificationStatus,
  cancellationRate,
  profileCompletion,
}: TrustScoreCardProps) {
  const { t } = useLanguage();
  const tier = getTrustTier(score);

  const factors = [
    {
      icon: Briefcase,
      label: t("trustFactorJobs"),
      value: Math.round(Math.min(completedJobs / 50, 1) * 25),
      max: 25,
      display: `${completedJobs} ${t("jobsDone")}`,
      color: "bg-blue-500",
    },
    {
      icon: Star,
      label: t("trustFactorRating"),
      value: Math.round((rating / 5) * 30),
      max: 30,
      display: `${rating.toFixed(1)} / 5`,
      color: "bg-amber-400",
    },
    {
      icon: UserCheck,
      label: t("trustFactorVerification"),
      value: verificationStatus === "approved" ? 20 : verificationStatus === "pending" ? 8 : 0,
      max: 20,
      display: verificationStatus === "approved" ? t("verificationApproved") : verificationStatus === "pending" ? t("verificationPending") : t("verificationNone"),
      color: "bg-emerald-500",
    },
    {
      icon: User,
      label: t("trustFactorProfile"),
      value: Math.round(profileCompletion * 15),
      max: 15,
      display: `${Math.round(profileCompletion * 100)}%`,
      color: "bg-violet-500",
    },
    {
      icon: TrendingDown,
      label: t("trustFactorCancellation"),
      value: Math.round((1 - Math.min(cancellationRate, 1)) * 10),
      max: 10,
      display: `${Math.round(cancellationRate * 100)}% ${t("cancellationRateLabel")}`,
      color: "bg-rose-500",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <Card className="overflow-hidden">
        <div className={`h-1.5 w-full bg-gradient-to-r ${TIER_BG[tier]} to-transparent`} />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            {t("trustScoreTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 text-center">
              <div className={`text-4xl font-black ${TIER_COLORS[tier]}`}>{score}</div>
              <div className="text-xs text-muted-foreground">{t("outOf100")}</div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${TIER_COLORS[tier]}`}>
                  {t(`trustTier${tier.charAt(0).toUpperCase() + tier.slice(1)}` as any)}
                </span>
                <TrustBadge score={score} size="sm" showScore={false} showLabel />
              </div>
              <TrustMeter score={score} />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0</span>
                <span>New</span>
                <span>Rising</span>
                <span>Trusted</span>
                <span>Top</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1 border-t border-border/60">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("scoreBreakdown")}</p>
            {factors.map(({ icon: Icon, label, value, max, display, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                    <span className="text-muted-foreground/50">· {display}</span>
                  </div>
                  <span className="font-semibold text-foreground">{value}<span className="text-muted-foreground font-normal">/{max}</span></span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
