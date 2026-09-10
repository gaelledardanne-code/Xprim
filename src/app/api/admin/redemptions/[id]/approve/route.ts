import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { approveRedemption } from "@/server/services/rewards";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const redemption = await approveRedemption(id);
    return NextResponse.json({ redemption });
  } catch (error) {
    return toErrorResponse(error);
  }
}
