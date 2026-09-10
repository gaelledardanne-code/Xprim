import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import {
  InvalidSurveyStateError,
  closeSurvey,
  createSurvey,
  pauseSurvey,
  publishSurvey,
  updateSurvey,
} from "./surveyAdmin";

const baseInput = {
  title: "Mauritius Grocery Habits",
  description: "Tell us about your grocery shopping habits.",
  category: "Shopping",
  estimatedMinutes: 8,
  rewardPoints: 150,
  providerType: "MANUAL" as const,
  externalUrl: "https://example.com/survey/grocery",
};

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("createSurvey", () => {
  it("creates a draft survey with a provider and eligibility record", async () => {
    const survey = await createSurvey(baseInput);

    expect(survey.status).toBe("DRAFT");
    const withRelations = await prisma.survey.findUniqueOrThrow({
      where: { id: survey.id },
      include: { provider: true, eligibility: true },
    });
    expect(withRelations.provider.type).toBe("MANUAL");
    expect(withRelations.eligibility).not.toBeNull();
  });

  it("reuses an existing provider of the same type instead of duplicating it", async () => {
    await createSurvey(baseInput);
    await createSurvey({ ...baseInput, title: "Second survey" });

    const providers = await prisma.surveyProvider.findMany({ where: { type: "MANUAL" } });
    expect(providers).toHaveLength(1);
  });

  it("applies eligibility targeting when provided", async () => {
    const survey = await createSurvey({
      ...baseInput,
      targetCountries: ["MU"],
      minAge: 18,
      maxAge: 65,
      targetGenders: ["FEMALE"],
    });

    const eligibility = await prisma.surveyEligibility.findUniqueOrThrow({ where: { surveyId: survey.id } });
    expect(eligibility.countries).toEqual(["MU"]);
    expect(eligibility.minAge).toBe(18);
    expect(eligibility.maxAge).toBe(65);
    expect(eligibility.genders).toEqual(["FEMALE"]);
  });
});

describe("survey status transitions", () => {
  it("publishes a draft survey", async () => {
    const survey = await createSurvey(baseInput);

    const published = await publishSurvey(survey.id);

    expect(published.status).toBe("PUBLISHED");
  });

  it("pauses a published survey", async () => {
    const survey = await createSurvey(baseInput);
    await publishSurvey(survey.id);

    const paused = await pauseSurvey(survey.id);

    expect(paused.status).toBe("PAUSED");
  });

  it("closes a survey from published or paused", async () => {
    const survey = await createSurvey(baseInput);
    await publishSurvey(survey.id);

    const closed = await closeSurvey(survey.id);

    expect(closed.status).toBe("CLOSED");
  });

  it("refuses to publish a closed survey", async () => {
    const survey = await createSurvey(baseInput);
    await publishSurvey(survey.id);
    await closeSurvey(survey.id);

    await expect(publishSurvey(survey.id)).rejects.toThrow(InvalidSurveyStateError);
  });
});

describe("updateSurvey", () => {
  it("updates editable fields", async () => {
    const survey = await createSurvey(baseInput);

    const updated = await updateSurvey(survey.id, { rewardPoints: 300, estimatedMinutes: 10 });

    expect(updated.rewardPoints).toBe(300);
    expect(updated.estimatedMinutes).toBe(10);
  });
});
