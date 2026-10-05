import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { eq } from "drizzle-orm";
import { db, tournaments as tournamentsTable } from "@/db";
import { requireProfile, getAllowedGameIds } from "@/lib/auth";
import { getTeamsForTournament, getMatchesForTournament } from "@/lib/data/teams";
import { TournamentStatusBadge } from "@/components/site/status-badge";
import { TournamentStatusSelect } from "@/components/admin/tournament-status-select";
import { TournamentFormDialog } from "@/components/admin/tournament-form-dialog";
import { TeamsModeration } from "@/components/admin/teams-moderation";
import { MatchesManager } from "@/components/admin/matches-manager";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { DeleteTournamentButton } from "@/components/admin/delete-tournament-button";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import type { Tournament } from "@/lib/types";

export default async function AdminTournamentDetailPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const profile = await requireProfile();
  if (profile.role === "judge") redirect("/admin/appeals");
  const allowed = await getAllowedGameIds(profile);

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournamentsTable.id, params.tournamentId),
    with: { games: true },
  });

  if (!tournament) notFound();
  if (allowed !== "all" && !allowed.includes(tournament.game_id)) notFound();

  const [teams, matches] = await Promise.all([
    getTeamsForTournament(tournament.id, true),
    getMatchesForTournament(tournament.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm" style={{ color: tournament.games?.accent_color }}>
            {tournament.games?.name}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{tournament.title}</h1>
            <TournamentStatusBadge status={tournament.status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TournamentStatusSelect tournamentId={tournament.id} status={tournament.status} />
          <TournamentFormDialog
            tournament={tournament as Tournament}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="h-3.5 w-3.5" /> Редактировать
              </Button>
            }
          />
          <DeleteTournamentButton tournamentId={tournament.id} title={tournament.title} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/${tournament.games?.slug}/${tournament.slug}`} target="_blank">
          <Button variant="ghost" size="sm">
            Открыть публичную страницу →
          </Button>
        </Link>
        <CsvExportButton tournamentId={tournament.id} fileName={slugify(tournament.title)} />
      </div>

      <TeamsModeration
        tournamentId={tournament.id}
        teams={teams}
        playerFields={tournament.games?.game_config?.player_fields ?? []}
      />
      <MatchesManager
        tournamentId={tournament.id}
        matches={matches}
        teams={teams}
        format={tournament.format}
        modes={tournament.games?.game_config?.modes ?? []}
        gameConfig={tournament.games?.game_config}
      />
    </div>
  );
}
