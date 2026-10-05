import { redirect } from "next/navigation";
import { GamesManager } from "@/components/admin/games-manager";
import { getAllGamesAdmin } from "@/lib/data/games";
import { requireProfile, getAllowedGameIds } from "@/lib/auth";

export default async function AdminGamesPage() {
  const profile = await requireProfile();
  if (profile.role === "judge") redirect("/admin/appeals");
  const allowed = await getAllowedGameIds(profile);
  const allGames = await getAllGamesAdmin();

  const games = allowed === "all" ? allGames : allGames.filter((g) => allowed.includes(g.id));

  return <GamesManager games={games} canManage={profile.role === "superadmin"} />;
}
