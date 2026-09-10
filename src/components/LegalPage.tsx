import Link from "next/link";
import { Logo } from "@/components/ui";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto w-full max-w-3xl px-6 py-6">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
        <p className="mb-8 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
          Placeholder content for V1 — pending legal review before this platform handles real research
          participant data.
        </p>
        <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground/90">{children}</div>
      </main>
      <footer className="mx-auto w-full max-w-3xl px-6 py-8 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          ← Back to Xprim
        </Link>
      </footer>
    </div>
  );
}
