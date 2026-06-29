import { Shield, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type TrustTier = "new" | "rising" | "trusted" | "top";

export function getTrustTier(score: number): TrustTier {
  if (score >= 80) return "top";
  if (score >= 60) return "trusted";
  if (score >= 40) return "rising";
  return "new";
}

const TIER_CONFIG = {
  new:     { color: "text-slate-500",  bg: "bg-slate-100",    border: "border-slate-200",  ring: "bg-slate-400",    Icon: ShieldOff },
  rising:  { color: "text-blue-600",   bg: "bg-blue-50",      border: "border-blue-200",   ring: "bg-blue-500",     Icon: ShieldAlert },
  trusted: { color: "text-emerald-600",bg: "bg-emerald-50",   border: "border-emerald-200",ring: "bg-emerald-500",  Icon: ShieldCheck },
  top:     { color: "text-amber-600",  bg: "bg-amber-50",     border: "border-amber-200",  ring: "bg-amber-500",    Icon: Shield },
};

interface TrustBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  showLabel?: boolean;
}

export default function TrustBadge({ score, size = "sm", showScore = true, showLabel = false }: TrustBadgeProps) {
  const { t } = useLanguage();
  const tier = getTrustTier(score);
  const { color, bg, border, Icon } = TIER_CONFIG[tier];

  const tierLabels: Record<TrustTier, string> = {
    new: t("trustTierNew"),
    rising: t("trustTierRising"),
    trusted: t("trustTierTrusted"),
    top: t("trustTierTop"),
  };

  const iconSize = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  const textSize = size === "lg" ? "text-sm" : "text-xs";
  const padding = size === "lg" ? "px-3 py-1.5" : size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${bg} ${border} ${color} ${padding} ${textSize}`}>
      <Icon className={`${iconSize} flex-shrink-0`} />
      {showScore && <span>{score}</span>}
      {showLabel && <span>{tierLabels[tier]}</span>}
    </span>
  );
}

interface TrustMeterProps {
  score: number;
  className?: string;
}

export function TrustMeter({ score, className = "" }: TrustMeterProps) {
  const tier = getTrustTier(score);
  const { ring } = TIER_CONFIG[tier];
  return (
    <div className={`w-full bg-muted rounded-full h-1.5 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ${ring}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}
