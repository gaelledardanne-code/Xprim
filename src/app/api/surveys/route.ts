import { NextResponse } from "next/server";
import { requireUser } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { getEligibleSurveys } from "@/server/services/eligibility";

export async function GET() {
  try {
    const user = await requireUser();
    const surveys = await getEligibleSurveys(user.id);
    return NextResponse.json({ surveys });
  } catch (error) {
    return toErrorResponse(error);
  }
}
