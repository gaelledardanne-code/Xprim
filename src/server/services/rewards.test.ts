import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { InsufficientBalanceError } from "./points";
import { getBalance, awardPoints } from "./points";
import {
  InvalidRedemptionStateError,
  approveRedemption,
  fulfillRedemption,
  rejectRedemption,
  requestRedemption,
} from "./rewards";

async function createUser(email = `user-${Math.random().toString(36).slice(2)}@xprim.test`) {
  return prisma.user.create({
    data: { email, passwordHash: "x", firstName: "Test", lastName: "User" },
  });
}

async function createReward(xpCost = 1000) {
  return prisma.reward.create({
    data: { name: "Rs 100 voucher", xpCost, active: true },
  });
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("rewards service", () => {
  it("creates a pending redemption and deducts the XP cost", async () => {
    const user = await createUser();
    await awardPoints({ userId: user.id, amount: 1500, reason: "seed" });
    const reward = await createReward(1000);

    const redemption = await requestRedemption({ userId: user.id, rewardId: reward.id });

    expect(redemption.status).toBe("PENDING");
    expect(redemption.xpCost).toBe(1000);
    expect(await getBalance(user.id)).toBe(500);
  });

  it("rejects a redemption request when the balance is insufficient", async () => {
    const user = await createUser();
    await awardPoints({ userId: user.id, amount: 100, reason: "seed" });
    const reward = await createReward(1000);

    await expect(requestRedemption({ userId: user.id, rewardId: reward.id })).rejects.toThrow(
      InsufficientBalanceError,
    );

    expect(await getBalance(user.id)).toBe(100);
    const redemptions = await prisma.rewardRedemption.findMany({ where: { userId: user.id } });
    expect(redemptions).toHaveLength(0);
  });

  it("lets an admin approve a pending redemption", async () => {
    const user = await createUser();
    await awardPoints({ userId: user.id, amount: 1000, reason: "seed" });
    const reward = await createReward(1000);
    const redemption = await requestRedemption({ userId: user.id, rewardId: reward.id });

    const approved = await approveRedemption(redemption.id);

    expect(approved.status).toBe("APPROVED");
    expect(approved.decidedAt).not.toBeNull();
  });

  it("lets an admin reject a pending redemption and refunds the XP", async () => {
    const user = await createUser();
    await awardPoints({ userId: user.id, amount: 1000, reason: "seed" });
    const reward = await createReward(1000);
    const redemption = await requestRedemption({ userId: user.id, rewardId: reward.id });
    expect(await getBalance(user.id)).toBe(0);

    const rejected = await rejectRedemption(redemption.id);

    expect(rejected.status).toBe("REJECTED");
    expect(await getBalance(user.id)).toBe(1000);
  });

  it("lets an admin fulfil an approved redemption", async () => {
    const user = await createUser();
    await awardPoints({ userId: user.id, amount: 1000, reason: "seed" });
    const reward = await createReward(1000);
    const redemption = await requestRedemption({ userId: user.id, rewardId: reward.id });
    await approveRedemption(redemption.id);

    const fulfilled = await fulfillRedemption(redemption.id);

    expect(fulfilled.status).toBe("FULFILLED");
    expect(fulfilled.fulfilledAt).not.toBeNull();
  });

  it("refuses to fulfil a redemption that has not been approved", async () => {
    const user = await createUser();
    await awardPoints({ userId: user.id, amount: 1000, reason: "seed" });
    const reward = await createReward(1000);
    const redemption = await requestRedemption({ userId: user.id, rewardId: reward.id });

    await expect(fulfillRedemption(redemption.id)).rejects.toThrow(InvalidRedemptionStateError);
  });

  it("refuses to approve a redemption that is no longer pending", async () => {
    const user = await createUser();
    await awardPoints({ userId: user.id, amount: 1000, reason: "seed" });
    const reward = await createReward(1000);
    const redemption = await requestRedemption({ userId: user.id, rewardId: reward.id });
    await approveRedemption(redemption.id);

    await expect(approveRedemption(redemption.id)).rejects.toThrow(InvalidRedemptionStateError);
  });
});
