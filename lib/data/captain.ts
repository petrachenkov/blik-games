import { eq, and, or, inArray } from "drizzle-orm";
import { db, teams, matches, match_results, appeals } from "@/db";

export async function getCaptainTeams(userId: string) {
  return db.query.teams.findMany({
    where: eq(teams.captain_user_id, userId),
    with: { tournaments: { with: { games: true } } },
    orderBy: (t, { desc }) => desc(t.created_at),
  });
}

export async function getCaptainTeamDetail(teamId: string, userId: string) {
  const team = await db.query.teams.findFirst({
    where: and(eq(teams.id, teamId), eq(teams.captain_user_id, userId)),
    with: {
      players: true,
      tournaments: { with: { games: true } },
    },
  });

  if (!team) return null;

  const teamMatches = await db.query.matches.findMany({
    where: and(eq(matches.tournament_id, team.tournament_id), or(eq(matches.team_a_id, teamId), eq(matches.team_b_id, teamId))),
    with: { team_a: true, team_b: true },
    orderBy: (m, { asc }) => asc(m.round),
  });

  const matchIds = teamMatches.map((m) => m.id);

  const [results, teamAppeals] = await Promise.all([
    matchIds.length ? db.select().from(match_results).where(inArray(match_results.match_id, matchIds)) : Promise.resolve([]),
    matchIds.length ? db.select().from(appeals).where(inArray(appeals.match_id, matchIds)) : Promise.resolve([]),
  ]);

  return { team, matches: teamMatches, results, appeals: teamAppeals };
}
