"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo, buttonStyles, Card } from "@/components/ui";

function CompleteSurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = searchParams.get("surveyId");

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleConfirm() {
    if (!surveyId) return;
    setStatus("loading");

    const res = await fetch("/api/participations/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surveyId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error ?? "We couldn't record your completion.");
      setStatus("error");
      return;
    }

    setStatus("done");
  }

  return (
    <Card className="w-full max-w-md text-center">
      {status === "done" ? (
        <>
          <p className="text-3xl">🎉</p>
          <h1 className="mt-2 text-xl font-semibold">Thanks for sharing your opinion!</h1>
          <p className="mt-2 text-sm text-muted">Your XP has been added to your balance.</p>
          <button onClick={() => router.push("/dashboard")} className={`${buttonStyles.primary} mt-6 w-full`}>
            Back to dashboard
          </button>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">Finish up over there, then confirm here</h1>
          <p className="mt-2 text-sm text-muted">
            We opened the survey in a new tab. Once you&apos;ve completed it, come back and confirm below so we can
            award your XP.
          </p>
          {message && <p className="mt-3 text-sm text-danger">{message}</p>}
          <button
            onClick={handleConfirm}
            disabled={status === "loading" || !surveyId}
            className={`${buttonStyles.primary} mt-6 w-full`}
          >
            {status === "loading" ? "Confirming…" : "I've completed this survey"}
          </button>
          <Link href="/dashboard" className="mt-3 block text-sm text-muted hover:text-foreground">
            Back to dashboard
          </Link>
        </>
      )}
    </Card>
  );
}

export default function CompleteSurveyPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-16">
      <Logo />
      <Suspense>
        <CompleteSurveyContent />
      </Suspense>
    </div>
  );
}
