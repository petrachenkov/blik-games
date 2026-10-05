import { eq, and, ne, inArray, isNotNull, desc, asc } from "drizzle-orm";
import { db, tournaments, matches, games } from "@/db";
import type { Tournament, Match } from "@/lib/types";

export async function getTournamentsForGame(gameId: string): Promise<Tournament[]> {
  const rows = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.game_id, gameId))
    .orderBy(asc(tournaments.starts_at));
  return rows as unknown as Tournament[];
}

export async function getTournamentBySlug(gameSlug: string, tournamentSlug: string): Promise<Tournament | null> {
  const rows = await db
    .select({ tournament: tournaments, games: games })
    .from(tournaments)
    .innerJoin(games, eq(games.id, tournaments.game_id))
    .where(and(eq(tournaments.slug, tournamentSlug), eq(games.slug, gameSlug)))
    .limit(1);
  if (rows.length === 0) return null;
  return { ...rows[0].tournament, games: rows[0].games } as unknown as Tournament;
}

export async function getUpcomingTournamentWithGame(): Promise<Tournament | null> {
  const rows = await db
    .select({ tournament: tournaments, games: games })
    .from(tournaments)
    .innerJoin(games, eq(games.id, tournaments.game_id))
    .where(and(inArray(tournaments.status, ["registration", "registration_closed", "ongoing"]), ne(games.status, "hidden")))
    .orderBy(asc(tournaments.starts_at))
    .limit(1);
  if (rows.length === 0) return null;
  return { ...rows[0].tournament, games: rows[0].games } as unknown as Tournament;
}

export async function getUpcomingMatches(limit = 6): Promise<Match[]> {
  const rows = await db.query.matches.findMany({
    where: and(eq(matches.status, "scheduled"), isNotNull(matches.scheduled_at), isNotNull(matches.team_a_id), isNotNull(matches.team_b_id)),
    with: {
      team_a: true,
      team_b: true,
      tournaments: { with: { games: true } },
    },
    orderBy: asc(matches.scheduled_at),
    limit: limit * 4, // с запасом — часть отфильтруется ниже по скрытым играм
  });
  return (rows as unknown as Match[]).filter((m: any) => m.tournaments?.games?.status !== "hidden").slice(0, limit);
}

export async function getRecentResults(limit = 6): Promise<Match[]> {
  const rows = await db.query.matches.findMany({
    where: eq(matches.status, "finished"),
    with: {
      team_a: true,
      team_b: true,
      tournaments: { with: { games: true } },
    },
    orderBy: desc(matches.scheduled_at),
    limit: limit * 4,
  });
  return (rows as unknown as Match[]).filter((m: any) => m.tournaments?.games?.status !== "hidden").slice(0, limit);
}
