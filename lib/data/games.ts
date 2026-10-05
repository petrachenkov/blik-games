import { eq, ne, inArray, asc } from "drizzle-orm";
import { db, games } from "@/db";
import type { Game, GameStatus } from "@/lib/types";

export async function getPublicGames(): Promise<Game[]> {
  const rows = await db.select().from(games).where(ne(games.status, "hidden")).orderBy(asc(games.sort_order));
  return rows as unknown as Game[];
}

export async function getGamesByStatus(statuses: GameStatus[]): Promise<Game[]> {
  const rows = await db
    .select()
    .from(games)
    .where(inArray(games.status, statuses))
    .orderBy(asc(games.sort_order));
  return rows as unknown as Game[];
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const rows = await db.select().from(games).where(eq(games.slug, slug)).limit(1);
  return (rows[0] as unknown as Game) ?? null;
}

export async function getAllGamesAdmin(): Promise<Game[]> {
  const rows = await db.select().from(games).orderBy(asc(games.sort_order));
  return rows as unknown as Game[];
}
