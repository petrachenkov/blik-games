"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Trophy, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { adminNavItems, filterNavItems } from "@/components/admin/nav-items";

export function AdminMobileNav({
  isSuperadmin,
  isJudge,
  displayName,
  roleLabel,
}: {
  isSuperadmin: boolean;
  isJudge: boolean;
  displayName: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = filterNavItems(adminNavItems, isSuperadmin, isJudge);

  return (
    <div className="lg:hidden">
      <div className="flex h-16 items-center justify-between border-b border-white/10 bg-white/[0.02] px-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-violet-400" />
          <span className="font-display font-bold">Blik Games</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-[#0a0a0f] border-l border-white/10">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <span className="font-display font-bold">Меню</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground"
                aria-label="Закрыть меню"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-white/10 p-4">
              <div className="mb-3 px-1 text-xs text-muted-foreground">
                {displayName}
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
          </div>
        </div>
      )}
    </div>
  );
}
