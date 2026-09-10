import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";

export async function GET() {
  try {
    await requireAdmin();
    const participations = await prisma.participation.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        survey: { select: { id: true, title: true, rewardPoints: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ participations });
  } catch (error) {
    return toErrorResponse(error);
  }
}
