import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { genderValues } from "./auth";

export class InvalidSurveyStateError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move a survey from ${from} to ${to}`);
    this.name = "InvalidSurveyStateError";
  }
}

const providerTypeValues = ["MANUAL", "SURVEYMONKEY"] as const;

export const createSurveySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  client: z.string().trim().optional(),
  category: z.string().trim().min(1),
  estimatedMinutes: z.coerce.number().int().positive(),
  rewardPoints: z.coerce.number().int().positive(),
  providerType: z.enum(providerTypeValues),
  externalUrl: z.string().url(),
  externalSurveyId: z.string().trim().optional(),
  completionUrl: z.string().url().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  maxResponses: z.coerce.number().int().positive().optional(),
  targetCountries: z.array(z.string().trim().length(2)).optional(),
  minAge: z.coerce.number().int().min(0).optional(),
  maxAge: z.coerce.number().int().min(0).optional(),
  targetGenders: z.array(z.enum(genderValues)).optional(),
  createdById: z.string().optional(),
});

export type CreateSurveyInput = z.input<typeof createSurveySchema>;

async function findOrCreateProvider(type: (typeof providerTypeValues)[number]) {
  const existing = await prisma.surveyProvider.findFirst({ where: { type } });
  if (existing) return existing;

  const name = type === "MANUAL" ? "Manual / generic external URL" : "SurveyMonkey";
  return prisma.surveyProvider.create({ data: { type, name } });
}

/** Creates a new survey in DRAFT status, along with its provider link and eligibility record. */
export async function createSurvey(input: CreateSurveyInput) {
  const data = createSurveySchema.parse(input);
  const provider = await findOrCreateProvider(data.providerType);

  return prisma.survey.create({
    data: {
      title: data.title,
      description: data.description,
      client: data.client,
      category: data.category,
      estimatedMinutes: data.estimatedMinutes,
      rewardPoints: data.rewardPoints,
      providerId: provider.id,
      externalUrl: data.externalUrl,
      externalSurveyId: data.externalSurveyId,
      completionUrl: data.completionUrl,
      startDate: data.startDate,
      endDate: data.endDate,
      maxResponses: data.maxResponses,
      createdById: data.createdById,
      status: "DRAFT",
      eligibility: {
        create: {
          countries: data.targetCountries ?? [],
          minAge: data.minAge ?? null,
          maxAge: data.maxAge ?? null,
          genders: data.targetGenders ?? [],
        },
      },
    },
  });
}

export const updateSurveySchema = createSurveySchema
  .omit({ providerType: true, createdById: true })
  .partial();

export type UpdateSurveyInput = z.input<typeof updateSurveySchema>;

/** Updates a survey's editable fields (not its status — use the transition functions for that). */
export async function updateSurvey(surveyId: string, input: UpdateSurveyInput) {
  const data = updateSurveySchema.parse(input);
  const { targetCountries, minAge, maxAge, targetGenders, ...surveyFields } = data;

  const hasEligibilityUpdate =
    targetCountries !== undefined || minAge !== undefined || maxAge !== undefined || targetGenders !== undefined;

  return prisma.survey.update({
    where: { id: surveyId },
    data: {
      ...surveyFields,
      ...(hasEligibilityUpdate && {
        eligibility: {
          update: {
            ...(targetCountries !== undefined && { countries: targetCountries }),
            ...(minAge !== undefined && { minAge }),
            ...(maxAge !== undefined && { maxAge }),
            ...(targetGenders !== undefined && { genders: targetGenders }),
          },
        },
      }),
    },
  });
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["PAUSED", "CLOSED"],
  PAUSED: ["PUBLISHED", "CLOSED"],
  CLOSED: [],
};

async function transitionStatus(surveyId: string, to: string) {
  const survey = await prisma.survey.findUniqueOrThrow({ where: { id: surveyId } });
  if (!ALLOWED_TRANSITIONS[survey.status]?.includes(to)) {
    throw new InvalidSurveyStateError(survey.status, to);
  }
  return prisma.survey.update({ where: { id: surveyId }, data: { status: to as never } });
}

export const publishSurvey = (surveyId: string) => transitionStatus(surveyId, "PUBLISHED");
export const pauseSurvey = (surveyId: string) => transitionStatus(surveyId, "PAUSED");
export const closeSurvey = (surveyId: string) => transitionStatus(surveyId, "CLOSED");

export async function listSurveysAdmin() {
  return prisma.survey.findMany({
    include: {
      provider: true,
      eligibility: true,
      _count: { select: { participations: { where: { status: "COMPLETED" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSurveyAdmin(surveyId: string) {
  return prisma.survey.findUniqueOrThrow({
    where: { id: surveyId },
    include: {
      provider: true,
      eligibility: true,
      participations: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
    },
  });
}
