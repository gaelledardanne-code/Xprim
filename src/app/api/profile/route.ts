import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/authz";
import { toErrorResponse } from "@/server/apiError";
import { getProfileCompletion, updateProfile } from "@/server/services/profile";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } });
    const completion = await getProfileCompletion(user.id);
    return NextResponse.json({ profile, completion });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const profile = await updateProfile(user.id, body);
    const completion = await getProfileCompletion(user.id);
    return NextResponse.json({ profile, completion });
  } catch (error) {
    return toErrorResponse(error);
  }
}
