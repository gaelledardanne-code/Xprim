import { NextResponse } from "next/server";
import { registerUser } from "@/server/services/auth";
import { toErrorResponse } from "@/server/apiError";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerUser(body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
