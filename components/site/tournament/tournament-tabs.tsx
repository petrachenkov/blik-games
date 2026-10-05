"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/site/tournament/overview-tab";
import { TeamsTab } from "@/components/site/tournament/teams-tab";
import { MatchesTab } from "@/components/site/tournament/matches-tab";
import { BracketTab } from "@/components/site/tournament/bracket-tab";
import { RulesTab } from "@/components/site/tournament/rules-tab";
import { PrizesTab } from "@/components/site/tournament/prizes-tab";
import { RegistrationGate } from "@/components/site/tournament/registration-gate";
import type { Tournament, Team, Match, Game } from "@/lib/types";

export function TournamentTabs({
  tournament,
  game,
  teams,
  matches,
  captainUserId,
}: {
  tournament: Tournament;
  game: Game;
  teams: Team[];
  matches: Match[];
  captainUserId: string | null;
}) {
  const canRegister = tournament.status === "registration";

  return (
    <Tabs defaultValue="overview">
      <TabsList className="flex-wrap">
        <TabsTrigger value="overview">Обзор</TabsTrigger>
        <TabsTrigger value="registration">Регистрация</TabsTrigger>
        <TabsTrigger value="teams">Команды</TabsTrigger>
        <TabsTrigger value="bracket">Сетка</TabsTrigger>
        <TabsTrigger value="matches">Матчи</TabsTrigger>
        <TabsTrigger value="rules">Правила</TabsTrigger>
        <TabsTrigger value="prizes">Призы</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab
          tournament={tournament}
          teamsCount={teams.filter((t) => t.status === "approved").length}
          champion={teams.find((t) => t.status === "approved" && t.final_placement === 1) ?? null}
          accentColor={game.accent_color}
        />
      </TabsContent>

      <TabsContent value="registration">
        {game.status === "frozen" ? (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-10 text-center text-blue-300">
            Регистрация недоступна: игра заморожена.
          </div>
        ) : canRegister ? (
          <RegistrationGate
            tournamentId={tournament.id}
            gameConfig={game.game_config}
            accentColor={game.accent_color}
            userId={captainUserId}
          />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
            Регистрация на этот турнир сейчас закрыта.
          </div>
        )}
      </TabsContent>

      <TabsContent value="teams">
        <TeamsTab teams={teams} />
      </TabsContent>

      <TabsContent value="bracket">
        <BracketTab matches={matches} accentColor={game.accent_color} />
      </TabsContent>

      <TabsContent value="matches">
        <MatchesTab matches={matches} />
      </TabsContent>

      <TabsContent value="rules">
        <RulesTab rulesMd={tournament.rules_md} />
      </TabsContent>

      <TabsContent value="prizes">
        <PrizesTab prizeInfo={tournament.prize_info} accentColor={game.accent_color} />
      </TabsContent>
    </Tabs>
  );
}
