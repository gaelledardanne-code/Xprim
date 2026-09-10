"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui";
import { COUNTRIES } from "@/lib/countries";

const GENDERS = ["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"];

export function SurveyForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    client: "",
    category: "",
    estimatedMinutes: "10",
    rewardPoints: "150",
    providerType: "MANUAL",
    externalUrl: "",
    externalSurveyId: "",
    startDate: "",
    endDate: "",
    maxResponses: "",
    targetCountries: [] as string[],
    minAge: "",
    maxAge: "",
    targetGenders: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCountry(code: string) {
    update(
      "targetCountries",
      form.targetCountries.includes(code)
        ? form.targetCountries.filter((c) => c !== code)
        : [...form.targetCountries, code],
    );
  }

  function toggleGender(g: string) {
    update("targetGenders", form.targetGenders.includes(g) ? form.targetGenders.filter((x) => x !== g) : [...form.targetGenders, g]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      client: form.client || undefined,
      category: form.category,
      estimatedMinutes: Number(form.estimatedMinutes),
      rewardPoints: Number(form.rewardPoints),
      providerType: form.providerType,
      externalUrl: form.externalUrl,
      externalSurveyId: form.externalSurveyId || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      maxResponses: form.maxResponses ? Number(form.maxResponses) : undefined,
      targetCountries: form.targetCountries,
      minAge: form.minAge ? Number(form.minAge) : undefined,
      maxAge: form.maxAge ? Number(form.maxAge) : undefined,
      targetGenders: form.targetGenders,
    };

    const res = await fetch("/api/admin/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create the survey.");
      return;
    }

    router.push("/admin/surveys");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Survey title
        <input required value={form.title} onChange={(e) => update("title", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea required rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Client
          <input value={form.client} onChange={(e) => update("client", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Category
          <input required value={form.category} onChange={(e) => update("category", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Estimated duration (minutes)
          <input type="number" min={1} required value={form.estimatedMinutes} onChange={(e) => update("estimatedMinutes", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Reward XP
          <input type="number" min={1} required value={form.rewardPoints} onChange={(e) => update("rewardPoints", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Survey provider
          <select value={form.providerType} onChange={(e) => update("providerType", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm">
            <option value="MANUAL">Manual / generic URL</option>
            <option value="SURVEYMONKEY">SurveyMonkey</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          External survey ID (optional)
          <input value={form.externalSurveyId} onChange={(e) => update("externalSurveyId", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        External URL
        <input type="url" required placeholder="https://www.surveymonkey.com/r/..." value={form.externalUrl} onChange={(e) => update("externalUrl", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Start date
          <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          End date
          <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Maximum responses
          <input type="number" min={1} value={form.maxResponses} onChange={(e) => update("maxResponses", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
        </label>
      </div>

      <fieldset className="rounded-lg border border-card-border p-4">
        <legend className="px-1 text-sm font-medium">Eligibility (leave empty for &quot;anyone&quot;)</legend>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Minimum age
            <input type="number" min={0} value={form.minAge} onChange={(e) => update("minAge", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Maximum age
            <input type="number" min={0} value={form.maxAge} onChange={(e) => update("maxAge", e.target.value)} className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm" />
          </label>
        </div>

        <p className="mb-2 mt-4 text-sm">Target countries</p>
        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
          {COUNTRIES.map((c) => (
            <button type="button" key={c.code} onClick={() => toggleCountry(c.code)} className={`rounded-full border px-2.5 py-1 text-xs ${form.targetCountries.includes(c.code) ? "border-brand bg-brand/10 text-brand" : "border-card-border text-muted"}`}>
              {c.name}
            </button>
          ))}
        </div>

        <p className="mb-2 mt-4 text-sm">Target gender</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button type="button" key={g} onClick={() => toggleGender(g)} className={`rounded-full border px-2.5 py-1 text-xs ${form.targetGenders.includes(g) ? "border-brand bg-brand/10 text-brand" : "border-card-border text-muted"}`}>
              {g.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" disabled={saving} className={buttonStyles.primary}>
        {saving ? "Creating…" : "Create survey"}
      </button>
    </form>
  );
}
