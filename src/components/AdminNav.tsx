import Link from "next/link";
import { Logo } from "@/components/ui";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/surveys", label: "Surveys" },
  { href: "/admin/respondents", label: "Respondents" },
  { href: "/admin/participations", label: "Participations" },
  { href: "/admin/rewards", label: "Rewards" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <header className="border-b border-card-border">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="rounded-full bg-muted/10 px-2.5 py-1 text-xs font-medium text-muted">Admin</span>
        </div>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
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
        <LogoutButton className="text-sm text-muted hover:text-foreground" />
      </div>
    </header>
  );
}
