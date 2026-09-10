import { prisma } from "@/lib/prisma";
import { awardPoints, deductPoints } from "./points";

export class RewardNotAvailableError extends Error {
  constructor() {
    super("Reward not found or no longer active");
    this.name = "RewardNotAvailableError";
  }
}

export class InvalidRedemptionStateError extends Error {
  constructor(expected: string, actual: string) {
    super(`Redemption must be ${expected} but is ${actual}`);
    this.name = "InvalidRedemptionStateError";
  }
}

interface RequestRedemptionInput {
  userId: string;
  rewardId: string;
}

/**
 * Creates a reward redemption request and immediately reserves the XP cost
 * from the user's balance. Throws InsufficientBalanceError (from the points
 * service) if the user cannot afford it, rolling back the whole request.
 */
export async function requestRedemption({ userId, rewardId }: RequestRedemptionInput) {
  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.active) {
    throw new RewardNotAvailableError();
  }

  return prisma.$transaction(async (tx) => {
    const redemption = await tx.rewardRedemption.create({
      data: { userId, rewardId, xpCost: reward.xpCost, status: "PENDING" },
    });

    await deductPoints({
      userId,
      amount: reward.xpCost,
      reason: `Redemption request: ${reward.name}`,
      redemptionId: redemption.id,
      tx,
    });

    return redemption;
  });
}

function assertStatus(redemption: { status: string }, expected: string) {
  if (redemption.status !== expected) {
    throw new InvalidRedemptionStateError(expected, redemption.status);
  }
}

export async function approveRedemption(redemptionId: string) {
  const redemption = await prisma.rewardRedemption.findUniqueOrThrow({ where: { id: redemptionId } });
  assertStatus(redemption, "PENDING");

  return prisma.rewardRedemption.update({
    where: { id: redemptionId },
    data: { status: "APPROVED", decidedAt: new Date() },
  });
}

/** Rejects a pending redemption and refunds the reserved XP back to the user. */
export async function rejectRedemption(redemptionId: string) {
  const redemption = await prisma.rewardRedemption.findUniqueOrThrow({
    where: { id: redemptionId },
    include: { reward: true },
  });
  assertStatus(redemption, "PENDING");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.rewardRedemption.update({
      where: { id: redemptionId },
      data: { status: "REJECTED", decidedAt: new Date() },
    });

    await awardPoints({
      userId: redemption.userId,
      amount: redemption.xpCost,
      reason: `Redemption rejected — refund: ${redemption.reward.name}`,
      type: "REVERSAL",
      tx,
    });

    return updated;
  });
}

export async function fulfillRedemption(redemptionId: string) {
  const redemption = await prisma.rewardRedemption.findUniqueOrThrow({ where: { id: redemptionId } });
  assertStatus(redemption, "APPROVED");

  return prisma.rewardRedemption.update({
    where: { id: redemptionId },
    data: { status: "FULFILLED", fulfilledAt: new Date() },
  });
}
