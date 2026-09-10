import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RespondentNav } from "@/components/RespondentNav";
import { ProfileForm } from "@/components/ProfileForm";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompletion } from "@/server/services/profile";
import { COUNTRIES } from "@/lib/countries";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const completion = calculateProfileCompletion(profile);
  const countryName = COUNTRIES.find((c) => c.code === profile.country)?.name ?? profile.country;

  return (
    <div className="flex min-h-full flex-col">
      <RespondentNav userId={session.user.id} active="/profile" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <h1 className="mb-1 text-2xl font-semibold">Your profile</h1>
        <p className="mb-6 text-muted">A few extra details help us match you with the right surveys.</p>

        <Card className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Profile completion</span>
            <span className="font-semibold">{completion}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-card-border">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${completion}%` }} />
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-muted">Basic information</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">Date of birth</dt>
            <dd>{profile.dateOfBirth?.toISOString().slice(0, 10) ?? "—"}</dd>
            <dt className="text-muted">Gender</dt>
            <dd>{profile.gender ?? "—"}</dd>
            <dt className="text-muted">Country</dt>
            <dd>{countryName ?? "—"}</dd>
            <dt className="text-muted">Region / city</dt>
            <dd>{profile.region ?? "—"}</dd>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-muted">Additional profiling</h2>
          <ProfileForm
            initial={{
              employmentStatus: profile.employmentStatus,
              householdSize: profile.householdSize,
              education: profile.education,
              incomeBracket: profile.incomeBracket,
              interests: profile.interests,
            }}
          />
        </Card>
      </main>
    </div>
  );
}
