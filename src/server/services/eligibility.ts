import type { Profile, SurveyEligibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type EligibilityAwareSurvey = {
  maxResponses: number | null;
  eligibility: SurveyEligibility | null;
  _count: { participations: number };
};

type EligibilityAwareUser = {
  profile: Pick<Profile, "country" | "gender" | "dateOfBirth"> | null;
};

export function calculateAge(dateOfBirth: Date, now: Date): number {
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

/** True if the survey is under capacity and matches the user's basic profile targeting. */
export function surveyMatchesUser(
  survey: EligibilityAwareSurvey,
  user: EligibilityAwareUser,
  now: Date = new Date(),
): boolean {
  if (survey.maxResponses !== null && survey._count.participations >= survey.maxResponses) {
    return false;
  }

  const eligibility = survey.eligibility;
  if (!eligibility) return true;

  if (eligibility.countries.length > 0) {
    if (!user.profile?.country || !eligibility.countries.includes(user.profile.country)) {
      return false;
    }
  }

  if (eligibility.genders.length > 0) {
    if (!user.profile?.gender || !eligibility.genders.includes(user.profile.gender)) {
      return false;
    }
  }

  if (eligibility.minAge !== null || eligibility.maxAge !== null) {
    if (!user.profile?.dateOfBirth) return false;
    const age = calculateAge(user.profile.dateOfBirth, now);
    if (eligibility.minAge !== null && age < eligibility.minAge) return false;
    if (eligibility.maxAge !== null && age > eligibility.maxAge) return false;
  }

  return true;
}

export function isWithinSchedulingWindow(
  survey: { startDate: Date | null; endDate: Date | null },
  now: Date = new Date(),
): boolean {
  if (survey.startDate && survey.startDate > now) return false;
  if (survey.endDate && survey.endDate < now) return false;
  return true;
}

/**
 * Returns the published surveys a respondent is currently eligible for:
 * within their scheduling window, under capacity, matching basic profile
 * targeting, and not already started/completed by this user.
 */
export async function getEligibleSurveys(userId: string, now: Date = new Date()) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { profile: true },
  });

  const candidates = await prisma.survey.findMany({
    where: {
      status: "PUBLISHED",
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
      participations: { none: { userId } },
    },
    include: { eligibility: true, provider: true, _count: { select: { participations: { where: { status: "COMPLETED" } } } } },
    orderBy: { createdAt: "desc" },
  });

  return candidates.filter((survey) => surveyMatchesUser(survey, user, now));
}
