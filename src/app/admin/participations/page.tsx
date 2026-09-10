import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { Card, Badge } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function AdminParticipationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const participations = await prisma.participation.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      survey: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav active="/admin/participations" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Participations</h1>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="py-2 pr-4 font-medium">Respondent</th>
                <th className="py-2 pr-4 font-medium">Survey</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">XP</th>
                <th className="py-2 pr-4 font-medium">Started</th>
                <th className="py-2 pr-4 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {participations.map((p) => (
                <tr key={p.id} className="border-b border-card-border last:border-0">
                  <td className="py-3 pr-4">
                    {p.user.firstName} {p.user.lastName}
                  </td>
                  <td className="py-3 pr-4">{p.survey.title}</td>
                  <td className="py-3 pr-4">
                    <Badge tone="muted">{p.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-accent">{p.rewardPoints ?? "—"}</td>
                  <td className="py-3 pr-4">{p.startedAt.toLocaleDateString()}</td>
                  <td className="py-3 pr-4">{p.completedAt?.toLocaleDateString() ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {participations.length === 0 && <p className="py-4 text-sm text-muted">No participations yet.</p>}
        </Card>
      </main>
    </div>
  );
}
