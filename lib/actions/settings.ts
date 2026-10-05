"use server";

import { revalidatePath } from "next/cache";
import { db, settings } from "@/db";
import { requireProfile } from "@/lib/auth/session";
import { isSuperadmin } from "@/lib/auth/rules";
import { logAction } from "@/lib/actions/audit";

export async function updateSetting(key: string, value: string) {
  const user = await requireProfile();
  if (!isSuperadmin(user)) return { error: "Недостаточно прав" };

  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });

  await logAction("update_setting", "settings", key, { value });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { success: true };
}
