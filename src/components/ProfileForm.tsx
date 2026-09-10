"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui";

interface ProfileFormProps {
  initial: {
    employmentStatus: string | null;
    householdSize: number | null;
    education: string | null;
    incomeBracket: string | null;
    interests: string[];
  };
}

const EMPLOYMENT = [
  ["EMPLOYED_FULL_TIME", "Employed full-time"],
  ["EMPLOYED_PART_TIME", "Employed part-time"],
  ["SELF_EMPLOYED", "Self-employed"],
  ["UNEMPLOYED", "Unemployed"],
  ["STUDENT", "Student"],
  ["RETIRED", "Retired"],
  ["OTHER", "Other"],
];

const EDUCATION = [
  ["PRIMARY", "Primary"],
  ["SECONDARY", "Secondary"],
  ["VOCATIONAL", "Vocational"],
  ["UNDERGRADUATE", "Undergraduate"],
  ["POSTGRADUATE", "Postgraduate"],
  ["OTHER", "Other"],
];

const INCOME = [
  ["LOW", "Low"],
  ["LOWER_MIDDLE", "Lower middle"],
  ["MIDDLE", "Middle"],
  ["UPPER_MIDDLE", "Upper middle"],
  ["HIGH", "High"],
  ["PREFER_NOT_TO_SAY", "Prefer not to say"],
];

const INTERESTS = ["Shopping", "Banking", "Food delivery", "Streaming", "Travel", "Technology", "Health"];

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    employmentStatus: initial.employmentStatus ?? "",
    householdSize: initial.householdSize?.toString() ?? "",
    education: initial.education ?? "",
    incomeBracket: initial.incomeBracket ?? "",
    interests: initial.interests,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleInterest(interest: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);

    const payload: Record<string, unknown> = { interests: form.interests };
    if (form.employmentStatus) payload.employmentStatus = form.employmentStatus;
    if (form.education) payload.education = form.education;
    if (form.incomeBracket) payload.incomeBracket = form.incomeBracket;
    if (form.householdSize) payload.householdSize = Number(form.householdSize);

    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Employment status
          <select
            value={form.employmentStatus}
            onChange={(e) => setForm((f) => ({ ...f, employmentStatus: e.target.value }))}
            className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Not set</option>
            {EMPLOYMENT.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Household size
          <input
            type="number"
            min={1}
            max={20}
            value={form.householdSize}
            onChange={(e) => setForm((f) => ({ ...f, householdSize: e.target.value }))}
            className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Education
          <select
            value={form.education}
            onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
            className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Not set</option>
            {EDUCATION.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Household income bracket
          <select
            value={form.incomeBracket}
            onChange={(e) => setForm((f) => ({ ...f, incomeBracket: e.target.value }))}
            className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Not set</option>
            {INCOME.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm">Interests</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <button
              type="button"
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                form.interests.includes(interest)
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-card-border text-muted"
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className={buttonStyles.primary}>
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="text-sm text-accent">Saved!</span>}
      </div>
    </form>
  );
}
