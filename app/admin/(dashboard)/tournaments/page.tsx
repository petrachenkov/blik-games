import Link from "next/link";
import { redirect } from "next/navigation";
import { Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/components/site/status-badge";
import { TournamentFormDialog } from "@/components/admin/tournament-form-dialog";
import { DuplicateButton } from "@/components/admin/duplicate-button";
import { requireProfile, getAllowedGameIds } from "@/lib/auth";
import { getAllGamesAdmin } from "@/lib/data/games";
import { inArray, desc } from "drizzle-orm";
import { db, tournaments as tournamentsTable } from "@/db";
import { formatDate } from "@/lib/utils";

export default async function AdminTournamentsPage() {
  const profile = await requireProfile();
  if (profile.role === "judge") redirect("/admin/appeals");
  const allowed = await getAllowedGameIds(profile);
  const allGames = await getAllGamesAdmin();
  const games = allowed === "all" ? allGames : allGames.filter((g) => allowed.includes(g.id));

  const gameIds = games.map((g) => g.id);
  const tournaments = gameIds.length
    ? await db.select().from(tournamentsTable).where(inArray(tournamentsTable.game_id, gameIds)).orderBy(desc(tournamentsTable.created_at))
    : [];

  const byGame = games.map((game) => ({
    game,
    tournaments: (tournaments ?? []).filter((t) => t.game_id === game.id),
  }));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold">Турниры</h1>

      {byGame.map(({ game, tournaments }) => (
        <div key={game.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: game.accent_color }} />
              <h2 className="font-display text-lg font-bold">{game.name}</h2>
            </div>
            <TournamentFormDialog
              gameId={game.id}
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="h-3.5 w-3.5" /> Новый турнир
                </Button>
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.length === 0 && (
              <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-muted-foreground">
                Турниров пока нет.
              </div>
            )}
            {tournaments.map((t) => (
              <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <TournamentStatusBadge status={t.status} />
                  <span className="text-xs text-muted-foreground">{formatDate(t.starts_at)}</span>
                </div>
                <Link href={`/admin/tournaments/${t.id}`} className="font-medium hover:underline">
                  {t.title}
                </Link>
                <div className="mt-3 flex items-center gap-2">
                  <Link href={`/admin/tournaments/${t.id}`}>
                    <Button size="sm" variant="outline">
                      Управлять
                    </Button>
                  </Link>
                  <DuplicateButton tournamentId={t.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
