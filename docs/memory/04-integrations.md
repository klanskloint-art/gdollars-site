# 04. Интеграции: Poparce, Worker, логотипы, Telegram

## Poparce (poizon-api.com / poparce.ru) — данные Poizon
OpenAPI: `https://poparce.ru/api/dewu/api-json` (или `poizon-api.com/api/dewu/api-json`). Авторизация: заголовок `x-api-key`.
Используемые методы (через Worker, без префикса `/api/dewu`):
- `GET /searchProducts?keyword=&limit=1..100&page=0` → `{ total, page, lastId, productList: [{ spuId, productId, title (обычно китайский), brandName, images[], logoUrl, articleNumber, price (0!), seriesName }] }`. **Цены в поиске нет.**
- `GET /productDetail?spuId=` → `DetailResponseTypeV5`: `detail{spuId,title,articleNumber,logoUrl,…}`, `image.spuImage.images[{url}]`, `price.item.price` (в фэнях), `saleProperties.list[{propertyValueId,name:'尺码',value:'42.5'}]`, `skus[{skuId,authPrice,status,properties[{propertyValueId}]}]`, иногда `layerModel.skuInfoList`.
  - Факт: `authPrice` одинаковый для всех размеров → одна цена на модель. Цены по размерам — только через Shihuo.
- Shihuo («цены продавцов», по доке Poparce): `GET https://poparce.ru/api/shihuo/by-article/{article}` → goodsId; `GET https://poparce.ru/api/shihuo/price/{goodsId}`. Ключ `e330aa03…` → «Требуется валидный API-ключ»; ключ `0fe1dace…` → ответ про **квоту** (нет оплаченного тарифа). Формат ответа ещё не видели.
- Лимит: 3 запроса/сек (в `assets/poparce.js` очередь: старт не чаще 400 мс, ≤2 параллельно).
- Цены в фэнях → делим на 100 (`config.poparce.fen: true`).
- Размеры: убираем китайские приписки, ⅓/⅔ (adidas) оставляем.
- Подбор товара к нашей модели (`pick()` в poparce.js): бренд должен совпасть, пропуск кастомов (`定制`), детских (`童|GS|PS|TD`), без цены, обувь с макс. размером < 37; бонус за совпадение цвета (COLOR_ZH).

### Расход запросов (важно — их мало)
- Каталог и карточки у покупателей **не** тратят запросы (`cards: false`, `live: "owner"`), КРОМЕ товаров из `GD_PZCAT` без цены: их страница делает 1 `productDetail` у любого посетителя (кеш 3 ч на устройство).
- Массовая загрузка «по товарам» = 2 запроса/товар и много «не найдено» на шаблонных товарах — **не рекомендовать**.
- «Импорт каталога по брендам» = 1 запрос на бренд×категорию, берёт до ~25 товаров/запрос, останавливается на целевом числе (500 ≈ 20 запросов).

## Cloudflare Worker (`cloudflare-worker.js`)
Зачем: Poparce не даёт CORS браузеру. Worker пробрасывает ключ и добавляет CORS. Разрешённые пути: `/searchProducts /productDetail /productsDetailSimple /getCategories /shihuo/by-article/* /shihuo/price/*`. Пробует `poparce.ru`, затем `poizon-api.com`. Ключ можно передать `?key=` (для ручной проверки в браузере).

## Логотипы брендов
`brandLogo(name)`: Brandfetch `cdn.brandfetch.io/domain/<dom>/h/240/w/480/theme/dark/fallback/404/logo.png?c=<clientId>` → при ошибке logo.dev `img.logo.dev/<dom>?token=pk_…&size=200&format=png` → текстовый wordmark. Домены — `data/brand-domains.js`. `theme/light` даёт БЕЛЫЕ логотипы (были невидимы) — не возвращать.

## Telegram-вход
`config.telegramBotId` + OAuth `oauth.telegram.org/auth?bot_id=…&origin=…&return_to=…`. Без сервера (`apiBase` пуст) подпись не проверяется — профиль просто сохраняется в `gd_profile`. Работает только на домене из @BotFather (`klanskloint-art.github.io`). На компьютере нужно подтверждение в Telegram на телефоне.

## Чего нет / не настроено
- Сервер (`apiBase`) — заказы уходят менеджеру через Telegram-ссылку; Click/Payme не подключены.
- Владелец в `ownerTelegram: []` не прописан (режим владельца — 5 тапов по логотипу, на реальном домене разрешён только при списке).
- Google login (`googleClientId` пуст).
