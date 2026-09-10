import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { createSurvey, listSurveysAdmin } from "@/server/services/surveyAdmin";

export async function GET() {
  try {
    await requireAdmin();
    const surveys = await listSurveysAdmin();
    return NextResponse.json({ surveys });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const survey = await createSurvey({ ...body, createdById: admin.id });
    return NextResponse.json({ survey }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
