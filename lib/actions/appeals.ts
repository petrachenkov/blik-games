"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, appeals, matches, tournaments, teams } from "@/db";
import { requireCaptainUser, requireProfile } from "@/lib/auth/session";
import { isCaptainOfTeam, isTeamInMatch, isStaffOfGame } from "@/lib/auth/rules";
import { logAction } from "@/lib/actions/audit";
import { advanceWinnerIfNeeded, finalizeTournamentIfChampionDecided, finalizeRoundRobinIfComplete } from "@/lib/actions/matches";
import type { AppealResolution } from "@/lib/types";

export async function submitAppeal(input: { matchId: string; teamId: string; reason: string; evidenceUrls?: string[] }) {
  if (!input.reason.trim()) return { error: "Укажите причину апелляции" };

  const user = await requireCaptainUser();
  if (!(await isCaptainOfTeam(user, input.teamId))) return { error: "Нет доступа" };
  if (!(await isTeamInMatch(input.teamId, input.matchId))) return { error: "Команда не участвует в этом матче" };

  await db.insert(appeals).values({
    match_id: input.matchId,
    submitted_by_team_id: input.teamId,
    reason: input.reason,
    evidence_urls: input.evidenceUrls?.length ? input.evidenceUrls : null,
  });

  await logAction("submit_appeal", "appeal", input.matchId, { teamId: input.teamId });
  revalidatePath("/team");
  return { success: true };
}

export async function resolveAppeal(input: {
  appealId: string;
  matchId: string;
  resolution: AppealResolution;
  notes?: string;
  newScoreA?: number;
  newScoreB?: number;
}) {
  const user = await requireProfile();

  const match = await db.query.matches.findFirst({ where: eq(matches.id, input.matchId) });
  if (!match) return { error: "Матч не найден" };
  const tournament = await db.query.tournaments.findFirst({ where: eq(tournaments.id, match.tournament_id), columns: { game_id: true } });
  if (!tournament) return { error: "Турнир не найден" };
  if (!(await isStaffOfGame(user, tournament.game_id))) return { error: "Недостаточно прав" };

  await db
    .update(appeals)
    .set({
      status: "resolved",
      resolution: input.resolution,
      resolution_notes: input.notes || null,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .where(eq(appeals.id, input.appealId));

  if (input.resolution === "changed" && input.newScoreA !== undefined && input.newScoreB !== undefined) {
    await db.update(matches).set({ score_a: input.newScoreA, score_b: input.newScoreB, status: "finished" }).where(eq(matches.id, input.matchId));

    const advanceError = await advanceWinnerIfNeeded(input.matchId);
    if (advanceError) return { error: advanceError };
    await finalizeTournamentIfChampionDecided(input.matchId);
    await finalizeRoundRobinIfComplete(input.matchId);
  }

  if (input.resolution === "replayed") {
    // Если победитель уже успел "просочиться" в следующий раунд — убираем его
    // оттуда, пока матч не переигран заново.
    if (match.next_match_id && match.next_match_slot) {
      if (match.next_match_slot === "a") {
        await db.update(matches).set({ team_a_id: null }).where(eq(matches.id, match.next_match_id));
      } else {
        await db.update(matches).set({ team_b_id: null }).where(eq(matches.id, match.next_match_id));
      }
    }

    await db.update(matches).set({ score_a: null, score_b: null, status: "scheduled" }).where(eq(matches.id, input.matchId));

    // Если этот матч уже успел закрыть турнир (был финалом/решающим в round robin) —
    // откатываем завершение, раз исход теперь пересматривается.
    const currentTournament = await db.query.tournaments.findFirst({ where: eq(tournaments.id, match.tournament_id), columns: { status: true } });
    if (currentTournament?.status === "finished") {
      await db.update(tournaments).set({ status: "ongoing" }).where(eq(tournaments.id, match.tournament_id));
      await db.update(teams).set({ final_placement: null }).where(eq(teams.tournament_id, match.tournament_id));
    }
  }

  await logAction(`resolve_appeal_${input.resolution}`, "appeal", input.appealId, { notes: input.notes });
  revalidatePath("/admin/appeals");
  revalidatePath("/");
  return { success: true };
}
