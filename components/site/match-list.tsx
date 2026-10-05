import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ModeBadge } from "@/components/site/mode-badge";
import { formatDateTime } from "@/lib/utils";
import type { Match } from "@/lib/types";

function TeamLabel({ team }: { team?: { name: string } | null }) {
  return <span className="font-medium">{team?.name ?? "TBD"}</span>;
}

export function UpcomingMatchesSection({ matches }: { matches: Match[] }) {
  if (matches.length === 0) return null;
  return (
    <section className="container py-12">
      <div className="mb-6 flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-violet-400" />
        <h2 className="font-display text-2xl font-bold">Ближайшие матчи</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => {
          const tournament = (match as any).tournaments;
          const game = tournament?.games;
          return (
            <Link
              key={match.id}
              href={game ? `/${game.slug}/${tournament.slug}` : "#"}
              className="block"
            >
              <Card className="h-full transition-transform hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-1.5 text-xs">
                    <span className="font-semibold" style={{ color: game?.accent_color }}>
                      {game?.name}
                    </span>
                    {tournament?.title && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="truncate text-muted-foreground">{tournament.title}</span>
                      </>
                    )}
                  </div>
                  <div className="mb-4 font-display text-xl font-bold leading-tight sm:text-2xl">
                    {formatDateTime(match.scheduled_at)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <TeamLabel team={match.team_a} />
                    <span className="text-muted-foreground">vs</span>
                    <TeamLabel team={match.team_b} />
                  </div>
                  {match.modes_plan && match.modes_plan.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {match.modes_plan.map((entry, i) => (
                        <ModeBadge key={i} mode={entry.mode} map={entry.map} />
                      ))}
                    </div>
                  ) : (
                    match.mode && (
                      <div className="mt-3">
                        <ModeBadge mode={match.mode} map={match.map ?? undefined} />
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function RecentResultsSection({ matches }: { matches: Match[] }) {
  if (matches.length === 0) return null;
  return (
    <section className="container py-12">
      <h2 className="mb-6 font-display text-2xl font-bold">Последние результаты</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => {
          const tournament = (match as any).tournaments;
          const game = tournament?.games;
          const aWins = (match.score_a ?? 0) > (match.score_b ?? 0);
          return (
            <Card key={match.id}>
              <CardContent className="p-5">
                <div className="mb-3 text-xs" style={{ color: game?.accent_color }}>
                  {game?.name}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={aWins ? "font-bold" : "text-muted-foreground"}>
                    {match.team_a?.name ?? "TBD"}
                  </span>
                  <span className="font-display font-bold tabular-nums">
                    {match.score_a ?? 0} : {match.score_b ?? 0}
                  </span>
                  <span className={!aWins ? "font-bold" : "text-muted-foreground"}>
                    {match.team_b?.name ?? "TBD"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
