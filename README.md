# Telegram Aquarium Idle

Production-ready MVP Telegram Mini App на Next.js, Vercel, Prisma, PostgreSQL и PixiJS. Пользователь авторизуется через Telegram initData, получает персональный аквариум, стартовую рыбку, валюту `водоросль`, корм, offline income, marketplace, daily rewards и базовые достижения.

## Архитектура проекта

```text
src/app                 App Router pages and Route Handlers
src/app/api             Backend API for auth, user, fish, marketplace, inventory, income
src/app/(game)          Mobile-first game screens
src/components          Shared UI, layout, Pixi aquarium renderer
src/features            Feature modules: auth, fish, income, inventory, marketplace, rewards
src/lib                 API client, DB singleton, Telegram auth, validation, helpers
src/server              Repositories and domain services
src/stores              Zustand stores for UI and realtime income
src/types               Shared DTO/view types
prisma                  Database schema and seed
docs                    Room for growth docs
```

Ключевые решения:

- App Router + Route Handlers под Vercel serverless.
- Prisma client создается lazy singleton, чтобы не падать во время build.
- PostgreSQL через Neon или Supabase с pooled `DATABASE_URL` и direct `DIRECT_URL`.
- Telegram `initData` валидируется на backend через HMAC SHA-256.
- Session хранится в httpOnly cookie с JWT.
- Server state в TanStack Query, UI/realtime state в Zustand.
- PixiJS загружается только на клиенте внутри `useEffect`, чтобы SSR не трогал `window`.
- Realtime UI income тикает локально, authoritative начисление делает `/api/income/claim` и login sync.
- WebSocket не используется: MVP подходит под Vercel через polling/refetch и serverless Route Handlers.

## Реализованные API

- `POST /api/auth/telegram` - Telegram Mini App auth, first-login bootstrap, offline income claim.
- `GET /api/user` - полный snapshot аквариума.
- `PATCH /api/fish?fishId=...` - переименование рыбки.
- `GET /api/marketplace` - fish types, цены, rarity chances.
- `POST /api/marketplace/purchase` - покупка рыбки или корма.
- `POST /api/inventory/feed` - кормление рыбки.
- `POST /api/income/claim` - начисление offline income.
- `POST /api/daily-rewards/claim` - ежедневная награда.
- `GET /api/achievements` - список достижений.
- `GET /api/health` - healthcheck.

## ENV variables

Создай `.env` или `.env.local`:

```env
DATABASE_URL="postgresql://aquarium:aquarium@localhost:5432/aquarium?schema=public"
DIRECT_URL="postgresql://aquarium:aquarium@localhost:5432/aquarium?schema=public"
TELEGRAM_BOT_TOKEN="123456:replace_me"
TELEGRAM_BOT_USERNAME="your_aquarium_bot"
JWT_SECRET="replace-with-32-byte-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

# Как запустить проект

## Локальный запуск

1. Установи Node.js `20.9+`. Рекомендуется Node.js 24 LTS.

2. Установи Docker Desktop.

3. Установи зависимости:

```bash
npm install
```

4. Создай env:

```bash
cp .env.example .env
```

На Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

5. Запусти PostgreSQL:

```bash
docker compose up -d
```

6. Сгенерируй Prisma Client:

```bash
npm run db:generate
```

7. Создай миграции и таблицы:

```bash
npm run db:migrate
```

8. Заполни справочники рыб и достижения:

```bash
npm run db:seed
```

9. Запусти проект:

```bash
npm run dev
```

10. Открой:

```text
http://localhost:3000
```

Важно: полноценный login работает внутри Telegram Mini App, потому что браузер сам по себе не дает реальный `window.Telegram.WebApp.initData`.
Для локальной проверки UI вне Telegram на экране аквариума появится кнопка `Локальный dev-вход`; endpoint `/api/auth/dev` отключен в production.

## Telegram настройка

1. Открой Telegram и найди `@BotFather`.

2. Создай бота:

```text
/newbot
```

Сохрани:

- bot token в `TELEGRAM_BOT_TOKEN`
- username в `TELEGRAM_BOT_USERNAME`

3. Создай Mini App:

```text
/newapp
```

Выбери своего бота, укажи название, описание и иконку.

4. Для локального теста нужен HTTPS URL. Используй один из вариантов:

```bash
npx localtunnel --port 3000
```

или:

```bash
ngrok http 3000
```

5. Вставь HTTPS URL в BotFather как Web App URL:

```text
https://your-tunnel-url.example
```

6. Для production укажи домен Vercel:

```text
https://your-project.vercel.app
```

7. Fullscreen включается в клиенте автоматически:

```ts
window.Telegram?.WebApp?.requestFullscreen?.()
window.Telegram?.WebApp?.expand()
```

8. Тестирование:

- открой бота в Telegram mobile или desktop;
- нажми кнопку Mini App;
- проверь, что появился личный аквариум;
- закрой Mini App на несколько минут;
- открой снова и проверь offline income.

## Чат бота и уведомления

Webhook не нужен: игрок открывает Mini App из чата бота, Mini App безопасно передаёт `initData` и бот отправляет приветствие при первом запуске. Бот уведомляет о заявках в друзья, подарках и визитах друзей. В `vercel.json` также настроен ежедневный cron `09:00 UTC`, который отправляет напоминание о доступной ежедневной награде. Для cron добавь в Vercel только `CRON_SECRET` — случайную строку не короче 16 символов; Vercel автоматически передаёт её в заголовке `Authorization`.

Важно: Telegram разрешает боту написать пользователю только после того, как пользователь открыл с ним личный чат и запустил Mini App.

## Vercel deploy

1. Создай GitHub репозиторий и отправь проект:

```bash
git init
git add .
git commit -m "Initial aquarium mini app"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

2. Создай PostgreSQL:

- Neon: создай project, возьми pooled connection string для `DATABASE_URL` и direct string для `DIRECT_URL`.
- Supabase: создай project, возьми pooled connection string для runtime и direct connection для миграций.

3. Импортируй GitHub repo в Vercel.

4. Добавь Environment Variables в Vercel:

```env
DATABASE_URL="pooled-postgres-url"
DIRECT_URL="direct-postgres-url"
TELEGRAM_BOT_TOKEN="botfather-token"
TELEGRAM_BOT_USERNAME="your_bot"
JWT_SECRET="long-random-production-secret"
NEXT_PUBLIC_APP_URL="https://your-project.vercel.app"
NEXT_PUBLIC_API_URL="https://your-project.vercel.app/api"
```

5. Выполни production migrations локально или через CI:

```bash
npm run db:deploy
npm run db:seed
```

Для Neon/Supabase убедись, что `DIRECT_URL` не идет через pooler при миграциях.

6. Deploy:

```bash
vercel --prod
```

или просто push в `main`, если Git integration включен.

7. Обнови Mini App URL в BotFather на production URL.

8. После каждого изменения Prisma schema:

```bash
npm run db:migrate
git add prisma/migrations prisma/schema.prisma
git commit -m "Update database schema"
git push
npm run db:deploy
```

## Production notes

- Не запускай Prisma на Edge runtime, Route Handlers здесь используют `runtime = "nodejs"`.
- Для Vercel используй pooled `DATABASE_URL`, иначе можно упереться в лимит соединений PostgreSQL.
- Offline income capped at 7 days, чтобы экономика не взрывалась после долгого отсутствия.
- Для 50+ рыб Pixi renderer держит один ticker, delta time movement, lightweight vector fish и lazy client init.
- Для realtime multiplayer лучше добавить Supabase Realtime, Ably или Pusher, но для idle MVP polling дешевле и надежнее.

## Что расширять дальше

- Sprite atlas вместо vector fish: `public/sprites/atlas.json` + texture packer.
- Real achievements unlock service после покупок и milestones.
- Server-side hunger decay cron или lazy hunger decay при snapshot fetch.
- Telegram cloud storage для клиентских preferences.
- Anti-cheat event log и economy balancing dashboard.
