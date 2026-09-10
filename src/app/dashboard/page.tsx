import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RespondentNav } from "@/components/RespondentNav";
import { SurveyCard } from "@/components/SurveyCard";
import { Card, buttonStyles } from "@/components/ui";
import { getEligibleSurveys } from "@/server/services/eligibility";
import { getBalance } from "@/server/services/points";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [surveys, balance, completedCount, pointsEarned] = await Promise.all([
    getEligibleSurveys(session.user.id),
    getBalance(session.user.id),
    prisma.participation.count({ where: { userId: session.user.id, status: "COMPLETED" } }),
    prisma.pointTransaction.aggregate({
      where: { userId: session.user.id, type: "EARNED" },
      _sum: { amount: true },
    }),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex min-h-full flex-col">
      <RespondentNav userId={session.user.id} active="/dashboard" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Hello, {firstName} 👋</h1>
            <p className="mt-1 text-muted">Pick a survey. Share your opinion. Earn points.</p>
          </div>
          <Link href="/rewards" className={buttonStyles.secondary}>
            Redeem rewards
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-muted">Your balance</p>
            <p className="mt-1 text-2xl font-semibold text-accent">{balance.toLocaleString()} XP</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Surveys completed</p>
            <p className="mt-1 text-2xl font-semibold">{completedCount}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Points earned</p>
            <p className="mt-1 text-2xl font-semibold">{(pointsEarned._sum.amount ?? 0).toLocaleString()} XP</p>
          </Card>
        </div>

        <h2 className="mb-4 text-lg font-semibold">Available surveys</h2>
        {surveys.length === 0 ? (
          <Card className="text-sm text-muted">
            No surveys are available for you right now — check back soon, or complete your profile to unlock more.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                id={survey.id}
                title={survey.title}
                description={survey.description}
                category={survey.category}
                estimatedMinutes={survey.estimatedMinutes}
                rewardPoints={survey.rewardPoints}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
