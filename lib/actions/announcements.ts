"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, announcements } from "@/db";
import { requireProfile, type SessionUser } from "@/lib/auth/session";
import { isSuperadmin, isAdminOfGame } from "@/lib/auth/rules";
import { logAction } from "@/lib/actions/audit";
import { announcementSchema } from "@/lib/validations";

const FORBIDDEN = { error: "Недостаточно прав" };

async function canManage(user: SessionUser, gameId: string | null): Promise<boolean> {
  if (gameId === null) return isSuperadmin(user);
  return isAdminOfGame(user, gameId);
}

export async function createAnnouncement(input: { game_id: string | null; title: string; body: string; is_pinned: boolean }) {
  const user = await requireProfile();
  if (!(await canManage(user, input.game_id))) return FORBIDDEN;

  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };

  const [data] = await db.insert(announcements).values(parsed.data).returning();

  await logAction("create", "announcement", data.id, { title: data.title });
  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { data };
}

export async function updateAnnouncement(id: string, input: { game_id: string | null; title: string; body: string; is_pinned: boolean }) {
  const user = await requireProfile();
  const existing = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
  if (!existing) return { error: "Объявление не найдено" };
  if (!(await canManage(user, existing.game_id)) || !(await canManage(user, input.game_id))) return FORBIDDEN;

  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };

  await db.update(announcements).set(parsed.data).where(eq(announcements.id, id));

  await logAction("update", "announcement", id, { title: input.title });
  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const user = await requireProfile();
  const existing = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
  if (!existing) return { error: "Объявление не найдено" };
  if (!(await canManage(user, existing.game_id))) return FORBIDDEN;

  await db.delete(announcements).where(eq(announcements.id, id));
  await logAction("delete", "announcement", id);
  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: true };
}
