# Установка в khamidullaevv/khamidullaevv

Это твой собственный аналог readme-aura: скрипт на Satori рендерит две тёмные
SVG-карточки (профиль + статистика) из живых данных GitHub API и коммитит их
обратно в репозиторий раз в сутки.

## 1. Скопируй файлы в свой репозиторий профиля

Из этого архива перенеси в `khamidullaevv/khamidullaevv`:

```
.github/workflows/update-readme.yml
scripts/h.mjs
scripts/fetch-font.mjs
scripts/generate-cards.mjs
scripts/build-readme.mjs
readme.source.md
package.json
```

`assets/` создавать не нужно — Action сгенерирует его сам при первом запуске.

## 2. Создай токен для статистики

1. [github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token (classic)**
2. Права: `public_repo`, `read:user` — этого достаточно
3. Скопируй токен

## 3. Добавь токен как секрет репозитория

1. В репозитории `khamidullaevv/khamidullaevv` → **Settings → Secrets and variables → Actions**
2. **New repository secret**
3. Имя: `STATS_TOKEN`
4. Значение: токен из шага 2

(Обычный `GITHUB_TOKEN`, который Actions даёт по умолчанию, тоже подойдёт для
базовых данных, но у него более жёсткие лимиты на Search API — с личным PAT
надёжнее.)

## 4. Запусти Action вручную первый раз

1. Вкладка **Actions** → **Update Profile README** → **Run workflow**
2. Дождись зелёной галочки (обычно 20–40 секунд)
3. В репозитории появятся `assets/profile-card.svg`, `assets/stats-card.svg`
   и обновлённый `README.md`

Дальше Action будет сам обновлять карточки раз в сутки по cron — руками
трогать ничего не нужно.

## Как это устроено

- `readme.source.md` — единственный файл, который ты редактируруешь руками
  (шапка, бейджи, структура страницы)
- `scripts/generate-cards.mjs` — тянет статистику из GitHub REST API
  (звёзды, коммиты за год, PR, issues, репозитории, подписчики) и рендерит
  два JSX-дерева через [Satori](https://github.com/vercel/satori) в SVG
- `scripts/fetch-font.mjs` — скачивает шрифт Inter в формате TTF с Google
  Fonts (Satori не умеет woff2)
- `scripts/build-readme.mjs` — копирует `readme.source.md` → `README.md`
  (задел на будущее, если захочешь подставлять цифры прямо в текст, а не
  только в SVG)
- Готовые SVG лежат физически в репозитории — README грузится мгновенно и
  не зависит от аптайма сторонних Vercel-сервисов

## Если хочешь изменить дизайн карточек

Открой `scripts/generate-cards.mjs` — там две функции, `ProfileCard()` и
`StatsCard()`, стилизованные как обычный flexbox/CSS (Satori понимает
`display: flex`, `gap`, `borderRadius`, градиенты и т.д. — почти всё, что
работает в браузере). Правишь стили → пушишь → Action перерисует карточки
при следующем запуске.
