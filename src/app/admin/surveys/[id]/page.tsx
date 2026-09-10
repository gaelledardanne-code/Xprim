import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { Card, Badge } from "@/components/ui";
import { SurveyStatusActions } from "@/components/SurveyStatusActions";
import { SurveyEditForm } from "@/components/SurveyEditForm";
import { getSurveyAdmin } from "@/server/services/surveyAdmin";

const statusTone = {
  DRAFT: "muted",
  PUBLISHED: "accent",
  PAUSED: "warning",
  CLOSED: "danger",
} as const;

export default async function AdminSurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const survey = await getSurveyAdmin(id);

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav active="/admin/surveys" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{survey.title}</h1>
            <Badge tone={statusTone[survey.status]}>{survey.status}</Badge>
          </div>
          <SurveyStatusActions surveyId={survey.id} status={survey.status} />
        </div>

        <Card className="mb-6">
          <SurveyEditForm
            surveyId={survey.id}
            initial={{
              title: survey.title,
              description: survey.description,
              client: survey.client,
              category: survey.category,
              estimatedMinutes: survey.estimatedMinutes,
              rewardPoints: survey.rewardPoints,
              externalUrl: survey.externalUrl,
              startDate: survey.startDate?.toISOString().slice(0, 10) ?? null,
              endDate: survey.endDate?.toISOString().slice(0, 10) ?? null,
              maxResponses: survey.maxResponses,
              targetCountries: survey.eligibility?.countries ?? [],
              minAge: survey.eligibility?.minAge ?? null,
              maxAge: survey.eligibility?.maxAge ?? null,
              targetGenders: survey.eligibility?.genders ?? [],
            }}
          />
        </Card>

        <h2 className="mb-4 text-lg font-semibold">Responses ({survey.participations.length})</h2>
        <div className="flex flex-col gap-2">
          {survey.participations.length === 0 && <Card className="text-sm text-muted">No responses yet.</Card>}
          {survey.participations.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {p.user.firstName} {p.user.lastName}
                </p>
                <p className="text-xs text-muted">{p.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {p.rewardPoints !== null && <span className="text-sm text-accent">+{p.rewardPoints} XP</span>}
                <Badge tone="muted">{p.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
