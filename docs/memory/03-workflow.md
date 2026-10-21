# 03. Как вносить изменения, проверять и публиковать

## Начало новой сессии
1. Подключить репо: `klanskloint-art/gdollars-site` (в Claude Code: add_repo с access `push`), клонировать.
2. Прочитать `CLAUDE.md` и `docs/memory/07-status-and-todo.md`.
3. `git log --oneline | head -20` — что делалось последним.

## Правка
- Большие файлы (`assets/app.js`, `assets/styles.css`) правь точечно (Python `str.replace` с `assert old in s` или Edit). CSS — новым блоком в конец файла.
- После правки: проверка синтаксиса
  ```bash
  for f in assets/app.js assets/poparce.js config.js; do node -e "new Function(require('fs').readFileSync('$f','utf8'))" && echo ok $f; done
  ```
- Подними версию кеша во ВСЕХ тегах: `sed -i -E 's/v=OLD/v=NEW/g' index.html`.

## Визуальная проверка (Playwright уже установлен в контейнере)
```bash
S=<scratchpad>; rm -rf $S/tsite && mkdir $S/tsite && cp -r index.html config.js assets data icons $S/tsite/ && cp $S/tsite/index.html $S/tsite/test.html
# скрипт: chromium.launch(), viewport 390x844 (телефон) и 1440x900 (комп), goto file://$S/tsite/test.html#<route>, screenshot
```
- Внешние сети в песочнице закрыты → logo.dev/Brandfetch/Poizon-картинки и Poparce подменяй через `page.route(...)` фейковыми ответами.
- Проверяй `pageerror` и отсутствие горизонтального скролла.

## Публикация
```bash
git add -A && git -c user.name="klanskloint-art" -c user.email="klanskloint-art@users.noreply.github.com" commit -m "…" && git push origin main
```
Через 1–2 мин сайт обновлён. Пользователю: «обнови Ctrl+Shift+R / закрой и открой вкладку».

## Cloudflare Worker
- Код: `cloudflare-worker.js`. Пользователь сам вставляет его в Cloudflare → Workers & Pages → `empty-hill-838d` → Edit code → Ctrl+A, Delete, Ctrl+V (правой кнопкой вставка не работает) → Deploy.
- Проверка: `https://empty-hill-838d.klanskloint.workers.dev/searchProducts?keyword=nike&limit=3&page=0&key=<KEY>`.
- В последней версии в чате передаётся ключ всеми способами (x-api-key, x-service-api-key, Bearer, cookie, ?apiKey) и пропускаются `/shihuo/by-article/<article>` и `/shihuo/price/<goodsId>`. Файл в репо может отставать от того, что реально задеплоено — уточнить у пользователя.

## Данные Poizon от пользователя
- Пользователь скачивает в `#admin-import` файлы `poparce-cache.js` / `poizon-catalog.js` и присылает в чат.
- Перед выкладкой фильтруй: детские модели (обувь с макс. размером < 37, артикулы Asics 1014A/1204A/1154A), без цены (`minCny 0`), неверный цвет (s1 → 823511-402 — не белый AF1, исключён).
- Кладёшь в `data/`, поднимаешь версию, пушишь.

## Artifact-зеркало (необязательно)
Раньше каждое изменение публиковалось ещё и в artifact `N38GBMZLrxu3U7iAd13VVu` (папка artifact-files в scratchpad). Это только превью; основной сайт — GitHub Pages.
