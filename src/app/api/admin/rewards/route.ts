import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";

export async function GET() {
  try {
    await requireAdmin();
    const [rewards, redemptions] = await Promise.all([
      prisma.reward.findMany({ orderBy: { xpCost: "asc" } }),
      prisma.rewardRedemption.findMany({
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, reward: true },
        orderBy: { requestedAt: "desc" },
      }),
    ]);
    return NextResponse.json({ rewards, redemptions });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { name, description, xpCost, active } = await request.json();
    if (typeof name !== "string" || typeof xpCost !== "number") {
      return NextResponse.json({ error: "name and xpCost are required" }, { status: 400 });
    }
    const reward = await prisma.reward.create({
      data: { name, description, xpCost, active: active ?? true },
    });
    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
