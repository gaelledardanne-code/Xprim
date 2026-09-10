"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, buttonStyles } from "@/components/ui";

interface SurveyCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  rewardPoints: number;
}

export function SurveyCard({ id, title, description, category, estimatedMinutes, rewardPoints }: SurveyCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/participations/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surveyId: id }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not start this survey.");
      setLoading(false);
      return;
    }

    const { redirectUrl } = await res.json();
    if (redirectUrl) {
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
    }
    router.push(`/surveys/complete?surveyId=${id}`);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{title}</h3>
        <Badge tone="accent">Available</Badge>
      </div>

      <p className="text-sm text-muted">{description}</p>

      <div className="flex flex-wrap gap-2 text-xs text-muted">
        <span>⏱ {estimatedMinutes} min</span>
        <span>·</span>
        <span className="font-medium text-accent">{rewardPoints} XP</span>
        <span>·</span>
        <span>{category}</span>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="button" onClick={handleStart} disabled={loading} className={buttonStyles.primary}>
        {loading ? "Starting…" : "Start survey"}
      </button>
    </Card>
  );
}
