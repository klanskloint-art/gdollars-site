window.GD_CONFIG = {
  brand: "G&Dllars",

  // true shows the "demo catalog" notice; set false once data/products.js holds real items and prices
  demo: true,

  // internal price-check page at #pricing; set false before launch so customers can't see markups
  pricingPage: true,

  // demo admin panel at #admin (manager, buyer, warehouse, logist); set false before launch
  adminPage: true,

  // 1 ¥ (CNY) in сум; update to the current rate
  cnyToUzs: 1750,

  // Rates for feed prices in other currencies (сум for 1 unit). USD and EUR: Central Bank of Uzbekistan, 19.10.2026.
  // Update them regularly; prices on the site are recalculated automatically.
  rates: { CNY: 1750, USD: 12055.90, EUR: 13572.53, UZS: 1 },
  roundTo: 1000,

  // retail = Poizon/Dewu price × (1 + markup) × cnyToUzs, rounded up to roundTo
  markups: {
    // шапки, кепки и трусы +70%
    beanies: 0.70, caps: 0.70, underwear: 0.70,
    // обувь и футболки +65%
    shoes: 0.65, tshirts: 0.65,
    // кофты/худи и носки +62%
    hoodies: 0.62, socks: 0.62,
    // куртки и шорты +61% (пальто считаем как куртки)
    jackets: 0.61, coats: 0.61, shorts: 0.61,
    // штаны +57%
    pants: 0.57,
    // очки +53%
    eyewear: 0.53,
    // часы +40%
    watches: 0.40,
    // не указано — прежние значения: бра/топы, сумки, ремни, чемоданы и прочие аксессуары
    bras: 0.47,
    accessories: 0.50
  },

  // Address of your G&Dllars API server (the backend). Leave empty until it is running:
  // orders then go to the manager via Telegram. Example: "https://api.g-dollars.uz"
  apiBase: "",

  deliveryDays: "14–21",

  // "× 2 в сплит" line on product cards; set to null if you don't offer paying in parts
  split: { parts: 2 },
  // Delivery page: how long each step takes, in order:
  // 1 purchase & dispatch, 2 processing, 3 flight & customs, 4 delivery to the customer.
  // Leave "" to hide the time for that step. Example: ["1–3 дня", "1 день", "3–7 дней", "1–2 дня"]
  deliverySteps: ["", "", "", ""],
  // Promo codes: "CODE": percent off. Empty = no codes work. Example: { "WELCOME10": 10 }
  promos: {},
  // "Войти через Telegram": works when apiBase points to your server and the site is on
  // the domain set for this bot in @BotFather (/setdomain).
  telegramBot: "Gurgwk_bot",
  // Bot ID = the digits BEFORE ":" in the bot token from @BotFather (e.g. "7712345678").
  // Never put the part after ":" here. With this set, "Войти через Telegram" opens Telegram's login window.
  telegramBotId: "8102490953",
  // Domain linked to the bot in @BotFather (/setdomain). Telegram login only works on this domain.
  // Google sign-in: OAuth Client ID from console.cloud.google.com (…apps.googleusercontent.com). Empty = no Google button.
  googleClientId: "",
  // Main site address. Telegram login works only here (bot domain set in @BotFather with /setdomain).
  siteDomain: "klanskloint-art.github.io",
  siteUrl: "https://klanskloint-art.github.io/gdollars-site/",
  // Owner: only these Telegram accounts can turn on owner mode (5 taps on the GD logo) on the real site.
  // Username without @, or the numeric Telegram ID.
  ownerTelegram: [],
  // Brand logos: free key from logo.dev (Dashboard → API keys → "Publishable key", starts with pk_).
  // With it, brand cards load the brands' logos by website domain (list in data/brand-domains.js).
  // Free plan for a shop requires the "Logos provided by Logo.dev" link — it is added to the footer automatically.
  logoDevToken: "pk_euY7XDktSAKsmq6KkjDeyQ",
  // Poparce / poizon-api.com: live photos, sizes, stock and prices from Poizon.
  // token = your API key (sent in the "x-api-key" header). It is visible to anyone who opens the site's code.
  // fen: true = the API returns prices in fen (1/100 of a yuan), as Poizon does.
  poparce: { token: "90e3fdd31a17", base: "https://empty-hill-838d.klanskloint.workers.dev", fen: true },
  // Brandfetch Logo API client ID (public, free at developers.brandfetch.com): full brand logos like on Pont. Empty = logo.dev icons.
  brandfetchClientId: "1idn33yRl6lJI-lS95j",
  // Price = official retail (retailUsd) minus belowRetail, but never lower than
  // the Poizon price (dewuCny) plus minMarginOverPoizon, so you don't sell at a loss.
  // Items without retailUsd use the category markups above.
  // Pricing mode. null = Poizon price (dewuCny) × (1 + markup for the item type) × cnyToUzs (markups above).
  // To price from official retail instead, use: { belowRetail: 0.22, minMarginOverPoizon: 0.15 }
  pricing: null,
  // Sizes that are NOT available on Poizon now (shown crossed out, can't be added to cart).
  // Example: soldOut: { "s1": ["36", "45"], "h1": ["XS"] }
  soldOut: {},
  // Sale (Распродажа): percent off by product id, brand or category.
  // Example: { "Puma": 20, "s1": 15, "socks": 10 }. Empty = the sale page says there are no discounts now.
  sale: {},

  contacts: {
    telegram: "Dollars7122",
    email: "klanskloint@gmail.com",
    phone: "+998944444793",
    phoneDisplay: "+998 94 444 47 93"
  }
};
