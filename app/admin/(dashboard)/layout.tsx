import Link from "next/link";
import { Trophy, LogOut } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { Toaster } from "@/components/ui/sonner";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { adminNavItems, filterNavItems } from "@/components/admin/nav-items";
import { APP_ROLE_LABELS } from "@/lib/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const isSuperadmin = profile.role === "superadmin";
  const isJudge = profile.role === "judge";
  const visibleItems = filterNavItems(adminNavItems, isSuperadmin, isJudge);
  const roleLabel = profile.role ? APP_ROLE_LABELS[profile.role] : "";

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f] lg:flex-row">
      <AdminMobileNav
        isSuperadmin={isSuperadmin}
        isJudge={isJudge}
        displayName={profile.display_name}
        roleLabel={roleLabel}
      />

      <aside className="relative hidden w-64 shrink-0 border-r border-white/10 bg-white/[0.02] lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <Trophy className="h-5 w-5 text-violet-400" />
          <span className="font-display font-bold">Blik Games</span>
        </div>
        <nav className="space-y-1 p-4">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-white/10 p-4">
          <div className="mb-3 px-1 text-xs text-muted-foreground">
            {profile.display_name}
            <br />
            <span className="text-[10px] uppercase tracking-wide">{roleLabel}</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Выйти
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
      <Toaster />
    </div>
  );
}
