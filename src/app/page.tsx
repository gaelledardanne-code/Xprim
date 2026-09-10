import Link from "next/link";
import { Logo, buttonStyles } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="px-3 py-2 text-foreground/80 hover:text-foreground">
            Log in
          </Link>
          <Link href="/register" className={buttonStyles.primary}>
            Join Xprim
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          Xprim by Tagada
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Your opinion has value.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Answer surveys. Share your perspective. Earn points.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className={buttonStyles.primary}>
            Join Xprim
          </Link>
          <Link href="/login" className={buttonStyles.secondary}>
            Log in
          </Link>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap justify-center gap-4 px-6 py-8 text-xs text-muted">
        <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link>
        <Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link>
      </footer>
    </div>
  );
}
