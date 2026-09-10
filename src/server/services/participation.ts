import { prisma } from "@/lib/prisma";
import { isWithinSchedulingWindow, surveyMatchesUser } from "./eligibility";
import { awardPoints } from "./points";

export class SurveyNotAvailableError extends Error {
  constructor(reason: string) {
    super(`Survey is not available: ${reason}`);
    this.name = "SurveyNotAvailableError";
  }
}

export class AlreadyParticipatingError extends Error {
  constructor() {
    super("A participation already exists for this user and survey");
    this.name = "AlreadyParticipatingError";
  }
}

export class DuplicateCompletionError extends Error {
  constructor() {
    super("This survey has already been completed by this user");
    this.name = "DuplicateCompletionError";
  }
}

export class SurveyExpiredError extends Error {
  constructor() {
    super("This survey's end date has passed");
    this.name = "SurveyExpiredError";
  }
}

export class ParticipationNotStartedError extends Error {
  constructor() {
    super("No started participation found for this user and survey");
    this.name = "ParticipationNotStartedError";
  }
}

async function loadSurveyForEligibility(surveyId: string) {
  return prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      provider: true,
      eligibility: true,
      _count: { select: { participations: { where: { status: "COMPLETED" } } } },
    },
  });
}

interface StartSurveyInput {
  userId: string;
  surveyId: string;
  ipHash?: string;
  userAgent?: string;
  now?: Date;
}

/**
 * Starts a survey for a user: validates the survey is published, within its
 * scheduling window, under capacity, and matches the user's basic profile
 * targeting, then creates the (single, unique) participation record.
 */
export async function startSurvey({ userId, surveyId, ipHash, userAgent, now = new Date() }: StartSurveyInput) {
  const survey = await loadSurveyForEligibility(surveyId);
  if (!survey) {
    throw new SurveyNotAvailableError("survey not found");
  }
  if (survey.status !== "PUBLISHED") {
    throw new SurveyNotAvailableError("survey is not published");
  }
  if (!isWithinSchedulingWindow(survey, now)) {
    throw new SurveyNotAvailableError("survey is outside its scheduling window");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { profile: true },
  });

  if (!surveyMatchesUser(survey, user, now)) {
    throw new SurveyNotAvailableError("survey is at capacity or does not match user profile");
  }

  const existing = await prisma.participation.findUnique({
    where: { userId_surveyId: { userId, surveyId } },
  });
  if (existing) {
    throw new AlreadyParticipatingError();
  }

  try {
    return await prisma.participation.create({
      data: {
        userId,
        surveyId,
        status: "STARTED",
        provider: survey.provider.type,
        startedAt: now,
        ipHash,
        userAgent,
      },
    });
  } catch (error) {
    // Unique constraint race: another concurrent request created it first.
    if (isUniqueConstraintError(error)) {
      throw new AlreadyParticipatingError();
    }
    throw error;
  }
}

interface CompleteSurveyInput {
  userId: string;
  surveyId: string;
  externalResponseId?: string;
  now?: Date;
}

/**
 * Marks a started participation as completed and awards the survey's reward
 * points, atomically. Rejects a survey whose end date has passed (marking
 * the participation EXPIRED instead) and rejects a second completion of the
 * same user+survey pair.
 */
export async function completeSurvey({ userId, surveyId, externalResponseId, now = new Date() }: CompleteSurveyInput) {
  const participation = await prisma.participation.findUnique({
    where: { userId_surveyId: { userId, surveyId } },
    include: { survey: true },
  });

  if (!participation) {
    throw new ParticipationNotStartedError();
  }
  if (participation.status === "COMPLETED") {
    throw new DuplicateCompletionError();
  }
  if (participation.status !== "STARTED") {
    throw new SurveyNotAvailableError(`participation is in status ${participation.status}`);
  }

  if (participation.survey.endDate && participation.survey.endDate < now) {
    await prisma.participation.update({
      where: { id: participation.id },
      data: { status: "EXPIRED" },
    });
    throw new SurveyExpiredError();
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.participation.update({
      where: { id: participation.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
        rewardPoints: participation.survey.rewardPoints,
        externalResponseId,
      },
    });

    await awardPoints({
      userId,
      amount: participation.survey.rewardPoints,
      reason: participation.survey.title,
      participationId: updated.id,
      tx,
    });

    return updated;
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}
