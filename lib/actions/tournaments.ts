"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, tournaments } from "@/db";
import { requireProfile } from "@/lib/auth/session";
import { isAdminOfGame } from "@/lib/auth/rules";
import { logAction } from "@/lib/actions/audit";
import { tournamentSchema } from "@/lib/validations";
import type { TournamentFormat, TournamentStatus } from "@/lib/types";

const FORBIDDEN = { error: "Недостаточно прав" };

interface TournamentInput {
  title: string;
  slug: string;
  description?: string;
  format: TournamentFormat;
  max_teams: number;
  registration_opens_at?: string;
  registration_closes_at?: string;
  starts_at?: string;
  prize_info?: string;
  rules_md?: string;
}

function toNullableDate(value?: string) {
  return value ? new Date(value).toISOString() : null;
}

export async function createTournament(gameId: string, input: TournamentInput) {
  const user = await requireProfile();
  if (!(await isAdminOfGame(user, gameId))) return FORBIDDEN;

  const parsed = tournamentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };

  const [data] = await db
    .insert(tournaments)
    .values({
      game_id: gameId,
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? "",
      format: parsed.data.format,
      max_teams: parsed.data.max_teams,
      registration_opens_at: toNullableDate(parsed.data.registration_opens_at),
      registration_closes_at: toNullableDate(parsed.data.registration_closes_at),
      starts_at: toNullableDate(parsed.data.starts_at),
      prize_info: parsed.data.prize_info ?? "",
      rules_md: parsed.data.rules_md ?? "",
      status: "draft",
    })
    .returning();

  await logAction("create", "tournament", data.id, { title: data.title });
  revalidatePath("/admin/tournaments");
  return { data };
}

export async function duplicateTournament(tournamentId: string) {
  const user = await requireProfile();
  const original = await db.query.tournaments.findFirst({ where: eq(tournaments.id, tournamentId) });
  if (!original) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, original.game_id))) return FORBIDDEN;

  const [data] = await db
    .insert(tournaments)
    .values({
      game_id: original.game_id,
      title: `${original.title} (копия)`,
      slug: `${original.slug}-copy-${Date.now().toString(36)}`,
      description: original.description,
      format: original.format,
      max_teams: original.max_teams,
      prize_info: original.prize_info,
      rules_md: original.rules_md,
      status: "draft",
    })
    .returning();

  await logAction("duplicate", "tournament", data.id, { from: tournamentId });
  revalidatePath("/admin/tournaments");
  return { data };
}

export async function updateTournament(id: string, input: TournamentInput) {
  const user = await requireProfile();
  const existing = await db.query.tournaments.findFirst({ where: eq(tournaments.id, id) });
  if (!existing) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, existing.game_id))) return FORBIDDEN;

  const parsed = tournamentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };

  await db
    .update(tournaments)
    .set({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? "",
      format: parsed.data.format,
      max_teams: parsed.data.max_teams,
      registration_opens_at: toNullableDate(parsed.data.registration_opens_at),
      registration_closes_at: toNullableDate(parsed.data.registration_closes_at),
      starts_at: toNullableDate(parsed.data.starts_at),
      prize_info: parsed.data.prize_info ?? "",
      rules_md: parsed.data.rules_md ?? "",
    })
    .where(eq(tournaments.id, id));

  await logAction("update", "tournament", id, { title: input.title });
  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${id}`);
  return { success: true };
}

export async function setTournamentStatus(id: string, status: TournamentStatus) {
  const user = await requireProfile();
  const existing = await db.query.tournaments.findFirst({ where: eq(tournaments.id, id) });
  if (!existing) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, existing.game_id))) return FORBIDDEN;

  await db.update(tournaments).set({ status }).where(eq(tournaments.id, id));
  await logAction("set_status", "tournament", id, { status });
  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${id}`);
  return { success: true };
}

export async function deleteTournament(id: string) {
  const user = await requireProfile();
  const existing = await db.query.tournaments.findFirst({ where: eq(tournaments.id, id) });
  if (!existing) return { error: "Турнир не найден" };
  if (!(await isAdminOfGame(user, existing.game_id))) return FORBIDDEN;

  await db.delete(tournaments).where(eq(tournaments.id, id));
  await logAction("delete", "tournament", id);
  revalidatePath("/admin/tournaments");
  redirect("/admin/tournaments");
}
