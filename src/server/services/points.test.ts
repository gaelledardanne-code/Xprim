import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { awardPoints, deductPoints, getBalance, listTransactions } from "./points";

async function createUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: "x",
      firstName: "Test",
      lastName: "User",
    },
  });
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("points service", () => {
  it("returns a zero balance for a user with no transactions", async () => {
    const user = await createUser("balance-zero@xprim.test");
    expect(await getBalance(user.id)).toBe(0);
  });

  it("awards points and reflects them in the balance", async () => {
    const user = await createUser("award@xprim.test");

    await awardPoints({ userId: user.id, amount: 150, reason: "Survey completion" });

    expect(await getBalance(user.id)).toBe(150);
  });

  it("accumulates balance across multiple awards", async () => {
    const user = await createUser("accumulate@xprim.test");

    await awardPoints({ userId: user.id, amount: 150, reason: "Survey A" });
    await awardPoints({ userId: user.id, amount: 250, reason: "Survey B" });

    expect(await getBalance(user.id)).toBe(400);
  });

  it("rejects awarding a non-positive amount", async () => {
    const user = await createUser("reject-nonpositive@xprim.test");

    await expect(
      awardPoints({ userId: user.id, amount: 0, reason: "invalid" }),
    ).rejects.toThrow();
    await expect(
      awardPoints({ userId: user.id, amount: -10, reason: "invalid" }),
    ).rejects.toThrow();
  });

  it("deducts points and reflects them in the balance", async () => {
    const user = await createUser("deduct@xprim.test");
    await awardPoints({ userId: user.id, amount: 1000, reason: "seed" });

    await deductPoints({ userId: user.id, amount: 400, reason: "Reward redemption" });

    expect(await getBalance(user.id)).toBe(600);
  });

  it("rejects a deduction that would overdraw the balance", async () => {
    const user = await createUser("overdraw@xprim.test");
    await awardPoints({ userId: user.id, amount: 100, reason: "seed" });

    await expect(
      deductPoints({ userId: user.id, amount: 200, reason: "too much" }),
    ).rejects.toThrow(/insufficient/i);

    expect(await getBalance(user.id)).toBe(100);
  });

  it("lists transactions newest first with signed amounts", async () => {
    const user = await createUser("history@xprim.test");
    await awardPoints({ userId: user.id, amount: 150, reason: "Survey A" });
    await awardPoints({ userId: user.id, amount: 250, reason: "Survey B" });
    await deductPoints({ userId: user.id, amount: 100, reason: "Redeem" });

    const transactions = await listTransactions(user.id);

    expect(transactions).toHaveLength(3);
    expect(transactions[0].reason).toBe("Redeem");
    expect(transactions[0].amount).toBe(-100);
    expect(transactions[2].reason).toBe("Survey A");
    expect(transactions[2].amount).toBe(150);
  });

  it("keeps balances isolated per user", async () => {
    const alice = await createUser("alice@xprim.test");
    const bob = await createUser("bob@xprim.test");

    await awardPoints({ userId: alice.id, amount: 500, reason: "seed" });

    expect(await getBalance(alice.id)).toBe(500);
    expect(await getBalance(bob.id)).toBe(0);
  });
});
