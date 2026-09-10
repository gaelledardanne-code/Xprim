import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompletion } from "@/server/services/profile";
import { getBalance } from "@/server/services/points";

export default async function AdminRespondentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const respondents = await prisma.user.findMany({
    where: { role: "RESPONDENT" },
    include: { profile: true, _count: { select: { participations: { where: { status: "COMPLETED" } } } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = await Promise.all(
    respondents.map(async (r) => ({
      ...r,
      completion: r.profile ? calculateProfileCompletion(r.profile) : 0,
      balance: await getBalance(r.id),
    })),
  );

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav active="/admin/respondents" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Respondents</h1>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Country</th>
                <th className="py-2 pr-4 font-medium">Profile</th>
                <th className="py-2 pr-4 font-medium">XP balance</th>
                <th className="py-2 pr-4 font-medium">Completed</th>
                <th className="py-2 pr-4 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-card-border last:border-0">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/respondents/${r.id}`} className="font-medium hover:underline">
                      {r.firstName} {r.lastName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{r.profile?.country ?? "—"}</td>
                  <td className="py-3 pr-4">{r.completion}%</td>
                  <td className="py-3 pr-4 text-accent">{r.balance.toLocaleString()} XP</td>
                  <td className="py-3 pr-4">{r._count.participations}</td>
                  <td className="py-3 pr-4">{r.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-4 text-sm text-muted">No respondents yet.</p>}
        </Card>
      </main>
    </div>
  );
}
