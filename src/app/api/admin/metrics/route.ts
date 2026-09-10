import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { getAdminMetrics } from "@/server/services/adminMetrics";

export async function GET() {
  try {
    await requireAdmin();
    const metrics = await getAdminMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return toErrorResponse(error);
  }
}
