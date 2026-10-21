# 01. Проект, ссылки, аккаунты

## Ссылки
| Что | Где |
|---|---|
| Сайт (основной) | https://klanskloint-art.github.io/gdollars-site/ |
| Репозиторий | https://github.com/klanskloint-art/gdollars-site (public, ветка `main`) |
| Настройки GitHub Pages | Settings → Pages → Deploy from a branch → `main` / `(root)` |
| Посредник Poparce (Cloudflare Worker) | https://empty-hill-838d.klanskloint.workers.dev — код в `cloudflare-worker.js` |
| Кабинет Poparce | https://poparce.ru (аккаунт `urge_n37`, вход через Telegram Dollars7122) |
| Старый адрес Netlify | capable-croissant-f6810c.netlify.app — **не используется** (кончились бесплатные кредиты, $9/мес). |
| Artifact-зеркало в claude.ai | https://claude.ai/artifact/N38GBMZLrxu3U7iAd13VVu (превью внутри чата; логотипы/Telegram там не работают) |

## Внешние сервисы
- **Telegram-бот** `@Gurgwk_bot` (id `8102490953`) — вход через Telegram на сайте. Домен бота в @BotFather `/setdomain` = `klanskloint-art.github.io`. Работает только на этом домене.
- **logo.dev** — значки брендов, publishable key `pk_…` в `config.js` (`logoDevToken`).
- **Brandfetch** — полные логотипы брендов (тёмный вариант `theme/dark`), client id в `config.js` (`brandfetchClientId`). Секретный API key Brandfetch пользователь присылал в чат — он не используется, его советовали перевыпустить.
- **Poparce / poizon-api.com** — API к Poizon (Dewu). Ключ в `config.js → poparce.token`. Подписка «Все магазины»: 500 запросов, 3 запроса/сек, истекала ~25.10.2026. На 20.10 вечером было потрачено 427/500. Неизвестно, сбрасывается ли лимит ежедневно — спросить владельца.
  - Есть ещё ключ `0fe1dace-…` (тот же или другой аккаунт — не подтверждено): Shihuo-эндпоинт принял его, но ответил про **квоту** → цен по размерам в подписке нет.
  - Ключ `50891188-…` пользователь прислал без объяснения — **не использовать**, пока не подтвердит, что это платная подписка его аккаунта (подозрение на мульти-аккаунт).
- **Cloudflare** — аккаунт klanskloint@gmail.com, Worker `empty-hill-838d` (Workers & Pages). Нужен, т.к. Poparce не отдаёт CORS браузеру.
- **GitHub** — аккаунт `klanskloint-art`, Claude GitHub App установлен (All repositories) → из сессии Claude Code можно пушить.
- Google login: нужен `googleClientId` — не получен.

## Бизнес
- Покупка на Poizon в юанях → цена в сумах = `¥ × (1 + наценка) × cnyToUzs`, округление до 1000.
- Курс `cnyToUzs: 1750` (рынок ~1680–1700 на 20.10.2026; 1750 — запас).
- Наценки (`config.js → markups`): шапки/кепки/трусы +70%, обувь/футболки +65%, худи/носки +62%, куртки/пальто/шорты +61%, штаны +57%, очки +53%, часы +40%, бра +47%, прочие аксессуары +50%.
- Доставка 14–21 день, оплата Click/Payme (не подключены — нужен договор и сервер), рассрочка «× 2 в сплит» — только надпись.
- Договоры (Poizon, Click/Payme, регистрация бизнеса) должен подписывать совершеннолетний/зарегистрированный владелец — владелец собирался подключить родителя.
- Письмо о партнёрстве в Poizon составлено (EN+ZH); отправлялось в чат поддержки приложения — ответа нет (робот). Цель: официальный доступ к каталогу с ценами по размерам.
