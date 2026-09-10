"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Logo, buttonStyles, Card } from "@/components/ui";
import { COUNTRIES } from "@/lib/countries";

const GENDERS = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    country: "",
    region: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Please check your details.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      router.push("/login");
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-16">
      <Logo />
      <Card className="w-full max-w-lg">
        <h1 className="mb-1 text-xl font-semibold">Join Xprim</h1>
        <p className="mb-6 text-sm text-muted">Create your account to start earning XP.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              First name
              <input
                required
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Last name
              <input
                required
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Date of birth
              <input
                type="date"
                required
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Gender
              <select
                required
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select…
                </option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Country
              <select
                required
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select…
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Region / city
              <input
                required
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
                className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={loading} className={buttonStyles.primary}>
            {loading ? "Creating your account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brand hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
