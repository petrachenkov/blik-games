import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { TournamentStatusBadge } from "@/components/site/status-badge";
import { TournamentTabs } from "@/components/site/tournament/tournament-tabs";
import { getTournamentBySlug } from "@/lib/data/tournaments";
import { getTeamsForTournament, getMatchesForTournament } from "@/lib/data/teams";
import { getSettings } from "@/lib/data/settings";
import { getCurrentUser } from "@/lib/auth";
import { hexToRgba } from "@/lib/utils";

export const revalidate = 15;

export async function generateMetadata({
  params,
}: {
  params: { gameSlug: string; tournamentSlug: string };
}): Promise<Metadata> {
  const tournament = await getTournamentBySlug(params.gameSlug, params.tournamentSlug);
  return { title: tournament ? `${tournament.title} — Blik Games` : "Турнир не найден" };
}

export default async function TournamentPage({
  params,
}: {
  params: { gameSlug: string; tournamentSlug: string };
}) {
  const tournament = await getTournamentBySlug(params.gameSlug, params.tournamentSlug);
  if (!tournament || !tournament.games || tournament.games.status === "hidden") notFound();

  const game = tournament.games;

  const [teams, matches, settings, currentUser] = await Promise.all([
    getTeamsForTournament(tournament.id),
    getMatchesForTournament(tournament.id),
    getSettings(),
    getCurrentUser(),
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
          <div className="container py-14">
            <div className="mb-3 flex items-center gap-2 text-sm" style={{ color: game.accent_color }}>
              {game.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.logo_url} alt="" className="h-5 w-5 rounded object-cover" />
              )}
              {game.name}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{tournament.title}</h1>
              <TournamentStatusBadge status={tournament.status} />
            </div>
          </div>
        </section>

        <section className="container py-12">
          <TournamentTabs tournament={tournament} game={game} teams={teams} matches={matches} captainUserId={currentUser?.id ?? null} />
        </section>
      </main>
      <SiteFooter channelUrl={settings.official_channel_url} chatUrl={settings.max_chat_url} />
    </>
  );
}
