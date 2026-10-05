import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { StatsSection } from "@/components/site/stats";
import { GameGrid } from "@/components/site/game-grid";
import { UpcomingMatchesSection, RecentResultsSection } from "@/components/site/match-list";
import { HallOfFame } from "@/components/site/hall-of-fame";
import { AnnouncementsSection } from "@/components/site/announcements-list";
import { HowToParticipate } from "@/components/site/how-to";
import { CommunitySection } from "@/components/site/community";
import { getPublicGames } from "@/lib/data/games";
import { getUpcomingTournamentWithGame, getUpcomingMatches, getRecentResults } from "@/lib/data/tournaments";
import { getSettings, getStats, getAnnouncements } from "@/lib/data/settings";

// force-dynamic, а не revalidate: страница собирает живые турнирные данные
// из Postgres, которого ещё не существует на этапе `docker build` (БД —
// отдельный сервис в docker-compose, поднимается позже) — со статической
// предгенерацией сборка образа падает.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [games, tournament, upcomingMatches, recentResults, settings, stats, announcements] =
    await Promise.all([
      getPublicGames(),
      getUpcomingTournamentWithGame(),
      getUpcomingMatches(),
      getRecentResults(),
      getSettings(),
      getStats(),
      getAnnouncements(),
    ]);

  const activeGames = games.filter((g) => g.status !== "archived");

  return (
    <>
      <SiteHeader />
      <main>
        <Hero tournament={tournament} />
        <AnnouncementsSection announcements={announcements as any} />
        <StatsSection stats={stats} />

        <section className="container py-12">
          <h2 className="mb-6 font-display text-2xl font-bold">Игры</h2>
          <GameGrid games={activeGames} />
        </section>

        <UpcomingMatchesSection matches={upcomingMatches} />
        <RecentResultsSection matches={recentResults} />
        <HallOfFame />
        <HowToParticipate />
        <CommunitySection channelUrl={settings.max_channel_url} chatUrl={settings.max_chat_url} />
      </main>
      <SiteFooter channelUrl={settings.official_channel_url} chatUrl={settings.max_chat_url} />
    </>
  );
}
