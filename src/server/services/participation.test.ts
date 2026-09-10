import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { getBalance } from "./points";
import {
  AlreadyParticipatingError,
  DuplicateCompletionError,
  SurveyExpiredError,
  SurveyNotAvailableError,
  completeSurvey,
  startSurvey,
} from "./participation";

async function createProvider() {
  return prisma.surveyProvider.create({
    data: { type: "MANUAL", name: "Manual / generic URL" },
  });
}

async function createUser(email = `user-${Math.random().toString(36).slice(2)}@xprim.test`) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: "x",
      firstName: "Test",
      lastName: "User",
      profile: { create: { country: "MU", gender: "FEMALE", dateOfBirth: new Date("1995-06-01") } },
    },
  });
}

async function createSurvey(
  providerId: string,
  overrides: Partial<{
    status: "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED";
    endDate: Date | null;
    maxResponses: number | null;
    rewardPoints: number;
  }> = {},
) {
  return prisma.survey.create({
    data: {
      title: "Test Survey",
      description: "desc",
      category: "Shopping",
      estimatedMinutes: 8,
      rewardPoints: overrides.rewardPoints ?? 150,
      providerId,
      externalUrl: "https://example.com/survey",
      status: overrides.status ?? "PUBLISHED",
      endDate: overrides.endDate ?? null,
      maxResponses: overrides.maxResponses ?? null,
      eligibility: { create: {} },
    },
  });
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("participation service", () => {
  it("creates a STARTED participation record when a user starts a survey", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const survey = await createSurvey(provider.id);

    const participation = await startSurvey({ userId: user.id, surveyId: survey.id });

    expect(participation.status).toBe("STARTED");
    expect(participation.userId).toBe(user.id);
    expect(participation.surveyId).toBe(survey.id);
  });

  it("refuses to start a survey that is not published", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const survey = await createSurvey(provider.id, { status: "PAUSED" });

    await expect(startSurvey({ userId: user.id, surveyId: survey.id })).rejects.toThrow(
      SurveyNotAvailableError,
    );
  });

  it("refuses to start the same survey twice for the same user", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const survey = await createSurvey(provider.id);

    await startSurvey({ userId: user.id, surveyId: survey.id });

    await expect(startSurvey({ userId: user.id, surveyId: survey.id })).rejects.toThrow(
      AlreadyParticipatingError,
    );
  });

  it("refuses to start a survey that is already at capacity", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const other = await createUser();
    const survey = await createSurvey(provider.id, { maxResponses: 1 });
    await prisma.participation.create({
      data: { userId: other.id, surveyId: survey.id, status: "COMPLETED", provider: "MANUAL", completedAt: new Date() },
    });

    await expect(startSurvey({ userId: user.id, surveyId: survey.id })).rejects.toThrow(
      SurveyNotAvailableError,
    );
  });

  it("awards the survey's reward points on completion", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const survey = await createSurvey(provider.id, { rewardPoints: 150 });
    await startSurvey({ userId: user.id, surveyId: survey.id });

    const participation = await completeSurvey({ userId: user.id, surveyId: survey.id });

    expect(participation.status).toBe("COMPLETED");
    expect(participation.rewardPoints).toBe(150);
    expect(await getBalance(user.id)).toBe(150);
  });

  it("records a point transaction linked to the participation", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const survey = await createSurvey(provider.id, { rewardPoints: 250 });
    await startSurvey({ userId: user.id, surveyId: survey.id });
    const participation = await completeSurvey({ userId: user.id, surveyId: survey.id });

    const transaction = await prisma.pointTransaction.findUnique({
      where: { participationId: participation.id },
    });

    expect(transaction?.amount).toBe(250);
    expect(transaction?.type).toBe("EARNED");
  });

  it("cannot complete the same survey twice", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const survey = await createSurvey(provider.id, { rewardPoints: 150 });
    await startSurvey({ userId: user.id, surveyId: survey.id });
    await completeSurvey({ userId: user.id, surveyId: survey.id });

    await expect(completeSurvey({ userId: user.id, surveyId: survey.id })).rejects.toThrow(
      DuplicateCompletionError,
    );

    expect(await getBalance(user.id)).toBe(150);
  });

  it("cannot complete a survey that was never started", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const survey = await createSurvey(provider.id);

    await expect(completeSurvey({ userId: user.id, surveyId: survey.id })).rejects.toThrow();
  });

  it("marks the participation EXPIRED and awards no points if the survey's end date has passed since starting", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const survey = await createSurvey(provider.id, {
      endDate: new Date(Date.now() + 1000 * 60), // 1 minute from now
    });
    await startSurvey({ userId: user.id, surveyId: survey.id });

    // simulate time passing beyond the survey's end date
    const future = new Date(Date.now() + 1000 * 60 * 60);

    await expect(
      completeSurvey({ userId: user.id, surveyId: survey.id, now: future }),
    ).rejects.toThrow(SurveyExpiredError);

    const participation = await prisma.participation.findUnique({
      where: { userId_surveyId: { userId: user.id, surveyId: survey.id } },
    });
    expect(participation?.status).toBe("EXPIRED");
    expect(await getBalance(user.id)).toBe(0);
  });

  it("does not exceed max responses when two users complete concurrently at the cap", async () => {
    const provider = await createProvider();
    const survey = await createSurvey(provider.id, { maxResponses: 1 });
    const userA = await createUser();
    const userB = await createUser();

    await startSurvey({ userId: userA.id, surveyId: survey.id });
    await completeSurvey({ userId: userA.id, surveyId: survey.id });

    await expect(startSurvey({ userId: userB.id, surveyId: survey.id })).rejects.toThrow(
      SurveyNotAvailableError,
    );
  });
});
