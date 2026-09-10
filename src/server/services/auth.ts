import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("An account with this email already exists");
    this.name = "EmailAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export const genderValues = ["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"] as const;

export const registerInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(genderValues),
  // ISO 3166-1 alpha-2 country code. Not restricted to a fixed list so the
  // platform stays international; validate against a real country list at
  // the UI layer.
  country: z.string().trim().length(2, "Country must be an ISO 3166-1 alpha-2 code"),
  region: z.string().trim().min(1, "Region/city is required"),
});

export type RegisterInput = z.input<typeof registerInputSchema>;

const BCRYPT_ROUNDS = 10;

/** Registers a respondent: validates input, hashes the password, creates the user and their initial profile. */
export async function registerUser(input: RegisterInput) {
  const data = registerInputSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new EmailAlreadyExistsError();
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      profile: {
        create: {
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          country: data.country,
          region: data.region,
        },
      },
    },
  });

  const { passwordHash: _omit, ...safeUser } = user;
  return safeUser;
}

interface VerifyCredentialsInput {
  email: string;
  password: string;
}

/** Used by the credentials auth provider. Never reveals whether the email or the password was wrong. */
export async function verifyCredentials({ email, password }: VerifyCredentialsInput) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  const { passwordHash: _omit, ...safeUser } = user;
  return safeUser;
}
