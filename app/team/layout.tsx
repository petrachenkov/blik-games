import Link from "next/link";
import { Trophy, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { signOutCaptain } from "@/lib/actions/auth";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Blik Games</span>
          </Link>
          {user && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="hidden sm:inline">{user.email}</span>
              <form action={signOutCaptain}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
                >
                  <LogOut className="h-3.5 w-3.5" /> Выйти
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
}
