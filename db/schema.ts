import { relations, sql } from "drizzle-orm";
import type { GameConfig, ModesPlanEntry } from "@/lib/types";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// Поля названы в snake_case (как колонки в БД и как их уже ожидают
// все компоненты/типы в lib/types.ts) — это сильно уменьшает объём
// переписывания UI-слоя при переходе с Supabase на Drizzle.
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "string" });

export const game_status = pgEnum("game_status", ["active", "frozen", "hidden", "archived"]);
export const tournament_status = pgEnum("tournament_status", [
  "draft",
  "registration",
  "registration_closed",
  "ongoing",
  "frozen",
  "finished",
  "cancelled",
]);
export const tournament_format = pgEnum("tournament_format", [
  "single_elimination",
  "double_elimination",
  "groups_playoff",
  "round_robin",
]);
export const team_status = pgEnum("team_status", ["pending", "approved", "rejected", "disqualified"]);
export const match_stage = pgEnum("match_stage", ["group", "playoff"]);
export const match_status = pgEnum("match_status", ["scheduled", "live", "finished"]);
export const app_role = pgEnum("app_role", ["superadmin", "game_admin", "judge"]);
export const match_result_status = pgEnum("match_result_status", ["pending", "confirmed", "disputed"]);
export const appeal_status = pgEnum("appeal_status", ["pending", "resolved"]);
export const appeal_resolution = pgEnum("appeal_resolution", ["kept", "changed", "replayed"]);

// users — заменяет profiles + auth.users. Пароль и сессии полностью свои.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  display_name: text("display_name").notNull().default(""),
  role: app_role("role"),
  created_at: timestamptz("created_at").notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires_at: timestamptz("expires_at").notNull(),
    created_at: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("sessions_user_id_idx").on(t.user_id),
  })
);

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    short_name: text("short_name"),
    description: text("description").default(""),
    logo_url: text("logo_url"),
    cover_url: text("cover_url"),
    accent_color: text("accent_color").notNull().default("#7C3AED"),
    status: game_status("status").notNull().default("active"),
    freeze_reason: text("freeze_reason"),
    sort_order: integer("sort_order").notNull().default(0),
    game_config: jsonb("game_config").$type<GameConfig>().notNull().default({} as GameConfig),
    created_at: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("games_status_idx").on(t.status),
    sortOrderIdx: index("games_sort_order_idx").on(t.sort_order),
  })
);

export const game_admins = pgTable(
  "game_admins",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    game_id: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.user_id, t.game_id] }),
  })
);

export const tournaments = pgTable(
  "tournaments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    game_id: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").default(""),
    cover_url: text("cover_url"),
    format: tournament_format("format").notNull().default("single_elimination"),
    status: tournament_status("status").notNull().default("draft"),
    max_teams: integer("max_teams").notNull().default(16),
    registration_opens_at: timestamptz("registration_opens_at"),
    registration_closes_at: timestamptz("registration_closes_at"),
    starts_at: timestamptz("starts_at"),
    prize_info: text("prize_info").default(""),
    rules_md: text("rules_md").default(""),
    created_at: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    gameIdIdx: index("tournaments_game_id_idx").on(t.game_id),
    statusIdx: index("tournaments_status_idx").on(t.status),
    gameSlugUnique: uniqueIndex("tournaments_game_id_slug_key").on(t.game_id, t.slug),
  })
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournament_id: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    logo_url: text("logo_url"),
    captain_telegram: text("captain_telegram").notNull(),
    status: team_status("status").notNull().default("pending"),
    reject_reason: text("reject_reason"),
    group_label: text("group_label"),
    seed: integer("seed"),
    created_at: timestamptz("created_at").notNull().defaultNow(),
    captain_user_id: uuid("captain_user_id").references(() => users.id, { onDelete: "set null" }),
    final_placement: integer("final_placement"),
  },
  (t) => ({
    tournamentIdIdx: index("teams_tournament_id_idx").on(t.tournament_id),
    statusIdx: index("teams_status_idx").on(t.status),
    captainUserIdIdx: index("teams_captain_user_id_idx").on(t.captain_user_id),
    finalPlacementIdx: index("teams_final_placement_idx").on(t.final_placement),
  })
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    team_id: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    full_name: text("full_name").notNull(),
    study_group: text("study_group").notNull(),
    telegram: text("telegram").notNull(),
    is_substitute: boolean("is_substitute").notNull().default(false),
    game_data: jsonb("game_data").$type<Record<string, string>>().notNull().default({}),
    created_at: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    teamIdIdx: index("players_team_id_idx").on(t.team_id),
  })
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournament_id: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    round: integer("round").notNull().default(1),
    stage: match_stage("stage").notNull().default("playoff"),
    team_a_id: uuid("team_a_id").references(() => teams.id, { onDelete: "set null" }),
    team_b_id: uuid("team_b_id").references(() => teams.id, { onDelete: "set null" }),
    score_a: integer("score_a"),
    score_b: integer("score_b"),
    mode: text("mode"),
    map: text("map"),
    scheduled_at: timestamptz("scheduled_at"),
    status: match_status("status").notNull().default("scheduled"),
    created_at: timestamptz("created_at").notNull().defaultNow(),
    modes_plan: jsonb("modes_plan").$type<ModesPlanEntry[]>().notNull().default([]),
    win_target: integer("win_target").notNull().default(2),
    next_match_id: uuid("next_match_id").references((): AnyPgColumn => matches.id, { onDelete: "set null" }),
    next_match_slot: text("next_match_slot"),
  },
  (t) => ({
    tournamentIdIdx: index("matches_tournament_id_idx").on(t.tournament_id),
    statusIdx: index("matches_status_idx").on(t.status),
    scheduledAtIdx: index("matches_scheduled_at_idx").on(t.scheduled_at),
    nextMatchIdIdx: index("matches_next_match_id_idx").on(t.next_match_id),
    nextMatchSlotCheck: check("matches_next_match_slot_check", sql`${t.next_match_slot} in ('a', 'b')`),
  })
);

export const match_results = pgTable(
  "match_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    match_id: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    submitted_by_team_id: uuid("submitted_by_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    score_a: integer("score_a").notNull(),
    score_b: integer("score_b").notNull(),
    screenshot_urls: text("screenshot_urls").array().notNull(),
    recording_urls: text("recording_urls").array(),
    status: match_result_status("status").notNull().default("pending"),
    reviewed_by: uuid("reviewed_by").references(() => users.id),
    reviewed_at: timestamptz("reviewed_at"),
    review_notes: text("review_notes"),
    created_at: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    matchIdIdx: index("match_results_match_id_idx").on(t.match_id),
    statusIdx: index("match_results_status_idx").on(t.status),
  })
);

export const appeals = pgTable(
  "appeals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    match_id: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    submitted_by_team_id: uuid("submitted_by_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: appeal_status("status").notNull().default("pending"),
    resolution: appeal_resolution("resolution"),
    resolution_notes: text("resolution_notes"),
    resolved_by: uuid("resolved_by").references(() => users.id),
    resolved_at: timestamptz("resolved_at"),
    created_at: timestamptz("created_at").notNull().defaultNow(),
    evidence_urls: text("evidence_urls").array(),
  },
  (t) => ({
    matchIdIdx: index("appeals_match_id_idx").on(t.match_id),
    statusIdx: index("appeals_status_idx").on(t.status),
  })
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    game_id: uuid("game_id").references(() => games.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    is_pinned: boolean("is_pinned").notNull().default(false),
    created_at: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    gameIdIdx: index("announcements_game_id_idx").on(t.game_id),
  })
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull().default({}),
});

export const audit_log = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity_type: text("entity_type").notNull(),
    entity_id: text("entity_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    created_at: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    createdAtIdx: index("audit_log_created_at_idx").on(t.created_at),
  })
);

// ---------------------------------------------------------
// Relations — используются relational query API (db.query.*)
// ---------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  game_admins: many(game_admins),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.user_id], references: [users.id] }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  tournaments: many(tournaments),
  game_admins: many(game_admins),
  announcements: many(announcements),
}));

export const gameAdminsRelations = relations(game_admins, ({ one }) => ({
  user: one(users, { fields: [game_admins.user_id], references: [users.id] }),
  games: one(games, { fields: [game_admins.game_id], references: [games.id] }),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  games: one(games, { fields: [tournaments.game_id], references: [games.id] }),
  teams: many(teams),
  matches: many(matches),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  tournaments: one(tournaments, { fields: [teams.tournament_id], references: [tournaments.id] }),
  players: many(players),
  captain: one(users, { fields: [teams.captain_user_id], references: [users.id] }),
}));

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, { fields: [players.team_id], references: [teams.id] }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  tournaments: one(tournaments, { fields: [matches.tournament_id], references: [tournaments.id] }),
  team_a: one(teams, { fields: [matches.team_a_id], references: [teams.id] }),
  team_b: one(teams, { fields: [matches.team_b_id], references: [teams.id] }),
  results: many(match_results),
  appeals: many(appeals),
}));

export const matchResultsRelations = relations(match_results, ({ one }) => ({
  match: one(matches, { fields: [match_results.match_id], references: [matches.id] }),
  submitted_by_team: one(teams, { fields: [match_results.submitted_by_team_id], references: [teams.id] }),
}));

export const appealsRelations = relations(appeals, ({ one }) => ({
  match: one(matches, { fields: [appeals.match_id], references: [matches.id] }),
  submitted_by_team: one(teams, { fields: [appeals.submitted_by_team_id], references: [teams.id] }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  games: one(games, { fields: [announcements.game_id], references: [games.id] }),
}));

export const auditLogRelations = relations(audit_log, ({ one }) => ({
  profiles: one(users, { fields: [audit_log.user_id], references: [users.id] }),
}));
