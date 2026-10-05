import { GameCard } from "@/components/site/game-card";
import type { Game } from "@/lib/types";

export function GameGrid({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
        Игры скоро появятся здесь.
      </div>
    );
  }

  return (
    <div className="grid auto-rows-[minmax(280px,auto)] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game, i) => (
        <GameCard key={game.id} game={game} className={i === 0 ? "lg:col-span-2" : undefined} />
      ))}
    </div>
  );
}
