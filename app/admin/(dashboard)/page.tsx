import Link from "next/link";
import { redirect } from "next/navigation";
import { Gamepad2, Trophy, FileClock, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inArray, eq, and, asc, desc } from "drizzle-orm";
import { db, tournaments as tournamentsTable, teams, matches } from "@/db";
import { requireProfile, getAllowedGameIds } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

const NO_GAMES = ["00000000-0000-0000-0000-000000000000"];

export default async function AdminDashboardPage() {
  const profile = await requireProfile();
  if (profile.role === "judge") redirect("/admin/appeals");
  const allowed = await getAllowedGameIds(profile);
  const gameIds = allowed === "all" ? null : allowed.length ? allowed : NO_GAMES;

  const activeTournaments = await db.query.tournaments.findMany({
    where: gameIds
      ? and(inArray(tournamentsTable.status, ["registration", "ongoing", "registration_closed"]), inArray(tournamentsTable.game_id, gameIds))
      : inArray(tournamentsTable.status, ["registration", "ongoing", "registration_closed"]),
    with: { games: { columns: { name: true, slug: true, accent_color: true } } },
    orderBy: asc(tournamentsTable.starts_at),
  });

  const pendingTeamsAll = await db.query.teams.findMany({
    where: eq(teams.status, "pending"),
    with: { tournaments: { with: { games: { columns: { name: true, slug: true } } } } },
    orderBy: desc(teams.created_at),
    limit: 50,
  });
  const pendingTeams = (gameIds ? pendingTeamsAll.filter((t) => gameIds.includes(t.tournaments.game_id)) : pendingTeamsAll).slice(0, 8);

  const upcomingMatchesAll = await db.query.matches.findMany({
    where: eq(matches.status, "scheduled"),
    with: { team_a: { columns: { name: true } }, team_b: { columns: { name: true } }, tournaments: { columns: { title: true, game_id: true } } },
    orderBy: asc(matches.scheduled_at),
    limit: 50,
  });
  const upcomingMatches = (gameIds ? upcomingMatchesAll.filter((m) => gameIds.includes(m.tournaments.game_id)) : upcomingMatchesAll).slice(0, 5);

  const stats = [
    { label: "Активные турниры", value: activeTournaments?.length ?? 0, icon: Trophy },
    { label: "Новые заявки", value: pendingTeams?.length ?? 0, icon: FileClock },
    { label: "Ближайшие матчи", value: upcomingMatches?.length ?? 0, icon: CalendarClock },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Дашборд</h1>
        <p className="text-sm text-muted-foreground">Обзор текущей активности</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Новые заявки команд</h2>
            <div className="space-y-3">
              {(pendingTeams ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Нет заявок на рассмотрении.</p>
              )}
              {(pendingTeams ?? []).map((t: any) => (
                <Link
                  key={t.id}
                  href={`/admin/tournaments/${t.tournaments?.id ?? ""}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm hover:bg-white/[0.06]"
                >
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.tournaments?.games?.name}</div>
                  </div>
                  <Badge variant="outline">На рассмотрении</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Ближайшие матчи</h2>
            <div className="space-y-3">
              {(upcomingMatches ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Матчи не запланированы.</p>
              )}
              {(upcomingMatches ?? []).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                >
                  <div>
                    {m.team_a?.name ?? "TBD"} vs {m.team_b?.name ?? "TBD"}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateTime(m.scheduled_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
            <Gamepad2 className="h-5 w-5" /> Активные турниры
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(activeTournaments ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Нет активных турниров.</p>
            )}
            {(activeTournaments ?? []).map((t: any) => (
              <Link
                key={t.id}
                href={`/admin/tournaments/${t.id}`}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm hover:bg-white/[0.06]"
              >
                <div style={{ color: t.games?.accent_color }} className="text-xs">
                  {t.games?.name}
                </div>
                <div className="font-medium">{t.title}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
