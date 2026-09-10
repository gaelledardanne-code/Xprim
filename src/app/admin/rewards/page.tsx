import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { Card, Badge } from "@/components/ui";
import { RedemptionActions } from "@/components/RedemptionActions";
import { prisma } from "@/lib/prisma";

const statusTone = {
  PENDING: "brand",
  APPROVED: "accent",
  FULFILLED: "accent",
  REJECTED: "danger",
} as const;

export default async function AdminRewardsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [rewards, redemptions] = await Promise.all([
    prisma.reward.findMany({ orderBy: { xpCost: "asc" } }),
    prisma.rewardRedemption.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } }, reward: true },
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav active="/admin/rewards" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Rewards</h1>

        <h2 className="mb-3 text-lg font-semibold">Catalogue</h2>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {rewards.map((r) => (
            <Card key={r.id}>
              <p className="font-semibold">{r.name}</p>
              <p className="text-sm text-accent">{r.xpCost.toLocaleString()} XP</p>
              {!r.active && <Badge tone="muted">Inactive</Badge>}
            </Card>
          ))}
        </div>

        <h2 className="mb-3 text-lg font-semibold">Redemption requests</h2>
        <div className="flex flex-col gap-2">
          {redemptions.length === 0 && <Card className="text-sm text-muted">No redemption requests yet.</Card>}
          {redemptions.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {r.user.firstName} {r.user.lastName} — {r.reward.name}
                </p>
                <p className="text-xs text-muted">
                  {r.xpCost} XP · {r.requestedAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                <RedemptionActions redemptionId={r.id} status={r.status} />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
