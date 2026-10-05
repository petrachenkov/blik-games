import { eq } from "drizzle-orm";
import { db, match_results, appeals } from "@/db";
import type { MatchResult, Appeal } from "@/lib/types";

export async function getPendingMatchResults(gameIds: string[] | "all") {
  const rows = await db.query.match_results.findMany({
    where: eq(match_results.status, "pending"),
    with: {
      submitted_by_team: { columns: { id: true, name: true } },
      match: { with: { team_a: true, team_b: true, tournaments: { with: { games: true } } } },
    },
    orderBy: (r, { asc }) => asc(r.created_at),
  });

  if (gameIds === "all") return rows as unknown as MatchResult[];
  return rows.filter((r: any) => r.match?.tournaments?.game_id && gameIds.includes(r.match.tournaments.game_id)) as unknown as MatchResult[];
}

export async function getPendingAppeals(gameIds: string[] | "all") {
  const rows = await db.query.appeals.findMany({
    where: eq(appeals.status, "pending"),
    with: {
      submitted_by_team: { columns: { id: true, name: true } },
      match: { with: { team_a: true, team_b: true, tournaments: { with: { games: true } } } },
    },
    orderBy: (a, { asc }) => asc(a.created_at),
  });

  if (gameIds === "all") return rows as unknown as Appeal[];
  return rows.filter((a: any) => a.match?.tournaments?.game_id && gameIds.includes(a.match.tournaments.game_id)) as unknown as Appeal[];
}
