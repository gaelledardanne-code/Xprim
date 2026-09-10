import { NextResponse } from "next/server";
import { requireUser } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { completeSurvey } from "@/server/services/participation";

/**
 * Marks a participation as completed and awards XP.
 *
 * V1 completion mechanism: the respondent is redirected back to Xprim after
 * finishing the external survey (via the survey's completionUrl, or by
 * manually clicking "I've completed this survey" in dev/demo mode), and the
 * client calls this endpoint. A real provider webhook (e.g. SurveyMonkey)
 * would call the same `completeSurvey` service function server-to-server
 * instead of relying on this client-triggered route — see SurveyProvider in
 * the schema for where that integration plugs in.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { surveyId, externalResponseId } = await request.json();
    if (typeof surveyId !== "string") {
      return NextResponse.json({ error: "surveyId is required" }, { status: 400 });
    }

    const participation = await completeSurvey({
      userId: user.id,
      surveyId,
      externalResponseId: typeof externalResponseId === "string" ? externalResponseId : undefined,
    });

    return NextResponse.json({ participation });
  } catch (error) {
    return toErrorResponse(error);
  }
}
