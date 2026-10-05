"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, count } from "drizzle-orm";
import { db, matches, tournaments, teams, games } from "@/db";
import { requireProfile } from "@/lib/auth/session";
import { isAdminOfGame, isStaffOfGame } from "@/lib/auth/rules";
import { logAction } from "@/lib/actions/audit";
import { buildRandomModesPlan } from "@/lib/game-config-utils";
import { computeStandings } from "@/lib/standings";
import type { MatchStage, MatchStatus, ModesPlanEntry, GameConfig } from "@/lib/types";

async function getTournamentGameId(tournamentId: string): Promise<string | null> {
  const row = await db.query.tournaments.findFirst({ where: eq(tournaments.id, tournamentId), columns: { game_id: true } });
  return row?.game_id ?? null;
}

async function getMatchTournamentId(matchId: string): Promise<string | null> {
  const row = await db.query.matches.findFirst({ where: eq(matches.id, matchId), columns: { tournament_id: true } });
  return row?.tournament_id ?? null;
}

async function getGameConfigForTournament(tournamentId: string): Promise<GameConfig | null> {
  const row = await db
    .select({ game_config: games.game_config })
    .from(tournaments)
    .innerJoin(games, eq(games.id, tournaments.game_id))
    .where(eq(tournaments.id, tournamentId))
    .limit(1);
  return row[0]?.game_config ?? null;
}

/**
 * Если матч завершён и у него задан next_match_id — записывает победителя
 * в соответствующий слот (A/B) следующего раунда сетки.
 */
export async function advanceWinnerIfNeeded(matchId: string): Promise<string | null> {
  const m = await db.query.matches.findFirst({ where: eq(matches.id, matchId) });
  if (!m || m.status !== "finished" || !m.next_match_id || !m.next_match_slot) return null;

  const winner = (m.score_a ?? 0) > (m.score_b ?? 0) ? m.team_a_id : (m.score_b ?? 0) > (m.score_a ?? 0) ? m.team_b_id : null;
  if (!winner) return null;

  if (m.next_match_slot === "a") {
    await db.update(matches).set({ team_a_id: winner }).where(eq(matches.id, m.next_match_id));
  } else {
    await db.update(matches).set({ team_b_id: winner }).where(eq(matches.id, m.next_match_id));
  }
  return null;
}

/**
 * Если завершённый матч — единственный матч в последнем раунде плей-офф
 * (т.е. финал), автоматически завершает турнир и фиксирует чемпиона/
 * серебряного призёра через teams.final_placement.
 */
export async function finalizeTournamentIfChampionDecided(matchId: string): Promise<string | null> {
  const m = await db.query.matches.findFirst({ where: eq(matches.id, matchId) });
  if (!m || m.status !== "finished" || m.stage !== "playoff") return null;

  const [maxRoundRow] = await db
    .select({ round: matches.round })
    .from(matches)
    .where(and(eq(matches.tournament_id, m.tournament_id), eq(matches.stage, "playoff")))
    .orderBy(desc(matches.round))
    .limit(1);
  if (maxRoundRow?.round !== m.round) return null; // не последний раунд

  const [{ c }] = await db
    .select({ c: count() })
    .from(matches)
    .where(and(eq(matches.tournament_id, m.tournament_id), eq(matches.stage, "playoff"), eq(matches.round, m.round)));
  if (c !== 1) return null; // в последнем раунде больше одного матча — это ещё не финал

  const winner = (m.score_a ?? 0) > (m.score_b ?? 0) ? m.team_a_id : (m.score_b ?? 0) > (m.score_a ?? 0) ? m.team_b_id : null;
  if (!winner) return null;
  const runnerUp = winner === m.team_a_id ? m.team_b_id : m.team_a_id;

  await db.update(tournaments).set({ status: "finished" }).where(eq(tournaments.id, m.tournament_id));
  await db.update(teams).set({ final_placement: 1 }).where(eq(teams.id, winner));
  if (runnerUp) await db.update(teams).set({ final_placement: 2 }).where(eq(teams.id, runnerUp));

  return null;
}

/**
 * Для формата round_robin нет стадии плей-офф — чемпион определяется по итоговой
 * таблице, как только отыграны все матчи. Вызывается при завершении любого
 * матча группового этапа; срабатывает только для format = 'round_robin'.
 */
export async function finalizeRoundRobinIfComplete(matchId: string): Promise<string | null> {
  const m = await db.query.matches.findFirst({ where: eq(matches.id, matchId) });
  if (!m || m.status !== "finished" || m.stage !== "group") return null;

  const tournament = await db.query.tournaments.findFirst({ where: eq(tournaments.id, m.tournament_id) });
  if (tournament?.format !== "round_robin") return null;

  const groupMatches = await db.select().from(matches).where(and(eq(matches.tournament_id, m.tournament_id), eq(matches.stage, "group")));
  if (groupMatches.some((gm) => gm.status !== "finished")) return null; // ещё не все матчи сыграны

  const approvedTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(and(eq(teams.tournament_id, m.tournament_id), eq(teams.status, "approved")));
  if (approvedTeams.length === 0) return null;

  const standings = computeStandings(approvedTeams, groupMatches);
  if (standings.length === 0) return null;

  await db.update(tournaments).set({ status: "finished" }).where(eq(tournaments.id, m.tournament_id));
  await db.update(teams).set({ final_placement: 1 }).where(eq(teams.id, standings[0].teamId));
  if (standings[1]) await db.update(teams).set({ final_placement: 2 }).where(eq(teams.id, standings[1].teamId));

  return null;
}

/**
 * Строит одноэлиминационную сетку плей-офф из списка id команд (с null-заглушками
 * для первого раунда, если команд не степень двойки) и заполняет все последующие
 * раунды пустыми матчами-заглушками. Финальный раунд получает win_target=3,
 * остальные раунды плей-офф — win_target=2. У каждого матча сразу случайный план
 * режимов/карт (админ может поменять вручную после генерации).
 */
async function insertEliminationBracket(tournamentId: string, teamIds: string[], gameConfig: GameConfig | null): Promise<string | null> {
  const shuffled: (string | null)[] = [...teamIds].sort(() => Math.random() - 0.5);
  let size = 2;
  while (size < shuffled.length) size *= 2;
  while (shuffled.length < size) shuffled.push(null);

  const totalRounds = Math.log2(size);

  // Строим раунды сверху вниз, запоминая id матчей предыдущего раунда,
  // чтобы связать их с матчами следующего раунда через next_match_id/slot.
  let previousRoundMatches: { id: string; team_a_id: string | null; team_b_id: string | null }[] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const isFinal = round === totalRounds;
    const winTarget = isFinal ? 3 : 2;
    const matchCount = size / 2 ** round;

    const toInsert = Array.from({ length: matchCount }, (_, i) => ({
      tournament_id: tournamentId,
      round,
      stage: "playoff" as const,
      team_a_id: round === 1 ? shuffled[i * 2] : null,
      team_b_id: round === 1 ? shuffled[i * 2 + 1] ?? null : null,
      modes_plan: buildRandomModesPlan(gameConfig),
      win_target: winTarget,
      status: "scheduled" as const,
    }));

    const inserted = await db
      .insert(matches)
      .values(toInsert)
      .returning({ id: matches.id, team_a_id: matches.team_a_id, team_b_id: matches.team_b_id });

    // Связываем пары матчей предыдущего раунда с только что созданными матчами этого раунда.
    if (previousRoundMatches.length > 0) {
      for (let i = 0; i < previousRoundMatches.length; i += 2) {
        const nextMatch = inserted[Math.floor(i / 2)];
        const slotA = previousRoundMatches[i];
        const slotB = previousRoundMatches[i + 1];
        if (slotA) {
          await db.update(matches).set({ next_match_id: nextMatch.id, next_match_slot: "a" }).where(eq(matches.id, slotA.id));
        }
        if (slotB) {
          await db.update(matches).set({ next_match_id: nextMatch.id, next_match_slot: "b" }).where(eq(matches.id, slotB.id));
        }
      }
    }

    previousRoundMatches = inserted;
  }

  // "Бай" в 1-м раунде — команда без соперника сразу проходит дальше.
  const round1 = await db
    .select({ id: matches.id, team_a_id: matches.team_a_id, team_b_id: matches.team_b_id })
    .from(matches)
    .where(and(eq(matches.tournament_id, tournamentId), eq(matches.stage, "playoff"), eq(matches.round, 1)));

  for (const m of round1) {
    const hasA = !!m.team_a_id;
    const hasB = !!m.team_b_id;
    if (hasA === hasB) continue; // оба слота заполнены или оба пусты — не бай

    const scoreA = hasA ? 1 : 0;
    const scoreB = hasB ? 1 : 0;
    await db.update(matches).set({ score_a: scoreA, score_b: scoreB, status: "finished" }).where(eq(matches.id, m.id));

    await advanceWinnerIfNeeded(m.id);
    await finalizeTournamentIfChampionDecided(m.id);
    await finalizeRoundRobinIfComplete(m.id);
  }

  return null;
}

interface MatchInput {
  round: number;
  stage: MatchStage;
  team_a_id: string | null;
  team_b_id: string | null;
  scheduled_at?: string;
  modesPlan: ModesPlanEntry[];
  winTarget: number;
}

export async function createMatch(tournamentId: string, input: MatchInput) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return { error: "Недостаточно прав" };

  await db.insert(matches).values({
    tournament_id: tournamentId,
    round: input.round,
    stage: input.stage,
    team_a_id: input.team_a_id,
    team_b_id: input.team_b_id,
    modes_plan: input.modesPlan,
    win_target: input.winTarget,
    scheduled_at: input.scheduled_at ? new Date(input.scheduled_at).toISOString() : null,
    status: "scheduled",
  });
  await logAction("create", "match", null, { tournamentId });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

export async function updateMatchPlan(
  matchId: string,
  tournamentId: string,
  input: { modesPlan: ModesPlanEntry[]; winTarget: number; scheduledAt?: string }
) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isStaffOfGame(user, gameId))) return { error: "Недостаточно прав" };

  await db
    .update(matches)
    .set({
      modes_plan: input.modesPlan,
      win_target: input.winTarget,
      scheduled_at: input.scheduledAt ? new Date(input.scheduledAt).toISOString() : null,
    })
    .where(eq(matches.id, matchId));
  await logAction("update_plan", "match", matchId, input);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/");
  return { success: true };
}

export async function updateMatchScore(matchId: string, tournamentId: string, scoreA: number, scoreB: number, status: MatchStatus) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isStaffOfGame(user, gameId))) return { error: "Недостаточно прав" };

  await db.update(matches).set({ score_a: scoreA, score_b: scoreB, status }).where(eq(matches.id, matchId));

  if (status === "finished") {
    const advanceError = await advanceWinnerIfNeeded(matchId);
    if (advanceError) return { error: advanceError };
    await finalizeTournamentIfChampionDecided(matchId);
    await finalizeRoundRobinIfComplete(matchId);
  }

  await logAction("update_score", "match", matchId, { scoreA, scoreB, status });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/");
  return { success: true };
}

export async function updateMatchModeResults(
  matchId: string,
  tournamentId: string,
  input: { modesPlan: ModesPlanEntry[]; teamAId: string | null; teamBId: string | null; status: MatchStatus }
) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isStaffOfGame(user, gameId))) return { error: "Недостаточно прав" };

  const scoreA = input.modesPlan.filter((e) => e.winnerTeamId && e.winnerTeamId === input.teamAId).length;
  const scoreB = input.modesPlan.filter((e) => e.winnerTeamId && e.winnerTeamId === input.teamBId).length;

  await db
    .update(matches)
    .set({ modes_plan: input.modesPlan, score_a: scoreA, score_b: scoreB, status: input.status })
    .where(eq(matches.id, matchId));

  if (input.status === "finished") {
    const advanceError = await advanceWinnerIfNeeded(matchId);
    if (advanceError) return { error: advanceError };
    await finalizeTournamentIfChampionDecided(matchId);
    await finalizeRoundRobinIfComplete(matchId);
  }

  await logAction("update_mode_results", "match", matchId, { scoreA, scoreB, status: input.status });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteMatch(matchId: string, tournamentId: string) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return { error: "Недостаточно прав" };

  await db.delete(matches).where(eq(matches.id, matchId));
  await logAction("delete", "match", matchId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

function roundRobinPairs(teamIds: string[]): { round: number; teamA: string; teamB: string }[] {
  const ids: (string | null)[] = [...teamIds];
  if (ids.length % 2 !== 0) ids.push(null);
  const n = ids.length;
  const pairs: { round: number; teamA: string; teamB: string }[] = [];

  const rotating = ids.slice(1);
  for (let round = 0; round < n - 1; round++) {
    const arrangement = [ids[0], ...rotating];
    for (let i = 0; i < n / 2; i++) {
      const a = arrangement[i];
      const b = arrangement[n - 1 - i];
      if (a && b) pairs.push({ round: round + 1, teamA: a, teamB: b });
    }
    rotating.unshift(rotating.pop()!);
  }
  return pairs;
}

export async function generateGroupStage(tournamentId: string) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return { error: "Недостаточно прав" };

  const approvedTeams = await db
    .select({ id: teams.id, group_label: teams.group_label })
    .from(teams)
    .where(and(eq(teams.tournament_id, tournamentId), eq(teams.status, "approved")));

  if (approvedTeams.length < 2) return { error: "Нужно минимум 2 одобренные команды" };

  const withoutGroup = approvedTeams.filter((t) => !t.group_label);
  if (withoutGroup.length > 0) {
    return { error: "Сначала проведите жеребьёвку групп — не у всех команд указана группа" };
  }

  await db.delete(matches).where(and(eq(matches.tournament_id, tournamentId), eq(matches.stage, "group")));

  const groups = new Map<string, string[]>();
  for (const t of approvedTeams) {
    const key = t.group_label!;
    groups.set(key, [...(groups.get(key) ?? []), t.id]);
  }

  const gameConfig = await getGameConfigForTournament(tournamentId);

  const matchesToInsert: (typeof matches.$inferInsert)[] = [];
  for (const teamIds of groups.values()) {
    const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
    for (const { round, teamA, teamB } of roundRobinPairs(shuffled)) {
      matchesToInsert.push({
        tournament_id: tournamentId,
        round,
        stage: "group",
        team_a_id: teamA,
        team_b_id: teamB,
        modes_plan: buildRandomModesPlan(gameConfig),
        win_target: 1,
        status: "scheduled",
      });
    }
  }

  if (matchesToInsert.length === 0) return { error: "Не удалось составить расписание группового этапа" };

  await db.insert(matches).values(matchesToInsert);

  await logAction("generate_group_stage", "tournament", tournamentId, { groups: groups.size });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

export async function generateRoundRobin(tournamentId: string) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return { error: "Недостаточно прав" };

  const approvedTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.tournament_id, tournamentId), eq(teams.status, "approved")));

  if (approvedTeams.length < 2) return { error: "Нужно минимум 2 одобренные команды" };

  await db.delete(matches).where(and(eq(matches.tournament_id, tournamentId), eq(matches.stage, "group")));

  const gameConfig = await getGameConfigForTournament(tournamentId);
  const shuffled = approvedTeams.map((t) => t.id).sort(() => Math.random() - 0.5);
  const matchesToInsert = roundRobinPairs(shuffled).map(({ round, teamA, teamB }) => ({
    tournament_id: tournamentId,
    round,
    stage: "group" as const,
    team_a_id: teamA,
    team_b_id: teamB,
    modes_plan: buildRandomModesPlan(gameConfig),
    win_target: 1,
    status: "scheduled" as const,
  }));

  await db.insert(matches).values(matchesToInsert);

  await logAction("generate_round_robin", "tournament", tournamentId, { teams: approvedTeams.length });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

export async function generatePlayoffFromGroups(tournamentId: string, advancePerGroup: number) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return { error: "Недостаточно прав" };

  const approvedTeams = await db
    .select({ id: teams.id, name: teams.name, group_label: teams.group_label })
    .from(teams)
    .where(and(eq(teams.tournament_id, tournamentId), eq(teams.status, "approved")));
  if (approvedTeams.length === 0) return { error: "Нет одобренных команд" };

  const groupMatches = await db.select().from(matches).where(and(eq(matches.tournament_id, tournamentId), eq(matches.stage, "group")));
  if (groupMatches.length === 0) {
    return { error: "Групповой этап ещё не сгенерирован" };
  }
  const unfinished = groupMatches.filter((m) => m.status !== "finished");
  if (unfinished.length > 0) {
    return { error: `Групповой этап не завершён: осталось матчей — ${unfinished.length}` };
  }

  const teamsByGroup = new Map<string, { id: string; name: string }[]>();
  for (const team of approvedTeams) {
    const group = team.group_label ?? "—";
    teamsByGroup.set(group, [...(teamsByGroup.get(group) ?? []), team]);
  }

  const advancing: string[] = [];
  for (const groupTeams of teamsByGroup.values()) {
    const standings = computeStandings(groupTeams, groupMatches);
    advancing.push(...standings.slice(0, advancePerGroup).map((s) => s.teamId));
  }

  if (advancing.length < 2) return { error: "Недостаточно команд вышло в плей-офф" };

  await db.delete(matches).where(and(eq(matches.tournament_id, tournamentId), eq(matches.stage, "playoff")));

  const gameConfig = await getGameConfigForTournament(tournamentId);
  const bracketError = await insertEliminationBracket(tournamentId, advancing, gameConfig);
  if (bracketError) return { error: bracketError };

  await logAction("generate_playoff_from_groups", "tournament", tournamentId, { advancing: advancing.length });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}

export async function generateSingleEliminationBracket(tournamentId: string) {
  const user = await requireProfile();
  const gameId = await getTournamentGameId(tournamentId);
  if (!gameId) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, gameId))) return { error: "Недостаточно прав" };

  const approvedTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.tournament_id, tournamentId), eq(teams.status, "approved")));

  if (approvedTeams.length < 2) return { error: "Нужно минимум 2 одобренные команды" };

  await db.delete(matches).where(and(eq(matches.tournament_id, tournamentId), eq(matches.stage, "playoff")));

  const gameConfig = await getGameConfigForTournament(tournamentId);
  const bracketError = await insertEliminationBracket(
    tournamentId,
    approvedTeams.map((t) => t.id),
    gameConfig
  );
  if (bracketError) return { error: bracketError };

  await logAction("generate_bracket", "tournament", tournamentId, { teams: approvedTeams.length });
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return { success: true };
}
