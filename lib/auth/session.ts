import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, gt } from "drizzle-orm";
import { db, sessions, users, game_admins } from "@/db";
import type { AppRole } from "@/lib/types";

const COOKIE_NAME = "blik_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

export interface SessionUser {
  id: string;
  email: string;
  display_name: string;
  role: AppRole;
  created_at: string;
}

function toSessionUser(row: typeof users.$inferSelect): SessionUser {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    role: row.role,
    created_at: row.created_at,
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({ id: token, user_id: userId, expires_at: expiresAt.toISOString() });

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const row = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.user_id))
    .where(and(eq(sessions.id, token), gt(sessions.expires_at, new Date().toISOString())))
    .limit(1);

  if (row.length === 0) return null;
  return toSessionUser(row[0].user);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession();
}

/** Требует сотрудника площадки (role не null); иначе редирект на /admin/login */
export async function requireProfile(): Promise<SessionUser> {
  const user = await getSession();
  if (!user || !user.role) redirect("/admin/login");
  return user;
}

/** Требует любого авторизованного пользователя (капитана) — без роли сотрудника */
export async function requireCaptainUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/team/auth");
  return user;
}

export async function getAllowedGameIds(user: SessionUser): Promise<string[] | "all"> {
  if (user.role === "superadmin") return "all";
  const rows = await db.select({ game_id: game_admins.game_id }).from(game_admins).where(eq(game_admins.user_id, user.id));
  return rows.map((r) => r.game_id);
}
