import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { Card, Badge, buttonStyles } from "@/components/ui";
import { SurveyStatusActions } from "@/components/SurveyStatusActions";
import { listSurveysAdmin } from "@/server/services/surveyAdmin";

const statusTone = {
  DRAFT: "muted",
  PUBLISHED: "accent",
  PAUSED: "warning",
  CLOSED: "danger",
} as const;

export default async function AdminSurveysPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const surveys = await listSurveysAdmin();

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav active="/admin/surveys" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Surveys</h1>
          <Link href="/admin/surveys/new" className={buttonStyles.primary}>
            Create survey
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {surveys.map((survey) => (
            <Card key={survey.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/surveys/${survey.id}`} className="font-semibold hover:underline">
                    {survey.title}
                  </Link>
                  <Badge tone={statusTone[survey.status]}>{survey.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {survey.category} · {survey.estimatedMinutes} min · {survey.rewardPoints} XP ·{" "}
                  {survey._count.participations}
                  {survey.maxResponses ? ` / ${survey.maxResponses}` : ""} completed
                </p>
              </div>
              <SurveyStatusActions surveyId={survey.id} status={survey.status} />
            </Card>
          ))}
          {surveys.length === 0 && <Card className="text-sm text-muted">No surveys yet.</Card>}
        </div>
      </main>
    </div>
  );
}
