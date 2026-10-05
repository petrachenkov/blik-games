export type GameStatus = "active" | "frozen" | "hidden" | "archived";
export type TournamentStatus =
  | "draft"
  | "registration"
  | "registration_closed"
  | "ongoing"
  | "frozen"
  | "finished"
  | "cancelled";
export type TournamentFormat =
  | "single_elimination"
  | "double_elimination"
  | "groups_playoff"
  | "round_robin";
export type TeamStatus = "pending" | "approved" | "rejected" | "disqualified";
export type MatchStage = "group" | "playoff";
export type MatchStatus = "scheduled" | "live" | "finished";
export type AppRole = "superadmin" | "game_admin" | "judge" | null;
export type MatchResultStatus = "pending" | "confirmed" | "disputed";
export type AppealStatus = "pending" | "resolved";
export type AppealResolution = "kept" | "changed" | "replayed";

export interface PlayerFieldConfig {
  key: string;
  label: string;
  pattern?: string;
  required?: boolean;
}

export interface GameConfig {
  team_size: number;
  substitutes: number;
  player_fields: PlayerFieldConfig[];
  modes: string[];
  maps: string[];
  match_format: string;
  /** Пул карт для каждого режима — используется для автоподбора карты при генерации матчей */
  mode_maps?: Record<string, string[]>;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string;
  logo_url: string | null;
  cover_url: string | null;
  accent_color: string;
  status: GameStatus;
  freeze_reason: string | null;
  sort_order: number;
  game_config: GameConfig;
  created_at: string;
}

export interface Tournament {
  id: string;
  game_id: string;
  slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  max_teams: number;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  starts_at: string | null;
  prize_info: string;
  rules_md: string;
  created_at: string;
  games?: Game;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  logo_url: string | null;
  captain_telegram: string;
  status: TeamStatus;
  reject_reason: string | null;
  group_label: string | null;
  seed: number | null;
  final_placement: number | null;
  captain_user_id: string | null;
  created_at: string;
  players?: Player[];
}

export interface Player {
  id: string;
  team_id: string;
  full_name: string;
  study_group: string;
  telegram: string;
  is_substitute: boolean;
  game_data: Record<string, string>;
  created_at: string;
}

export interface ModesPlanEntry {
  mode: string;
  map: string;
  /** Счёт игр внутри самого режима (бо1/бо3/бо5 в зависимости от стадии — см. win_target матча) */
  scoreA?: number;
  scoreB?: number;
  winnerTeamId?: string | null;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  stage: MatchStage;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  mode: string | null;
  map: string | null;
  modes_plan: ModesPlanEntry[];
  win_target: number;
  scheduled_at: string | null;
  status: MatchStatus;
  next_match_id: string | null;
  next_match_slot: "a" | "b" | null;
  created_at: string;
  team_a?: Team | null;
  team_b?: Team | null;
}

export interface MatchResult {
  id: string;
  match_id: string;
  submitted_by_team_id: string;
  score_a: number;
  score_b: number;
  screenshot_urls: string[];
  recording_urls: string[] | null;
  status: MatchResultStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  submitted_by_team?: Pick<Team, "id" | "name">;
  match?: Match;
}

export interface Appeal {
  id: string;
  match_id: string;
  submitted_by_team_id: string;
  reason: string;
  evidence_urls: string[] | null;
  status: AppealStatus;
  resolution: AppealResolution | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  submitted_by_team?: Pick<Team, "id" | "name">;
  match?: Match;
}

export interface Announcement {
  id: string;
  game_id: string | null;
  title: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  games?: Pick<Game, "id" | "name" | "slug" | "accent_color"> | null;
}

export interface Profile {
  id: string;
  display_name: string;
  role: AppRole;
  email: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  active: "Активна",
  frozen: "Заморожена",
  hidden: "Скрыта",
  archived: "Архив",
};

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: "Черновик",
  registration: "Регистрация открыта",
  registration_closed: "Регистрация закрыта",
  ongoing: "Идёт",
  frozen: "Заморожен",
  finished: "Завершён",
  cancelled: "Отменён",
};

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: "Single elimination",
  double_elimination: "Double elimination",
  groups_playoff: "Группы + плей-офф",
  round_robin: "Round robin",
};

export const TEAM_STATUS_LABELS: Record<TeamStatus, string> = {
  pending: "На рассмотрении",
  approved: "Принята",
  rejected: "Отклонена",
  disqualified: "Дисквалифицирована",
};

export const MATCH_RESULT_STATUS_LABELS: Record<MatchResultStatus, string> = {
  pending: "На проверке",
  confirmed: "Подтверждён",
  disputed: "Оспорен",
};

export const APPEAL_STATUS_LABELS: Record<AppealStatus, string> = {
  pending: "На рассмотрении",
  resolved: "Рассмотрена",
};

export const APPEAL_RESOLUTION_LABELS: Record<AppealResolution, string> = {
  kept: "Оставлено в силе",
  changed: "Результат изменён",
  replayed: "Переигровка",
};

export const APP_ROLE_LABELS: Record<Exclude<AppRole, null>, string> = {
  superadmin: "Суперадмин",
  game_admin: "Админ игры",
  judge: "Судья",
};
