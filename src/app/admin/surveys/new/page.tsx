import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { Card } from "@/components/ui";
import { SurveyForm } from "@/components/SurveyForm";

export default async function NewSurveyPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav active="/admin/surveys" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Create survey</h1>
        <Card>
          <SurveyForm />
        </Card>
      </main>
    </div>
  );
}
