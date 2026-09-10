import { Prisma, PointTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient balance for this deduction");
    this.name = "InsufficientBalanceError";
  }
}

/** A user's XP balance is always derived from the transaction ledger, never stored directly. */
export async function getBalance(userId: string): Promise<number> {
  const result = await prisma.pointTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function listTransactions(userId: string) {
  return prisma.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

interface AwardPointsInput {
  userId: string;
  amount: number;
  reason: string;
  type?:
    | typeof PointTransactionType.EARNED
    | typeof PointTransactionType.BONUS
    | typeof PointTransactionType.ADJUSTMENT
    | typeof PointTransactionType.REVERSAL;
  participationId?: string;
  tx?: Prisma.TransactionClient;
}

/** Records a positive XP movement. Server-side only — never trust a client-supplied amount. */
export async function awardPoints({
  userId,
  amount,
  reason,
  type = PointTransactionType.EARNED,
  participationId,
  tx,
}: AwardPointsInput) {
  if (amount <= 0) {
    throw new Error("awardPoints requires a positive amount");
  }
  const client = tx ?? prisma;
  return client.pointTransaction.create({
    data: { userId, amount, reason, type, participationId },
  });
}

interface DeductPointsInput {
  userId: string;
  amount: number;
  reason: string;
  type?: typeof PointTransactionType.REDEMPTION | typeof PointTransactionType.REVERSAL;
  redemptionId?: string;
  tx?: Prisma.TransactionClient;
}

/** Records a negative XP movement, rejecting it if it would overdraw the balance. */
export async function deductPoints({
  userId,
  amount,
  reason,
  type = PointTransactionType.REDEMPTION,
  redemptionId,
  tx,
}: DeductPointsInput) {
  if (amount <= 0) {
    throw new Error("deductPoints requires a positive amount");
  }
  const client = tx ?? prisma;

  const balance = await client.pointTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const currentBalance = balance._sum.amount ?? 0;

  if (currentBalance < amount) {
    throw new InsufficientBalanceError();
  }

  return client.pointTransaction.create({
    data: { userId, amount: -amount, reason, type, redemptionId },
  });
}
