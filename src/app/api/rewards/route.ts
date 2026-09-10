import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { getBalance } from "@/server/services/points";

export async function GET() {
  try {
    const user = await requireUser();
    const [rewards, balance, redemptions] = await Promise.all([
      prisma.reward.findMany({ where: { active: true }, orderBy: { xpCost: "asc" } }),
      getBalance(user.id),
      prisma.rewardRedemption.findMany({
        where: { userId: user.id },
        include: { reward: true },
        orderBy: { requestedAt: "desc" },
      }),
    ]);
    return NextResponse.json({ rewards, balance, redemptions });
  } catch (error) {
    return toErrorResponse(error);
  }
}
