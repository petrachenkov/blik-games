import { isNotNull, inArray, asc } from "drizzle-orm";
import { db, users, game_admins } from "@/db";

export async function getStaffList() {
  const profiles = await db
    .select({
      id: users.id,
      email: users.email,
      display_name: users.display_name,
      role: users.role,
      created_at: users.created_at,
    })
    .from(users)
    .where(isNotNull(users.role))
    .orderBy(asc(users.display_name));

  if (profiles.length === 0) return [];

  const assignments = await db.query.game_admins.findMany({
    where: inArray(
      game_admins.user_id,
      profiles.map((p) => p.id)
    ),
    with: { games: { columns: { id: true, name: true, accent_color: true } } },
  });

  return profiles.map((profile) => ({
    ...profile,
    games: assignments.filter((a) => a.user_id === profile.id).map((a) => a.games),
  }));
}
