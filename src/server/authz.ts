import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("You must be signed in to do this");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("You do not have permission to do this");
    this.name = "ForbiddenError";
  }
}

/** Returns the signed-in user's session, or throws UnauthorizedError. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session.user;
}

/** Returns the signed-in admin's session, or throws Unauthorized/Forbidden. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new ForbiddenError();
  }
  return user;
}
