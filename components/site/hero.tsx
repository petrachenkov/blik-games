import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Countdown } from "@/components/site/countdown";
import { formatDateTime, hexToRgba } from "@/lib/utils";
import type { Tournament } from "@/lib/types";

export function Hero({ tournament }: { tournament: Tournament | null }) {
  const game = tournament?.games;
  const accent = game?.accent_color ?? "#7C3AED";

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          background: `radial-gradient(900px circle at 20% -10%, ${hexToRgba(accent, 0.35)}, transparent 60%), radial-gradient(700px circle at 90% 10%, ${hexToRgba(accent, 0.2)}, transparent 55%)`,
        }}
      />
      <div className="absolute inset-0 -z-10 bg-grid-pattern bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />

      <div className="container flex flex-col items-center gap-8 py-16 text-center sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Киберспортивный хаб колледжа
        </span>
        <h1 className="max-w-3xl text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Собери команду.
          <br />
          <span style={{ color: accent }}>Стань чемпионом.</span>
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground sm:text-lg">
          Турниры по Brawl Stars, CS2, Dota 2, Valorant и другим играм. Регистрируй команду и
          сражайся за звание лучших киберспортсменов колледжа.
        </p>

        {tournament && game ? (
          <div className="mt-4 flex w-full max-w-xl flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Ближайший турнир
            </div>
            <Link
              href={`/${game.slug}/${tournament.slug}`}
              className="font-display text-2xl font-bold transition-colors hover:opacity-80"
              style={{ color: accent }}
            >
              {tournament.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              {game.name} · старт {formatDateTime(tournament.starts_at)}
            </p>
            {tournament.starts_at && <Countdown target={tournament.starts_at} />}
            <Link
              href={`/${game.slug}/${tournament.slug}`}
              className="mt-2 inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: accent, boxShadow: `0 0 30px ${hexToRgba(accent, 0.4)}` }}
            >
              Подробнее о турнире
            </Link>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-6 text-muted-foreground backdrop-blur-xl">
            Скоро здесь появится анонс ближайшего турнира — следи за обновлениями!
          </div>
        )}
      </div>
    </section>
  );
}
