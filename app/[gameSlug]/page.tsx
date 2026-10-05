import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { GameStatusBadge } from "@/components/site/status-badge";
import { TournamentList } from "@/components/site/tournament-list";
import { getGameBySlug } from "@/lib/data/games";
import { getTournamentsForGame } from "@/lib/data/tournaments";
import { getSettings } from "@/lib/data/settings";
import { hexToRgba } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: { gameSlug: string };
}): Promise<Metadata> {
  const game = await getGameBySlug(params.gameSlug);
  return { title: game ? `${game.name} — Blik Games` : "Игра не найдена" };
}

export default async function GamePage({ params }: { params: { gameSlug: string } }) {
  const game = await getGameBySlug(params.gameSlug);
  if (!game || game.status === "hidden") notFound();

  const [tournaments, settings] = await Promise.all([
    getTournamentsForGame(game.id),
    getSettings(),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 -z-10 opacity-50"
            style={{
              background: `radial-gradient(800px circle at 30% 0%, ${hexToRgba(game.accent_color, 0.3)}, transparent 60%)`,
            }}
          />
          <div className="container py-16">
            <div className="flex flex-wrap items-center gap-3">
              {game.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              )}
              <h1 className="font-display text-4xl font-extrabold">{game.name}</h1>
              <GameStatusBadge status={game.status} />
            </div>
            {game.status === "frozen" && game.freeze_reason && (
              <p className="mt-4 max-w-xl rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
                Игра заморожена: {game.freeze_reason}
              </p>
            )}
            <p className="mt-4 max-w-2xl text-muted-foreground">{game.description}</p>
          </div>
        </section>

        <section className="container py-12">
          <h2 className="mb-6 font-display text-2xl font-bold">Турниры</h2>
          <TournamentList tournaments={tournaments} gameSlug={game.slug} accentColor={game.accent_color} />
        </section>
      </main>
      <SiteFooter channelUrl={settings.official_channel_url} chatUrl={settings.max_chat_url} />
    </>
  );
}
