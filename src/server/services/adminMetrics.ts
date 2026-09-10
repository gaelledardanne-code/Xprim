import { prisma } from "@/lib/prisma";

export async function getAdminMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalRespondents,
    activeRespondents,
    surveysPublished,
    surveysCompleted,
    xpDistributed,
    pendingRewardRequests,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "RESPONDENT" } }),
    prisma.user.count({ where: { role: "RESPONDENT", lastActiveAt: { gte: thirtyDaysAgo } } }),
    prisma.survey.count({ where: { status: "PUBLISHED" } }),
    prisma.participation.count({ where: { status: "COMPLETED" } }),
    prisma.pointTransaction.aggregate({ where: { type: "EARNED" }, _sum: { amount: true } }),
    prisma.rewardRedemption.count({ where: { status: "PENDING" } }),
  ]);

  return {
    totalRespondents,
    activeRespondents,
    surveysPublished,
    surveysCompleted,
    xpDistributed: xpDistributed._sum.amount ?? 0,
    pendingRewardRequests,
  };
}
