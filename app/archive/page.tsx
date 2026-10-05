import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { GameGrid } from "@/components/site/game-grid";
import { getGamesByStatus } from "@/lib/data/games";
import { getSettings } from "@/lib/data/settings";

// force-dynamic — см. пояснение в app/page.tsx
export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const [games, settings] = await Promise.all([
    getGamesByStatus(["archived"]),
    getSettings(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container py-12">
        <h1 className="mb-2 font-display text-3xl font-bold">Архив</h1>
        <p className="mb-8 text-muted-foreground">
          Завершённые игры прошлых сезонов — история турниров и результатов.
        </p>
        <GameGrid games={games} />
      </main>
      <SiteFooter channelUrl={settings.official_channel_url} chatUrl={settings.max_chat_url} />
    </>
  );
}
