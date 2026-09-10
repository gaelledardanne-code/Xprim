import { NextResponse } from "next/server";
import { requireUser } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { requestRedemption } from "@/server/services/rewards";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { rewardId } = await request.json();
    if (typeof rewardId !== "string") {
      return NextResponse.json({ error: "rewardId is required" }, { status: 400 });
    }

    const redemption = await requestRedemption({ userId: user.id, rewardId });
    return NextResponse.json({ redemption }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
