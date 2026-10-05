"use server";

import { revalidatePath } from "next/cache";
import { eq, ilike } from "drizzle-orm";
import { db, users, game_admins } from "@/db";
import { requireProfile } from "@/lib/auth/session";
import { isSuperadmin } from "@/lib/auth/rules";
import { logAction } from "@/lib/actions/audit";
import type { AppRole } from "@/lib/types";

const FORBIDDEN = { error: "Недостаточно прав" };

export async function findUserByEmail(email: string) {
  const user = await requireProfile();
  if (!isSuperadmin(user)) return FORBIDDEN;

  const rows = await db
    .select({ id: users.id, email: users.email, display_name: users.display_name, role: users.role, created_at: users.created_at })
    .from(users)
    .where(ilike(users.email, email.trim()))
    .limit(1);

  if (rows.length === 0) {
    return { error: "Пользователь с таким email не найден. Он должен сначала зарегистрироваться в кабинете капитана." };
  }
  return { data: rows[0] };
}

export async function setStaffAssignment(input: { userId: string; role: AppRole; gameIds: string[] }) {
  const user = await requireProfile();
  if (!isSuperadmin(user)) return FORBIDDEN;

  await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
  await db.delete(game_admins).where(eq(game_admins.user_id, input.userId));

  if (input.role && input.gameIds.length > 0) {
    await db.insert(game_admins).values(input.gameIds.map((gameId) => ({ user_id: input.userId, game_id: gameId })));
  }

  await logAction("set_staff_assignment", "profile", input.userId, { role: input.role, gameIds: input.gameIds });
  revalidatePath("/admin/staff");
  return { success: true };
}

export async function removeStaffRole(userId: string) {
  const user = await requireProfile();
  if (!isSuperadmin(user)) return FORBIDDEN;

  await db.delete(game_admins).where(eq(game_admins.user_id, userId));
  await db.update(users).set({ role: null }).where(eq(users.id, userId));

  await logAction("remove_staff_role", "profile", userId);
  revalidatePath("/admin/staff");
  return { success: true };
}
