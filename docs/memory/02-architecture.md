# 02. Архитектура кода

Vanilla JS SPA, без сборщика и зависимостей. Всё грузится скриптами по порядку из `index.html`:

```
config.js                window.GD_CONFIG  (настройки, наценки, ключи, контакты)
data/products.js         window.GD_PRODUCTS (~2 530 базовых товаров; ids s*, h*, y*, gb*, nb*, puma*, conv*, vans*, laco*, …)
data/brands.js           window.GD_BRANDS (1 196 брендов: [name, popular, premium]) + BRAND_GROUPS
data/brand-domains.js    window.GD_BRAND_DOMAINS (бренд → домен для логотипов)
data/feed.js             window.GD_FEED (пусто; внешний фид товаров)
data/more.js             генератор +30 000 «нарисованных» товаров (est: true) → дописывает в GD_PRODUCTS
data/poizon-import.js    window.GD_POIZON (результат JSON-импорта; пусто)
data/poizon-catalog.js   window.GD_PZCAT (настоящие товары Poizon из поиска по брендам; пусто, ждём файл)
data/poparce-cache.js    window.GD_PP {productId: {spuId, article, images[], sizes[], sizeCny{}, soldOut[], minCny}} — 11 товаров
assets/poizon-import.js  GDPoizon: парсер JSON-выгрузок (фильтр по брендам магазина)
assets/i18n.js           ru/en строки (t("key"))
assets/art.js            SVG-рисунки товаров (заглушки)
assets/poparce.js        GDPoparce: клиент Poparce через Worker (очередь ≤3 rps, кеш localStorage gd_pp_cache: m: 7 дней, d: 3 часа)
assets/app.js            всё приложение (~3 800 строк)
assets/styles.css        стили; правки дописываются блоками в КОНЕЦ файла с комментарием /* vNNN: … */
```

## app.js — ключевые места
- Вверху: `CATS`, `ACC`, `WEAR`, `retailPrice()`, `officialBased()`, `accSub()`.
- Сборка каталога: `POIZON_ITEMS`, `applyPP` (накладывает GD_PP), `isReal`, `PZCAT` (noPrice-товары), `BASE_ITEMS` (фильтр `CFG.onlyReal`), `PRODUCTS`, `byId`.
- Цены: `sizeFactor()` (МОЯ ПРИКИДКА для товаров без данных: обувь вне 38–43 +3.5%/размер, XS+5%, XL+4%, XXL+8%), `priceAt(p, size)` (если есть `sizeCny[size]` — берёт его), `isSoldOut()`.
- Картинки: `imgUrl(src, w)` — ресайз CDN Poizon через `?x-oss-process=image/resize,w_N/format,webp`, фолбэк на оригинал (`data-orig`); `media()`, `card()`.
- Роутер `onRoute()`; маршруты: `home, shop, catalog, catalog-<cat|shoes|wear|acc>, p-<id>, brands, brand-<name>, search=<q>, sale, link, delivery, contacts, pricing, cart, checkout, done, account, orders, order-<id>, favorites, addresses, addr-new, addr-edit-N, admin, admin-import`.
  - На ширине ≤900px `catalog-*` → старый `viewCatalog()`, на компе → `viewCatalogPont()` (layout как у Pont через `viewListing()`).
- Главная `viewHome()`: слайдер 2 плашки (розовая «Совсем …», голубая «Скоро...»), 10 с, прогресс-полоска CSS-анимацией; ряды брендов/товаров с `enhanceRails()` (стрелки) и `railMore()` (плитка «Все»); популярность — `BRAND_RANK` + `popularPick()`.
- Бренды: `BRANDS` (агрегаты count/from/budget), `brandLogo()` (Brandfetch → logo.dev → текстовый wordmark), `viewBrands()` (вкладки Все/Популярные/Премиум/Бюджетные + буквы), `viewBrand()` (цветной баннер `brandHeroStyle()` / `BRAND_COLORS`).
- Товар `viewProduct()`: размеры (зачёркнутые sold out), розовый блок цены, кнопка «В корзину»; `liveProduct(p)` — подтягивает цену/размеры с Poizon (для noPrice-товаров у всех, иначе только у владельца).
- Poparce в админке `viewAdminImport()`: проверка подключения, массовая загрузка по товарам (2 запроса/товар), восстановление из кеша браузера, **импорт каталога по брендам** (поиск, ~25 товаров/запрос, цель N товаров, скачивает `poizon-catalog.js`).
- Заказы/статусы/фейерверк при «Оплачено» — `viewOrder()`, `celebrate()`; режим владельца — 5 тапов по логотипу, `ownerAllowed()` по `ownerTelegram`.
- Вход: Telegram OAuth (`telegramLoginUrl`, `finishTelegramLogin`), редирект на основной домен с чужих.

## localStorage
`gd_profile gd_addrs gd_cart gd_orders gd_favs gd_recent gd_owner gd_celebrated gd_loggedout gd_after_login gd_lang gd_home_gender gd_br_view gd_role gd_pp_cache gd_poizon_import`

## PWA
`manifest.webmanifest` (scope `./`), `sw.js` (network-first), `icons/`. `.nojekyll` для Pages.
