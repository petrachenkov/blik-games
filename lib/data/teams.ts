import { eq, and, ne, asc } from "drizzle-orm";
import { db, teams, matches } from "@/db";
import type { Team, Match } from "@/lib/types";

/**
 * includeAll=true возвращает и pending-заявки — только для админки/судей,
 * куда попадают исключительно после requireProfile()+assertStaffOfGame().
 * Публичным страницам всегда передавать includeAll=false.
 */
export async function getTeamsForTournament(tournamentId: string, includeAll = false): Promise<Team[]> {
  const rows = await db.query.teams.findMany({
    where: includeAll
      ? eq(teams.tournament_id, tournamentId)
      : and(eq(teams.tournament_id, tournamentId), ne(teams.status, "pending")),
    with: { players: true },
    orderBy: asc(teams.created_at),
  });
  return rows as unknown as Team[];
}

export async function getMatchesForTournament(tournamentId: string): Promise<Match[]> {
  const rows = await db.query.matches.findMany({
    where: eq(matches.tournament_id, tournamentId),
    with: { team_a: true, team_b: true },
    orderBy: [asc(matches.round), asc(matches.scheduled_at)],
  });
  return rows as unknown as Match[];
}
