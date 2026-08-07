# Telegram Aquarium Idle

Мобильная Telegram Mini App игра про аквариум: игрок получает рыбок, кормит их, открывает рыбное казино, покупает декор/фоны, собирает награды, дружит с другими игроками и получает пассивный доход в водорослях.

Проект сделан на Next.js App Router, React, Prisma, PostgreSQL, TanStack Query, Zustand и PixiJS. Интерфейс рассчитан в первую очередь на мобильный экран внутри Telegram.

## Быстрый старт для новичка

### 1. Что нужно установить

- Node.js 24.x. Версия указана в `.nvmrc` и `package.json`.
- Docker Desktop, если хочешь локальную PostgreSQL базу.
- Git.
- Любой редактор кода, например VS Code.

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка env

Скопируй пример:

```powershell
Copy-Item .env.example .env
```

Минимум для локального запуска:

```env
DATABASE_URL="postgresql://aquarium:aquarium@localhost:5432/aquarium?schema=public"
DIRECT_URL="postgresql://aquarium:aquarium@localhost:5432/aquarium?schema=public"
JWT_SECRET="replace-with-32-byte-random-secret"
TELEGRAM_BOT_TOKEN="123456:replace_me"
TELEGRAM_BOT_USERNAME="your_aquarium_bot"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

Для реального Telegram login нужны настоящие `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` и Mini App URL из BotFather. В обычном браузере Telegram `initData` нет, поэтому полноценная авторизация проверяется через Telegram.

### 4. Локальная база

Подними PostgreSQL:

```bash
docker compose up -d
```

Сгенерируй Prisma Client:

```bash
npm run db:generate
```

Создай таблицы миграциями:

```bash
npm run db:migrate
```

Заполни справочники рыб, товаров и достижений:

```bash
npm run db:seed
```

### 5. Запуск dev-сервера

```bash
npm run dev
```

Открой:

```text
http://localhost:3000
```

Если порт занят, можно так:

```bash
npm run dev -- --port 3001
```

## Основные команды

```bash
npm run dev          # локальная разработка
npm run build        # production build: prisma generate + next build
npm run start        # запуск уже собранного Next.js приложения
npm run typecheck    # проверка TypeScript
npm run db:generate  # генерация Prisma Client
npm run db:migrate   # локальная миграция БД через prisma migrate dev
npm run db:deploy    # применение production migrations
npm run db:seed      # заполнение стартовых данных
```

Важно: `npm run build` специально не делает `prisma db push` и `db:seed`. Миграции и seed нельзя запускать автоматически на каждом Vercel build, иначе легко забить лимит подключений к базе.

## Архитектура папок

```text
src/app                         Next.js App Router: страницы и API route handlers
src/app/(game)                  игровые страницы: aquarium, inventory, marketplace, profile и т.д.
src/app/api                     backend API: auth, user, fish, marketplace, inventory, friends
src/components/aquarium          PixiJS renderer аквариума и AI движения рыб
src/components/fish              модалки рыбного казино и награды
src/components/layout            общий shell, нижнее меню, QueryProvider
src/components/ui                базовые Button/Panel
src/features/auth                Telegram auth, профиль, настройки
src/features/fish                экран аквариума
src/features/inventory           склад, корм, фоны, декор, карточка инфо рыбки
src/features/marketplace         магазин и рыбное казино
src/features/rewards             ежедневные награды и достижения
src/lib                          shared helpers: API client, assets, env, Prisma, Telegram, capacity
src/server/repositories          слой доступа к данным
src/server/services              бизнес-логика игры
src/stores                       Zustand stores: доход, звук, UI
src/types                        DTO и view-типы между backend/frontend
prisma                           schema.prisma и seed.ts
public/assets                    картинки фонов, декора, еды и магазина
```

## Как устроены данные

### Prisma модели

Главные модели в `prisma/schema.prisma`:

- `User` - игрок Telegram, валюта, связи с рыбами/друзьями/инвентарём.
- `Aquarium` - уровень, опыт, фон, декор, загрязнение.
- `FishType` - справочник видов рыб: редкость, шанс, доход, цвет, скорость.
- `Fish` - конкретная рыбка игрока: имя, характер, голод, избранное, состояние анимации.
- `Inventory` - корм и очистители.
- `Friend`, `FriendRequest`, `FriendGift` - друзья и подарки.
- `Achievement`, `UserAchievement` - достижения.
- `Transaction` - история экономики.

### Snapshot

Большинство экранов живёт от одного объекта `AquariumSnapshot` из `GET /api/user`. Его формирует `PlayerService.getSnapshot()`:

- применяет голод;
- начисляет загрязнение;
- проверяет достижения;
- возвращает пользователя, аквариум, инвентарь, рыб, достижения и текущий доход.

На клиенте snapshot хранится в TanStack Query с ключом `['snapshot']`.

## Вместимость аквариума

Вместимость сейчас равна 20 рыбам. Константа лежит в:

```text
src/lib/fish-capacity.ts
```

Правило:

- первые 20 рыб из snapshot считаются активными и рендерятся в аквариуме;
- все рыбы сверх 20 остаются в `Склад -> Рыбки` и помечаются как перенаселение;
- доход считается только от активных 20 рыб.

Если будешь менять вместимость, меняй только `aquariumFishCapacity`.

## Где редактировать частые вещи

### Нижнее меню и общий экран

```text
src/components/layout/app-shell.tsx
```

Там находятся:

- верхняя плашка валюты;
- нижняя навигация;
- скрытие меню при открытых модалках через `data-app-modal="true"`.

### Аквариум и поведение рыб

```text
src/features/fish/aquarium-client.tsx
src/components/aquarium/aquarium-renderer.tsx
src/components/aquarium/fish-ai.ts
```

`aquarium-client.tsx` выбирает активных рыб и передаёт их в renderer.

`aquarium-renderer.tsx` отвечает за Pixi-сцену, фон, декор, пузырьки, загрязнение, клики по рыбам и режим наблюдения.

`fish-ai.ts` отвечает за цели движения, скорость, реакции на тап и специальное движение к корму в инфо-карточке.

### Склад, корм и карточка рыбки

```text
src/features/inventory/inventory-screen.tsx
```

Там находятся:

- вкладки `Корм`, `Декор`, `Фоны`, `Рыбки`;
- карточки рыб на складе;
- модалка инфо рыбки;
- кормление внутри модалки.

### Магазин и казино

```text
src/features/marketplace/marketplace-screen.tsx
src/components/fish/casino-reveal-modal.tsx
src/server/services/marketplace.service.ts
```

Frontend показывает разделы магазина и казино. Backend выбирает результат покупки, списывает валюту и создаёт рыбу/возврат.

### Профиль, друзья, подарки

```text
src/features/auth/profile-screen.tsx
src/features/friends/use-friends.ts
src/server/services/friends.service.ts
```

Тут редактируются профиль, достижения, заявки в друзья, подарки водорослей/рыб и просмотр аквариума друга.

### Настройки и звуки

```text
src/features/auth/settings-screen.tsx
src/stores/sound-store.ts
```

Звуки сделаны через Web Audio API без внешних аудиофайлов.

### Товары, картинки и каталоги

```text
src/lib/app-assets.ts
public/assets/**
prisma/seed.ts
```

Если добавляешь товар или фон:

1. Добавь картинку в `public/assets`.
2. Добавь запись в `src/lib/app-assets.ts`.
3. Если это рыба или достижение, обнови `prisma/seed.ts`.
4. Запусти `npm run db:seed` там, где надо обновить справочники.

## API endpoints

- `POST /api/auth/telegram` - вход через Telegram initData.
- `POST /api/auth/dev` - локальный dev-login, отключён в production.
- `GET /api/user` - основной snapshot игры.
- `PATCH /api/fish` - переименование и избранное.
- `DELETE /api/fish` - продажа рыбы.
- `GET /api/marketplace` - каталог магазина и рыб.
- `POST /api/marketplace/purchase` - покупка еды/товара/рыбного казино.
- `POST /api/inventory/feed` - кормление рыбы.
- `PATCH /api/aquarium` - декор, фон, очистка.
- `POST /api/income/claim` - начисление offline income.
- `POST /api/daily-rewards/claim` - ежедневная награда.
- `GET/POST/PATCH/DELETE /api/friends` - друзья и заявки.
- `POST/PATCH /api/friends/gift` - отправка и получение подарков.
- `POST /api/friends/visit` - уведомление о визите.
- `GET /api/achievements` - достижения.
- `GET /api/health` - healthcheck.

## Как безопасно вносить изменения

1. Перед работой проверь git:

```bash
git status --short --branch
```

2. Найди нужный файл через ripgrep:

```bash
rg -n "FishModal|marketplace|incomePerSecond" src
```

3. Делай маленькие изменения. Не смешивай UI, базу и большую бизнес-логику в одном коммите без причины.

4. После правки React-компонентов проверь:

- хуки не должны быть внутри `if`/циклов;
- кнопкам внутри форм нужен `type="button"`, если это не submit;
- спискам нужны стабильные `key`;
- не создавай компоненты внутри компонентов;
- не запускай лишние refetch-и, если snapshot уже пришёл из mutation.

5. После правки Prisma schema:

```bash
npm run db:migrate
npm run db:seed
npm run typecheck
npm run build
```

6. Перед push:

```bash
git diff
npm run typecheck
npm run build
```

## Тест-план для ручной проверки

### Базовая загрузка

- Открыть `/aquarium`.
- Проверить, что верхняя валюта видна.
- Проверить, что нижнее меню не перекрывает модалки.
- Проверить, что при ошибке auth в dev появляется dev-login.

### Аквариум

- Проверить, что в аквариуме максимум 20 рыб.
- Если у игрока больше 20 рыб, лишние должны быть только в `Склад -> Рыбки`.
- Проверить режим наблюдения: вход, выход, drag, zoom.
- Проверить тап по рыбке: подпись/эмоция появляется, UI не ломается.

### Склад

- Открыть `Корм и склад`.
- Проверить вкладки `Корм`, `Декор`, `Фоны`, `Рыбки`.
- Во вкладке `Рыбки` проверить прямоугольные карточки и кнопку `Инфо`.
- Открыть инфо рыбки: нижнее меню должно исчезнуть.
- Нажать `Покормить`: рыба спокойно подплывает к корму и приложение не падает.

### Магазин

- Открыть магазин.
- Проверить плитки разделов.
- В разделе рыб открыть казино.
- Проверить покупку при достаточном и недостаточном балансе.
- Проверить результат: рыба/возврат, snapshot обновляется.

### Профиль и друзья

- Проверить отображение уровня, рыб, достижений.
- Добавить друга по Telegram ID.
- Отправить подарок водорослей.
- Отправить свою рыбку: у отправителя она блокируется/исчезает, у получателя появляется pending gift.
- Забрать подарок.

### Production smoke test

После деплоя:

```bash
npx vercel inspect https://fish-game-delta.vercel.app
npx vercel logs https://fish-game-delta.vercel.app --since 10m
```

В логах не должно быть:

- `Too many database connections opened`;
- Prisma validation errors;
- 500 на `/api/user`, `/api/inventory/feed`, `/api/marketplace/purchase`.

## Найденные и исправленные проблемы в текущем аудите

1. API-клиент мог падать на `response.json()`, если сервер вернул HTML или пустой ответ. Теперь non-JSON ответ превращается в нормальную ошибку, которую UI может показать.

2. TanStack Query делал частый polling snapshot каждые 30 секунд и refetch при фокусе окна. Это создавало лишнюю нагрузку на API и PostgreSQL. Теперь polling отключён, `staleTime` увеличен до 60 секунд, refetch on focus выключен.

3. После успешного Telegram auth клиент сразу делал ещё один `invalidateQueries(['snapshot'])`, хотя snapshot уже был получен. Убран лишний запрос к `/api/user`.

4. После ограничения аквариума до 20 рыб доход всё ещё мог считаться от всех рыб. Теперь live и offline income считают только активных рыб в пределах вместимости.

## Известные технические риски

- В проекте нет автоматических unit/e2e тестов. Сейчас проверка держится на `typecheck`, production build и ручном smoke test.
- Полноценный Telegram login невозможно честно проверить в обычном браузере без настоящего `window.Telegram.WebApp.initData`.
- Prisma schema меняется через миграции; не запускай `prisma db push` на production без отдельного решения.
- Если будет много одновременных игроков, лучше перейти на pooled PostgreSQL URL или Prisma Accelerate/Data Proxy. В production Prisma client уже добавляет `connection_limit=1` и `pool_timeout=20` к runtime URL как защиту для serverless.

## Deploy на Vercel

1. Проверь env в Vercel:

```env
DATABASE_URL="pooled-postgres-url"
DIRECT_URL="direct-postgres-url"
TELEGRAM_BOT_TOKEN="botfather-token"
TELEGRAM_BOT_USERNAME="your_bot"
JWT_SECRET="long-random-production-secret"
CRON_SECRET="long-random-secret"
NEXT_PUBLIC_APP_URL="https://fish-game-delta.vercel.app"
NEXT_PUBLIC_API_URL="https://fish-game-delta.vercel.app/api"
```

2. Для изменений Prisma schema отдельно выполни:

```bash
npm run db:deploy
npm run db:seed
```

3. Обычный deploy:

```bash
npx vercel deploy --prod --yes
```

4. Проверка:

```bash
npx vercel inspect https://fish-game-delta.vercel.app
npx vercel logs https://fish-game-delta.vercel.app --since 10m
```

## Git workflow

Обычный порядок:

```bash
git status --short --branch
git diff
npm run typecheck
npm run build
git add .
git commit -m "Short clear message"
git push origin main
```

Не откатывай чужие изменения через `git reset --hard`, если не понимаешь точно, что делаешь.

## Короткая карта: что менять для популярных задач

- Новый товар: `src/lib/app-assets.ts`, картинки в `public/assets`, возможно `PlayerService.buyProduct()`.
- Новая рыба: `prisma/schema.prisma`, `prisma/seed.ts`, `src/server/services/fish.service.ts`, renderer при необходимости.
- Новый экран: `src/app/(game)/<route>/page.tsx`, компонент в `src/features/<feature>`.
- Новая API-логика: route в `src/app/api`, сервис в `src/server/services`, validation в `src/lib/validation/game.ts`.
- Изменить поведение рыб: `src/components/aquarium/fish-ai.ts`.
- Изменить визуал аквариума: `src/components/aquarium/aquarium-renderer.tsx`.
- Изменить карточки склада: `src/features/inventory/inventory-screen.tsx`.
- Изменить казино: `src/components/fish/casino-reveal-modal.tsx` и `src/server/services/marketplace.service.ts`.