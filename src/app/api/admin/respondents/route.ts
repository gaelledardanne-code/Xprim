import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { calculateProfileCompletion } from "@/server/services/profile";
import { getBalance } from "@/server/services/points";

export async function GET() {
  try {
    await requireAdmin();

    const respondents = await prisma.user.findMany({
      where: { role: "RESPONDENT" },
      include: { profile: true, _count: { select: { participations: { where: { status: "COMPLETED" } } } } },
      orderBy: { createdAt: "desc" },
    });

    const rows = await Promise.all(
      respondents.map(async (r) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        country: r.profile?.country ?? null,
        profileCompletion: r.profile ? calculateProfileCompletion(r.profile) : 0,
        xpBalance: await getBalance(r.id),
        surveysCompleted: r._count.participations,
        registeredAt: r.createdAt,
        lastActiveAt: r.lastActiveAt,
      })),
    );

    return NextResponse.json({ respondents: rows });
  } catch (error) {
    return toErrorResponse(error);
  }
}
