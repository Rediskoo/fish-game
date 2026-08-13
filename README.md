# Aquarium Idle

Telegram Mini App про живой аквариум: игрок собирает и кормит рыб, получает пассивный доход, открывает кейсы, украшает аквариум, выполняет достижения и обменивается подарками с друзьями.

Стек: Next.js 16 (App Router), React 19, TypeScript, Prisma 6, PostgreSQL, TanStack Query, Zustand, PixiJS и Tailwind CSS 4.

## Возможности

- Telegram-аутентификация с проверкой подписи `initData` и HTTP-only JWT-сессией;
- локальная dev-аутентификация вне production;
- аквариум с анимацией и поведением рыб;
- голод, загрязнение, кормление и очистка;
- пассивный доход с ограничением офлайн-периода в 7 дней;
- магазин, рыбные кейсы, декор и фоны;
- ежедневные награды, достижения, друзья и подарки;
- адаптация под safe-area Telegram и reduced motion;
- встроенное обучение при первом входе, повторяемое в настройках;
- unit-тесты критичных игровых расчётов.
- полный серверный цикл скрещивания: икра → эмбрионы → мальки → малыш → взрослая гибридная рыба;
- детерминированный genome, родословная, идемпотентный запуск/claim и быстрое взросление кормом для малышей.

## Быстрый старт

Понадобятся Node.js 24.x, Docker Desktop и Git.

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). В обычном браузере приложение автоматически использует безопасный dev-вход через `/api/auth/dev`; в production этот endpoint отключён.

Если PowerShell запрещает запуск `npm.ps1`, используйте `npm.cmd`, например `npm.cmd run dev`. Либо настройте Execution Policy для своего пользователя.

## Переменные окружения

Создайте `.env` из `.env.example`.

| Переменная | Обязательна | Назначение |
| --- | --- | --- |
| `DATABASE_URL` | да | PostgreSQL URL для приложения и Prisma |
| `DIRECT_URL` | да | прямое подключение для миграций |
| `JWT_SECRET` | да | секрет подписи сессии, минимум 16 символов |
| `TELEGRAM_BOT_TOKEN` | для Telegram | токен BotFather и проверка `initData` |
| `TELEGRAM_BOT_USERNAME` | для Telegram | username бота без `@` |
| `CRON_SECRET` | для cron | Bearer-секрет уведомлений, минимум 16 символов |
| `NEXT_PUBLIC_TELEGRAM_MINI_APP_URL` | production | публичная ссылка Mini App |
| `NEXT_PUBLIC_APP_URL` | рекомендуется | базовый URL приложения |
| `NEXT_PUBLIC_API_URL` | рекомендуется | базовый URL API |

Не используйте значения из примера в production. Сгенерировать секрет можно командой `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Команды

```text
npm run dev          локальный Next.js сервер
npm run build        Prisma generate + production build
npm run start        запуск production build
npm run lint         ESLint
npm run typecheck    строгая проверка TypeScript
npm run test         unit-тесты Vitest
npm run check        lint + typecheck + tests
npm run db:generate  генерация Prisma Client
npm run db:migrate   создание/применение dev-миграции
npm run db:deploy    применение миграций в production
npm run db:seed      стартовый каталог и достижения
npm run db:studio    Prisma Studio
```

Сборке нужны как минимум `DATABASE_URL` и `DIRECT_URL`: Prisma читает конфигурацию до запуска Next.js. Сборка не запускает миграции и seed автоматически.

## Архитектура

```text
src/app/                     страницы App Router и API route handlers
src/components/aquarium/     PixiJS-рендерер и поведение рыб
src/components/layout/       оболочка, провайдеры и onboarding
src/features/                UI и query/mutation hooks по доменам
src/features/breeding/       genetics, timeline, экран и клиентские hooks питомника
src/lib/                     auth, env, Telegram, API и чистые расчёты
src/server/repositories/     запросы к Prisma
src/server/services/         бизнес-логика игры
src/stores/                  локальное состояние Zustand
src/types/                   контракты snapshot/API
prisma/schema.prisma         модель PostgreSQL
prisma/seed.ts               стартовые данные
prisma/migrations/           совместимые миграции, включая breeding_jobs
public/                      игровые ассеты
```

Клиент получает единый `AquariumSnapshot`. Route handler отвечает только за сессию, валидацию и HTTP-ответ; игровая логика находится в сервисах; доступ к данным — в Prisma/repository. Чистые формулы вынесены в `src/lib/game-mechanics.ts`, чтобы их можно было тестировать без БД.

## Основной игровой цикл

1. Telegram SDK передаёт подписанный `initData` в `/api/auth/telegram`.
2. Сервер проверяет подпись и срок данных, создаёт/обновляет игрока и сессию.
3. `/api/user` применяет голод и загрязнение, проверяет достижения и возвращает snapshot.
4. React Query хранит серверное состояние, Zustand — только локальные настройки и оптимистичный счётчик.
5. Мутации кормления, покупок, подарков и наград выполняются транзакционно и обновляют snapshot.

## API

- `GET /api/health` — health check;
- `POST /api/auth/telegram` — Telegram login;
- `POST /api/auth/dev` — локальный login, отключён в production;
- `GET /api/user` — состояние игрока;
- `GET|PATCH /api/fish` — список/редактирование рыб;
- `POST /api/inventory/feed` — кормление;
- `GET /api/marketplace`, `POST /api/marketplace/purchase` — каталог и покупки;
- `POST /api/income/claim` — офлайн-доход;
- `POST /api/daily-rewards/claim` — ежедневная награда;
- `PATCH /api/aquarium` — очистка и оформление;
- `GET|POST|PATCH /api/friends` — друзья и заявки;
- `POST /api/friends/gift`, `POST /api/friends/visit` — подарки и посещение;
- `GET /api/cron/daily-reward` — защищённый cron уведомлений.
- `GET|POST|PATCH /api/breeding` — состояние, запуск, ускорение и получение гибрида.

Ошибки имеют единый JSON-формат `{ ok: false, error }`, успешные ответы — `{ ok: true, data }`.

## Тестирование

Перед коммитом:

```powershell
npm run check
npm run build
```

Unit-тесты проверяют границы голода, штраф к доходу, кормление, будущие timestamps и лимит офлайн-дохода. Для ручного smoke test проверьте:

- первый вход и все три шага обучения;
- повтор обучения из настроек;
- кормление и изменение дохода;
- покупку повторяемого и уникального товара;
- открытие кейса, продажу/сохранение приза;
- ежедневную награду дважды;
- добавление друга, подарок и посещение;
- отображение при ширине 320–430 px и `prefers-reduced-motion`.

## Telegram и webhook

Укажите HTTPS URL Mini App в BotFather. Авторизация принимает только свежие данные с валидной HMAC-подписью. Webhook настраивается сервером при Telegram login; для production убедитесь, что публичный URL доступен Telegram.

Cron вызывается с заголовком:

```text
Authorization: Bearer <CRON_SECRET>
```

## Docker и deployment

`docker compose up -d` поднимает PostgreSQL для разработки. На Vercel используется нативный Next.js build output; Dockerfile запускает стандартный production-сервер через `npm run start`.

Для Vercel добавьте env-переменные, примените миграции через `npm run db:deploy`, выполните seed один раз и затем деплойте. Не запускайте `db push`/`seed` на каждом build.

## Безопасность и эксплуатация

- `.env`, логи, build-кеш и coverage исключены из Git;
- dev-login недоступен при `NODE_ENV=production`;
- все изменяющие баланс операции должны оставаться транзакционными;
- никогда не доверяйте `userId`, цене или награде с клиента;
- запускайте `npm audit` после обновления lockfile;
- резервируйте PostgreSQL перед миграциями production.

## Правила доработки

При добавлении механики сначала создайте чистую функцию и тесты для граничных условий, затем подключайте её к сервису и API. Не размещайте бизнес-логику в React-компонентах. Новый endpoint должен проверять сессию, валидировать вход через Zod, возвращать единый формат ответа и не раскрывать внутренние ошибки/секреты.

Ассеты меняются через `src/assets/aquarium-assets.ts` и `src/lib/app-assets.ts`; вместимость — через `src/lib/fish-capacity.ts`; экономика — в серверных сервисах и `src/lib/game-mechanics.ts`.
