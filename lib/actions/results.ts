"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, match_results, matches, tournaments } from "@/db";
import { requireCaptainUser, requireProfile } from "@/lib/auth/session";
import { isCaptainOfTeam, isTeamInMatch, isStaffOfGame } from "@/lib/auth/rules";
import { logAction } from "@/lib/actions/audit";
import { advanceWinnerIfNeeded, finalizeTournamentIfChampionDecided, finalizeRoundRobinIfComplete } from "@/lib/actions/matches";

export async function submitMatchResult(input: {
  matchId: string;
  teamId: string;
  scoreA: number;
  scoreB: number;
  screenshotUrls: string[];
  recordingUrls?: string[];
}) {
  if (input.screenshotUrls.length === 0) return { error: "Загрузите хотя бы один скриншот" };

  const user = await requireCaptainUser();
  if (!(await isCaptainOfTeam(user, input.teamId))) return { error: "Нет доступа" };
  if (!(await isTeamInMatch(input.teamId, input.matchId))) return { error: "Команда не участвует в этом матче" };

  await db.insert(match_results).values({
    match_id: input.matchId,
    submitted_by_team_id: input.teamId,
    score_a: input.scoreA,
    score_b: input.scoreB,
    screenshot_urls: input.screenshotUrls,
    recording_urls: input.recordingUrls?.length ? input.recordingUrls : null,
  });

  await logAction("submit_result", "match_result", input.matchId, { teamId: input.teamId });
  revalidatePath("/team");
  return { success: true };
}

export async function reviewMatchResult(input: { resultId: string; matchId: string; decision: "confirmed" | "disputed"; notes?: string }) {
  const user = await requireProfile();

  const match = await db.query.matches.findFirst({ where: eq(matches.id, input.matchId) });
  if (!match) return { error: "Матч не найден" };
  const tournament = await db.query.tournaments.findFirst({ where: eq(tournaments.id, match.tournament_id), columns: { game_id: true } });
  if (!tournament) return { error: "Турнир не найден" };
  if (!(await isStaffOfGame(user, tournament.game_id))) return { error: "Недостаточно прав" };

  const [result] = await db
    .update(match_results)
    .set({
      status: input.decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: input.notes || null,
    })
    .where(eq(match_results.id, input.resultId))
    .returning();

  if (!result) return { error: "Результат не найден" };

  if (input.decision === "confirmed") {
    await db.update(matches).set({ score_a: result.score_a, score_b: result.score_b, status: "finished" }).where(eq(matches.id, input.matchId));

    const advanceError = await advanceWinnerIfNeeded(input.matchId);
    if (advanceError) return { error: advanceError };
    await finalizeTournamentIfChampionDecided(input.matchId);
    await finalizeRoundRobinIfComplete(input.matchId);
  }

  await logAction(`review_result_${input.decision}`, "match_result", input.resultId, { notes: input.notes });
  revalidatePath("/admin/appeals");
  revalidatePath("/");
  return { success: true };
}
