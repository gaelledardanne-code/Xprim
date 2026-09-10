"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, buttonStyles } from "@/components/ui";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  xpCost: number;
}

interface Redemption {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED";
  xpCost: number;
  requestedAt: string;
  reward: { name: string };
}

const statusTone: Record<Redemption["status"], "brand" | "accent" | "danger" | "muted"> = {
  PENDING: "brand",
  APPROVED: "accent",
  FULFILLED: "accent",
  REJECTED: "danger",
};

export function RewardsCatalog({
  rewards,
  balance,
  redemptions,
}: {
  rewards: Reward[];
  balance: number;
  redemptions: Redemption[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRedeem(rewardId: string) {
    setPendingId(rewardId);
    setError(null);

    const res = await fetch("/api/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId }),
    });

    setPendingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not redeem this reward.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Available rewards</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {rewards.map((reward) => (
            <Card key={reward.id} className="flex flex-col gap-3">
              <h3 className="font-semibold">{reward.name}</h3>
              {reward.description && <p className="text-sm text-muted">{reward.description}</p>}
              <p className="text-sm font-medium text-accent">{reward.xpCost.toLocaleString()} XP</p>
              <button
                type="button"
                disabled={pendingId === reward.id || balance < reward.xpCost}
                onClick={() => handleRedeem(reward.id)}
                className={buttonStyles.primary}
              >
                {balance < reward.xpCost
                  ? "Not enough XP"
                  : pendingId === reward.id
                    ? "Requesting…"
                    : "Redeem"}
              </button>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Your redemption requests</h2>
        {redemptions.length === 0 ? (
          <Card className="text-sm text-muted">No reward requests yet.</Card>
        ) : (
          <div className="flex flex-col gap-2">
            {redemptions.map((r) => (
              <Card key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.reward.name}</p>
                  <p className="text-xs text-muted">{new Date(r.requestedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">-{r.xpCost.toLocaleString()} XP</span>
                  <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
