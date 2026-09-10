import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { Card } from "@/components/ui";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav active="/admin/settings" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
        <Card className="text-sm text-muted">
          Platform-wide settings (branding, provider credentials, reward catalogue management) will live here
          as Xprim grows. For V1, providers and rewards are managed via the Surveys and Rewards sections and
          seeded demo data.
        </Card>
      </main>
    </div>
  );
}
