import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { genderValues } from "./auth";

/**
 * The core profiling fields that count towards "profile completion".
 * `interests` is intentionally excluded: it's an open-ended, optional list
 * rather than a single fact to fill in. Add new tracked fields here as the
 * profiling questionnaire grows.
 */
const TRACKED_FIELDS = [
  "dateOfBirth",
  "gender",
  "country",
  "region",
  "employmentStatus",
  "householdSize",
  "education",
  "incomeBracket",
] as const;

export interface ProfileCompletionInput {
  dateOfBirth: Date | null;
  gender: string | null;
  country: string | null;
  region: string | null;
  employmentStatus: string | null;
  householdSize: number | null;
  education: string | null;
  incomeBracket: string | null;
  interests: string[];
}

export function calculateProfileCompletion(profile: ProfileCompletionInput): number {
  const filled = TRACKED_FIELDS.filter((field) => {
    const value = profile[field];
    return value !== null && value !== undefined;
  }).length;

  return Math.round((filled / TRACKED_FIELDS.length) * 100);
}

export async function getProfileCompletion(userId: string): Promise<number> {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  return calculateProfileCompletion(profile);
}

export const updateProfileSchema = z.object({
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(genderValues).optional(),
  country: z.string().trim().length(2).optional(),
  region: z.string().trim().min(1).optional(),
  employmentStatus: z
    .enum([
      "EMPLOYED_FULL_TIME",
      "EMPLOYED_PART_TIME",
      "SELF_EMPLOYED",
      "UNEMPLOYED",
      "STUDENT",
      "RETIRED",
      "OTHER",
    ])
    .optional(),
  householdSize: z.coerce.number().int().min(1).max(20).optional(),
  education: z.enum(["PRIMARY", "SECONDARY", "VOCATIONAL", "UNDERGRADUATE", "POSTGRADUATE", "OTHER"]).optional(),
  incomeBracket: z.enum(["LOW", "LOWER_MIDDLE", "MIDDLE", "UPPER_MIDDLE", "HIGH", "PREFER_NOT_TO_SAY"]).optional(),
  interests: z.array(z.string()).optional(),
});

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const data = updateProfileSchema.parse(input);
  return prisma.profile.update({ where: { userId }, data });
}
