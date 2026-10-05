import { eq, and } from "drizzle-orm";
import { db, game_admins, teams, matches } from "@/db";
import type { SessionUser } from "@/lib/auth/session";

export class AuthzError extends Error {}

export function isSuperadmin(user: SessionUser): boolean {
  return user.role === "superadmin";
}

export async function isAdminOfGame(user: SessionUser, gameId: string): Promise<boolean> {
  if (isSuperadmin(user)) return true;
  if (user.role !== "game_admin") return false;
  const row = await db
    .select({ game_id: game_admins.game_id })
    .from(game_admins)
    .where(and(eq(game_admins.user_id, user.id), eq(game_admins.game_id, gameId)))
    .limit(1);
  return row.length > 0;
}

export async function isJudgeOfGame(user: SessionUser, gameId: string): Promise<boolean> {
  if (isSuperadmin(user)) return true;
  if (user.role !== "judge") return false;
  const row = await db
    .select({ game_id: game_admins.game_id })
    .from(game_admins)
    .where(and(eq(game_admins.user_id, user.id), eq(game_admins.game_id, gameId)))
    .limit(1);
  return row.length > 0;
}

export async function isStaffOfGame(user: SessionUser, gameId: string): Promise<boolean> {
  return (await isAdminOfGame(user, gameId)) || (await isJudgeOfGame(user, gameId));
}

export async function assertSuperadmin(user: SessionUser): Promise<void> {
  if (!isSuperadmin(user)) throw new AuthzError("Недостаточно прав");
}

export async function assertAdminOfGame(user: SessionUser, gameId: string): Promise<void> {
  if (!(await isAdminOfGame(user, gameId))) throw new AuthzError("Недостаточно прав");
}

export async function assertStaffOfGame(user: SessionUser, gameId: string): Promise<void> {
  if (!(await isStaffOfGame(user, gameId))) throw new AuthzError("Недостаточно прав");
}

export async function isCaptainOfTeam(user: SessionUser, teamId: string): Promise<boolean> {
  const row = await db.select({ captain_user_id: teams.captain_user_id }).from(teams).where(eq(teams.id, teamId)).limit(1);
  return row.length > 0 && row[0].captain_user_id === user.id;
}

export async function isTeamInMatch(teamId: string, matchId: string): Promise<boolean> {
  const row = await db
    .select({ team_a_id: matches.team_a_id, team_b_id: matches.team_b_id })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (row.length === 0) return false;
  return row[0].team_a_id === teamId || row[0].team_b_id === teamId;
}
