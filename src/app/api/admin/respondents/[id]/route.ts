import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { getBalance, listTransactions } from "@/server/services/points";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [user, participations, redemptions, balance, transactions] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id }, include: { profile: true } }),
      prisma.participation.findMany({ where: { userId: id }, include: { survey: true }, orderBy: { createdAt: "desc" } }),
      prisma.rewardRedemption.findMany({ where: { userId: id }, include: { reward: true }, orderBy: { requestedAt: "desc" } }),
      getBalance(id),
      listTransactions(id),
    ]);

    const { passwordHash: _omit, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      participations,
      redemptions,
      balance,
      transactions,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
