import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { Card } from "@/components/ui";
import { getAdminMetrics } from "@/server/services/adminMetrics";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const metrics = await getAdminMetrics();

  const cards = [
    { label: "Total respondents", value: metrics.totalRespondents },
    { label: "Active respondents (30d)", value: metrics.activeRespondents },
    { label: "Surveys published", value: metrics.surveysPublished },
    { label: "Surveys completed", value: metrics.surveysCompleted },
    { label: "XP distributed", value: metrics.xpDistributed.toLocaleString() },
    { label: "Pending reward requests", value: metrics.pendingRewardRequests },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav active="/admin" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Overview</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((m) => (
            <Card key={m.label}>
              <p className="text-sm text-muted">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold">{m.value}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
