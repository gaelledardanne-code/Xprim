import { NextResponse } from "next/server";
import { ZodError } from "zod";

const STATUS_BY_ERROR_NAME: Record<string, number> = {
  UnauthorizedError: 401,
  ForbiddenError: 403,
  InvalidCredentialsError: 401,
  EmailAlreadyExistsError: 409,
  InsufficientBalanceError: 400,
  SurveyNotAvailableError: 409,
  AlreadyParticipatingError: 409,
  DuplicateCompletionError: 409,
  SurveyExpiredError: 410,
  ParticipationNotStartedError: 404,
  RewardNotAvailableError: 404,
  InvalidRedemptionStateError: 409,
};

/** Converts a service-layer error into a JSON HTTP response with an appropriate status code. */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
  }

  if (error instanceof Error) {
    const status = STATUS_BY_ERROR_NAME[error.name] ?? 500;
    if (status === 500) {
      console.error(error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    return NextResponse.json({ error: error.message }, { status });
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
