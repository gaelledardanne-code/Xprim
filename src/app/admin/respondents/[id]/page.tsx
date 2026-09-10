import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { Card, Badge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompletion } from "@/server/services/profile";
import { getBalance, listTransactions } from "@/server/services/points";

export default async function AdminRespondentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const [user, participations, redemptions, balance, transactions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id }, include: { profile: true } }),
    prisma.participation.findMany({ where: { userId: id }, include: { survey: true }, orderBy: { createdAt: "desc" } }),
    prisma.rewardRedemption.findMany({ where: { userId: id }, include: { reward: true }, orderBy: { requestedAt: "desc" } }),
    getBalance(id),
    listTransactions(id),
  ]);

  const completion = user.profile ? calculateProfileCompletion(user.profile) : 0;

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav active="/admin/respondents" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <h1 className="mb-1 text-2xl font-semibold">
          {user.firstName} {user.lastName}
        </h1>
        <p className="mb-6 text-sm text-muted">{user.email}</p>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <p className="text-xs text-muted">XP balance</p>
            <p className="mt-1 text-xl font-semibold text-accent">{balance.toLocaleString()}</p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Profile completion</p>
            <p className="mt-1 text-xl font-semibold">{completion}%</p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Country</p>
            <p className="mt-1 text-xl font-semibold">{user.profile?.country ?? "—"}</p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Registered</p>
            <p className="mt-1 text-xl font-semibold">{user.createdAt.toLocaleDateString()}</p>
          </Card>
        </div>

        <h2 className="mb-3 text-lg font-semibold">Survey history</h2>
        <div className="mb-8 flex flex-col gap-2">
          {participations.length === 0 && <Card className="text-sm text-muted">No participations yet.</Card>}
          {participations.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <span>{p.survey.title}</span>
              <div className="flex items-center gap-3">
                {p.rewardPoints !== null && <span className="text-sm text-accent">+{p.rewardPoints} XP</span>}
                <Badge tone="muted">{p.status}</Badge>
              </div>
            </Card>
          ))}
        </div>

        <h2 className="mb-3 text-lg font-semibold">XP transaction history</h2>
        <div className="mb-8 flex flex-col gap-2">
          {transactions.length === 0 && <Card className="text-sm text-muted">No transactions yet.</Card>}
          {transactions.map((t) => (
            <Card key={t.id} className="flex items-center justify-between">
              <span>{t.reason}</span>
              <span className={t.amount >= 0 ? "text-accent" : "text-danger"}>
                {t.amount >= 0 ? "+" : ""}
                {t.amount} XP
              </span>
            </Card>
          ))}
        </div>

        <h2 className="mb-3 text-lg font-semibold">Reward redemption history</h2>
        <div className="flex flex-col gap-2">
          {redemptions.length === 0 && <Card className="text-sm text-muted">No redemption requests yet.</Card>}
          {redemptions.map((r) => (
            <Card key={r.id} className="flex items-center justify-between">
              <span>{r.reward.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">-{r.xpCost} XP</span>
                <Badge tone="muted">{r.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
