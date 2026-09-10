import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import {
  closeSurvey,
  getSurveyAdmin,
  pauseSurvey,
  publishSurvey,
  updateSurvey,
} from "@/server/services/surveyAdmin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const survey = await getSurveyAdmin(id);
    return NextResponse.json({ survey });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    if (typeof body.status === "string") {
      const transition = { PUBLISHED: publishSurvey, PAUSED: pauseSurvey, CLOSED: closeSurvey }[
        body.status as "PUBLISHED" | "PAUSED" | "CLOSED"
      ];
      if (!transition) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const survey = await transition(id);
      return NextResponse.json({ survey });
    }

    const survey = await updateSurvey(id, body);
    return NextResponse.json({ survey });
  } catch (error) {
    return toErrorResponse(error);
  }
}
