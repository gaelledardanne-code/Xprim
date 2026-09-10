import Link from "next/link";
import { Logo } from "@/components/ui";
import { LogoutButton } from "@/components/LogoutButton";
import { getBalance } from "@/server/services/points";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/rewards", label: "Rewards" },
];

export async function RespondentNav({ userId, active }: { userId: string; active: string }) {
  const balance = await getBalance(userId);

  return (
    <header className="border-b border-card-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 ${
                active === link.href ? "bg-brand/10 text-brand font-medium" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent">
            {balance.toLocaleString()} XP
          </span>
          <LogoutButton className="text-sm text-muted hover:text-foreground" />
        </div>
      </div>
    </header>
  );
}
