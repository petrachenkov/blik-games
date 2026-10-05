# Blik Games

Киберспортивный хаб Тверского колледжа им. А. Н. Коняева для проведения турниров по Brawl Stars, CS2, Dota 2, Valorant и другим играм.

Развёртывается по адресу `blik.tgiek.ru/games`.

## Стек

- Next.js 14 (App Router) + TypeScript, `basePath: "/games"`, `output: "standalone"`
- Tailwind CSS + shadcn-стиль компонентов, lucide-react, framer-motion
- Обычный Postgres (`drizzle-orm` + `pg`), без Supabase — своя аутентификация (bcrypt + серверные сессии в таблице `sessions`), файлы хранятся на диске (том `/app/uploads`)
- Docker (multi-stage, `node:20-alpine`)

## Локальная разработка

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Поднимите Postgres для разработки:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
3. Скопируйте `.env.example` в `.env.local` и при необходимости поправьте `DATABASE_URL`:
   ```bash
   cp .env.example .env.local
   ```
4. Примените миграции к базе:
   ```bash
   npx drizzle-kit migrate
   ```
5. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
   Приложение будет доступно на `http://localhost:3000/games`.

## Схема базы и миграции

Схема описана в `db/schema.ts` (Drizzle ORM). Чтобы изменить структуру БД:

1. Поправьте `db/schema.ts`.
2. Сгенерируйте SQL-миграцию: `npx drizzle-kit generate`.
3. Примените её: `npx drizzle-kit migrate`.

Основные таблицы: `users` (капитаны и сотрудники в одной таблице, `role` — `null` у капитанов), `sessions`, `games`, `tournaments`, `teams`, `players`, `matches`, `match_results`, `appeals`, `announcements`, `settings`, `game_admins`, `audit_log`.

## Назначение первого суперадмина

Зарегистрируйтесь как капитан на `/team/auth` (или через SQL создайте пользователя — пароль должен быть bcrypt-хэшем), затем выполните:

```sql
update users set role = 'superadmin' where email = 'you@example.com';
```

Админка доступна на `/games/admin`.

## Авторизация и права

Никакого RLS — все проверки прав находятся в коде (`lib/auth/rules.ts` + явные проверки в начале каждого server action). Роли:

- `superadmin` — полный доступ ко всем играм, турнирам, настройкам и журналу действий
- `game_admin` — доступ только к играм, назначенным через таблицу `game_admins`
- `judge` (судья) — может подтверждать результаты матчей и разрешать апелляции по назначенным играм, но не управляет турнирами/командами
- `null` (капитан) — обычный пользователь, может регистрировать команды и подавать результаты/апелляции по своим матчам

## Файлы (логотипы, скриншоты, видео)

Загрузка — `POST /api/upload` (form-data: `file`, `folder`), раздача — `GET /games/uploads/<folder>/<file>` (поддерживает Range-запросы для видео). Файлы пишутся в `UPLOADS_DIR` (по умолчанию `./uploads` локально, `/app/uploads` в контейнере — должен быть примонтирован как volume, чтобы не терять файлы при пересборке).

## Продакшен

Переменные стека (задаются в Portainer → Stack → Environment variables, либо в `.env` рядом с compose-файлом):

- `POSTGRES_PASSWORD` — обязательна, пароль БД;
- `NEXT_PUBLIC_SITE_URL` — обязательна, публичный адрес: `https://blik.tgiek.ru/games`.

Без них `docker compose` сразу откажется стартовать с понятным сообщением, а не поднимет приложение с пустыми значениями.

Поднимает три сервиса — `postgres`, `migrate` (одноразовый, применяет схему и завершается) и `app` — с volume под данные БД и под загруженные файлы. **Миграции применяются автоматически** при каждом `up` (сервис `migrate` стартует после `postgres`, `app` стартует только после успешного завершения `migrate`) — отдельно руками их запускать не нужно.

Контейнер `app` **не публикует порт на хост** — он подключён к внешней сети `nginx_default` (та же, что у NPM на сервере). Сеть должна существовать до запуска стека: `docker network create nginx_default` (если её ещё нет).

### Прокси (Nginx Proxy Manager)

В существующем Proxy Host для `blik.tgiek.ru` добавить **Custom Location**:

- Location: `/games`
- Scheme: `http`, Forward Hostname / IP: `blik-games-app`, Forward Port: `3000`
- Вкладка Advanced: `client_max_body_size 200M;` (видео-доказательства до 200 МБ)

Проверка: `https://blik.tgiek.ru/games` открывает приложение, `https://blik.tgiek.ru/games/admin` без входа редиректит на `/games/admin/login` (именно на `https://blik.tgiek.ru/...`, а не на внутренний адрес контейнера).

### Первый суперадмин на проде

После первого деплоя зарегистрируйтесь как капитан на `https://blik.tgiek.ru/games/team/auth`, затем на сервере:

```bash
docker exec -it blik-games-postgres psql -U blik_games -d blik_games \
  -c "update users set role = 'superadmin' where email = 'you@example.com';"
```

Проверено целиком: `docker compose up -d --build` с нуля, на полностью пустом volume, поднимает рабочее приложение одной командой.

**Важно**: свежая база после миграции — пустая (0 игр, 0 настроек, 0 пользователей). Если переносите уже существующие данные (например, из локальной БД, где разработка велась), перенесите их после того, как `migrate` создаст схему, тем же способом, что при первоначальном переезде с Supabase — `pg_dump --data-only` из старой базы и восстановление в `postgres`-контейнер, **до** запуска `app`:

```bash
docker compose up -d postgres
# дождаться, пока migrate отработает (docker compose logs migrate)
pg_dump -h <старый-хост> -U ... --data-only --no-owner > data.sql
docker exec -i <postgres-контейнер> psql -U blik_games -d blik_games < data.sql
docker compose up -d app
```

Затем создайте первого суперадмина (см. раздел выше).

Настройте обратный прокси (nginx/traefik) так, чтобы запросы к `blik.tgiek.ru/games` проксировались на порт 3000 контейнера `app`, с `client_max_body_size` не меньше 200 МБ (под загрузку видео-доказательств).
