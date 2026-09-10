import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { getEligibleSurveys } from "./eligibility";

async function createProvider() {
  return prisma.surveyProvider.create({
    data: { type: "MANUAL", name: "Manual / generic URL" },
  });
}

async function createUser(overrides: Partial<{ email: string; country: string; gender: "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY"; birthYear: number }> = {}) {
  const email = overrides.email ?? `user-${Math.random().toString(36).slice(2)}@xprim.test`;
  const birthYear = overrides.birthYear ?? 1995; // ~31 years old in 2026
  return prisma.user.create({
    data: {
      email,
      passwordHash: "x",
      firstName: "Test",
      lastName: "User",
      profile: {
        create: {
          country: overrides.country ?? "MU",
          gender: overrides.gender ?? "FEMALE",
          dateOfBirth: new Date(`${birthYear}-06-01`),
        },
      },
    },
  });
}

async function createSurvey(
  providerId: string,
  overrides: Partial<{
    status: "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED";
    startDate: Date | null;
    endDate: Date | null;
    maxResponses: number | null;
    countries: string[];
    minAge: number | null;
    maxAge: number | null;
    genders: ("MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY")[];
    title: string;
  }> = {},
) {
  return prisma.survey.create({
    data: {
      title: overrides.title ?? "Test Survey",
      description: "desc",
      category: "Shopping",
      estimatedMinutes: 8,
      rewardPoints: 150,
      providerId,
      externalUrl: "https://example.com/survey",
      status: overrides.status ?? "PUBLISHED",
      startDate: overrides.startDate ?? null,
      endDate: overrides.endDate ?? null,
      maxResponses: overrides.maxResponses ?? null,
      eligibility: {
        create: {
          countries: overrides.countries ?? [],
          minAge: overrides.minAge ?? null,
          maxAge: overrides.maxAge ?? null,
          genders: overrides.genders ?? [],
        },
      },
    },
  });
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("eligibility service", () => {
  it("shows a published survey with no targeting to any user", async () => {
    const provider = await createProvider();
    const user = await createUser();
    await createSurvey(provider.id);

    const surveys = await getEligibleSurveys(user.id);

    expect(surveys).toHaveLength(1);
  });

  it("excludes draft, paused and closed surveys", async () => {
    const provider = await createProvider();
    const user = await createUser();
    await createSurvey(provider.id, { status: "DRAFT" });
    await createSurvey(provider.id, { status: "PAUSED" });
    await createSurvey(provider.id, { status: "CLOSED" });

    const surveys = await getEligibleSurveys(user.id);

    expect(surveys).toHaveLength(0);
  });

  it("excludes surveys whose end date has passed", async () => {
    const provider = await createProvider();
    const user = await createUser();
    await createSurvey(provider.id, { endDate: new Date("2020-01-01") });

    const surveys = await getEligibleSurveys(user.id);

    expect(surveys).toHaveLength(0);
  });

  it("excludes surveys that have not started yet", async () => {
    const provider = await createProvider();
    const user = await createUser();
    await createSurvey(provider.id, { startDate: new Date("2099-01-01") });

    const surveys = await getEligibleSurveys(user.id);

    expect(surveys).toHaveLength(0);
  });

  it("excludes surveys that reached their max responses", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const other = await createUser();
    const survey = await createSurvey(provider.id, { maxResponses: 1 });
    await prisma.participation.create({
      data: {
        userId: other.id,
        surveyId: survey.id,
        status: "COMPLETED",
        provider: "MANUAL",
        completedAt: new Date(),
      },
    });

    const surveys = await getEligibleSurveys(user.id);

    expect(surveys).toHaveLength(0);
  });

  it("still shows a survey under capacity", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const other = await createUser();
    const survey = await createSurvey(provider.id, { maxResponses: 2 });
    await prisma.participation.create({
      data: {
        userId: other.id,
        surveyId: survey.id,
        status: "COMPLETED",
        provider: "MANUAL",
        completedAt: new Date(),
      },
    });

    const surveys = await getEligibleSurveys(user.id);

    expect(surveys).toHaveLength(1);
  });

  it("filters by target country", async () => {
    const provider = await createProvider();
    const mauritian = await createUser({ country: "MU" });
    const french = await createUser({ country: "FR" });
    await createSurvey(provider.id, { countries: ["MU"] });

    expect(await getEligibleSurveys(mauritian.id)).toHaveLength(1);
    expect(await getEligibleSurveys(french.id)).toHaveLength(0);
  });

  it("filters by age range", async () => {
    const provider = await createProvider();
    const adult = await createUser({ birthYear: 1990 });
    const teen = await createUser({ birthYear: 2015 });
    await createSurvey(provider.id, { minAge: 18, maxAge: 65 });

    expect(await getEligibleSurveys(adult.id)).toHaveLength(1);
    expect(await getEligibleSurveys(teen.id)).toHaveLength(0);
  });

  it("filters by target gender", async () => {
    const provider = await createProvider();
    const female = await createUser({ gender: "FEMALE" });
    const male = await createUser({ gender: "MALE" });
    await createSurvey(provider.id, { genders: ["FEMALE"] });

    expect(await getEligibleSurveys(female.id)).toHaveLength(1);
    expect(await getEligibleSurveys(male.id)).toHaveLength(0);
  });

  it("excludes surveys the user has already started or completed", async () => {
    const provider = await createProvider();
    const user = await createUser();
    const survey = await createSurvey(provider.id);
    await prisma.participation.create({
      data: {
        userId: user.id,
        surveyId: survey.id,
        status: "STARTED",
        provider: "MANUAL",
      },
    });

    const surveys = await getEligibleSurveys(user.id);

    expect(surveys).toHaveLength(0);
  });

  it("combines multiple eligibility criteria correctly", async () => {
    const provider = await createProvider();
    const eligible = await createUser({ country: "MU", gender: "FEMALE", birthYear: 1995 });
    const wrongCountry = await createUser({ country: "FR", gender: "FEMALE", birthYear: 1995 });
    await createSurvey(provider.id, {
      countries: ["MU"],
      genders: ["FEMALE"],
      minAge: 18,
      maxAge: 65,
    });

    expect(await getEligibleSurveys(eligible.id)).toHaveLength(1);
    expect(await getEligibleSurveys(wrongCountry.id)).toHaveLength(0);
  });
});
