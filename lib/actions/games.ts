"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db, games } from "@/db";
import { requireProfile } from "@/lib/auth/session";
import { isSuperadmin, isAdminOfGame } from "@/lib/auth/rules";
import { logAction } from "@/lib/actions/audit";
import { gameSchema } from "@/lib/validations";
import type { GameConfig } from "@/lib/types";

const FORBIDDEN = { error: "Недостаточно прав" };

export async function createGame(input: {
  name: string;
  slug: string;
  short_name?: string;
  description?: string;
  accent_color: string;
  logo_url?: string;
  cover_url?: string;
  game_config: GameConfig;
}) {
  const user = await requireProfile();
  if (!isSuperadmin(user)) return FORBIDDEN;

  const parsed = gameSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  const [maxOrder] = await db.select({ sort_order: games.sort_order }).from(games).orderBy(desc(games.sort_order)).limit(1);

  const [data] = await db
    .insert(games)
    .values({
      ...parsed.data,
      game_config: input.game_config,
      sort_order: (maxOrder?.sort_order ?? 0) + 1,
    })
    .returning();

  await logAction("create", "game", data.id, { name: data.name });
  revalidatePath("/admin/games");
  revalidatePath("/");
  return { data };
}

export async function updateGame(
  id: string,
  input: {
    name: string;
    slug: string;
    short_name?: string;
    description?: string;
    accent_color: string;
    logo_url?: string;
    cover_url?: string;
    game_config: GameConfig;
  }
) {
  const user = await requireProfile();
  if (!(await isAdminOfGame(user, id))) return FORBIDDEN;

  const parsed = gameSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  await db
    .update(games)
    .set({ ...parsed.data, game_config: input.game_config })
    .where(eq(games.id, id));

  await logAction("update", "game", id, { name: input.name });
  revalidatePath("/admin/games");
  revalidatePath("/");
  revalidatePath(`/${input.slug}`);
  return { success: true };
}

export async function freezeGame(id: string, reason: string) {
  const user = await requireProfile();
  if (!(await isAdminOfGame(user, id))) return FORBIDDEN;

  await db.update(games).set({ status: "frozen", freeze_reason: reason }).where(eq(games.id, id));
  await logAction("freeze", "game", id, { reason });
  revalidatePath("/admin/games");
  revalidatePath("/");
  return { success: true };
}

export async function unfreezeGame(id: string) {
  const user = await requireProfile();
  if (!(await isAdminOfGame(user, id))) return FORBIDDEN;

  await db.update(games).set({ status: "active", freeze_reason: null }).where(eq(games.id, id));
  await logAction("unfreeze", "game", id);
  revalidatePath("/admin/games");
  revalidatePath("/");
  return { success: true };
}

export async function setGameStatus(id: string, status: "active" | "hidden" | "archived") {
  const user = await requireProfile();
  if (!(await isAdminOfGame(user, id))) return FORBIDDEN;

  await db.update(games).set({ status }).where(eq(games.id, id));
  await logAction(`set_status_${status}`, "game", id);
  revalidatePath("/admin/games");
  revalidatePath("/");
  return { success: true };
}

export async function deleteGame(id: string) {
  const user = await requireProfile();
  if (!isSuperadmin(user)) return FORBIDDEN;

  await db.delete(games).where(eq(games.id, id));
  await logAction("delete", "game", id);
  revalidatePath("/admin/games");
  revalidatePath("/");
  return { success: true };
}

export async function reorderGames(orderedIds: string[]) {
  const user = await requireProfile();
  if (!isSuperadmin(user)) return FORBIDDEN;

  await Promise.all(orderedIds.map((id, index) => db.update(games).set({ sort_order: index }).where(eq(games.id, id))));

  await logAction("reorder", "game", null, { orderedIds });
  revalidatePath("/admin/games");
  revalidatePath("/");
  return { success: true as const };
}
