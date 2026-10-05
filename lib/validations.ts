import { z } from "zod";

export const TELEGRAM_REGEX = /^@?[a-zA-Z0-9_]{5,32}$/;

export const telegramSchema = z
  .string()
  .trim()
  .regex(TELEGRAM_REGEX, "Введите корректный Telegram-юзернейм (5-32 символа, латиница/цифры/_)");

export function playerSchema(fields: { key: string; pattern?: string; required?: boolean }[]) {
  const gameDataShape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny = z.string().trim();
    if (field.pattern) {
      schema = (schema as z.ZodString).regex(new RegExp(field.pattern), "Неверный формат поля");
    }
    if (!field.required) {
      schema = schema.optional().or(z.literal(""));
    } else {
      schema = (schema as z.ZodString).min(1, "Обязательное поле");
    }
    gameDataShape[field.key] = schema;
  }

  return z.object({
    full_name: z.string().trim().min(2, "Введите ФИО").max(100),
    study_group: z.string().trim().min(1, "Укажите учебную группу").max(50),
    telegram: telegramSchema,
    is_substitute: z.boolean().default(false),
    game_data: z.object(gameDataShape),
  });
}

export function teamRegistrationSchema(fields: { key: string; pattern?: string; required?: boolean }[], teamSize: number, substitutes: number) {
  return z.object({
    name: z.string().trim().min(2, "Введите название команды").max(60),
    logo_url: z.string().url().optional().or(z.literal("")),
    captain_telegram: telegramSchema,
    players: z
      .array(playerSchema(fields))
      .min(teamSize, `Нужно минимум ${teamSize} игроков`)
      .max(teamSize + substitutes, `Максимум ${teamSize + substitutes} игроков (включая запасных)`),
  });
}

export const gameSchema = z.object({
  name: z.string().trim().min(2, "Введите название").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Введите slug")
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  short_name: z.string().trim().max(40).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Введите HEX-цвет, например #FFC400"),
  logo_url: z.string().url().optional().or(z.literal("")),
  cover_url: z.string().url().optional().or(z.literal("")),
});

export const tournamentSchema = z.object({
  title: z.string().trim().min(2, "Введите название").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Введите slug")
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  description: z.string().max(2000).optional().or(z.literal("")),
  format: z.enum(["single_elimination", "double_elimination", "groups_playoff", "round_robin"]),
  max_teams: z.coerce.number().int().min(2).max(256),
  registration_opens_at: z.string().optional().or(z.literal("")),
  registration_closes_at: z.string().optional().or(z.literal("")),
  starts_at: z.string().optional().or(z.literal("")),
  prize_info: z.string().max(2000).optional().or(z.literal("")),
  rules_md: z.string().max(20000).optional().or(z.literal("")),
});

export const announcementSchema = z.object({
  game_id: z.string().uuid().nullable(),
  title: z.string().trim().min(2, "Введите заголовок").max(120),
  body: z.string().trim().min(1, "Введите текст").max(5000),
  is_pinned: z.boolean().default(false),
});
