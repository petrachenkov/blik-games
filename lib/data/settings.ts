import { eq, or, isNull, desc, ne, count } from "drizzle-orm";
import { db, settings, games, tournaments, teams, players, announcements } from "@/db";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = typeof row.value === "string" ? row.value : JSON.stringify(row.value);
  }
  return result;
}

export async function getStats() {
  const [[{ c: gamesCount }], [{ c: tournamentsCount }], [{ c: teamsCount }], [{ c: playersCount }]] = await Promise.all([
    db.select({ c: count() }).from(games).where(ne(games.status, "hidden")),
    db.select({ c: count() }).from(tournaments),
    db.select({ c: count() }).from(teams).where(eq(teams.status, "approved")),
    db.select({ c: count() }).from(players),
  ]);
  return {
    games: gamesCount,
    tournaments: tournamentsCount,
    teams: teamsCount,
    players: playersCount,
  };
}

export async function getAnnouncements(gameId?: string) {
  return db.query.announcements.findMany({
    where: gameId ? or(eq(announcements.game_id, gameId), isNull(announcements.game_id)) : undefined,
    with: { games: { columns: { id: true, name: true, slug: true, accent_color: true } } },
    orderBy: [desc(announcements.is_pinned), desc(announcements.created_at)],
  });
}
