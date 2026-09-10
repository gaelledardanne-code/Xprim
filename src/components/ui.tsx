import Link from "next/link";
import { clsx } from "@/lib/clsx";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={clsx("inline-flex items-baseline gap-1.5 font-semibold tracking-tight", className)}>
      <span className="text-xl text-brand">Xprim</span>
      <span className="text-xs font-normal text-muted">by Tagada</span>
    </Link>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

export const buttonStyles = {
  primary: clsx(buttonBase, "bg-brand text-brand-foreground hover:bg-brand-dark"),
  secondary: clsx(buttonBase, "bg-card border border-card-border text-foreground hover:bg-card-border/40"),
  danger: clsx(buttonBase, "bg-danger text-white hover:opacity-90"),
  ghost: clsx(buttonBase, "text-brand hover:bg-brand/10"),
};

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("rounded-2xl border border-card-border bg-card p-5 shadow-sm", className)}>{children}</div>
  );
}

export function Badge({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "accent" | "muted" | "warning" | "danger" }) {
  const toneClasses = {
    brand: "bg-brand/10 text-brand",
    accent: "bg-accent/10 text-accent",
    muted: "bg-muted/10 text-muted",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  }[tone];
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneClasses)}>
      {children}
    </span>
  );
}
