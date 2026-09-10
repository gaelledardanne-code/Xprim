import { prisma } from "@/lib/prisma";

/** Truncates all application tables. Test DB only — never call in production. */
export async function resetDb() {
  if (process.env.DATABASE_URL?.includes("xprim_dev")) {
    throw new Error("resetDb() refused: DATABASE_URL points at the dev database");
  }

  await prisma.$transaction([
    prisma.pointTransaction.deleteMany(),
    prisma.rewardRedemption.deleteMany(),
    prisma.reward.deleteMany(),
    prisma.participation.deleteMany(),
    prisma.surveyEligibility.deleteMany(),
    prisma.survey.deleteMany(),
    prisma.surveyProvider.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
