import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  registerUser,
  verifyCredentials,
} from "./auth";
import { calculateProfileCompletion, getProfileCompletion, updateProfile } from "./profile";

const validInput = {
  firstName: "Gaëlle",
  lastName: "Dardanne",
  email: "gaelle@xprim.test",
  password: "correct-horse-battery",
  dateOfBirth: "1990-05-12",
  gender: "FEMALE" as const,
  country: "MU",
  region: "Port Louis",
};

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("registerUser", () => {
  it("creates a user with a hashed password and a profile", async () => {
    const user = await registerUser(validInput);

    expect(user.email).toBe(validInput.email);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { profile: true } });
    expect(stored.passwordHash).not.toBe(validInput.password);
    expect(stored.passwordHash.length).toBeGreaterThan(20);
    expect(stored.profile?.country).toBe("MU");
    expect(stored.profile?.region).toBe("Port Louis");
  });

  it("never returns the password hash from registerUser", async () => {
    const user = await registerUser(validInput);
    expect((user as { passwordHash?: string }).passwordHash).toBeUndefined();
  });

  it("rejects a duplicate email", async () => {
    await registerUser(validInput);

    await expect(registerUser(validInput)).rejects.toThrow(EmailAlreadyExistsError);
  });

  it("rejects an invalid email", async () => {
    await expect(registerUser({ ...validInput, email: "not-an-email" })).rejects.toThrow();
  });

  it("rejects a password that is too short", async () => {
    await expect(registerUser({ ...validInput, password: "short" })).rejects.toThrow();
  });
});

describe("verifyCredentials", () => {
  it("returns the user when the password is correct", async () => {
    await registerUser(validInput);

    const user = await verifyCredentials({ email: validInput.email, password: validInput.password });

    expect(user.email).toBe(validInput.email);
  });

  it("rejects an incorrect password", async () => {
    await registerUser(validInput);

    await expect(
      verifyCredentials({ email: validInput.email, password: "wrong-password" }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("rejects an unknown email", async () => {
    await expect(
      verifyCredentials({ email: "nobody@xprim.test", password: "whatever" }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});

describe("profile completion", () => {
  it("computes a partial completion percentage right after registration", async () => {
    const user = await registerUser(validInput);

    const pct = await getProfileCompletion(user.id);

    // dateOfBirth, gender, country, region are set (4 of 8 tracked fields)
    expect(pct).toBe(50);
  });

  it("reaches 100% once all profiling fields are filled", async () => {
    const user = await registerUser(validInput);

    await updateProfile(user.id, {
      employmentStatus: "EMPLOYED_FULL_TIME",
      householdSize: 3,
      education: "UNDERGRADUATE",
      incomeBracket: "MIDDLE",
      interests: ["Shopping", "Travel"],
    });

    expect(await getProfileCompletion(user.id)).toBe(100);
  });

  it("computes 0% for a profile with nothing filled in", () => {
    expect(
      calculateProfileCompletion({
        dateOfBirth: null,
        gender: null,
        country: null,
        region: null,
        employmentStatus: null,
        householdSize: null,
        education: null,
        incomeBracket: null,
        interests: [],
      }),
    ).toBe(0);
  });
});

describe("updateProfile", () => {
  it("updates the requested fields without touching others", async () => {
    const user = await registerUser(validInput);

    await updateProfile(user.id, { householdSize: 4 });

    const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } });
    expect(profile.householdSize).toBe(4);
    expect(profile.country).toBe("MU");
  });
});
