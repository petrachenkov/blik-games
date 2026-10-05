import { Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { eq, desc } from "drizzle-orm";
import { db, tournaments } from "@/db";

interface Winner {
  tournament_id: string;
  title: string;
  slug: string;
  game_name: string;
  game_slug: string;
  accent_color: string;
  team_name: string;
  starts_at: string | null;
}

async function getWinners(): Promise<Winner[]> {
  const data = await db.query.tournaments.findMany({
    where: eq(tournaments.status, "finished"),
    with: { games: true, teams: { columns: { name: true, final_placement: true, status: true } } },
    orderBy: desc(tournaments.starts_at),
    limit: 6,
  });

  return data
    .map((t: any) => {
      const winner = (t.teams ?? []).find((tm: any) => tm.status === "approved" && tm.final_placement === 1);
      if (!winner) return null;
      return {
        tournament_id: t.id,
        title: t.title,
        slug: t.slug,
        game_name: t.games.name,
        game_slug: t.games.slug,
        accent_color: t.games.accent_color,
        team_name: winner.name,
        starts_at: t.starts_at,
      };
    })
    .filter(Boolean) as Winner[];
}

export async function HallOfFame() {
  const winners = await getWinners();
  if (winners.length === 0) return null;

  return (
    <section className="container py-12">
      <div className="mb-6 flex items-center gap-2">
        <Crown className="h-5 w-5 text-amber-400" />
        <h2 className="font-display text-2xl font-bold">Зал славы</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {winners.map((w) => (
          <Card key={w.tournament_id} className="relative overflow-hidden">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: w.accent_color }}
            />
            <CardContent className="p-5">
              <div className="text-xs" style={{ color: w.accent_color }}>
                {w.game_name}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{w.title}</div>
              <div className="mt-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="font-display text-lg font-bold">{w.team_name}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
