import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { registerUser } from "../src/server/services/auth";
import { updateProfile } from "../src/server/services/profile";
import { createSurvey, publishSurvey } from "../src/server/services/surveyAdmin";
import { startSurvey, completeSurvey } from "../src/server/services/participation";
import { requestRedemption } from "../src/server/services/rewards";

const ADMIN_EMAIL = "admin@xprim.test";
const ADMIN_PASSWORD = "AdminPass123!";

async function main() {
  console.log("Seeding Xprim demo data...");

  // --- Admin --------------------------------------------------------------
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      firstName: "Tagada",
      lastName: "Admin",
      role: "ADMIN",
    },
  });
  console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  // --- Rewards --------------------------------------------------------------
  const rewardDefs = [
    { name: "Rs 100 voucher", xpCost: 1000 },
    { name: "Rs 250 voucher", xpCost: 2500 },
    { name: "Rs 500 voucher", xpCost: 5000 },
  ];
  for (const r of rewardDefs) {
    const existing = await prisma.reward.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.reward.create({ data: { ...r, active: true } });
    }
  }
  console.log(`  Rewards: ${rewardDefs.length} created`);

  // --- Respondents ------------------------------------------------------
  async function ensureRespondent(input: Parameters<typeof registerUser>[0]) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return existing;
    const user = await registerUser(input);
    return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  }

  const gaelle = await ensureRespondent({
    firstName: "Gaëlle",
    lastName: "Dardanne",
    email: "gaelle@xprim.test",
    password: "RespondentPass123!",
    dateOfBirth: "1992-03-14",
    gender: "FEMALE",
    country: "MU",
    region: "Port Louis",
  });
  await updateProfile(gaelle.id, {
    employmentStatus: "EMPLOYED_FULL_TIME",
    householdSize: 3,
    education: "UNDERGRADUATE",
    incomeBracket: "MIDDLE",
    interests: ["Shopping", "Streaming", "Travel"],
  });

  const jonathan = await ensureRespondent({
    firstName: "Jonathan",
    lastName: "Li",
    email: "jonathan@xprim.test",
    password: "RespondentPass123!",
    dateOfBirth: "1988-11-02",
    gender: "MALE",
    country: "MU",
    region: "Curepipe",
  });
  await updateProfile(jonathan.id, {
    employmentStatus: "SELF_EMPLOYED",
    householdSize: 2,
    education: "POSTGRADUATE",
  });

  const amara = await ensureRespondent({
    firstName: "Amara",
    lastName: "Okafor",
    email: "amara@xprim.test",
    password: "RespondentPass123!",
    dateOfBirth: "2001-07-22",
    gender: "FEMALE",
    country: "ZA",
    region: "Cape Town",
  });

  console.log(
    `  Respondents: gaelle@xprim.test, jonathan@xprim.test, ${amara.email} (password: RespondentPass123!)`,
  );
  console.log("    (Amara is in South Africa — a live demo of country-based survey eligibility.)");

  // --- Surveys ------------------------------------------------------------
  async function ensureSurvey(input: Parameters<typeof createSurvey>[0]) {
    const existing = await prisma.survey.findFirst({ where: { title: input.title } });
    if (existing) return existing;
    const survey = await createSurvey({ ...input, createdById: admin.id });
    return publishSurvey(survey.id);
  }

  const grocery = await ensureSurvey({
    title: "Mauritius Grocery Habits",
    description: "Tell us about your grocery shopping habits.",
    client: "FreshMart Research",
    category: "Shopping",
    estimatedMinutes: 8,
    rewardPoints: 150,
    providerType: "MANUAL",
    externalUrl: "https://example.com/surveys/mauritius-grocery-habits",
    targetCountries: ["MU"],
    minAge: 18,
    maxAge: 65,
  });

  const banking = await ensureSurvey({
    title: "Digital Banking & Payments",
    description: "Share your experience with digital banking services.",
    client: "PaySure Insights",
    category: "Finance",
    estimatedMinutes: 12,
    rewardPoints: 250,
    providerType: "SURVEYMONKEY",
    externalUrl: "https://www.surveymonkey.com/r/demo-digital-banking",
    externalSurveyId: "demo-digital-banking",
    minAge: 18,
  });

  const foodDelivery = await ensureSurvey({
    title: "Food Delivery Habits",
    description: "Tell us about how you order food.",
    client: "QuickBite Research",
    category: "Food & Delivery",
    estimatedMinutes: 5,
    rewardPoints: 100,
    providerType: "MANUAL",
    externalUrl: "https://example.com/surveys/food-delivery-habits",
  });

  const entertainment = await ensureSurvey({
    title: "Entertainment & Streaming",
    description: "What do you watch, and how do you decide?",
    client: "StreamScope",
    category: "Entertainment",
    estimatedMinutes: 10,
    rewardPoints: 300,
    providerType: "MANUAL",
    externalUrl: "https://example.com/surveys/entertainment-streaming",
  });

  const travel = await ensureSurvey({
    title: "Travel Preferences",
    description: "Help us understand how you plan your next trip.",
    client: "Voyage Analytics",
    category: "Travel",
    estimatedMinutes: 15,
    rewardPoints: 400,
    providerType: "MANUAL",
    externalUrl: "https://example.com/surveys/travel-preferences",
    maxResponses: 500,
  });

  console.log("  Surveys: 5 created and published");

  // --- Demo activity -------------------------------------------------------
  async function ensureCompleted(userId: string, surveyId: string, externalResponseId: string) {
    const existing = await prisma.participation.findUnique({
      where: { userId_surveyId: { userId, surveyId } },
    });
    if (existing) return;
    await startSurvey({ userId, surveyId });
    await completeSurvey({ userId, surveyId, externalResponseId });
  }

  // Gaëlle has completed every demo survey (150 + 250 + 100 + 200 + 300 = 1000 XP).
  await ensureCompleted(gaelle.id, grocery.id, "demo-gaelle-grocery");
  await ensureCompleted(gaelle.id, banking.id, "demo-gaelle-banking");
  await ensureCompleted(gaelle.id, foodDelivery.id, "demo-gaelle-food");
  await ensureCompleted(gaelle.id, entertainment.id, "demo-gaelle-entertainment");
  await ensureCompleted(gaelle.id, travel.id, "demo-gaelle-travel");

  // Jonathan has completed one survey so far.
  await ensureCompleted(jonathan.id, foodDelivery.id, "demo-jonathan-food");

  // A pending reward redemption request for the admin to review.
  const voucher = await prisma.reward.findFirstOrThrow({ where: { name: "Rs 100 voucher" } });
  const existingRedemption = await prisma.rewardRedemption.findFirst({ where: { userId: gaelle.id } });
  if (!existingRedemption) {
    await requestRedemption({ userId: gaelle.id, rewardId: voucher.id });
  }

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
