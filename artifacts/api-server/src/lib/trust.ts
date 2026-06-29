import { db, workerProfilesTable, jobsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export interface TrustInputs {
  completedJobs: number;
  rating: number;
  verificationStatus: string;
  cancellationRate: number;
  skills: string[];
  location: string;
  about: string | null | undefined;
  experience: string | null | undefined;
  languages: string[];
  idProofUrl: string | null | undefined;
}

export function computeTrustScore(inputs: TrustInputs): number {
  const {
    completedJobs,
    rating,
    verificationStatus,
    cancellationRate,
    skills,
    location,
    about,
    experience,
    languages,
    idProofUrl,
  } = inputs;

  const jobsScore = Math.min(completedJobs / 50, 1) * 25;

  const ratingScore = (rating / 5) * 30;

  const verificationScore =
    verificationStatus === "approved" ? 20 :
    verificationStatus === "pending" ? 8 : 0;

  const profileFields = [
    skills.length > 0,
    location.length > 0,
    !!about,
    !!experience,
    languages.length > 0,
    !!idProofUrl,
  ];
  const profileScore = (profileFields.filter(Boolean).length / 6) * 15;

  const cancellationScore = (1 - Math.min(cancellationRate, 1)) * 10;

  const total = jobsScore + ratingScore + verificationScore + profileScore + cancellationScore;
  return Math.round(Math.min(100, Math.max(0, total)));
}

export function trustTier(score: number): "new" | "rising" | "trusted" | "top" {
  if (score >= 80) return "top";
  if (score >= 60) return "trusted";
  if (score >= 40) return "rising";
  return "new";
}

export async function recalculateTrustScore(workerUserId: number): Promise<void> {
  const [wp] = await db.select().from(workerProfilesTable)
    .where(eq(workerProfilesTable.userId, workerUserId)).limit(1);
  if (!wp) return;

  const allJobs = await db.select().from(jobsTable)
    .where(eq(jobsTable.workerId, workerUserId));

  const nonOpenJobs = allJobs.filter(j => j.status !== "open" && j.status !== "assigned");
  const cancelledByWorkerJobs = allJobs.filter(j => j.status === "cancelled");
  const cancellationRate = nonOpenJobs.length > 0
    ? cancelledByWorkerJobs.length / nonOpenJobs.length
    : 0;

  const score = computeTrustScore({
    completedJobs: wp.completedJobs,
    rating: wp.rating,
    verificationStatus: wp.verificationStatus,
    cancellationRate,
    skills: wp.skills,
    location: wp.location,
    about: wp.about,
    experience: wp.experience,
    languages: wp.languages,
    idProofUrl: wp.idProofUrl,
  });

  await db.update(workerProfilesTable)
    .set({ trustScore: score, cancellationRate })
    .where(eq(workerProfilesTable.userId, workerUserId));
}
