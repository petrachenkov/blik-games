"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

export async function signIn(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  // Не раскрываем отдельно случай "аккаунт есть, но не сотрудник" — тот же текст ошибки.
  if (!user || !user.role || !(await verifyPassword(password, user.password_hash))) {
    return { error: "Неверный email или пароль" };
  }

  await createSession(user.id);
  redirect("/admin");
}

export async function signOut() {
  await destroySession();
  redirect("/admin/login");
}

export async function signOutCaptain() {
  await destroySession();
  redirect("/team/auth");
}

export async function captainSignIn(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    return { error: "Неверный email или пароль" };
  }

  await createSession(user.id);
  return { success: true };
}

export async function captainSignUp(input: { email: string; password: string; displayName: string }) {
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 6) return { error: "Пароль должен быть не короче 6 символов" };

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return { error: "Этот email уже зарегистрирован" };

  const password_hash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({ email, password_hash, display_name: input.displayName || email, role: null })
    .returning();

  await createSession(user.id);
  return { success: true };
}
