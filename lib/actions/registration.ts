"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, teams, players, tournaments } from "@/db";
import { requireCaptainUser } from "@/lib/auth/session";
import { teamRegistrationSchema } from "@/lib/validations";
import type { GameConfig } from "@/lib/types";

interface RegisterTeamInput {
  name: string;
  logo_url?: string;
  captain_telegram: string;
  players: {
    full_name: string;
    study_group: string;
    telegram: string;
    is_substitute: boolean;
    game_data: Record<string, string>;
  }[];
}

export async function registerTeam(tournamentId: string, gameConfig: GameConfig, input: RegisterTeamInput) {
  const user = await requireCaptainUser();

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
    with: { games: true },
  });
  if (!tournament || tournament.status !== "registration" || tournament.games.status !== "active") {
    return { error: "Регистрация на этот турнир закрыта" };
  }

  const schema = teamRegistrationSchema(gameConfig.player_fields, gameConfig.team_size, gameConfig.substitutes);
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };

  const team = await db.transaction(async (tx) => {
    const [team] = await tx
      .insert(teams)
      .values({
        tournament_id: tournamentId,
        name: parsed.data.name,
        logo_url: parsed.data.logo_url || null,
        captain_telegram: parsed.data.captain_telegram.replace(/^@/, ""),
        captain_user_id: user.id,
        status: "pending",
      })
      .returning();

    await tx.insert(players).values(
      parsed.data.players.map((p) => ({
        team_id: team.id,
        full_name: p.full_name,
        study_group: p.study_group,
        telegram: p.telegram.replace(/^@/, ""),
        is_substitute: p.is_substitute,
        game_data: p.game_data,
      }))
    );

    return team;
  });

  revalidatePath(`/${tournament.games.slug}/${tournament.slug}`);
  return { success: true, team, players: parsed.data.players };
}
