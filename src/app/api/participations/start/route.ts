import { NextResponse } from "next/server";
import { requireUser } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { getRequestIp, hashIp } from "@/server/fraud";
import { startSurvey } from "@/server/services/participation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { surveyId } = await request.json();
    if (typeof surveyId !== "string") {
      return NextResponse.json({ error: "surveyId is required" }, { status: 400 });
    }

    const ip = getRequestIp(request);
    const participation = await startSurvey({
      userId: user.id,
      surveyId,
      ipHash: ip ? hashIp(ip) : undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    const survey = await prisma.survey.findUniqueOrThrow({ where: { id: surveyId } });

    return NextResponse.json({
      participation,
      redirectUrl: survey.externalUrl,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
