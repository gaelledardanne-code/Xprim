"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui";

const TRANSITIONS: Record<string, { status: string; label: string }[]> = {
  DRAFT: [{ status: "PUBLISHED", label: "Publish" }],
  PUBLISHED: [
    { status: "PAUSED", label: "Pause" },
    { status: "CLOSED", label: "Close" },
  ],
  PAUSED: [
    { status: "PUBLISHED", label: "Resume" },
    { status: "CLOSED", label: "Close" },
  ],
  CLOSED: [],
};

export function SurveyStatusActions({ surveyId, status }: { surveyId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function transition(to: string) {
    setLoading(true);
    await fetch(`/api/admin/surveys/${surveyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    setLoading(false);
    router.refresh();
  }

  const options = TRANSITIONS[status] ?? [];
  if (options.length === 0) return null;

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.status}
          disabled={loading}
          onClick={() => transition(option.status)}
          className={`${buttonStyles.ghost} px-2.5 py-1.5 text-xs`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
