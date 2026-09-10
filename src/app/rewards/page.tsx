import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RespondentNav } from "@/components/RespondentNav";
import { RewardsCatalog } from "@/components/RewardsCatalog";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getBalance, listTransactions } from "@/server/services/points";

export default async function RewardsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [rewards, balance, redemptions, transactions] = await Promise.all([
    prisma.reward.findMany({ where: { active: true }, orderBy: { xpCost: "asc" } }),
    getBalance(session.user.id),
    prisma.rewardRedemption.findMany({
      where: { userId: session.user.id },
      include: { reward: true },
      orderBy: { requestedAt: "desc" },
    }),
    listTransactions(session.user.id),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <RespondentNav userId={session.user.id} active="/rewards" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Card className="mb-8">
          <p className="text-sm text-muted">Your XP balance</p>
          <p className="mt-1 text-3xl font-semibold text-accent">{balance.toLocaleString()} XP</p>
        </Card>

        <RewardsCatalog
          rewards={rewards.map((r) => ({ ...r, description: r.description }))}
          balance={balance}
          redemptions={redemptions.map((r) => ({
            id: r.id,
            status: r.status,
            xpCost: r.xpCost,
            requestedAt: r.requestedAt.toISOString(),
            reward: { name: r.reward.name },
          }))}
        />

        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">XP activity</h2>
          <div className="flex flex-col gap-2">
            {transactions.length === 0 && <Card className="text-sm text-muted">No activity yet.</Card>}
            {transactions.map((t) => (
              <Card key={t.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.reason}</p>
                  <p className="text-xs text-muted">{t.createdAt.toLocaleDateString()}</p>
                </div>
                <span className={t.amount >= 0 ? "font-semibold text-accent" : "font-semibold text-danger"}>
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount.toLocaleString()} XP
                </span>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
