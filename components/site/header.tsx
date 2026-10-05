import Link from "next/link";
import { Trophy } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Blik Games</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          <Link href="/" className="transition-colors hover:text-foreground">
            Главная
          </Link>
          <Link href="/archive" className="transition-colors hover:text-foreground">
            Архив
          </Link>
          <Link href="/team" className="transition-colors hover:text-foreground">
            Кабинет капитана
          </Link>
          <Link href="/admin" className="transition-colors hover:text-foreground">
            Админ
          </Link>
        </nav>
      </div>
    </header>
  );
}
