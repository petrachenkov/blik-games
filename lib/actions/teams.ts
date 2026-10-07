"use server";

import { revalidatePath } from "next/cache";
import { eq, and, or, ne } from "drizzle-orm";
import { db, teams, matches, tournaments } from "@/db";
import { requireProfile } from "@/lib/auth/session";
import { isAdminOfGame, isStaffOfGame } from "@/lib/auth/rules";
import { logAction } from "@/lib/actions/audit";
import { advanceWinnerIfNeeded, finalizeTournamentIfChampionDecided, finalizeRoundRobinIfComplete } from "@/lib/actions/matches";
import type { ModesPlanEntry } from "@/lib/types";

const FORBIDDEN = { error: "Недостаточно прав" };

async function getTournamentGameId(tournamentId: string): Promise<string | null> {
  const row = await db.query.tournaments.findFirst({ where: eq(tournaments.id, tournamentId), columns: { game_id: true } });
  return row?.game_id ?? null;
}

export async function approveTeam(teamId: string, tournamentId: string) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return FORBIDDEN;

  await db.update(teams).set({ status: "approved", reject_reason: null }).where(eq(teams.id, teamId));
  await logAction("approve", "team", teamId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

export async function rejectTeam(teamId: string, tournamentId: string, reason: string) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return FORBIDDEN;

  await db.update(teams).set({ status: "rejected", reject_reason: reason }).where(eq(teams.id, teamId));
  await logAction("reject", "team", teamId, { reason });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

export async function disqualifyTeam(teamId: string, tournamentId: string, reason: string) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return FORBIDDEN;

  await db.update(teams).set({ status: "disqualified", reject_reason: reason }).where(eq(teams.id, teamId));

  // Технические поражения: иначе недоигранные матчи дисквалифицированной команды
  // навсегда блокируют проверку "групповой этап завершён" при генерации плей-офф.
  const pendingMatches = await db
    .select({ id: matches.id, team_a_id: matches.team_a_id, team_b_id: matches.team_b_id, win_target: matches.win_target, modes_plan: matches.modes_plan })
    .from(matches)
    .where(and(eq(matches.tournament_id, tournamentId), or(eq(matches.team_a_id, teamId), eq(matches.team_b_id, teamId)), ne(matches.status, "finished")));

  // Технический счёт матча — всегда 2:0, как обычная победа без решающего режима
  // (раньше здесь стоял win_target, из-за чего в группе технарь считался как 1:0, а в финале
  // как 3:0 — оба раза не совпадало с тем, как выглядит нормальная победа 2:0 по режимам).
  const TECH_WIN_MODES = 2;

  for (const m of pendingMatches) {
    const opponentId = m.team_a_id === teamId ? m.team_b_id : m.team_a_id;
    if (!opponentId) continue; // соперник ещё не определён (пустой слот плей-офф) — нечего форфейтить

    const scoreA = m.team_a_id === teamId ? 0 : TECH_WIN_MODES;
    const scoreB = m.team_b_id === teamId ? 0 : TECH_WIN_MODES;
    // Засчитываем технический счёт только в первых двух режимах (решающий — не нужен, как и при
    // обычной победе 2:0), иначе при повторном открытии редактора режимов счёт покажет 0:0 без победителя.
    const modesPlan: ModesPlanEntry[] = Array.isArray(m.modes_plan)
      ? m.modes_plan.map((entry, i) =>
          i < TECH_WIN_MODES
            ? {
                ...entry,
                scoreA: m.team_a_id === teamId ? 0 : m.win_target,
                scoreB: m.team_b_id === teamId ? 0 : m.win_target,
                winnerTeamId: opponentId,
              }
            : entry
        )
      : m.modes_plan;

    await db.update(matches).set({ score_a: scoreA, score_b: scoreB, modes_plan: modesPlan, status: "finished" }).where(eq(matches.id, m.id));

    await advanceWinnerIfNeeded(m.id);
    await finalizeTournamentIfChampionDecided(m.id);
    await finalizeRoundRobinIfComplete(m.id);
  }

  await logAction("disqualify", "team", teamId, { reason, forfeitedMatches: pendingMatches.length });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteTeam(teamId: string, tournamentId: string) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return FORBIDDEN;

  await db.delete(teams).where(eq(teams.id, teamId));
  await logAction("delete", "team", teamId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

export async function assignGroup(teamId: string, tournamentId: string, groupLabel: string) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return FORBIDDEN;

  await db.update(teams).set({ group_label: groupLabel || null }).where(eq(teams.id, teamId));
  await logAction("assign_group", "team", teamId, { groupLabel });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

export async function drawGroups(tournamentId: string, groupCount: number) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return FORBIDDEN;

  const approvedTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.tournament_id, tournamentId), eq(teams.status, "approved")));

  if (approvedTeams.length === 0) return { error: "Нет одобренных команд" };

  const shuffled = [...approvedTeams].sort(() => Math.random() - 0.5);
  const groupLetters = "ABCDEFGHIJKLMNOP";

  await Promise.all(
    shuffled.map((team, i) => db.update(teams).set({ group_label: `Группа ${groupLetters[i % groupCount]}` }).where(eq(teams.id, team.id)))
  );

  await logAction("draw_groups", "tournament", tournamentId, { groupCount });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

export async function exportTeamsCsv(tournamentId: string): Promise<string> {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId || !(await isStaffOfGame(user, gameId))) return "";

  const rows: string[] = ["Команда,Статус,Капитан Telegram,Игрок,Группа,Учебная группа,Telegram игрока,Запасной"];

  const teamsWithPlayers = await db.query.teams.findMany({
    where: eq(teams.tournament_id, tournamentId),
    with: { players: true },
    orderBy: (t, { asc }) => asc(t.created_at),
  });

  for (const team of teamsWithPlayers) {
    for (const player of team.players) {
      rows.push(
        [team.name, team.status, team.captain_telegram, player.full_name, team.group_label ?? "", player.study_group, player.telegram, player.is_substitute ? "да" : "нет"]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    }
  }

  return rows.join("\n");
}
