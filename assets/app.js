(function () {
  "use strict";

  const CFG = window.GD_CONFIG;
  const I18N = window.GD_I18N;
  const art = window.GD_ART;
  const CATS = ["shoes", "watches", "bags", "caps", "beanies", "eyewear", "belts", "luggage", "accessories", "hoodies", "tshirts", "pants", "shorts", "jackets", "coats", "beanies", "socks", "underwear", "bras"];
  const ACC = ["watches", "bags", "caps", "beanies", "eyewear", "belts", "luggage", "accessories"];          // separate "Аксессуары" department
  const WEAR = c => !ACC.includes(c);
  const CAT_COLORS = {
    shoes: "#F4F4EF", watches: "#C9C7C1", accessories: "#8A6040", bags: "#8A6040", caps: "#24304A", eyewear: "#1E1E1E", belts: "#5A3E2B", luggage: "#9A9D9B", hoodies: "#8E9290", shorts: "#B8895A", tshirts: "#2F6F4F", pants: "#3B4A6B", jackets: "#24342D", coats: "#B8895A",
    beanies: "#E2B23A", socks: "#F4F4EF", underwear: "#3A3A3A", bras: "#C9B2A1"
  };
  const NAV = [
    ["catalog", "nav_catalog"], ["brands", "nav_brands"], ["catalog-shoes", "cat_shoes"], ["catalog-hoodies", "cat_hoodies"], ["catalog-tshirts", "cat_tshirts"],
    ["catalog-jackets", "cat_jackets"], ["link", "nav_link"], ["favorites", "nav_favs"], ["orders", "nav_orders"], ["delivery", "nav_delivery"], ["contacts", "nav_contacts"]
  ];

  const ICON = {
    search: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4-4"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3.5h2.3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1l1.6-6.8H6.1"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 4 3 11l7 2 2 7z"/><path d="m10 13 4-4"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>'
  };

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { }
    }
  };

  // base price × (1 + category markup) × rate of its currency, rounded up to roundTo
  function retailPrice(category, amount, currency) {
    const markup = typeof CFG.markups[category] === "number" ? CFG.markups[category] : (ACC.includes(category) ? CFG.markups.accessories : undefined);
    const rate = currency ? (CFG.rates || {})[String(currency).toUpperCase()] : CFG.cnyToUzs;
    if (typeof markup !== "number" || typeof amount !== "number" || !(amount > 0) || !(rate > 0)) return null;
    return Math.ceil((amount * (1 + markup) * rate) / CFG.roundTo) * CFG.roundTo;
  }

  // official retail − belowRetail, floored at Poizon cost + minMarginOverPoizon
  function officialBased(p) {
    const pr = CFG.pricing, usd = (CFG.rates || {}).USD;
    if (!pr || !(p.retailUsd > 0) || !(usd > 0)) return null;
    const target = p.retailUsd * usd * (1 - (pr.belowRetail || 0));
    const floor = p.dewuCny > 0 ? p.dewuCny * CFG.cnyToUzs * (1 + (pr.minMarginOverPoizon || 0)) : 0;
    return Math.ceil(Math.max(target, floor) / CFG.roundTo) * CFG.roundTo;
  }

  function accSub(p) {
    const n = (p.name || "").toLowerCase();
    if (p.category === "beanies" && /\bcap\b|bucket|кепк|панам/.test(n)) return "caps";
    if (p.category !== "accessories") return p.category;
    if (/cabin|luggage|suitcase|trolley|чемодан/.test(n)) return "luggage";
    if (/sunglass|wayfarer|glasses|eyewear|очки/.test(n)) return "eyewear";
    if (/belt|wallet|cardholder|card holder|ремень|кошел/.test(n)) return "belts";
    if (/cap\b|hat\b|bucket|кепк|панам/.test(n)) return "caps";
    if (/bag|backpack|tote|duffel|crossbody|shoulder|waist|pouch|сумк|рюкзак/.test(n)) return "bags";
    return "accessories";
  }
  const PRODUCTS = (window.GD_PRODUCTS || []).concat(window.GD_FEED || []).map(p => Object.assign({}, p, { category: accSub(p) }))
    .map((p, i) => Object.assign({}, p, {
      price: officialBased(p) || (typeof p.basePrice === "number" ? retailPrice(p.category, p.basePrice, p.currency) : retailPrice(p.category, p.dewuCny)),
      order: i, tags: p.tags || [], images: p.images || [], sizes: p.sizes && p.sizes.length ? p.sizes : ["One size"]
    }))
    .map(p => {
      const sale = CFG.sale || {};
      const pct = Number(p.sale || sale[p.id] || sale[p.brand] || sale[p.category] || 0);
      if (!(pct > 0 && pct < 90) || p.price === null) return p;
      return Object.assign(p, { oldPrice: p.price, salePct: pct, price: Math.ceil(p.price * (1 - pct / 100) / CFG.roundTo) * CFG.roundTo });
    })
    .filter(p => {
      if (p.price === null) console.warn("[G&Dllars] Hidden product (unknown category or missing dewuCny):", p.id);
      return p.price !== null;
    });
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

  // Price per size, like on Poizon: common sizes cost the base price, rare ones a bit more.
  // Exact per-size Poizon prices can be given per product as sizeCny: { "40": 689, "45": 799 }.
  const APP_F = { XXS: 1.08, XS: 1.05, S: 1, M: 1, L: 1, XL: 1.04, XXL: 1.08, XXXL: 1.12, "2XL": 1.08, "3XL": 1.12 };
  function sizeFactor(p, z) {
    if (!z || !p.sizes || p.sizes.length < 2) return 1;
    const key = String(z).toUpperCase().trim();
    if (APP_F[key]) return APP_F[key];
    const n = parseFloat(String(z).replace(",", ".").replace(/^W/i, ""));
    if (isNaN(n)) return 1;
    if (/^W/i.test(String(z))) return n <= 28 ? 1.03 : n >= 36 ? 1.05 : 1;
    if (p.category === "shoes" && n >= 30 && n <= 50) {
      const d = n < 38 ? 38 - n : n > 43 ? n - 43 : 0;
      return 1 + 0.035 * d;
    }
    return 1;
  }
  function priceAt(p, z) {
    if (!p) return 0;
    if (z && p.sizeCny && p.sizeCny[z] > 0) {
      let v = retailPrice(p.category, p.sizeCny[z]);
      if (v && p.salePct) v = Math.ceil(v * (1 - p.salePct / 100) / CFG.roundTo) * CFG.roundTo;
      if (v) return v;
    }
    const f = sizeFactor(p, z);
    return f === 1 ? p.price : Math.ceil(p.price * f / CFG.roundTo) * CFG.roundTo;
  }
  // Sizes not available on Poizon right now: product field soldOut: ["36", "45"] or config.soldOut: { "s1": ["36"] }.
  const isSoldOut = (p, z) => !!((p.soldOut && p.soldOut.map(String).includes(String(z))) || ((CFG.soldOut || {})[p.id] || []).map(String).includes(String(z)));
  const hasSizePrices = p => p.sizes && p.sizes.some(z => priceAt(p, z) !== p.price);

  const COLOR_GROUPS = [
    ["black", "#1E1E1E", /^(чёрн|черн)/], ["white", "#F7F7F2", /^(бел)/], ["grey", "#9A9D9B", /^(сер)/],
    ["blue", "#2E4A8A", /^(син|тёмно-син|голуб|индиго)/], ["green", "#2F7A55", /^(зел|тёмно-зел|хаки)/],
    ["brown", "#8A6040", /^(корич|кэмел|каштан|песоч|беж)/], ["red", "#C0392B", /^(крас)/], ["yellow", "#E2B23A", /^(жёлт|желт|горчич)/]
  ];
  const colorGroup = p => {
    const n = String((p.colorName && (p.colorName.ru || p.colorName)) || "").toLowerCase();
    const g = COLOR_GROUPS.find(([, , re]) => re.test(n));
    return g ? g[0] : "other";
  };
  PRODUCTS.forEach(p => { p.colorGroup = colorGroup(p); });
  const PRICE_BANDS = { "lt1": [0, 1000000], "1-2": [1000000, 2000000], "2-5": [2000000, 5000000], "gt5": [5000000, Infinity] };
  const PREMIUM = new Set((window.GD_BRANDS || []).filter(b => b.premium).map(b => b.name));

  const savedCart = storage.get("gd_cart", []);
  const state = {
    lang: storage.get("gd_lang", "ru") === "en" ? "en" : "ru",
    cart: Array.isArray(savedCart) ? savedCart.filter(l => l && byId[l.id] && l.qty > 0) : [],
    filters: { cat: "all", gender: "all", brand: "all", sort: "popular", q: "", color: "all", size: "all", price: "all", tier: "all" },
    sizes: {},
    draft: null,
    order: null,
    route: "home",
    role: storage.get("gd_role", "manager"),
    adminAll: false,
    linkShot: null,
    addrs: (a => (Array.isArray(a) ? a.filter(x => x && x.address && x.name && x.phone) : []))(storage.get("gd_addrs", [])),
    addrSel: -1,
    favs: (s => (Array.isArray(s) ? s.filter(id => byId[id]) : []))(storage.get("gd_favs", [])),
    brView: storage.get("gd_br_view", "list") === "tiles" ? "tiles" : "list",
    brGroup: "all",
    brandCat: "all",
    brTab: "all",
    brLetter: "all",
    brQ: "",
    homeGender: storage.get("gd_home_gender", "men") === "women" ? "women" : "men",
    showSlide: null,
    keepFilters: false,
    keepScroll: false
  };
  let sliderTimer = null;
  let sliderRaf = 0;
  let adTimer = null;
  let revealObs = null;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function t(key, vars) {
    const dict = I18N[state.lang] || I18N.ru;
    let s = dict[key] != null ? dict[key] : (I18N.ru[key] != null ? I18N.ru[key] : key);
    if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  }

  function plural(n, base) {
    if (state.lang === "en") return t(base + (n === 1 ? "_one" : "_many"), { n });
    const m10 = n % 10, m100 = n % 100;
    const form = m10 === 1 && m100 !== 11 ? "_one" : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "_few" : "_many");
    return t(base + form, { n });
  }

  function num(n) {
    return new Intl.NumberFormat(state.lang === "ru" ? "ru-RU" : "en-US").format(n);
  }

  function money(n) {
    return num(n) + " " + t("currency");
  }

  const catName = c => t("cat_" + c);
  const sizeLabel = s => (s === "One size" ? t("one_size") : s);
  const code = p => "GD-" + String(p.id).toUpperCase();
  const count = () => state.cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = () => state.cart.reduce((s, l) => s + priceAt(byId[l.id], l.size) * l.qty, 0);

  function colorName(p) {
    const c = p.colorName;
    if (!c) return "";
    return typeof c === "string" ? c : (c[state.lang] || c.ru || "");
  }

  function tgUrl(text) {
    return "https://t.me/" + encodeURIComponent(CFG.contacts.telegram) + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function mailUrl(subject, body) {
    return "mailto:" + CFG.contacts.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }
  const telUrl = () => "tel:" + CFG.contacts.phone;

  function media(p, cls, eager) {
    const label = esc(p.brand + " " + p.name);
    if (p.images.length) {
      return `<div class="${cls}"><img src="${esc(p.images[0])}" alt="${label}" ${eager ? "" : 'loading="lazy"'} data-pid="${esc(p.id)}"></div>`;
    }
    return `<div class="${cls} pic" role="img" aria-label="${label}">${art(p.category, p.color)}</div>`;
  }

  document.addEventListener("error", e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.pid) return;
    const p = byId[img.dataset.pid];
    const box = img.parentElement;
    if (!p || !box) return;
    if (box.classList.contains("thumb")) { box.hidden = true; return; }
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", p.brand + " " + p.name);
    box.outerHTML = media(Object.assign({}, p, { images: [] }), box.className);
  }, true);

  const LOGO_MARK = '<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0B0F0C"/><text x="20" y="26.5" text-anchor="middle" font-family="Unbounded, Arial Black, sans-serif" font-weight="800" font-size="15" letter-spacing="-0.6" fill="#BDFF14">GD</text></svg>';
  function logoHtml() {
    return `${LOGO_MARK}<span class="logo-word">${esc(CFG.brand)}</span>`;
  }

  const ICON_HEART = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M12 20.3c-.3 0-.6-.1-.8-.3C7.6 17 3 13.4 3 9.1 3 6.3 5.1 4.2 7.7 4.2c1.8 0 3.3.9 4.3 2.4 1-1.5 2.5-2.4 4.3-2.4 2.6 0 4.7 2.1 4.7 4.9 0 4.3-4.6 7.9-8.2 10.9-.2.2-.5.3-.8.3Z"/></svg>';
  const ICON_GEM = '<svg class="gem" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M7 4h10l4 5-9 11L3 9l4-5Z"/><path d="M3 9h18"/><path d="M9.5 4 8 9l4 11 4-11-1.5-5"/></svg>';
  const ICON_TRUCK = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8z"/><circle cx="6" cy="17.5" r="1.8" fill="var(--bg)"/><circle cx="17" cy="17.5" r="1.8" fill="var(--bg)"/></svg>';
  const isFav = id => state.favs.includes(id);
  function favBtn(p) {
    const on = isFav(p.id);
    return `<button type="button" class="fav" data-action="fav" data-id="${esc(p.id)}" aria-pressed="${on}" aria-label="${t(on ? "fav_remove" : "fav_add")}">${ICON_HEART}</button>`;
  }
  function splitLine(price) {
    const sp = CFG.split;
    if (!sp || !(sp.parts > 1)) return "";
    const part = Math.ceil(price / sp.parts / 100) * 100;
    return `<span class="card-split"><span class="split-chip">${money(part)} × ${sp.parts}</span><span class="muted">${t("split_word")}</span></span>`;
  }

  const DESC = {
    ru: {
      shoes: "{bn} — модель на каждый день: подходит к джинсам, брюкам и спортивной одежде. Размеры по европейской сетке (EU).",
      watches: "{bn} — часы на каждый день. Длину ремешка или браслета можно подогнать под руку.",
      accessories: "{bn} — аксессуар, который дополнит повседневный образ.",
      hoodies: "{bn} — тёплый верх на прохладную погоду, хорошо сочетается с джинсами и спортивными брюками.",
      tshirts: "{bn} — базовая вещь для гардероба: носится сама по себе и под куртку или худи.",
      pants: "{bn} — брюки на каждый день, сочетаются с кроссовками и любым верхом.",
      shorts: "{bn} — шорты для тёплой погоды, спорта и прогулок.",
      jackets: "{bn} — верхняя одежда на межсезонье и прохладную погоду.",
      coats: "{bn} — пальто для холодного сезона, собирает строгий и повседневный образ.",
      beanies: "{bn} — головной убор на прохладную погоду.",
      socks: "{bn} — носки на каждый день.",
      underwear: "{bn} — бельё на каждый день.",
      bras: "{bn} — топ на каждый день и для спорта."
    },
    en: {
      shoes: "{bn} is an everyday pair that goes with jeans, trousers and sportswear. Sizes are EU.",
      watches: "{bn} is an everyday watch. The strap or bracelet can be adjusted to fit.",
      accessories: "{bn} is an accessory that finishes an everyday outfit.",
      hoodies: "{bn} is a warm layer for cooler days that pairs with jeans and joggers.",
      tshirts: "{bn} is a wardrobe basic, worn on its own or under a jacket or hoodie.",
      pants: "{bn} are everyday trousers that go with sneakers and any top.",
      shorts: "{bn} are shorts for warm weather, sport and walks.",
      jackets: "{bn} is outerwear for mid-season and cool weather.",
      coats: "{bn} is a coat for the cold season, for smart and casual outfits.",
      beanies: "{bn} is headwear for cooler weather.",
      socks: "{bn} are everyday socks.",
      underwear: "{bn} is everyday underwear.",
      bras: "{bn} is a top for every day and for sport."
    }
  };
  function describe(p) {
    if (p.description) return typeof p.description === "string" ? p.description : (p.description[state.lang] || p.description.ru || "");
    const L = state.lang === "en" ? "en" : "ru";
    const base = (DESC[L][p.category] || DESC[L].tshirts).replace("{bn}", p.brand + " " + p.name);
    const col = colorName(p);
    const who = p.gender === "men" ? t("desc_men") : p.gender === "women" ? t("desc_women") : t("desc_unisex");
    return [base, col ? t("desc_color", { c: col.toLowerCase() }) : "", who, t("desc_original")].filter(Boolean).join(" ");
  }

  function card(p) {
    const flag = p.tags.includes("new") ? t("flag_new") : "";
    const sp = CFG.split && CFG.split.parts > 1 ? Math.ceil(p.price / CFG.split.parts / 100) * 100 : 0;
    return `<div class="card">
      <a class="card-link" href="#p-${esc(p.id)}">
        <div class="card-art-wrap">${media(p, "card-art")}${p.salePct ? `<span class="sale-badge">−${p.salePct}%</span>` : ""}${flag ? `<span class="flag${p.tags.includes("new") ? "" : " flag-hit"}">${flag}</span>` : ""}</div>
        ${flag ? `<span class="card-label">${flag}</span>` : ""}
        <span class="card-brand">${esc(p.brand)}</span>
        <span class="card-name"><span class="cn-brand">${esc(p.brand)} </span>${esc(p.name)}</span>
        <span class="card-price${p.oldPrice ? " is-sale" : ""}">${hasSizePrices(p) ? `<small class="from">${state.lang === "ru" ? "от" : "from"}</small> ` : ""}${money(p.price)}${p.oldPrice ? ` <s>${money(p.oldPrice)}</s>` : ""}</span>
        ${sp ? `<span class="card-split"><span class="split-chip">${money(sp)} × ${CFG.split.parts}</span><span class="split-word">${t("split_word")}</span></span>` : ""}
        <span class="card-days">${ICON_GEM}${t("days_short", { days: CFG.deliveryDays })}</span>
      </a>
      ${favBtn(p)}
    </div>`;
  }

  function field(id, label, control) {
    return `<div class="field"><label for="${id}">${label}</label>${control}<span class="field-err" id="${id}Err" hidden></span></div>`;
  }

  function stepsHtml() {
    return `<ol class="steps">${[1, 2, 3, 4].map(n => `<li class="step"><span class="step-n">0${n}</span><h3>${t("how_" + n + "_t")}</h3><p>${t("how_" + n + "_d", { days: CFG.deliveryDays })}</p></li>`).join("")}</ol>`;
  }

  function sendPanel(text, subject) {
    const c = CFG.contacts;
    return `<div class="send">
      <pre class="order-text" id="sendText" tabindex="0">${esc(text)}</pre>
      <div class="send-actions">
        <button class="btn btn-tag" type="button" data-action="copy" data-target="sendText">${ICON.copy}${t("copy")}</button>
        <a class="btn btn-primary" href="${esc(tgUrl(text))}" target="_blank" rel="noopener">${ICON.send}${t("send_tg")}</a>
        <a class="btn btn-ghost" href="${esc(mailUrl(subject, text))}">${ICON.mail}${t("send_mail")}</a>
      </div>
      <p class="small muted" id="copyMsg" role="status"></p>
      <p class="small">${t("send_hint")}</p>
      <ul class="clist">
        <li>Telegram: <span class="sel">@${esc(c.telegram)}</span></li>
        <li>${t("email")}: <span class="sel">${esc(c.email)}</span></li>
        <li>${t("phone")}: <span class="sel">${esc(c.phoneDisplay)}</span></li>
      </ul>
    </div>`;
  }

  /* Shell */

  function renderShell() {
    document.documentElement.lang = state.lang;
    const c = CFG.contacts;
    $("#app").innerHTML = `
      <div class="appbar" id="appbar">
        <span class="appbar-ico" aria-hidden="true">${LOGO_MARK}</span>
        <span class="appbar-t"><b>${state.lang === "ru" ? "Установите приложение" : "Install the app"}</b><span>${state.lang === "ru" ? "Там быстрее, удобнее и всё под рукой" : "One tap from your home screen"}</span></span>
        <button type="button" class="appbar-soon appbar-install" id="appInstall">${state.lang === "ru" ? "Установить" : "Install"}</button>
      </div>
      <header class="hdr">
        <div class="wrap hdr-row">
          <a class="menubtn" href="#shop" data-action="drawer-open" aria-label="${t("menu")}" aria-controls="drawer" aria-expanded="false"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></a>
          <a class="logo" href="#home" aria-label="${esc(CFG.brand)}, ${t("home")}">${logoHtml()}</a>
          <nav class="hdr-links" aria-label="${t("nav_label")}">
            <a href="#delivery" class="hl-m">${state.lang === "ru" ? "Оплата" : "Payment"}</a>
            <a href="#brands" class="hl-m">${t("nav_brands")}</a>
            <a href="#contacts" class="hl-m">${state.lang === "ru" ? "Помощь" : "Help"}</a>
            <a href="#sale" class="hl-sale">${t("nav_sale")}</a>
            <a href="#brands">${t("nav_brands")}</a>
            <a href="#delivery">${t("del_short")}</a>
            <a href="#catalog">${t("nav_wear")}</a>
            <a href="#catalog-shoes">${t("cat_shoes")}</a>
            <a href="#catalog-acc">${t("dept_acc")}</a>
            <a href="#catalog" data-action="collection" data-sort="new">${t("fresh")}</a>
          </nav>
          <form class="search" id="searchForm" role="search">
            <input id="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="${t("search_ph")}" aria-label="${t("search_ph")}" value="${esc(state.filters.q)}">
            <button type="submit" aria-label="${t("search")}">${ICON.search}</button>
          </form>
          <div class="hdr-tools">
            <a class="cartbtn" href="#cart" aria-label="${t("cart")}">${ICON.bag}<span class="cart-count" id="cartCount" hidden></span></a>
            <a class="profbtn" href="#account" aria-label="${t("tab_account")}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M5 20c1.3-3.6 4-5.4 7-5.4s5.7 1.8 7 5.4"/></svg></a>
          </div>
        </div>
        <nav class="wrap nav" aria-label="${t("nav_label")}">${NAV.map(([h, k]) => `<a href="#${h}" data-nav="${h}">${t(k)}</a>`).join("")}</nav>
      </header>
      
      <div class="drawer" id="drawer" hidden>
        <div class="drawer-back" data-action="drawer-close"></div>
        <nav class="drawer-panel" role="dialog" aria-modal="true" aria-label="${t("menu")}">
          <div class="drawer-head">
            <a class="logo drawer-logo" href="#home" data-action="drawer-close">${logoHtml()}</a>
            <button type="button" class="drawer-x" data-action="drawer-close" aria-label="${t("close")}"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
          </div>
          <ul class="drawer-list">
            ${(() => {
              const I = {
                home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
                shop: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
                fav: '<path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.6 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.4 3.1 4.2 6.3C19.5 15.4 12 20 12 20z"/>',
                user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M5 20c1.3-3.6 4-5.4 7-5.4s5.7 1.8 7 5.4"/>',
                cart: '<path d="M2.5 3.5h2.3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1l1.6-6.8H6.1"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
                sale: '<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
                brands: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
                shoe: '<path d="M3 15c0-2 1-3 3-3l4-.5c1.5-1.8 2.7-3.5 4-4.5l1.5 2c1.5 1.5 3.5 2.5 5.5 3v3H3Z"/><path d="M3 15v3h18v-3"/>',
                wear: '<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0Z"/>',
                acc: '<circle cx="12" cy="13" r="6"/><path d="M9 7.5 10 3h4l1 4.5M9 18.5 10 21h4l1-2.5"/>',
                new: '<path d="m12 3 2.2 5.6L20 9.3l-4.4 3.9 1.3 5.8L12 16l-4.9 3 1.3-5.8L4 9.3l5.8-.7Z"/>',
                box: '<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/>',
                truck: '<path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
                card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
                help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'
              };
              const row = ([h, k, ic, cls, sort]) => `<li><a href="${h}" class="${cls || ""}" data-action="drawer-close"${sort ? ` data-sort="${sort}"` : ""}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[ic]}</svg><span>${t(k)}</span></a></li>`;
              const groups = [
                [["#home", "tab_home", "home"], ["#shop", "tab_shop", "shop"], ["#favorites", "nav_favs", "fav"], ["#account", "tab_account", "user"], ["#cart", "cart", "cart"]],
                [["#sale", "nav_sale", "sale", "dl-sale"], ["#brands", "nav_brands", "brands"], ["#catalog-shoes", "cat_shoes", "shoe"], ["#catalog", "nav_wear", "wear"], ["#catalog-acc", "dept_acc", "acc"], ["#catalog", "fresh", "new", "", "new"]],
                [["#orders", "nav_orders", "box"], ["#delivery", "del_short", "truck"], ["#delivery", "dr_pay", "card"], ["#contacts", "dr_help", "help"]]
              ];
              return groups.map(g => g.map(row).join("")).join('<li class="dl-sep" aria-hidden="true"></li>');
            })()}
          </ul>
        </nav>
      </div>
      <main id="main"></main>
      <footer class="ftr">
        <div class="wrap ftr-grid">
          <div class="ftr-brand"><a class="logo" href="#home" aria-label="${esc(CFG.brand)}">${logoHtml()}</a><p>${t("footer_tagline")}</p>${CFG.logoDevToken ? `<p class="ftr-credit"><a href="https://logo.dev" target="_blank" rel="noopener">Logos provided by Logo.dev</a></p>` : ""}</div>
          <div>
            <h2 class="ftr-h">${t("footer_shop")}</h2>
            <ul>
              <li><a href="#catalog">${t("nav_catalog")}</a></li>
              <li><a href="#brands">${t("nav_brands")}</a></li>
              <li><a href="#link">${t("nav_link")}</a></li>
              <li><a href="#orders">${t("nav_orders")}</a></li>
              <li><a href="#delivery">${t("nav_delivery")}</a></li>
              <li><a href="#contacts">${t("nav_contacts")}</a></li>
            </ul>
          </div>
          <div>
            <h2 class="ftr-h">${t("nav_contacts")}</h2>
            <ul>
              <li><a href="${esc(tgUrl())}" target="_blank" rel="noopener">Telegram @${esc(c.telegram)}</a></li>
              <li><span class="sel">${esc(c.email)}</span></li>
              <li><span class="sel">${esc(c.phoneDisplay)}</span></li>
            </ul>
          </div>
        </div>
        <div class="wrap ftr-bottom">© ${new Date().getFullYear()} ${esc(CFG.brand)}</div>
      </footer>
      <nav class="tabbar" aria-label="${t("nav_label")}">
        ${[
          ["home", "tab_home", '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>'],
          ["shop", "tab_shop", '<path d="M4 7h16M4 12h16M4 17h16"/>'],
          ["favorites", "nav_favs", '<path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.6 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.4 3.1 4.2 6.3C19.5 15.4 12 20 12 20z"/>'],
          ["account", "tab_account", '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>']
        ].map(([h, k, d]) => `<a href="#${h}" class="tab" data-tab="${h}"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${d}</svg><span>${t(k)}</span></a>`).join("")}
      </nav>
      <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
      <div class="sov sov2" id="sov" role="dialog" aria-modal="true" aria-label="${t("search")}" hidden>
        <div class="sov2-back" data-action="sov-close"></div>
        <div class="sov2-card">
          <form class="sov2-top" id="sovForm" role="search">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#6B6B6B" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4" stroke-linecap="round"/></svg>
            <input id="sovQ" type="search" autocomplete="off" enterkeyhint="search" aria-label="${t("search")}" placeholder="${state.lang === "ru" ? "Название, бренд или артикул" : "Name, brand or article"}">
            <button type="button" class="sov-clear" id="sovClear" aria-label="${t("reset")}" hidden>×</button>
          </form>
          <div class="sov2-body" id="sovBody"></div>
        </div>
      </div>`;

    const q = $("#q");
    q.readOnly = true;
    q.addEventListener("click", () => openSearch());
    q.addEventListener("focus", () => openSearch());
    $("#searchForm").addEventListener("submit", e => { e.preventDefault(); openSearch(); });
    updateCartCount();
    const setH = () => { const h = $(".hdr"); if (h) document.documentElement.style.setProperty("--hdrh", h.offsetHeight + "px"); };
    setH(); window.addEventListener("resize", setH);
  }

  // ---------- full-screen search ----------
  let sovGender = "men";
  const recent = () => { const r = storage.get("gd_recent", []); return Array.isArray(r) ? r.filter(x => typeof x === "string") : []; };
  function openSearch() {
    const ov = $("#sov");
    if (!ov || !ov.hidden) return;
    sovGender = state.filters.gender !== "all" ? state.filters.gender : (state.homeGender || "men");
    ov.hidden = false;
    document.body.classList.add("noscroll");
    const inp = $("#sovQ");
    inp.value = state.filters.q || "";
    drawSearch();
    const hq = $("#q"); if (hq) hq.blur();
  }
  function closeSearch() {
    const ov = $("#sov");
    if (!ov || ov.hidden) return;
    ov.hidden = true;
    document.body.classList.remove("noscroll");
    const hq = $("#q"); if (hq) hq.blur();
  }
  function doSearch(text) {
    const v = String(text || "").trim();
    if (v) storage.set("gd_recent", [v].concat(recent().filter(x => x.toLowerCase() !== v.toLowerCase())).slice(0, 10));
    Object.assign(state.filters, { q: v, gender: sovGender, brand: "all", color: "all", size: "all", price: "all", tier: "all" });
    const hq = $("#q"); if (hq) hq.value = v;
    closeSearch();
    state.sf = null;
    location.hash = "search=" + encodeURIComponent(v);
  }
  function drawSearch() {
    const inp = $("#sovQ"), body = $("#sovBody");
    $$(".sov-tab").forEach(b => b.setAttribute("aria-selected", String(b.dataset.g === sovGender)));
    const v = inp.value.trim().toLowerCase();
    $("#sovClear").hidden = !v;
    const CLOCK = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>`;
    const ARROW = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`;
    const head = (title, extra) => `<div class="sov-h"><h2>${title}</h2>${extra || ""}</div>`;
    const mark = name => `<span class="sov-mono" aria-hidden="true">${esc(name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase())}</span>`;
    if (!v) {
      const r = recent().slice(0, 5);
      const TREND = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#6B6B6B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>`;
      const pop = ["nike", "new balance", "adidas", "jordan", "asics", "timberland", "nike air", "stone island"];
      body.innerHTML =
        (r.length ? `<div class="sov2-h"><span>${state.lang === "ru" ? "Вы искали" : "Recent"}</span><button type="button" class="sov2-clr" data-action="sov-clear-all">${t("sov_clear")}</button></div>` +
          r.map(x => `<button type="button" class="sov2-row" data-action="sov-pick" data-q="${esc(x)}"><span class="sov2-ico">${CLOCK.replace('width="20" height="20"', 'width="22" height="22"')}</span><span>${esc(x)}</span></button>`).join("") : "") +
        `<div class="sov2-h"><span>${state.lang === "ru" ? "Часто ищут" : "Popular"}</span></div>` +
        pop.map(x => `<button type="button" class="sov2-row" data-action="sov-pick" data-q="${esc(x)}"><span class="sov2-ico">${TREND}</span><span>${esc(x)}</span></button>`).join("");
      return;
    }
    const fits = () => true;
    const brands = BRANDS.filter(b => b.name.toLowerCase().includes(v)).slice(0, 2);
    const prods = PRODUCTS.filter(p => fits(p) && (p.brand + " " + p.name).toLowerCase().includes(v)).slice(0, 4);
    body.innerHTML =
      (brands.length ? head(t("nav_brands")) + `<div class="sov-list">${brands.map(b => `<button type="button" class="sov-item" data-action="brand" data-brand="${esc(b.name)}" data-g="all">${mark(b.name)}<span class="sov-txt"><b>${esc(b.name)}</b><small>${plural(b.count, "items")}</small></span><span class="sov-go">${ARROW}</span></button>`).join("")}</div>` : "") +
      (prods.length ? head(t("sov_items")) + `<div class="sov-list">${prods.map(p => `<a class="sov-item" href="#p-${esc(p.id)}">${media(p, "sov-thumb")}<span class="sov-txt"><b>${esc(p.brand)} ${esc(p.name)}</b><small>${money(p.price)}</small></span><span class="sov-go">${ARROW}</span></a>`).join("")}</div>` : "") +
      (!brands.length && !prods.length ? `<div class="sov-none"><b>${t("sov_none")}</b><span>${t("sov_try")}</span></div>` : "") +
      (brands.length || prods.length ? `<button type="button" class="sov-all" data-action="sov-pick" data-q="${esc(inp.value.trim())}">${t("sov_show_all", { q: inp.value.trim() })}</button>` : "");
  }
  document.addEventListener("input", e => { if (e.target && e.target.id === "sovQ") drawSearch(); });
  document.addEventListener("submit", e => { if (e.target && e.target.id === "sovForm") { e.preventDefault(); doSearch($("#sovQ").value); } });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSearch(); });
  document.addEventListener("click", e => { if (e.target && e.target.id === "sovClear") { $("#sovQ").value = ""; drawSearch(); } });

  function updateCartCount() {
    const el = $("#cartCount");
    if (!el) return;
    const n = count();
    el.textContent = n;
    el.hidden = n === 0;
    const tc = null;
    if (tc) { tc.textContent = n; tc.hidden = n === 0; }
  }

  let toastTimer;
  function toast(msg, link) {
    const el = $("#toast");
    if (!el) return;
    el.innerHTML = `<span>${esc(msg)}</span>${link ? `<a href="${link.href}">${esc(link.label)}</a>` : ""}`;
    el.hidden = false;
    el.classList.remove("toast-out", "toast-in"); void el.offsetWidth; el.classList.add("toast-in");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("toast-in"); el.classList.add("toast-out");
      toastTimer = setTimeout(() => { el.hidden = true; el.classList.remove("toast-out"); }, 260);
    }, 3000);
  }

  /* Router */

  function onRoute() {
    closeSearch();
    if (location.hash.startsWith("#tgAuthResult=")) { finishTelegramLogin(location.hash.slice(14)); return; }
    const hash = decodeURIComponent(location.hash.slice(1)) || "home";
    state.route = hash;
    const tabOf = hash === "home" ? "home"
      : (hash === "shop" || hash.startsWith("search=") || hash === "catalog" || hash.startsWith("catalog-") || hash.startsWith("p-") || hash === "brands" || hash === "sale" || hash.startsWith("brand-") || hash === "link") ? "shop"
      : hash === "favorites" ? "favorites"
      : (hash === "account" || hash === "addresses" || hash === "orders" || hash.startsWith("order-") || hash === "delivery" || hash === "contacts") ? "account" : "";
    $$(".tab").forEach(a => { if (a.dataset.tab === tabOf) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    document.body.classList.toggle("on-pdp2", hash.startsWith("p-"));
    const withSearch = hash.startsWith("search=") || hash === "home" || hash === "shop" || hash === "catalog" || hash.startsWith("catalog-") || hash.startsWith("brand-");
    document.body.classList.toggle("no-search", !withSearch);
    document.body.classList.toggle("is-sale", hash === "sale");
    requestAnimationFrame(() => { const h = $(".hdr"); if (h) document.documentElement.style.setProperty("--hdrh", h.offsetHeight + "px"); });
    clearInterval(sliderTimer);
    cancelAnimationFrame(sliderRaf);
    clearInterval(adTimer);
    if (revealObs) { revealObs.disconnect(); revealObs = null; }
    state.showSlide = null;

    const exactNav = NAV.some(([h]) => h === hash);
    $$("[data-nav]").forEach(a => {
      const h = a.dataset.nav;
      const on = h === hash || (h === "catalog" && !exactNav && (hash === "catalog" || hash.startsWith("catalog-")));
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    let view;
    if (hash === "home") view = viewHome();
    else if (hash === "catalog" || hash.startsWith("catalog-")) view = viewCatalog(hash);
    else if (hash.startsWith("p-")) view = viewProduct(hash.slice(2));
    else if (hash === "cart") view = viewCart();
    else if (hash === "checkout") view = viewCheckout();
    else if (hash === "done") view = viewDone();
    else if (hash === "brands") view = viewBrands();
    else if (hash === "sale") view = viewSale();
    else if (hash.startsWith("brand-")) view = viewBrand(hash.slice(6));
    else if (hash === "orders") view = viewOrders();
    else if (hash === "shop") view = viewShop();
    else if (hash === "account") view = viewAccount();
    else if (hash === "addresses") view = viewAddresses();
    else if (hash.startsWith("search=")) view = viewSearch(hash.slice(7));
    else if (hash === "addr-new" || hash.startsWith("addr-edit-")) view = viewAddrForm(hash === "addr-new" ? -1 : Number(hash.slice(10)));
    else if (hash === "favorites") view = viewFavs();
    else if (hash.startsWith("order-")) view = viewOrder(hash.slice(6));
    else if (hash === "admin" && CFG.adminPage) view = viewAdmin();
    else if (hash === "link") view = viewLink();
    else if (hash === "delivery") view = viewDelivery();
    else if (hash === "contacts") view = viewContacts();
    else if (hash === "pricing" && CFG.pricingPage) view = viewPricing();
    else view = viewNotFound();

    const main = $("#main");
    const oldOn = $(".ptabs .ptab.is-on", main), oldBar = oldOn && oldOn.parentNode;
    const prevTab = oldOn ? { left: oldOn.offsetLeft, width: oldOn.offsetWidth, scroll: oldBar.scrollLeft } : null;
    main.innerHTML = view.html;
    document.title = view.title ? view.title + " · " + CFG.brand : CFG.brand;
    if (view.mount) view.mount(main);
    const ptOn = $(".ptab.is-on", main);
    if (ptOn) {
      // lime pill that slides from the previous tab to the new one, no page "reload" feel
      const bar = ptOn.parentNode;
      const target = Math.max(0, ptOn.offsetLeft - (bar.clientWidth - ptOn.offsetWidth) / 2);
      const ind = document.createElement("span"); ind.className = "ptab-ind"; bar.prepend(ind);
      const place = (l, w) => { ind.style.transform = `translateX(${l}px)`; ind.style.width = w + "px"; };
      if (prevTab) {
        bar.scrollLeft = prevTab.scroll; ind.classList.add("no-anim"); place(prevTab.left, prevTab.width);
        void ind.offsetWidth; ind.classList.remove("no-anim");
        requestAnimationFrame(() => { place(ptOn.offsetLeft, ptOn.offsetWidth); bar.scrollTo({ left: target, behavior: "smooth" }); });
        main.classList.remove("tab-fade"); void main.offsetWidth; main.classList.add("tab-fade");
      } else { bar.scrollLeft = target; ind.classList.add("no-anim"); place(ptOn.offsetLeft, ptOn.offsetWidth); }
    }
    setupReveal(main);
    if (!state.keepScroll) window.scrollTo(0, 0);
    state.keepScroll = false;
  }

  function setupReveal(root) {
    const els = $$(".tile, .step", root);
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); revealObs && revealObs.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--d", (i % 6) * 60 + "ms");
      revealObs.observe(el);
    });
  }

  function rerender() {
    state.keepScroll = true;
    state.keepFilters = true;
    onRoute();
  }

  function navigate(hash) {
    if (location.hash === "#" + hash) onRoute();
    else location.hash = hash;
  }

  /* Views */

  function mosaicSpans(n) {
    const spans = Array.from({ length: n }, () => ({ c: 2, r: 1, mc: 2, mr: 1 }));
    const fill = (start, perRow, cols, key) => {
      const left = n - start;
      if (left <= 0) return;
      const rows = Math.ceil(left / perRow);
      let idx = start;
      for (let r = 0; r < rows; r++) {
        const k = Math.floor(left / rows) + (r < left % rows ? 1 : 0);
        const base = Math.floor(cols / k), extra = cols - base * k;
        for (let j = 0; j < k; j++) spans[idx++][key] = base + (j < extra ? 1 : 0);
      }
    };
    const featDesktop = n >= 4 ? [[2, 2], [2, 2], [2, 1], [2, 1]] : [];
    featDesktop.forEach(([c, r], k) => { spans[k].c = c; spans[k].r = r; });
    fill(featDesktop.length, 3, 6, "c");
    const featPhone = n >= 3 ? [[2, 2], [2, 1], [2, 1]] : [];
    featPhone.forEach(([c, r], k) => { spans[k].mc = c; spans[k].mr = r; });
    fill(featPhone.length, 2, 4, "mc");
    return spans;
  }

  function viewHome() {
    const g = state.homeGender;
    const pool = PRODUCTS.filter(p => p.gender === g || p.gender === "unisex");
    const hits = pool.filter(p => p.tags.includes("hit"));
    const fresh = pool.filter(p => p.tags.includes("new"));
    const heroItems = (hits.length >= 3 ? hits : pool).slice(0, 3);
    const brands = Array.from(new Set(pool.map(p => p.brand))).sort((a, b) => a.localeCompare(b));
    const cats = CATS.filter(c => pool.some(p => p.category === c));
    const spans = mosaicSpans(cats.length);
    const minPrice = c => Math.min.apply(null, pool.filter(p => p.category === c).map(p => p.price));
    const example = pool.find(p => p.category === "shoes") || pool[0];

    const htag = p => `<a class="htag" href="#p-${esc(p.id)}">
        ${media(p, "htag-art", true)}
        <span class="htag-brand">${esc(p.brand)}</span>
        <span class="htag-name">${esc(p.name)}</span>
        <span class="htag-price">${money(p.price)}</span>
      </a>`;

    const SNEAKER = `<svg class="app-shoe" viewBox="0 0 360 170" aria-hidden="true">
        <defs>
          <linearGradient id="gdUpper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#ECEDEA"/></linearGradient>
          <linearGradient id="gdSole" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4E5E1"/></linearGradient>
        </defs>
        <ellipse cx="182" cy="158" rx="160" ry="7" fill="rgba(0,0,0,.10)"/>
        <!-- upper -->
        <path d="M30 118 C28 98 40 86 62 82 L118 74 C132 58 150 44 176 40 L206 40 C214 60 234 74 262 82 C298 92 328 100 334 118 L334 126 L30 126 Z" fill="url(#gdUpper)" stroke="#2A2F2B" stroke-width="2.4" stroke-linejoin="round"/>
        <!-- toe cap panel -->
        <path d="M30 118 C30 100 42 90 64 86 L96 82 C88 96 86 110 90 124 L30 126 Z" fill="#F7F7F4" stroke="#2A2F2B" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- heel panel + lime pull tab -->
        <path d="M262 82 C292 90 324 98 334 116 L334 126 L270 126 C262 112 258 96 262 82 Z" fill="#F7F7F4" stroke="#2A2F2B" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M318 96 L332 92 L336 112 L326 114 Z" fill="#BDFF14" stroke="#2A2F2B" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- side panel: plain G&D-style lime band (own design, no logo) -->
        <path d="M112 112 C150 100 200 96 252 104" fill="none" stroke="#BDFF14" stroke-width="7" stroke-linecap="round"/>
        <!-- eyestay + laces -->
        <path d="M150 52 C166 74 196 86 232 90" fill="none" stroke="#2A2F2B" stroke-width="1.8"/>
        <g fill="#2A2F2B"><circle cx="160" cy="58" r="2.2"/><circle cx="172" cy="68" r="2.2"/><circle cx="186" cy="76" r="2.2"/><circle cx="202" cy="82" r="2.2"/></g>
        <g stroke="#2A2F2B" stroke-width="3.2" stroke-linecap="round"><path d="M146 66 L164 56"/><path d="M156 76 L176 66"/><path d="M168 84 L190 74"/><path d="M182 90 L204 80"/></g>
        <!-- toe perforation -->
        <g fill="#B8BAB5"><circle cx="48" cy="104" r="1.4"/><circle cx="56" cy="100" r="1.4"/><circle cx="64" cy="97" r="1.4"/><circle cx="52" cy="110" r="1.4"/><circle cx="60" cy="106" r="1.4"/><circle cx="68" cy="103" r="1.4"/><circle cx="76" cy="100" r="1.4"/></g>
        <!-- stitching -->
        <path d="M36 120 C40 104 52 94 70 90" fill="none" stroke="#9A9D98" stroke-width="1.2" stroke-dasharray="3 3"/>
        <path d="M266 86 C262 98 264 112 272 122" fill="none" stroke="#9A9D98" stroke-width="1.2" stroke-dasharray="3 3"/>
        <!-- tongue -->
        <path d="M176 40 C172 30 182 24 196 26 C206 28 210 34 206 40 Z" fill="#F7F7F4" stroke="#2A2F2B" stroke-width="2" stroke-linejoin="round"/>
        <!-- sole -->
        <path d="M22 126 H342 Q350 126 348 136 Q346 150 332 150 H34 Q18 150 18 138 Q18 126 22 126 Z" fill="url(#gdSole)" stroke="#2A2F2B" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M26 134 H342" fill="none" stroke="#B8BAB5" stroke-width="1.2"/>
        <path d="M30 143 H338" fill="none" stroke="#B8BAB5" stroke-width="1" stroke-dasharray="2 4"/>
      </svg>`;
    const PHONE = `<div class="app-phone" aria-hidden="true">
        <div class="app-notch"></div>
        <div class="app-status"><span>9:41</span><span class="app-bars"></span></div>
        <div class="app-back">‹</div>
        ${SNEAKER}
        <div class="app-meta"><span class="app-chip">GD</span><span class="app-line"></span><span class="app-line short"></span></div>
      </div>`;
    const L = (r, e) => (state.lang === "ru" ? r : e);
    const FRAME = `<span class="ps-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
    const slides = [{
      cls: "pslide pslide-buyer",
      body: `<div class="ps-text">
          <span class="ps-eyebrow">${L("Запустили байер-сервис", "Buyer service is live")}</span>
          <h2>${L("Привезём <em>любой</em> товар по скрину или ссылке", "We’ll bring <em>any</em> item from a screenshot or link")}</h2>
          <a class="ps-btn" href="#link">${L("Подробнее", "Learn more")}</a>
        </div>
        <div class="ps-pic ps-pic-dark">${SNEAKER}${FRAME}</div>`
    }, {
      cls: "pslide pslide-app",
      body: `<div class="ps-text">
          <span class="ps-eyebrow">${L("Скоро · iOS и Android", "Soon · iOS & Android")}</span>
          <h2>${L("Мобильное приложение <em>G&amp;Dllars</em>", "The <em>G&amp;Dllars</em> mobile app")}</h2>
          <span class="ps-btn ps-btn-soft">${L("Скоро", "Soon")}</span>
        </div>
        <div class="ps-pic ps-pic-lime">${PHONE}</div>`
    }];

    const slideHtml = slides.map((s, i) => `<div class="slide ${s.cls}${i === 0 ? " is-on" : ""}" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${slides.length}"${i ? ' aria-hidden="true"' : ""}><div class="slide-grid">${s.body}</div></div>`).join("");
    const dots = slides.length > 1
      ? `<div class="dots">${slides.map((_, i) => `<button type="button" class="dot" data-action="slide" data-i="${i}" aria-label="${t("slide_n", { n: i + 1 })}" aria-current="${i === 0}"></button>`).join("")}</div>`
      : "";

    const html = `
      <div class="wrap">
        <div class="gswitch">
          <div class="seg seg-lg" role="group" aria-label="${t("home_for")}">
            ${["men", "women"].map(x => `<button type="button" data-action="home-gender" data-g="${x}" aria-pressed="${g === x}">${t("home_" + x)}</button>`).join("")}
          </div>
        </div>
        <section class="promo" aria-roledescription="carousel" aria-label="${t("promo_label")}">
          <div class="slides">${slideHtml}</div>
          ${dots}
        </section>
      </div>

      ${(() => {
        const inPool = new Set(pool.map(p => p.brand)); const top = BRANDS.filter(b => inPool.has(b.name))
          .sort((a, b) => (b.popular - a.popular) || (b.count - a.count)).slice(0, 14);
        if (!top.length) return "";
        return `<section class="sec hsec"><div class="wrap">
          <div class="hsec-head"><h2>${t("brands_title")}</h2><a class="pill-more" href="#brands">${t("see_all")} <span aria-hidden="true">›</span></a></div>
          <div class="brail">${top.map(b => `<button type="button" class="btile" data-action="brand" data-brand="${esc(b.name)}">
            <span class="btile-box">${CFG.logoDevToken || b.logo ? brandLogo(b.name, "", true) : `<span class="btile-word">${esc(b.name)}</span>`}</span>
            <span class="btile-name">${esc(b.name)}</span>
          </button>`).join("")}</div>
        </div></section>`;
      })()}

      ${["shoes", "hoodies", "tshirts", "pants", "jackets", "shorts"].map(c => {
        const list = pool.filter(p => p.category === c);
        if (!list.length) return "";
        const sorted = list.slice().sort((a, b) => (b.tags.includes("hit") - a.tags.includes("hit")) || a.order - b.order).slice(0, 12);
        return `<section class="sec hsec"><div class="wrap">
          <div class="hsec-head"><h2>${catName(c)}</h2><a class="pill-more" href="#catalog-${c}" data-action="prefilter" data-g="${g}">${t("see_all")} <span aria-hidden="true">›</span></a></div>
          <div class="rail">${sorted.map(card).join("")}</div>
        </div></section>`;
      }).join("")}

      ${(() => {
        const acc = PRODUCTS.filter(p => ACC.includes(p.category));
        if (!acc.length) return "";
        const subs = ACC.filter(c => acc.some(p => p.category === c));
        return `<section class="sec hsec dept"><div class="wrap">
          <div class="dept-box">
            <div class="hsec-head"><h2>${t("dept_acc")}</h2><a class="pill-more" href="#catalog-acc">${t("see_all")} <span aria-hidden="true">›</span></a></div>
            <div class="chips dept-chips">${subs.map(c => `<a class="chip" href="#catalog-${c}">${catName(c)} <span class="chip-n">${acc.filter(p => p.category === c).length}</span></a>`).join("")}</div>
            <div class="rail">${acc.slice().sort((a, b) => (b.tags.includes("hit") - a.tags.includes("hit")) || a.order - b.order).slice(0, 12).map(card).join("")}</div>
          </div>
        </div></section>`;
      })()}

      ${fresh.length ? `<section class="sec hsec"><div class="wrap">
        <div class="hsec-head"><h2>${t("fresh")}</h2><a class="pill-more" href="#catalog" data-action="prefilter" data-sort="new" data-g="${g}">${t("see_all")} <span aria-hidden="true">›</span></a></div>
        <div class="rail">${fresh.slice(0, 12).map(card).join("")}</div>
      </div></section>` : ""}

      <div class="home-end"></div>`;

    return {
      html,
      title: "",
      mount(root) {
        const track = $(".ads-track", root);
        if (track) {
          const adDots = $$(".ads-dots .dot", root);
          const cards = $$(".ad-card", track);
          let ai = 0, adPaused = false;
          const go = n => {
            ai = (n + cards.length) % cards.length;
            track.scrollTo({ left: cards[ai].offsetLeft - track.offsetLeft, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          };
          state.adGo = go;
          track.addEventListener("scroll", () => {
            const x = track.scrollLeft;
            let best = 0;
            cards.forEach((c, k) => { if (Math.abs(c.offsetLeft - track.offsetLeft - x) < Math.abs(cards[best].offsetLeft - track.offsetLeft - x)) best = k; });
            ai = best;
            adDots.forEach((d, k) => d.setAttribute("aria-current", String(k === best)));
            cards.forEach((c, k) => c.classList.toggle("is-on", k === best));
          }, { passive: true });
          cards[0] && cards[0].classList.add("is-on");
          ["pointerenter", "focusin", "touchstart"].forEach(ev => track.addEventListener(ev, () => { adPaused = true; }, { passive: true }));
          ["pointerleave", "focusout", "touchend"].forEach(ev => track.addEventListener(ev, () => { adPaused = false; }, { passive: true }));
          if (cards.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
            adTimer = setInterval(() => { if (!adPaused && !document.hidden) go(ai + 1); }, 4000);
          }
        }

        const slideEls = $$(".slide", root);
        const dotEls = $$(".slides ~ .dots .dot", root);
        if (slideEls.length < 2) return;
        let current = 0;
        const show = n => {
          current = (n + slideEls.length) % slideEls.length;
          slideEls.forEach((s, k) => {
            s.classList.toggle("is-on", k === current);
            if (k === current) s.removeAttribute("aria-hidden");
            else s.setAttribute("aria-hidden", "true");
          });
          dotEls.forEach((d, k) => d.setAttribute("aria-current", String(k === current)));
        };
        state.showSlide = show;

        const promo = $(".promo", root);
        let paused = false;
        promo.addEventListener("mouseenter", () => { paused = true; });
        promo.addEventListener("mouseleave", () => { paused = false; });
        promo.addEventListener("focusin", () => { paused = true; });
        promo.addEventListener("focusout", () => { paused = false; });

        let startX = null;
        promo.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
        promo.addEventListener("touchend", e => {
          if (startX === null) return;
          const dx = e.changedTouches[0].clientX - startX;
          startX = null;
          if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
        });

        // 7-second slides; the active dot fills up while the slide is shown (pauses on hover)
        const SLIDE_MS = 7000;
        let elapsed = 0, last = performance.now(), seen = current;
        const tick = now => {
          const dt = Math.min(now - last, 100); last = now;
          if (current !== seen) { seen = current; elapsed = 0; }
          if (!paused && !document.hidden) {
            elapsed += dt;
            if (elapsed >= SLIDE_MS) { elapsed = 0; show(current + 1); seen = current; }
          }
          $$(".dot", root).forEach(d => d.style.setProperty("--p", d.getAttribute("aria-current") === "true" ? Math.min(1, elapsed / SLIDE_MS).toFixed(3) : 0));
          sliderRaf = requestAnimationFrame(tick);
        };
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) sliderRaf = requestAnimationFrame(tick);
      }
    };
  }

  function brandsFor(cat) {
    return Array.from(new Set(PRODUCTS.filter(p => cat === "all" || p.category === cat).map(p => p.brand)))
      .sort((a, b) => a.localeCompare(b));
  }

  const BRANDS = (function () {
    const list = (window.GD_BRANDS || []).map(b => Object.assign({}, b));
    const known = new Set(list.map(b => b.name));
    PRODUCTS.forEach(p => { if (!known.has(p.brand)) { known.add(p.brand); list.push({ name: p.brand, popular: false, premium: false, group: "fashion" }); } });
    const agg = {};
    PRODUCTS.forEach(p => { const a = agg[p.brand] || (agg[p.brand] = { n: 0, min: Infinity }); a.n++; if (p.price < a.min) a.min = p.price; });
    list.forEach(b => { const a = agg[b.name]; b.count = a ? a.n : 0; b.from = a ? a.min : null; });
    // Only brands that have items in the catalog are shown.
    return list.filter(b => b.count > 0).sort((a, b) => a.name.localeCompare(b.name, "en"));
  })();
  const brandLetter = name => {
    const ch = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").charAt(0).toUpperCase();
    return /[A-Z]/.test(ch) ? ch : "#";
  };

  const ICO_GRID = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>`;
  const ICO_FIRE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 2.6-5 3.4-8.4 1.6 1.2 2.2 2.8 2.2 4.2 1-.6 1.8-1.8 2-3.2 2 1.6 4.4 4.2 4.4 7.4 0 3.2-2.4 5.6-6 5.6Z"/><path d="M12 21c-1.5 0-2.6-1-2.6-2.5 0-1.6 1.3-2.4 2.1-3.8 1.4 1 3.1 2.2 3.1 3.8 0 1.5-1.1 2.5-2.6 2.5Z"/></svg>`;
  const ICO_CROWN = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 8l4 4 4-6 4 6 4-4-1.6 10H5.6L4 8Z"/><path d="M6 20.5h12"/></svg>`;

  function brandLogo(name, cls, eager) {
    const local = (window.BRAND_LOGOS_LOCAL || {})[name] || ((window.GD_BRANDS || []).find(b => b.name === name) || {}).logo;
    const dom = (window.GD_BRAND_DOMAINS || {})[name];
    const tok = CFG.logoDevToken;
    const src = local || (tok && dom ? `https://img.logo.dev/${encodeURIComponent(dom)}?token=${encodeURIComponent(tok)}&size=200&format=webp&retina=true&fallback=404` : "");
    if (!src) return wordmark(name);
    return `<img class="blogo ${cls || ""}" src="${esc(src)}" alt="" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="80" height="80" onerror="this.hidden=true;this.nextElementSibling.hidden=false">${wordmark(name).replace("<span ", "<span hidden ")}`;
  }
  function wordmark(name) {
    // Plain text wordmark (no official logos): style varies a little by brand for a varied grid.
    const h = Array.from(name).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const styles = ["wm-a", "wm-b", "wm-c", "wm-d"];
    const long = name.length > 12 ? " wm-long" : "";
    return `<span class="wm ${styles[h % styles.length]}${long}" aria-hidden="true">${esc(name)}</span>`;
  }

  function viewBrands() {
    const html = `<section class="wrap page brands2">
      <nav class="crumbs" aria-label="${t("crumbs")}"><a href="#home">${t("tab_home")}</a><span>/</span><span>${t("nav_brands")}</span></nav>
      <div class="page-head"><h1>${t("nav_brands")}</h1></div>
      <div class="br-pills" role="group" aria-label="${t("br_tabs")}">
        ${[["all", ICO_GRID], ["popular", ICO_FIRE], ["premium", ICO_CROWN]].map(([k, ico]) => `<button type="button" class="br-pill" data-action="br-tab" data-k="${k}" aria-pressed="${state.brTab === k}">${ico}<span>${t("br_" + k)}</span></button>`).join("")}
      </div>
      <div class="br-search2">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4" stroke-linecap="round"/></svg>
        <label class="sr" for="brQ">${t("br_search_ph")}</label>
        <input id="brQ" type="search" autocomplete="off" placeholder="${t("br_search_ph")}" value="${esc(state.brQ)}">
      </div>
      <div class="br-letters2" id="brLetters" role="group" aria-label="${t("br_letters")}"></div>
      <div class="br-grid2" id="brGrid"></div>
    </section>`;
    return {
      html,
      title: t("nav_brands"),
      mount(root) {
        $("#brQ", root).addEventListener("input", e => { state.brQ = e.target.value.trim(); updateBrands(); });
        updateBrands();
      }
    };
  }

  function updateBrands() {
    const grid = $("#brGrid");
    if (!grid) return;
    const q = state.brQ.toLowerCase();
    const base = BRANDS.filter(b => (state.brTab === "all" || b[state.brTab]) && (!q || b.name.toLowerCase().includes(q)));
    const letters = ["#"].concat(Array.from(new Set(base.map(b => brandLetter(b.name)).filter(l => l !== "#"))).sort());
    const hasHash = base.some(b => brandLetter(b.name) === "#");
    if (state.brLetter !== "all" && !base.some(b => brandLetter(b.name) === state.brLetter)) state.brLetter = "all";
    $("#brLetters").innerHTML = ["all"].concat(letters.filter(l => l !== "#" || hasHash)).map(l => `<button type="button" class="br-let" data-action="br-letter" data-l="${esc(l)}" aria-pressed="${state.brLetter === l}">${l === "all" ? t("br_all") : esc(l)}</button>`).join("");
    const list = base.filter(b => state.brLetter === "all" || brandLetter(b.name) === state.brLetter);
    $$('[data-action="br-tab"]').forEach(x => x.setAttribute("aria-pressed", String(x.dataset.k === state.brTab)));
    grid.innerHTML = list.length ? list.map((b, bi) => `<button type="button" class="br-card" data-action="brand" data-brand="${esc(b.name)}" data-g="all">
        <span class="br-card-mark">${brandLogo(b.name, "", bi < 16)}</span>
        <span class="br-card-name">${esc(b.name)}</span>
      </button>`).join("") : `<div class="empty"><p>${t("br_none")}</p></div>`;
  }

  // ===== Search results page (Pont layout) =====
  const SHOE_EU = s => { const n = parseFloat(String(s).replace(",", ".")); return isNaN(n) ? null : n; };
  function sizeIn(sys, z) {
    const n = SHOE_EU(z);
    if (n === null || n < 30 || n > 50) return String(z);
    const fmt = x => String(Math.round(x * 2) / 2);
    return sys === "US" ? fmt(n - 33) : sys === "UK" ? fmt(n - 33.5) : sys === "RU" ? fmt(n - 1) : String(z);
  }
  const DEPT = p => (p.category === "shoes" ? "shoes" : ACC.includes(p.category) ? "acc" : "wear");
  function viewSearch(q) {
    const L = (r, e) => (state.lang === "ru" ? r : e);
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = p => (p.brand + " " + p.name + " " + catName(p.category) + " " + code(p) + " " + (p.colorName ? p.colorName.ru + " " + p.colorName.en : "")).toLowerCase();
    const all = PRODUCTS.filter(p => words.every(w => hay(p).includes(w)));
    if (!state.sf || state.sf.q !== q) state.sf = { q, dept: "all", min: "", max: "", sys: "EU", sizes: [], sort: "rel", shown: 40 };
    const sf = state.sf;
    const depts = [["shoes", L("Обувь", "Shoes")], ["wear", L("Одежда", "Clothing")], ["acc", L("Аксессуары", "Accessories")]]
      .map(([k, n]) => [k, n, all.filter(p => DEPT(p) === k)]).filter(d => d[2].length);
    return {
      title: L("Поиск", "Search") + ": " + q,
      html: `<section class="wrap page srch">
        <nav class="crumbs" aria-label="${t("crumbs")}"><a href="#home">${t("tab_home")}</a><span>›</span><span>${L("Поиск", "Search")}</span></nav>
        <div class="srch-head"><h1>${L("Результаты по запросу", "Results for")} «${esc(q)}»</h1><p class="muted" id="srCount"></p></div>
        <div class="srch-depts">${depts.map(([k, n, list]) => `<button type="button" class="srch-dept" data-dept="${k}" aria-pressed="${sf.dept === k}"><span class="srch-dept-pic">${media(list.find(p => p.images.length) || list[0], "sd-art")}</span><span>${n}</span></button>`).join("")}</div>
        <div class="srch-grid">
          <button type="button" class="srch-ftoggle" id="srFt">${L("Фильтры", "Filters")}</button>
          <aside class="srch-side" id="srSide">
            <h3>${L("Цена, сум", "Price, UZS")}</h3>
            <div class="srch-price"><input id="srMin" inputmode="numeric" placeholder="${L("от", "from")}" value="${esc(sf.min)}"><span>—</span><input id="srMax" inputmode="numeric" placeholder="${L("до", "to")}" value="${esc(sf.max)}"></div>
            <h3>${L("Размер", "Size")}</h3>
            <div class="srch-sys">${["EU", "US", "RU", "UK"].map(x => `<button type="button" data-sys="${x}" aria-pressed="${sf.sys === x}">${x}</button>`).join("")}</div>
            <div class="srch-sizes" id="srSizes"></div>
            <button type="button" class="srch-reset" id="srReset">${L("Сбросить фильтры", "Reset filters")}</button>
          </aside>
          <div class="srch-main">
            <div class="srch-bar"><select id="srSort" aria-label="${L("Сортировка", "Sort")}">
              ${[["rel", L("Релевантные", "Relevant")], ["asc", L("Сначала дешевле", "Price: low to high")], ["desc", L("Сначала дороже", "Price: high to low")], ["new", L("Новинки", "New")]].map(([k, n]) => `<option value="${k}" ${sf.sort === k ? "selected" : ""}>⇅ ${n}</option>`).join("")}
            </select></div>
            <div class="grid srch-cards" id="srCards"></div>
            <button type="button" class="btn srch-more" id="srMore" hidden>${L("Показать ещё", "Show more")}</button>
          </div>
        </div>
      </section>`,
      mount(root) {
        const num = v => Number(String(v).replace(/\D/g, "")) || 0;
        const draw = () => {
          const base = all.filter(p => sf.dept === "all" || DEPT(p) === sf.dept);
          const sizes = Array.from(new Set(base.flatMap(p => p.sizes))).filter(z => z !== "One size");
          const shoe = sizes.filter(z => SHOE_EU(z) !== null).sort((a, b) => SHOE_EU(a) - SHOE_EU(b));
          const rest = sizes.filter(z => SHOE_EU(z) === null);
          $("#srSizes", root).innerHTML = shoe.concat(rest).slice(0, 80).map(z => `<label class="srch-size"><input type="checkbox" value="${esc(z)}" ${sf.sizes.includes(z) ? "checked" : ""}><span>${esc(sizeIn(sf.sys, z))}</span></label>`).join("") || `<p class="muted small">—</p>`;
          let list = base.filter(p => (!sf.min || p.price >= num(sf.min)) && (!sf.max || p.price <= num(sf.max)) && (!sf.sizes.length || p.sizes.some(z => sf.sizes.includes(z) && !isSoldOut(p, z))));
          if (sf.sort === "asc") list = list.slice().sort((a, b) => a.price - b.price);
          else if (sf.sort === "desc") list = list.slice().sort((a, b) => b.price - a.price);
          else if (sf.sort === "new") list = list.slice().sort((a, b) => (b.tags.includes("new") - a.tags.includes("new")) || a.order - b.order);
          else list = list.slice().sort((a, b) => (b.images.length > 0) - (a.images.length > 0) || (b.tags.includes("hit") - a.tags.includes("hit")) || a.order - b.order);
          $("#srCount", root).textContent = plural(list.length, "items");
          $("#srCards", root).innerHTML = list.length ? list.slice(0, sf.shown).map(card).join("") : `<div class="empty"><p>${L("Ничего не нашлось. Попробуйте другое слово или сбросьте фильтры.", "Nothing found. Try another word or reset filters.")}</p></div>`;
          $("#srMore", root).hidden = list.length <= sf.shown;
          $$(".srch-dept", root).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.dept === sf.dept)));
          $$(".srch-sys button", root).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sys === sf.sys)));
        };
        root.addEventListener("click", e => {
          const d = e.target.closest(".srch-dept"); if (d) { sf.dept = sf.dept === d.dataset.dept ? "all" : d.dataset.dept; sf.sizes = []; sf.shown = 40; draw(); return; }
          const sy = e.target.closest(".srch-sys button"); if (sy) { sf.sys = sy.dataset.sys; draw(); return; }
          if (e.target.closest("#srMore")) { sf.shown += 40; draw(); return; }
          if (e.target.closest("#srFt")) { $("#srSide", root).classList.toggle("is-open"); return; }
          if (e.target.closest("#srReset")) { Object.assign(sf, { dept: "all", min: "", max: "", sizes: [], shown: 40 }); $("#srMin", root).value = ""; $("#srMax", root).value = ""; draw(); }
        });
        root.addEventListener("change", e => {
          if (e.target.closest(".srch-size")) { const v = e.target.value; sf.sizes = e.target.checked ? sf.sizes.concat(v) : sf.sizes.filter(x => x !== v); sf.shown = 40; draw(); }
          if (e.target.id === "srSort") { sf.sort = e.target.value; draw(); }
        });
        let tm;
        root.addEventListener("input", e => {
          if (e.target.id === "srMin" || e.target.id === "srMax") {
            const d = e.target.value.replace(/\D/g, ""); e.target.value = d ? Number(d).toLocaleString("ru-RU") : "";
            sf.min = $("#srMin", root).value; sf.max = $("#srMax", root).value;
            clearTimeout(tm); tm = setTimeout(draw, 300);
          }
        });
        draw();
      }
    };
  }

  function viewSale() {
    const list = PRODUCTS.filter(p => p.salePct).sort((a, b) => b.salePct - a.salePct || a.order - b.order);
    const maxPct = list.length ? Math.max.apply(null, list.map(p => p.salePct)) : 0;
    const L = (r, e) => (state.lang === "ru" ? r : e);
    const DEFS = `<defs>
        <linearGradient id="slG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3FFB0"/><stop offset=".35" stop-color="#D4FF3A"/><stop offset=".7" stop-color="#B4F000"/><stop offset="1" stop-color="#7FB300"/></linearGradient>
        <linearGradient id="slShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
        <radialGradient id="slGlow" cx=".35" cy=".25" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <linearGradient id="slBal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBFFD6"/><stop offset=".3" stop-color="#E2FF5C"/><stop offset=".65" stop-color="#BDF20A"/><stop offset="1" stop-color="#6E9E00"/></linearGradient>
        <linearGradient id="slBalHi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
      </defs>`;
    const HANGER = (x) => `<path d="M${x} 44c0-7-3-11 0-17 4-7 15-7 18 0 3 6-1 11-9 14" fill="none" stroke="#C9FF2E" stroke-width="4.5" stroke-linecap="round"/>`;
    const TEE = `<svg viewBox="0 0 220 210" class="sl-ill" aria-hidden="true">${DEFS}${HANGER(106)}
      <path d="M110 44 C98 44 92 46 84 50 L48 66 L28 104 L56 120 L70 100 L70 196 Q110 204 150 196 L150 100 L164 120 L192 104 L172 66 L136 50 C128 46 122 44 110 44 Z" fill="url(#slG)"/>
      <path d="M110 44 C98 44 92 46 84 50 L48 66 L28 104 L56 120 L70 100 L70 196 Q110 204 150 196 L150 100 L164 120 L192 104 L172 66 L136 50 C128 46 122 44 110 44 Z" fill="url(#slShade)"/>
      <path d="M110 44 C98 44 92 46 84 50 L48 66 L28 104 L56 120 L70 100 L70 196 Q110 204 150 196 L150 100 L164 120 L192 104 L172 66 L136 50 C128 46 122 44 110 44 Z" fill="url(#slGlow)"/>
      <path d="M90 49 Q110 66 130 49" fill="none" stroke="#8DBF00" stroke-width="5"/><path d="M90 49 Q110 62 130 49" fill="none" stroke="#2A3A00" stroke-width="2" opacity=".5"/>
      <path d="M70 100 Q74 88 72 78M150 100 Q146 88 148 78" fill="none" stroke="#7FB300" stroke-width="2" opacity=".7"/>
      <path d="M96 120 Q100 160 94 190M126 130 Q122 165 128 192" fill="none" stroke="#9CCF00" stroke-width="3" opacity=".55" stroke-linecap="round"/>
      <path d="M28 104 L56 120M192 104 L164 120" stroke="#8DBF00" stroke-width="4" stroke-linecap="round"/>
      <path d="M72 194 Q110 201 148 194" fill="none" stroke="#8DBF00" stroke-width="4"/></svg>`;
    const HOOD = `<svg viewBox="0 0 220 230" class="sl-ill" aria-hidden="true">${DEFS}${HANGER(104)}
      <path d="M113 40 C88 40 72 56 70 78 L40 92 C30 96 26 104 25 116 L18 196 L44 200 L56 118 L58 222 Q112 230 166 222 L168 118 L180 200 L206 196 L199 116 C198 104 194 96 184 92 L156 78 C154 56 138 40 113 40 Z" fill="url(#slG)"/>
      <path d="M113 40 C88 40 72 56 70 78 L40 92 C30 96 26 104 25 116 L18 196 L44 200 L56 118 L58 222 Q112 230 166 222 L168 118 L180 200 L206 196 L199 116 C198 104 194 96 184 92 L156 78 C154 56 138 40 113 40 Z" fill="url(#slShade)"/>
      <path d="M113 40 C88 40 72 56 70 78 L40 92 C30 96 26 104 25 116 L18 196 L44 200 L56 118 L58 222 Q112 230 166 222 L168 118 L180 200 L206 196 L199 116 C198 104 194 96 184 92 L156 78 C154 56 138 40 113 40 Z" fill="url(#slGlow)"/>
      <path d="M78 80 C86 104 140 104 148 80 C142 60 126 52 113 52 C100 52 84 60 78 80 Z" fill="#9FD400" opacity=".55"/>
      <path d="M84 82 C92 98 134 98 142 82" fill="none" stroke="#6E9E00" stroke-width="3"/>
      <path d="M104 96 C102 112 104 124 100 136M122 96 C124 112 122 124 126 136" fill="none" stroke="#5E8A00" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="100" cy="138" r="3" fill="#5E8A00"/><circle cx="126" cy="138" r="3" fill="#5E8A00"/>
      <path d="M78 168 L148 168 L156 206 L70 206 Z" fill="#B4EC00" stroke="#7FB300" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M60 220 Q112 228 164 220" fill="none" stroke="#8DBF00" stroke-width="5"/>
      <path d="M18 196 L44 200M206 196 L180 200" stroke="#8DBF00" stroke-width="5" stroke-linecap="round"/></svg>`;
    const BOX = `<svg viewBox="0 0 260 210" class="sl-ill sl-box" aria-hidden="true">${DEFS}
      <path d="M14 86 L136 50 L248 92 L126 132 Z" fill="#E3FF7A"/>
      <path d="M14 86 L126 132 L126 202 L14 156 Z" fill="url(#slG)"/><path d="M14 86 L126 132 L126 202 L14 156 Z" fill="#000" opacity=".08"/>
      <path d="M126 132 L248 92 L248 160 L126 202 Z" fill="url(#slG)"/><path d="M126 132 L248 92 L248 160 L126 202 Z" fill="url(#slGlow)"/>
      <path d="M58 73 L172 116 L172 186 L150 194 L150 124 L38 79 Z" fill="#111"/>
      <path d="M100 61 L212 102 L194 108 L80 66 Z" fill="#111"/>
      <g font-family="Inter, Arial, sans-serif" font-weight="800" fill="#BDFF14" font-size="7">
        <text transform="translate(66 82) rotate(22)">G&amp;DLLARS</text><text transform="translate(112 100) rotate(22)">G&amp;DLLARS</text>
        <text transform="translate(116 70) rotate(21)">G&amp;DLLARS</text><text transform="translate(160 86) rotate(21)">G&amp;DLLARS</text></g>
      <text transform="translate(178 178) rotate(-18)" font-family="Unbounded, Arial Black, sans-serif" font-weight="800" font-size="30" fill="#111" letter-spacing="-1">G&amp;D</text>
      <g transform="translate(26 120) skewY(22)"><rect width="18" height="18" fill="#fff" opacity=".9"/><path d="M3 3h5v5h-5zM10 3h5v5h-5zM3 10h5v5h-5zM11 11h3v3h-3z" fill="#111"/></g>
      <text transform="translate(28 150) skewY(22)" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="7" fill="#111">FAST · G&amp;D</text></svg>`;
    const pctTxt = maxPct ? maxPct + "%" : "%";
    const PCT = `<svg viewBox="0 0 280 140" class="sl-pct" aria-hidden="true">${DEFS}
      <g font-family="Unbounded, 'Arial Rounded MT Bold', Arial Black, sans-serif" font-weight="800" font-size="${maxPct ? 104 : 124}" text-anchor="middle" letter-spacing="-6">
        <text x="142" y="116" fill="#3E5A00" opacity=".55">${pctTxt}</text>
        <text x="140" y="112" fill="url(#slBal)" stroke="#EFFF9E" stroke-width="7" paint-order="stroke" stroke-linejoin="round">${pctTxt}</text>
        <text x="140" y="112" fill="url(#slBalHi)">${pctTxt}</text>
      </g></svg>`;
    const BOLT = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#BDFF14" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>`;
    const tiles = [
      { href: list.length ? "#sale-items" : "#catalog", t: maxPct ? L("Огромные скидки", "Huge discounts") : L("Скидки скоро", "Discounts soon"),
        sub: maxPct ? L(`до −${maxPct}% · ${plural(list.length, "items")}`, `up to −${maxPct}%`) : L("следите за обновлениями", "stay tuned"), body: PCT, cls: "sl-big" },
      { href: "#catalog-tshirts", t: L("Футболки", "T-shirts"), body: TEE },
      { href: "#catalog", t: L("Товары из-за границы", "Items from abroad"), body: BOX },
      { href: "#catalog-hoodies", t: L("Худи", "Hoodies"), body: HOOD }
    ];
    return {
      title: t("nav_sale"),
      html: `<section class="sale-land">
        <div class="wrap">
          <div class="sl-head">
            <span class="sl-eyebrow">G&amp;DLLARS</span>
            <h1>${L("Большая", "The big")}<br><mark>${L("распродажа", "sale")}</mark></h1>
          </div>
          <div class="sl-grid">${tiles.map(x => `<a class="sl-tile ${x.cls || ""}" href="${x.href}">
              <span class="sl-t">${x.t}</span>${x.sub ? `<span class="sl-sub">${BOLT}<span>${x.sub}</span></span>` : ""}
              <span class="sl-art">${x.body}</span></a>`).join("")}</div>
        </div>
      </section>
      <section class="wrap page" id="sale-items">
        ${list.length ? `<div class="page-head"><h2 class="sale-h">${t("nav_sale")}</h2><p class="muted">${plural(list.length, "items")}</p></div><div class="grid">${list.map(card).join("")}</div>`
          : `<div class="sale-empty"><b>${t("sale_none_t")}</b><p>${t("sale_none_d")}</p><a class="btn cb-go" href="#catalog">${t("cta_catalog")}</a></div>`}
      </section>`
    };
  }

  // Brand page banner in the brand's own colours (bg, accent); unknown brands get a calm colour from a fixed palette.
  const BRAND_COLORS = {
    "U.S. Polo Assn.": ["#14284B", "#C8102E"], "Nike": ["#111111", "#FA5400"], "Jordan": ["#B5122E", "#111111"], "Adidas": ["#0F0F0F", "#FFFFFF"],
    "New Balance": ["#C8102E", "#F4F4EF"], "Asics": ["#001E62", "#00A3E0"], "Onitsuka Tiger": ["#0A2240", "#E8B92F"], "Puma": ["#B32025", "#FFFFFF"],
    "Converse": ["#1D1D1B", "#E41D24"], "Vans": ["#C8102E", "#111111"], "Lacoste": ["#00553A", "#F4F4EF"], "Ralph Lauren": ["#041E42", "#C9A15B"],
    "Tommy Hilfiger": ["#0B2A55", "#CC0C2F"], "Calvin Klein": ["#111111", "#BFBFBF"], "The North Face": ["#D7192D", "#111111"], "Stone Island": ["#151515", "#F2C200"],
    "Moncler": ["#17284A", "#C8102E"], "Carhartt WIP": ["#9A6223", "#1A1A1A"], "Supreme": ["#DA291C", "#FFFFFF"], "Champion": ["#0B3C8C", "#D2232A"],
    "Levi's": ["#C41230", "#F4F4EF"], "Under Armour": ["#1D1D1D", "#D0D0D0"], "Columbia": ["#00539B", "#9FD3F0"], "Arc'teryx": ["#121212", "#9A9A9A"],
    "Gucci": ["#1B4D3E", "#C8102E"], "Prada": ["#111111", "#C9C9C9"], "Balenciaga": ["#0D0D0D", "#FFFFFF"], "Louis Vuitton": ["#4E3629", "#D4B27A"],
    "Dior": ["#1A1A1A", "#D9CBB3"], "Timberland": ["#A3762B", "#1E1E1E"], "UGG": ["#5B4636", "#E8DCC8"], "Dr. Martens": ["#F5C400", "#111111"],
    "Crocs": ["#2F7A3A", "#F4F4EF"], "Birkenstock": ["#1A2E5A", "#E8DCC8"], "Salomon": ["#121212", "#00A6D6"], "On": ["#1A1A1A", "#E5E5E5"],
    "Hoka": ["#3346C4", "#FFD23F"], "Reebok": ["#D71920", "#1A1A1A"], "Casio": ["#003C8F", "#E6E6E6"], "Essentials": ["#BFB4A2", "#1E1E1E"],
    "Stüssy": ["#111111", "#F4F4EF"], "Fila": ["#002D62", "#E4002B"], "Kappa": ["#111111", "#E4002B"], "Diesel": ["#B3001B", "#111111"]
  };
  const BH_PALETTE = [["#14284B", "#BDFF14"], ["#1B4D3E", "#E8DCC8"], ["#4E3629", "#E8B92F"], ["#3A2E5C", "#E7B9C6"], ["#0E3B43", "#7FD1C1"], ["#5C1A24", "#F4C9A8"], ["#22313F", "#F5A623"], ["#2E3A1F", "#D9E7A1"]];
  function brandHeroStyle(name) {
    const h = Array.from(name).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const [bg, ac] = BRAND_COLORS[name] || BH_PALETTE[h % BH_PALETTE.length];
    const lum = c => { const n = parseInt(c.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
    const fg = lum(bg) > 0.6 ? "#111111" : "#FFFFFF";
    return `--bh-bg:${bg};--bh-ac:${ac};--bh-fg:${fg}`;
  }

  function viewBrand(name) {
    const items = PRODUCTS.filter(p => p.brand === name);
    const info = BRANDS.find(b => b.name === name);
    if (!info && !items.length) return viewNotFound();
    const cats = CATS.filter(c => items.some(p => p.category === c));
    if (state.brandCat !== "all" && !cats.includes(state.brandCat)) state.brandCat = "all";
    const from = items.length ? Math.min.apply(null, items.map(p => p.price)) : null;
    const html = `<section class="wrap page">
      <a class="back" href="#brands">← ${t("nav_brands")}</a>
      <div class="brand-hero bh2" style="${brandHeroStyle(name)}">
        ${CFG.logoDevToken && (window.GD_BRAND_DOMAINS || {})[name] ? `<span class="bh-logo">${brandLogo(name, "", true)}</span>` : ""}
        <span class="ad-eyebrow">${info && info.premium ? t("tier_premium") : t("brand_eyebrow")}</span>
        <h1>${esc(name)}</h1>
        <p>${items.length ? `${plural(items.length, "items")} · ${t("from", { price: money(from) })}` : t("br_order")}</p>
      </div>
      ${items.length ? `<nav class="chips brand-cats" aria-label="${t("categories")}">
        <button type="button" class="chip" data-action="brand-cat" data-c="all" aria-pressed="${state.brandCat === "all"}">${t("all")} <span class="chip-n">${items.length}</span></button>
        ${cats.map(c => `<button type="button" class="chip" data-action="brand-cat" data-c="${c}" aria-pressed="${state.brandCat === c}">${catName(c)} <span class="chip-n">${items.filter(p => p.category === c).length}</span></button>`).join("")}
      </nav>
      <div id="brandBody"></div>` : `<div class="empty"><p>${t("brand_empty")}</p><a class="btn btn-primary" href="#link">${t("nav_link")}</a></div>`}
    </section>`;
    return { html, title: name, mount() { state.brandName = name; updateBrandPage(); } };
  }

  function updateBrandPage() {
    const body = $("#brandBody");
    if (!body) return;
    const items = PRODUCTS.filter(p => p.brand === state.brandName);
    $$('[data-action="brand-cat"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.c === state.brandCat)));
    const cats = CATS.filter(c => items.some(p => p.category === c) && (state.brandCat === "all" || state.brandCat === c));
    body.innerHTML = cats.map(c => `<section class="brand-sec">
      <h2 class="h-sm">${catName(c)}</h2>
      <div class="grid">${items.filter(p => p.category === c).map(card).join("")}</div>
    </section>`).join("");
    setupReveal(body);
  }

  function viewCatalog(hash) {
    const f = state.filters;
    const cat = hash.startsWith("catalog-") ? hash.slice(8) : "all";
    f.cat = (CATS.includes(cat) || cat === "acc") ? cat : "all";
    const inAcc = f.cat === "acc" || ACC.includes(f.cat);
    if (!state.keepFilters) {
      f.q = "";
      const q = $("#q");
      if (q) q.value = "";
    }
    state.keepFilters = false;
    const brands = brandsFor(f.cat);
    if (f.brand !== "all" && !brands.includes(f.brand)) f.brand = "all";
    if (f.size !== "all" && !sizesFor(f.cat).includes(f.size)) f.size = "all";

    const html = `<section class="wrap page">
      <div class="page-head" id="catHead"><h1 id="catTitle"></h1><p class="muted" id="catCount"></p></div>
      <nav class="chips" aria-label="${t("categories")}">
        ${inAcc
          ? `<a class="chip" href="#catalog-acc" ${f.cat === "acc" ? 'aria-current="page"' : ""}>${t("all")}</a>
             ${ACC.filter(c => PRODUCTS.some(p => p.category === c)).map(c => `<a class="chip" href="#catalog-${c}" ${f.cat === c ? 'aria-current="page"' : ""}>${catName(c)}</a>`).join("")}`
          : `<a class="chip" href="#catalog" ${f.cat === "all" ? 'aria-current="page"' : ""}>${t("all")}</a>
             ${CATS.filter(WEAR).map(c => `<a class="chip" href="#catalog-${c}" ${f.cat === c ? 'aria-current="page"' : ""}>${catName(c)}</a>`).join("")}
             <a class="chip chip-dept" href="#catalog-acc">${t("dept_acc")} ›</a>`}
      </nav>
      <div class="ctool">
        <button type="button" class="ftoggle" data-action="open-filters" aria-haspopup="dialog" aria-controls="fsheet">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
          ${t("filters")}<span class="fcount" id="fcount" hidden></span>
        </button>
        <label class="sortwrap" for="sortSel">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4"/></svg>
          <span class="sortlbl">${t("sort_btn")}</span>
        </label>
        <select id="sortSel" class="sortsel">
          ${["popular", "new", "asc", "desc"].map(s => `<option value="${s}" ${f.sort === s ? "selected" : ""}>${t("sort_" + s)}</option>`).join("")}
        </select>
      </div>
      <div class="fsheet" id="fsheet" hidden>
        <div class="fsheet-back" data-action="close-filters"></div>
        <div class="fsheet-panel" role="dialog" aria-modal="true" aria-labelledby="fsheetTitle">
          <div class="fsheet-head"><h2 id="fsheetTitle">${t("filters")}</h2><button type="button" class="fsheet-x" data-action="close-filters" aria-label="${t("close")}">×</button></div>
          <div class="fsheet-body">
            <div class="fgroup"><span class="flabel">${t("gender")}</span>
              <div class="seg" role="group" aria-label="${t("gender")}">
                ${["all", "men", "women"].map(g => `<button type="button" data-action="gender" data-g="${g}" aria-pressed="${f.gender === g}">${t("gender_" + g)}</button>`).join("")}
              </div>
            </div>
            <div class="fgroup"><span class="flabel">${t("tier")}</span>
              <div class="seg" role="group" aria-label="${t("tier")}">
                ${["all", "premium", "casual"].map(k => `<button type="button" data-action="tier" data-k="${k}" aria-pressed="${f.tier === k}">${t("tier_" + k)}</button>`).join("")}
              </div>
            </div>
            <div class="fgroup"><label class="flabel" for="brandSel">${t("brand")}</label>
              <select id="brandSel">
                <option value="all">${t("brand_all")}</option>
                ${brands.map(b => `<option value="${esc(b)}" ${f.brand === b ? "selected" : ""}>${esc(b)}</option>`).join("")}
              </select>
            </div>
            <div class="fgroup two">
              <div><label class="flabel" for="sizeSel">${t("size")}</label>
                <select id="sizeSel">
                  <option value="all">${t("size_all")}</option>
                  ${sizesFor(f.cat).map(z => `<option value="${esc(z)}" ${f.size === z ? "selected" : ""}>${esc(sizeLabel(z))}</option>`).join("")}
                </select></div>
              <div><label class="flabel" for="priceSel">${t("price")}</label>
                <select id="priceSel">
                  ${["all"].concat(Object.keys(PRICE_BANDS)).map(k => `<option value="${k}" ${f.price === k ? "selected" : ""}>${t("price_" + k)}</option>`).join("")}
                </select></div>
            </div>
            <div class="fgroup"><span class="flabel">${t("color")}</span>
              <div class="swatches" role="group" aria-label="${t("color")}">
                <button type="button" class="swatch swatch-all" data-action="color" data-c="all" aria-pressed="${f.color === "all"}">${t("color_all")}</button>
                ${COLOR_GROUPS.map(([k, hex]) => `<button type="button" class="swatch" data-action="color" data-c="${k}" aria-pressed="${f.color === k}" aria-label="${t("color_" + k)}" title="${t("color_" + k)}"><span style="background:${hex}"></span></button>`).join("")}
              </div>
            </div>
          </div>
          <div class="fsheet-foot">
            <button type="button" class="btn btn-ghost" data-action="clear-filters">${t("reset")}</button>
            <button type="button" class="btn btn-primary" data-action="close-filters" id="fshow"></button>
          </div>
        </div>
      </div>
      <div class="grid" id="grid"></div>
    </section>`;

    return {
      html,
      title: f.cat === "all" ? t("nav_catalog") : f.cat === "acc" ? t("dept_acc") : catName(f.cat),
      mount(root) {
        $("#brandSel", root).addEventListener("change", e => { f.brand = e.target.value; updateCatalog(); });
        $("#sortSel", root).addEventListener("change", e => { f.sort = e.target.value; updateCatalog(); });
        $("#sizeSel", root).addEventListener("change", e => { f.size = e.target.value; updateCatalog(); });
        $("#priceSel", root).addEventListener("change", e => { f.price = e.target.value; updateCatalog(); });
        updateCatalog();
      }
    };
  }

  function sizesFor(cat) {
    const all = new Set();
    PRODUCTS.filter(p => cat === "all" ? p.category === "shoes" : cat === "acc" ? ACC.includes(p.category) : p.category === cat).forEach(p => p.sizes.forEach(z => all.add(z)));
    const order = ["XS", "S", "M", "L", "XL", "XXL", "One size"];
    return Array.from(all).sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      return parseFloat(a.replace(/\D+/, "")) - parseFloat(b.replace(/\D+/, "")) || a.localeCompare(b);
    });
  }

  function filtered() {
    const f = state.filters;
    const q = f.q.toLowerCase();
    const list = PRODUCTS.filter(p =>
      (q || (f.cat === "all" ? WEAR(p.category) : f.cat === "acc" ? ACC.includes(p.category) : p.category === f.cat)) &&
      (!q || f.cat === "all" || (f.cat === "acc" ? ACC.includes(p.category) : p.category === f.cat)) &&
      (f.gender === "all" || p.gender === f.gender || p.gender === "unisex") &&
      (f.brand === "all" || p.brand === f.brand) &&
      (f.color === "all" || p.colorGroup === f.color) &&
      (f.size === "all" || p.sizes.includes(f.size)) &&
      (f.price === "all" || (p.price >= PRICE_BANDS[f.price][0] && p.price < PRICE_BANDS[f.price][1])) &&
      (f.tier === "all" || (f.tier === "premium") === PREMIUM.has(p.brand)) &&
      (!q || (p.brand + " " + p.name).toLowerCase().includes(q)));
    const lacks = (p, tag) => (p.tags.includes(tag) ? 0 : 1);
    const sorters = {
      popular: (a, b) => lacks(a, "hit") - lacks(b, "hit") || a.order - b.order,
      new: (a, b) => lacks(a, "new") - lacks(b, "new") || a.order - b.order,
      asc: (a, b) => a.price - b.price || a.order - b.order,
      desc: (a, b) => b.price - a.price || a.order - b.order
    };
    return list.sort(sorters[f.sort] || sorters.popular);
  }

  function updateCatalog() {
    const grid = $("#grid");
    if (!grid) return;
    const f = state.filters;
    const list = filtered();
    const sec = grid.closest("section");
    const isSearch = !!f.q;
    if (sec) sec.classList.toggle("is-search", isSearch);
    grid.classList.toggle("grid-min", isSearch);
    $("#catTitle").textContent = isSearch ? f.q : (f.cat === "all" ? t("nav_catalog") : f.cat === "acc" ? t("dept_acc") : catName(f.cat));
    $("#catCount").textContent = plural(list.length, "items");
    const active = ["gender", "brand", "color", "size", "price", "tier"].filter(k => f[k] !== "all").length;
    const fc = $("#fcount");
    if (fc) { fc.textContent = active; fc.hidden = !active; }
    const fs = $("#fshow");
    if (fs) fs.textContent = t("show_n", { n: plural(list.length, "items") });
    $$('[data-action="gender"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.g === f.gender)));
    $$('[data-action="tier"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.k === f.tier)));
    $$('[data-action="color"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.c === f.color)));
    if (grid._io) { grid._io.disconnect(); grid._io = null; }
    const old = grid.parentNode.querySelector(".more-wrap");
    if (old) old.remove();
    const STEP = 40;
    let shown = Math.min(STEP, list.length);
    if (list.length > shown) {
      const wrap = document.createElement("div");
      wrap.className = "more-wrap";
      wrap.innerHTML = `<button type="button" class="btn more-btn">${t("show_more")}</button>`;
      grid.after(wrap);
      const more = () => {
        const next = Math.min(shown + STEP, list.length);
        grid.insertAdjacentHTML("beforeend", list.slice(shown, next).map(card).join(""));
        shown = next;
        if (shown >= list.length) { wrap.remove(); if (grid._io) { grid._io.disconnect(); grid._io = null; } }
      };
      wrap.firstChild.addEventListener("click", more);
      if ("IntersectionObserver" in window) {
        grid._io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) more(); }, { rootMargin: "600px 0px" });
        grid._io.observe(wrap);
      }
    }
    grid.innerHTML = list.length
      ? list.slice(0, shown).map(card).join("")
      : `<div class="empty"><p>${t("no_results")}</p><div class="row">
          <button class="btn btn-ghost" type="button" data-action="reset">${t("reset")}</button>
</div></div>`;
  }

  function kindOf(p) {
    const n = (p.name || "").toLowerCase(), ru = state.lang !== "en";
    const pick = (pairs, def) => { for (const [re, w] of pairs) if (re.test(n)) return w; return def; };
    if (!ru) return catName(p.category);
    switch (p.category) {
      case "shoes": return pick([[/boot|1460|chelsea|jadon|ugg|ultra mini|classic short/, "Ботинки"], [/slide|clog|сабо|crocs|arizona|gizeh|milano/, "Шлёпанцы"], [/loafer|tassel/, "Лоферы"], [/slipper|tasman|boston/, "Тапочки"]], "Кроссовки");
      case "hoodies": return pick([[/hood/, "Худи"], [/cardigan/, "Кардиган"], [/sweater|knit|cashmere|cable/, "Свитер"], [/fleece|zip/, "Кофта"]], "Свитшот");
      case "tshirts": return pick([[/polo/, "Поло"], [/shirt(?!.*t-shirt)|oxford/, "Рубашка"]], "Футболка");
      case "pants": return pick([[/jean|denim|501|511|512|550/, "Джинсы"], [/jogger|sweatpant|fleece/, "Джоггеры"], [/legging/, "Леггинсы"]], "Брюки");
      case "jackets": return pick([[/puffer|down|nuptse|parka|maya|karakorum|crofton|himalayan/, "Пуховик"], [/vest/, "Жилет"], [/fleece/, "Флиска"]], "Куртка");
      case "coats": return pick([[/parka/, "Парка"], [/trench/, "Тренч"]], "Пальто");
      case "caps": return pick([[/bucket/, "Панама"]], "Кепка");
      case "bags": return pick([[/backpack/, "Рюкзак"], [/duffel/, "Спортивная сумка"]], "Сумка");
      case "belts": return pick([[/wallet/, "Кошелёк"]], "Ремень");
      case "eyewear": return "Очки";
      case "luggage": return "Чемодан";
      case "beanies": return "Шапка";
      case "watches": return "Часы";
      case "socks": return "Носки";
      case "shorts": return "Шорты";
      case "underwear": return "Бельё";
      case "bras": return "Топ";
      default: return catName(p.category);
    }
  }
  function seasonOf(p) {
    const k = kindOf(p).toLowerCase();
    if (["jackets", "coats", "beanies"].includes(p.category) || /ботинки|пуховик|парка|свитер/.test(k)) return t("season_cold");
    if (p.category === "shorts" || p.category === "eyewear" || /шлёпанцы/.test(k)) return t("season_warm");
    if (p.category === "hoodies") return t("season_mid");
    if (p.category === "shoes") return t("season_shoes");
    return t("season_all");
  }

  function etaRange() {
    const m = String(CFG.deliveryDays).match(/(\d+)\D+(\d+)/);
    const a = m ? +m[1] : 14, b = m ? +m[2] : 21;
    const f = d => new Date(Date.now() + d * 864e5).toLocaleDateString(state.lang === "ru" ? "ru-RU" : "en-US", { day: "2-digit", month: "short" });
    return f(a) + " – " + f(b);
  }

  document.addEventListener("change", e => {
    const el = e.target;
    if (el instanceof HTMLSelectElement && el.dataset.sizeFor) {
      state.sizes[el.dataset.sizeFor] = el.value;
      const err = $("#sizeErr");
      if (err) err.hidden = true;
    }
  });

  function viewProduct(id) {
    const p = byId[id];
    if (!p) return viewNotFound();
    if (p.sizes.length === 1 && !state.sizes[id]) state.sizes[id] = p.sizes[0];
    const sel = state.sizes[id];
    const related = PRODUCTS.filter(x => x.brand === p.brand && x.id !== p.id)
      .concat(PRODUCTS.filter(x => x.brand !== p.brand && x.category === p.category))
      .slice(0, 10);
    const ask = t("ask_text", { name: p.brand + " " + p.name, code: code(p) });
    const meta = [colorName(p), t("gender_" + p.gender)].filter(Boolean).join(" · ");
    const thumbs = p.images.length > 1
      ? `<div class="thumbs">${p.images.map((src, i) => `<button type="button" class="thumb" data-action="thumb" data-src="${esc(src)}" aria-pressed="${i === 0}" aria-label="${t("photo", { n: i + 1 })}"><img src="${esc(src)}" alt="" loading="lazy" data-pid="${esc(p.id)}"></button>`).join("")}</div>`
      : "";

    const html = `<section class="wrap page">
      <a class="back" href="#catalog-${p.category}">← ${catName(p.category)}</a>
      <div class="pdp">
        <div class="pdp-gallery">${media(p, "pdp-media", true)}${thumbs}</div>
        <div class="pdp-info">
          <h1 class="pdp-title"><span class="pdp-kind">${esc(kindOf(p))}</span> <mark>${esc(p.brand)} ${esc(p.name)}</mark></h1>
          <div class="pdp-badges">
            <span class="orig-chip"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#2F9E44" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="m8 12.5 2.6 2.6L16.5 9" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="orig-text">${t("badge_original")}</span></span>
            ${favBtn(p)}
          </div>
          <div class="pdp-tags">
            <a class="ptag" href="#catalog-${p.category}">${catName(p.category)}</a>
            <a class="ptag" href="#brand-${esc(p.brand)}" data-action="brand" data-brand="${esc(p.brand)}">${esc(p.brand)}</a>
            <span class="ptag">${t(PREMIUM.has(p.brand) ? "tier_premium" : "tier_casual")}</span>
          </div>
          <dl class="pdp-specs">
            <div><dt>${t("article")}</dt><dd class="mono">${esc(code(p))}</dd></div>
            <div><dt>${t("fit")}</dt><dd>${t(p.gender === "men" ? "gender_men" : p.gender === "women" ? "gender_women" : "gender_unisex")}</dd></div>
            <div><dt>${t("season")}</dt><dd>${esc(seasonOf(p))}</dd></div>
          </dl>
          <div class="psz" role="group" aria-label="${t("size")}">
            <div class="psz-bar">
              <span class="psz-eu">${p.category === "shoes" ? "EU" : (state.lang === "ru" ? "Размер" : "Size")}</span>
              <div class="psz-row" id="pszRow">${p.sizes.map(z => isSoldOut(p, z)
                ? `<button type="button" class="psz-b sz is-out" data-action="size-out" aria-disabled="true" title="${state.lang === "ru" ? "Нет в наличии" : "Sold out"}"><s>${esc(sizeLabel(z))}</s></button>`
                : `<button type="button" class="psz-b sz" data-action="size" data-id="${esc(p.id)}" data-size="${esc(z)}" aria-pressed="${sel === z}">${esc(sizeLabel(z))}</button>`).join("")}</div>
              ${p.sizes.length > 4 ? `<button type="button" class="psz-more" id="pszMore" aria-label="${state.lang === "ru" ? "Все размеры" : "All sizes"}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>` : ""}
            </div>
          </div>
          <p class="err" id="sizeErr" role="alert" hidden>${t("pick_size")}</p>
          <ul class="pdp-links pl2">
            <li><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#DD2048" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m4 15 11-11 5 5-11 11z"/><path d="m8 11 2 2M11 8l2 2M14 5l2 2"/></svg><a href="#" data-action="open-size-help">${t("size_how")}</a></li>
            <li><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 1 3.4 6.5L4 20l1.3-3.6A8 8 0 0 1 4 12z"/></svg><a href="${esc(tgUrl(t("ask_text", { name: p.brand + " " + p.name, code: code(p) })))}" target="_blank" rel="noopener">${state.lang === "ru" ? "Написать оператору" : "Message an operator"}</a></li>
          </ul>
          <div class="pbox">
            <span class="pbox-price${p.oldPrice ? " is-sale" : ""}" id="pdpPrice">${!sel && hasSizePrices(p) ? `<small class="from">${state.lang === "ru" ? "от" : "from"}</small> ` : ""}${money(priceAt(p, sel))}${p.oldPrice ? ` <s>${money(p.oldPrice)}</s> <em class="sale-pct">−${p.salePct}%</em>` : ""}</span>
            <span class="pbox-days">${state.lang === "ru" ? CFG.deliveryDays + " дней" : CFG.deliveryDays + " days"}</span>
            <span id="pdpSplit">${splitLine(priceAt(p, sel))}</span>
          </div>
          <p class="pnote">${state.lang === "ru" ? "Обратите внимание: срок доставки указан ориентировочно — от оплаты до получения заказа." : "Please note: the delivery time is an estimate — from payment to receiving your order."} <a href="#delivery">${state.lang === "ru" ? "Подробнее." : "Learn more."}</a></p>
          ${p.est ? `<p class="pnote">${state.lang === "ru" ? "Наличие этой расцветки и точную цену оператор подтвердит после оформления — до оплаты." : "The operator confirms this colorway and the exact price after checkout — before payment."}</p>` : ""}
          <button class="btn pbuy" type="button" data-action="add" data-id="${esc(p.id)}"><span class="pbuy-price">${money(priceAt(p, sel))}</span><span>${t("buy_short")}</span></button>
          <div class="acc acc-caps">
            <details open>
              <summary>${t("pd_desc")}</summary>
              <p class="muted acc-sub">${t("about_model")}</p>
              <ul class="bullets">
                <li>${t("brand")}: ${esc(p.brand)}</li>
                <li>${t("pd_model")}: ${esc(p.name)}</li>
                ${colorName(p) ? `<li>${t("color")}: ${esc(colorName(p).toLowerCase())}</li>` : ""}
                <li>${t("category")}: ${esc(catName(p.category).toLowerCase())}</li>
                <li>${t("gender")}: ${esc(t(p.gender === "men" ? "gender_men" : p.gender === "women" ? "gender_women" : "gender_unisex").toLowerCase())}</li>
                <li>${t("sizes_avail")}: ${esc(p.sizes.map(sizeLabel).join(", "))}</li>
                ${PREMIUM.has(p.brand) ? `<li>${t("tier")}: ${esc(t("tier_premium").toLowerCase())}</li>` : ""}
                <li>${t("article")}: <span class="mono">${esc(code(p))}</span></li>
              </ul>
            </details>
            <details>
              <summary>${t("pd_care_caps")}</summary>
              <p>${t("composition_note")}</p>
              <p>${t("care_" + (p.category === "accessories" ? "accessories" : p.category === "watches" ? "watches" : p.category === "shoes" ? "shoes" : ["jackets", "coats"].includes(p.category) ? "outer" : "apparel"))}</p>
              <p>${t(p.category === "shoes" ? "size_help_shoes" : (p.category === "watches" || p.category === "accessories") ? "size_help_watches" : "size_help_apparel")}</p>
            </details>
            <details>
              <summary>${t("pd_delivery_caps")}</summary>
              <p>${t("pd_delivery_text", { days: CFG.deliveryDays })}</p>
              <p>${t("seller_text", { brand: esc(CFG.brand) })}</p>
              <p><a href="${esc(tgUrl())}" target="_blank" rel="noopener">Telegram @${esc(CFG.contacts.telegram)}</a> · ${esc(CFG.contacts.phoneDisplay)}</p>
            </details>
          </div>
        </div>
      </div>
      ${related.length ? `<section class="sec rec">
        <h2 class="rec-h">${t("recommended")}</h2>
        <div class="rail rail-min">${related.map(card).join("")}</div>
        <a class="btn btn-outline btn-block" href="#brand-${esc(p.brand)}" data-action="brand" data-brand="${esc(p.brand)}">${t("show_all")}</a>
      </section>` : ""}
      <div class="buybar2"><button class="btn buy2" type="button" data-action="add" data-id="${esc(p.id)}"><span id="buyPrice">${money(priceAt(p, sel))}</span><span>${t("buy_short")}</span></button></div>
    </section>`;
    return { html, title: p.brand + " " + p.name };
  }

  const ICO_PICKUP = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10M8 5l8 4"/></svg>`;
  const ICO_COURIER = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/></svg>`;

  /* ===== Address form (Pont style): type, name, phone, label, map, address ===== */
  function addrLine(a) {
    if (!a) return "";
    const addr = a.address || "";
    const parts = addr.split(",").map(x => x.trim().replace(/^(г\.|город|g\.|city of)\s*/i, "").toLowerCase());
    return a.city && !parts.includes(String(a.city).toLowerCase()) ? a.city + ", " + addr : addr;
  }
  function detectCity(addr) {
    const list = t("cities").split("|");
    const parts = String(addr || "").split(",").map(x => x.trim().replace(/^(г\.|город|g\.|city of)\s*/i, "").toLowerCase());
    return list.find(c => parts.includes(c.toLowerCase())) || list[0];
  }
  const AF_ICO = {
    courier: `<svg viewBox="0 0 48 48" width="34" height="34" fill="none" stroke="#111" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M5 13h22v20H5zM27 20h8l7 7v6H27z"/><circle cx="13" cy="35" r="4" fill="#fff"/><circle cx="35" cy="35" r="4" fill="#fff"/></svg>`,
    pickup: `<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><path d="M8 18l16-8 16 8v18l-16 8-16-8z" fill="none" stroke="#111" stroke-width="3" stroke-linejoin="round"/><path d="M8 18l16 8 16-8M24 26v18" fill="none" stroke="#111" stroke-width="3" stroke-linejoin="round"/><path d="M16 14l16 8" stroke="#111" stroke-width="3"/></svg>`
  };
  function addrFormHtml(a) {
    a = a || {};
    const type = a.type === "pickup" ? "pickup" : "courier";
    const ph = String(a.phone || "").replace(/\D/g, "").replace(/^998/, "");
    const fmt = d => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
    const [first, ...rest] = String(a.first != null ? a.first : (a.name || "")).split(" ");
    const last = a.last != null ? a.last : rest.join(" ");
    const L = (r, e) => (state.lang === "ru" ? r : e);
    return `<div class="af" data-type="${type}">
      <div class="af-lbl">${L("Способ доставки", "Delivery method")}</div>
      <div class="af-types">
        <button type="button" class="af-type" data-af-type="courier" aria-pressed="${type === "courier"}"><span class="af-ico af-ico-c">${AF_ICO.courier}</span><span class="af-tt"><b>${L("Курьер", "Courier")}</b><small>${L("до двери", "to your door")}</small></span></button>
        <button type="button" class="af-type" data-af-type="pickup" aria-pressed="${type === "pickup"}"><span class="af-ico af-ico-p">${AF_ICO.pickup}</span><span class="af-tt"><b>${L("Самовывоз", "Pickup")}</b><small>${L("пункт выдачи", "pickup point")}</small></span></button>
      </div>
      <div class="af-2">
        <label class="af-f"><span class="af-lbl">${L("Имя", "First name")}</span><input class="af-in" id="afFirst" autocomplete="given-name" placeholder="${L("Иван", "John")}" value="${esc(first || "")}"><span class="af-err" id="afFirstErr" hidden></span></label>
        <label class="af-f"><span class="af-lbl">${L("Фамилия", "Last name")}</span><input class="af-in" id="afLast" autocomplete="family-name" placeholder="${L("Иванов", "Smith")}" value="${esc(last || "")}"></label>
      </div>
      <label class="af-f"><span class="af-lbl">${L("Телефон", "Phone")}</span>
        <span class="af-phone"><b>+998</b><input id="afPhone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="99 123 12 12" value="${esc(fmt(ph))}"></span>
        <span class="af-err" id="afPhoneErr" hidden>${L("Введите номер: +998 XX XXX XX XX", "Enter a number: +998 XX XXX XX XX")}</span></label>
      <label class="af-f"><span class="af-lbl">${L("Название (необязательно)", "Label (optional)")}</span><input class="af-in" id="afLabel" placeholder="${L("Дом, офис…", "Home, office…")}" value="${esc(a.label || "")}"></label>
      <div class="af-f"><span class="af-lbl">${L("Адрес на карте", "Address on the map")}</span>
        <div class="af-map" id="afMap"><div class="af-map-canvas" id="afMapCanvas"></div>
          <button type="button" class="af-where" id="afWhere"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 3 3 10.5l7.5 2.5L13 20.5z"/></svg>${L("Где я", "Locate me")}</button>
          <span class="af-hint" id="afHint">${L("Нажмите на карту или «Где я»", "Tap the map or “Locate me”")}</span>
        </div></div>
      <label class="af-f"><span class="af-lbl" id="afAddrLbl">${type === "pickup" ? L("Ваш адрес или ориентир", "Your address or landmark") : L("Адрес доставки", "Delivery address")}</span>
        <textarea class="af-in af-ta" id="afAddress" rows="2" placeholder="${L("г. Ташкент, ул. Амира Темура, д. 1", "Tashkent, Amir Temur st., 1")}">${esc(addrLine(a))}</textarea><span class="af-err" id="afAddressErr" hidden></span></label>
      <div class="af-btns"><button type="button" class="af-cancel" id="afCancel">${L("Отмена", "Cancel")}</button><button type="button" class="af-save" id="afSave">${L("Сохранить", "Save")}</button></div>
    </div>`;
  }
  let leafletP = null;
  function loadLeaflet() {
    if (window.L && window.L.map) return Promise.resolve(window.L);
    if (!leafletP) leafletP = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = () => (window.L ? res(window.L) : rej());
      s.onerror = () => { leafletP = null; rej(); };
      document.head.appendChild(s);
    });
    return leafletP;
  }
  function mountAddrForm(box, a, onSave, onCancel) {
    a = a || {};
    const $b = sel => box.querySelector(sel);
    let type = a.type === "pickup" ? "pickup" : "courier";
    let pos = a.lat ? { lat: a.lat, lng: a.lng } : null;
    let autoAddr = "";
    const L = (r, e) => (state.lang === "ru" ? r : e);
    box.querySelectorAll("[data-af-type]").forEach(b => b.addEventListener("click", () => {
      type = b.dataset.afType;
      box.querySelectorAll("[data-af-type]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      $b("#afAddrLbl").textContent = type === "pickup" ? L("Ваш адрес или ориентир", "Your address or landmark") : L("Адрес доставки", "Delivery address");
    }));
    const phone = $b("#afPhone");
    phone.addEventListener("input", () => {
      let d = phone.value.replace(/\D/g, "");
      if (d.startsWith("998") && d.length > 9) d = d.slice(3);
      d = d.slice(0, 9);
      phone.value = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
      if (d.length === 9) $b("#afPhoneErr").hidden = true;
    });
    phone.addEventListener("blur", () => { const d = phone.value.replace(/\D/g, ""); $b("#afPhoneErr").hidden = !d.length || d.length === 9; $b(".af-phone").classList.toggle("is-bad", !!d.length && d.length !== 9); });
    // map
    let map = null, marker = null;
    const hint = $b("#afHint");
    const setHint = txt => { hint.textContent = txt; hint.hidden = !txt; };
    const geocode = (lat, lng) => {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${state.lang === "ru" ? "ru" : "en"}&zoom=18`)
        .then(r => r.json()).then(j => {
          const ad = j.address || {};
          const city = ad.city || ad.town || ad.village || ad.state || "";
          const street = ad.road || ad.pedestrian || ad.neighbourhood || ad.suburb || "";
          const txt = [city && (state.lang === "ru" ? "г. " + city : city), street, ad.house_number && (state.lang === "ru" ? "д. " + ad.house_number : ad.house_number)].filter(Boolean).join(", ");
          const ta = $b("#afAddress");
          if (txt && (!ta.value.trim() || ta.value === autoAddr)) { ta.value = txt; autoAddr = txt; $b("#afAddressErr").hidden = true; }
          setHint("");
        }).catch(() => setHint(L("Точка отмечена — допишите адрес ниже", "Pinned — type the address below")));
    };
    const place = (lat, lng, zoom) => {
      pos = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
      if (!map) return;
      const icon = window.L.divIcon({ className: "af-pin", html: "<span></span>", iconSize: [34, 44], iconAnchor: [17, 42] });
      if (marker) marker.setLatLng([lat, lng]); else marker = window.L.marker([lat, lng], { icon }).addTo(map);
      if (zoom) map.setView([lat, lng], zoom);
      setHint(L("Ищем адрес…", "Finding address…"));
      geocode(lat, lng);
    };
    loadLeaflet().then(Lf => {
      if (!box.isConnected) return;
      const c = pos || { lat: 41.3111, lng: 69.2797 };
      map = Lf.map($b("#afMapCanvas"), { zoomControl: false, attributionControl: true }).setView([c.lat, c.lng], pos ? 16 : 11);
      Lf.control.zoom({ position: "bottomleft" }).addTo(map);
      let tileFail = 0;
      Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" })
        .on("tileerror", () => { if (++tileFail === 4) (() => { const m = $b("#afMap"); m.classList.add("is-off"); m.closest(".af-f").hidden = true; })(); }).addTo(map);
      map.on("click", e => place(e.latlng.lat, e.latlng.lng));
      if (pos) place(pos.lat, pos.lng);
      setTimeout(() => map.invalidateSize(), 60);
    }).catch(() => (() => { const m = $b("#afMap"); m.classList.add("is-off"); m.closest(".af-f").hidden = true; })());
    $b("#afWhere").addEventListener("click", () => {
      if (!navigator.geolocation) { toast(L("Геолокация недоступна", "Location unavailable")); return; }
      setHint(L("Определяем местоположение…", "Locating…"));
      navigator.geolocation.getCurrentPosition(p => place(p.coords.latitude, p.coords.longitude, 16),
        () => { setHint(L("Не удалось определить — нажмите на карту", "Couldn't locate — tap the map")); }, { enableHighAccuracy: true, timeout: 10000 });
    });
    $b("#afCancel").addEventListener("click", () => onCancel && onCancel());
    $b("#afSave").addEventListener("click", () => {
      const first = $b("#afFirst").value.trim(), last = $b("#afLast").value.trim();
      const d = phone.value.replace(/\D/g, ""), address = $b("#afAddress").value.trim();
      const errs = [];
      const show = (id, msg) => { const e = $b("#" + id + "Err"); if (msg) { e.textContent = msg; e.hidden = false; errs.push(id); } else if (id !== "afPhone") e.hidden = true; };
      show("afFirst", first ? "" : L("Введите имя", "Enter your name"));
      if (d.length !== 9) { $b("#afPhoneErr").hidden = false; $b(".af-phone").classList.add("is-bad"); errs.push("afPhone"); } else { $b("#afPhoneErr").hidden = true; $b(".af-phone").classList.remove("is-bad"); }
      show("afAddress", address ? "" : L("Укажите адрес на карте или напишите его", "Pin it on the map or type the address"));
      if (errs.length) { $b("#" + errs[0]).focus(); return; }
      onSave({ type, first, last, name: (first + " " + last).trim(), phone: "+998 " + phone.value, label: $b("#afLabel").value.trim(),
        address, city: detectCity(address), lat: pos ? pos.lat : null, lng: pos ? pos.lng : null });
    });
  }

  function addrListHtml() {
    if (!state.addrs.length) return `<div class="addr-empty">${t("addr_empty")}</div>`;
    return state.addrs.map((a, i) => `<label class="addr-card">
      <input type="radio" name="addrPick" value="${i}" ${state.addrSel === i ? "checked" : ""}>
      <span class="addr-dot" aria-hidden="true"></span>
      <span class="addr-txt"><b>${a.label ? esc(a.label) + " · " : ""}${esc(a.name)} · ${esc(a.phone)}</b><span>${esc(addrLine(a))}</span></span>
      <span class="addr-acts"><button type="button" class="addr-act" data-action="addr-edit" data-i="${i}">${t("edit")}</button><button type="button" class="addr-act" data-action="addr-del" data-i="${i}" aria-label="${t("remove")}">×</button></span>
    </label>`).join("");
  }

  function openDrawer() {
    const d = $("#drawer");
    if (!d) return;
    d.hidden = false;
    requestAnimationFrame(() => d.classList.add("is-open"));
    document.body.classList.add("noscroll");
    $$(".menubtn").forEach(b => b.setAttribute("aria-expanded", "true"));
    const route = "#" + (state.route || "home");
    $$(".drawer-list a").forEach(a => a.classList.toggle("is-cur", a.getAttribute("href") === route));
    setTimeout(() => { const x = $(".drawer-x"); if (x) x.focus(); }, 60);
  }
  function closeDrawer() {
    const d = $("#drawer");
    if (!d || d.hidden) return;
    d.classList.remove("is-open");
    document.body.classList.remove("noscroll");
    $$(".menubtn").forEach(b => b.setAttribute("aria-expanded", "false"));
    setTimeout(() => { d.hidden = true; }, 260);
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

  function promoOff() {
    if (!state.promo) return 0;
    return Math.round(cartTotal() * state.promo.pct / 100 / 1000) * 1000;
  }
  function payTotal() { return Math.max(0, cartTotal() - promoOff()); }

  function summaryBox(top, bottom) {
    return `<aside class="summary">
      ${top || ""}
      <div class="sum-row"><span>${plural(count(), "items")}</span><span>${money(cartTotal())}</span></div>
      <div class="sum-row sum-total"><span>${t("total")}</span><span>${money(cartTotal())}</span></div>
      <p class="muted small">${t("total_note")}</p>
      ${bottom || ""}
    </aside>`;
  }

  function viewCart() {
    if (!state.cart.length) {
      return {
        title: t("cart"),
        html: `<section class="wrap page"><div class="page-head"><h1>${t("cart")}</h1></div>
          <div class="empty"><p>${t("cart_empty")}</p><a class="btn btn-primary" href="#catalog">${t("cta_catalog")}</a></div></section>`
      };
    }
    const X = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
    const lines = state.cart.map((l, i) => {
      const p = byId[l.id];
      return `<div class="cl">
        <div class="cl-left">${favBtn(p)}<a href="#p-${esc(p.id)}" tabindex="-1" aria-hidden="true">${media(p, "cl-art")}</a></div>
        <div class="cl-meta">
          <a class="cl-name" href="#p-${esc(p.id)}"><b>${esc(p.brand)}</b> ${esc(p.name)}</a>
          <span class="cl-size">${p.category === "shoes" ? "EU " : ""}${esc(sizeLabel(l.size))}</span>
        </div>
        <div class="cl-qty" role="group" aria-label="${t("qty")}">
          <button type="button" data-action="dec" data-i="${i}" aria-label="${t("less")}" ${l.qty <= 1 ? "disabled" : ""}>−</button>
          <span>${l.qty}</span>
          <button type="button" data-action="inc" data-i="${i}" aria-label="${t("more_qty")}">+</button>
        </div>
        <button type="button" class="cl-x" data-action="remove" data-i="${i}" aria-label="${t("remove")}">${X}</button>
        <strong class="cl-total">${money(priceAt(p, l.size) * l.qty)}</strong>
      </div>`;
    }).join("");
    const box = `<aside class="cbox">
      <h2>${t("cart_sum")}</h2>
      <div class="cb-row"><span>${t("cart_goods")} (${count()})</span><span>${money(cartTotal())}</span></div>
      <div class="cb-row"><span>${t("delivery")}</span><span class="cb-muted">${t("cart_deliv_later")}</span></div>
      <div class="cb-pay"><span>${t("cart_to_pay")}</span><strong>${money(cartTotal())}</strong></div>
      <a class="btn cb-go" href="#checkout" data-action="go-checkout">${t("checkout")}</a>
      <p class="cb-note">${t("cart_note")}</p>
    </aside>`;
    return {
      title: t("cart"),
      html: `<section class="wrap page cart2">
        <div class="page-head"><h1>${t("cart")}</h1></div>
        ${profTabs("cart")}
        <div class="cart-grid"><div class="cl-list"><h2 class="cl-head">${state.lang === "ru" ? "Товары" : "Items"} <span>${plural(count(), "items")}</span></h2>${lines}</div><div class="cart-side">${box}
          <p class="cart-pay-note">${state.lang === "ru" ? "Цены указаны в сумах. Оплата картой Uzcard / Humo через Click и Payme." : "Prices are in UZS. Pay by Uzcard / Humo via Click and Payme."}</p>
          <a class="cart-op" href="${esc(tgUrl(state.lang === "ru" ? "Здравствуйте! Вопрос по корзине" : "Hi! A question about my cart"))}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.4L3.5 20.5l1.6-4.5a8.4 8.4 0 1 1 15.4-4.4Z"/></svg>${state.lang === "ru" ? "Написать оператору" : "Message an operator"}</a>
        </div></div>
      </section>`
    };
  }

  function viewCheckout() {
    if (!state.cart.length) return viewCart();
    if (!storage.get("gd_profile", null)) {
      const va = viewAccount();
      const a = va.html.indexOf("<!--plogin-->"), b = va.html.indexOf("<!--/plogin-->");
      const L = (r, e) => (state.lang === "ru" ? r : e);
      return {
        title: t("co_title"),
        html: `<section class="wrap page prof co-gate">
          <a class="back" href="#cart">← ${t("cart")}</a>
          <div class="page-head"><h1>${L("Оформление заказа", "Checkout")}</h1></div>
          <p class="prof-lead co-gate-lead">${L("Войдите, чтобы оформить заказ. Товары из корзины сохранятся.", "Sign in to place your order. Your cart will be kept.")}</p>
          ${va.html.slice(a, b)}
        </section>`,
        mount(root) {
          const lb = $("#loginBtn", root);
          if (lb) lb.addEventListener("click", () => storage.set("gd_after_login", "checkout"), true);
          storage.set("gd_after_login", "checkout");
          va.mount(root);
        }
      };
    }
    const d = state.draft || {};
    const cities = t("cities").split("|");
    const delivery = ["pickup", "courier"].includes(d.delivery) ? d.delivery : "courier";
    const mini = `<ul class="mini">${state.cart.map(l => {
      const p = byId[l.id];
      return `<li><span>${esc(p.brand + " " + p.name)} · ${esc(sizeLabel(l.size))} × ${l.qty}</span><span>${money(priceAt(p, l.size) * l.qty)}</span></li>`;
    }).join("")}</ul>`;

    const html = `<section class="wrap page">
      <a class="back" href="#cart">← ${t("cart")}</a>
      <div class="page-head"><h1>${t("co_title")}</h1><p class="muted">${t("co_lead")}</p></div>
      <div class="cart-grid">
        <form class="form co-form" id="coForm" novalidate>
          <div class="co-card">
            <h2 class="co-h">${t("get_ways")}</h2>
            <div class="get-opts" role="radiogroup" aria-label="${t("get_ways")}">
              ${[["pickup", ICO_PICKUP], ["courier", ICO_COURIER]].map(([v, ico]) => `<label class="get-opt">
                <input type="radio" name="delivery" value="${v}" ${delivery === v ? "checked" : ""}>
                <span class="get-ico" aria-hidden="true">${ico}</span>
                <span class="get-kind">${t("get_" + v + "_k")}</span>
                <b class="get-name">${t("get_" + v)}</b>
                <span class="get-note">${t("get_" + v + "_n")}</span>
              </label>`).join("")}
            </div>
            <h3 class="co-cap">${t("addr_caps")}</h3>
            <div id="addrList" class="addr-list">${addrListHtml()}</div>
            <div id="addrInline" class="ap-formbox co-afbox" hidden></div>
            <button type="button" class="addr-add" id="addrAddBtn" data-action="addr-new"><span aria-hidden="true">+</span> ${t("addr_add")}</button>
            <p class="err" id="addrErr" hidden>${t("addr_need")}</p>
            <input type="hidden" id="coName" name="name"><input type="hidden" id="coPhone" name="phone"><input type="hidden" id="coCity" name="city"><input type="hidden" id="coAddress" name="address">
            ${field("coComment", t("f_comment"), `<textarea id="coComment" name="comment" placeholder="${t("f_comment_ph")}">${esc(d.comment || "")}</textarea>`)}
          </div>
        </form>
        <aside class="cbox cobox">
          <h2>${t("cart_sum")}</h2>
          ${mini}
          <div class="promo-row">
            <input id="coPromo" form="coForm" name="promo" autocomplete="off" placeholder="${t("promo_ph")}" value="${esc(state.promo ? state.promo.code : "")}" aria-label="${t("promo_ph")}">
            <button type="button" class="promo-btn" data-action="promo">${t("promo_apply")}</button>
          </div>
          <p class="promo-msg" id="promoMsg" ${state.promo ? "" : "hidden"}>${state.promo ? t("promo_ok", { n: state.promo.pct }) : ""}</p>
          <div class="cb-sep"></div>
          <div class="cb-row"><span>${t("cart_goods")}</span><span>${money(cartTotal())}</span></div>
          <div class="cb-row" id="promoRow" ${state.promo ? "" : "hidden"}><span>${t("promo_disc")}</span><span class="cb-minus">−${money(promoOff())}</span></div>
          <div class="cb-row"><span>${t("delivery")}</span><span class="cb-muted">${t("co_deliv_mgr")}</span></div>
          <div class="cb-pay"><span>${t("cart_to_pay")}</span><strong id="coPay">${money(payTotal())}</strong></div>
          <div class="pay-head"><span>${t("pay_method")}</span></div>
          <div class="pay-opts" role="radiogroup" aria-label="${t("pay_method")}">
            ${[["click", "Click"], ["payme", "Payme"]].map(([v, n]) => `<label class="pay-opt">
              <input type="radio" form="coForm" name="pay" value="${v}" ${(d.pay || "click") === v ? "checked" : ""}>
              <span class="pay-ico pay-ico-${v}" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/></svg></span>
              <span class="pay-txt"><b>${n}</b><span>${t("pay_card_via", { m: n })}</span></span>
              <span class="pay-dot" aria-hidden="true"></span>
            </label>`).join("")}
          </div>
          <button class="btn cb-go" id="coSubmit" type="submit" form="coForm">${t("co_confirm")}</button>
          <p class="co-need" id="coNeed"></p>
          <p class="cb-note">${t("co_pay_note")}</p>
        </aside>
      </div>
      <div class="fsheet" id="asheet" hidden>
        <div class="fsheet-back" data-action="addr-close"></div>
        <div class="fsheet-panel" role="dialog" aria-modal="true" aria-labelledby="asheetTitle">
          <div class="fsheet-head"><h2 id="asheetTitle">${t("addr_new")}</h2><button type="button" class="fsheet-x" data-action="addr-close" aria-label="${t("close")}">×</button></div>
          <div class="fsheet-body" id="asheetBody"></div>
        </div>
      </div>
    </section>`;

    return {
      html,
      title: t("co_title"),
      mount(root) {
        const form = $("#coForm", root);
        const draftOf = () => Object.fromEntries(new FormData(form));
        const need = () => {
          const x = Object.fromEntries(new FormData(form));
          const miss = [];
          if (!String(x.address || "").trim()) miss.push(t("addr_word"));
          const b = $("#coSubmit"), n = $("#coNeed");
          b.classList.toggle("is-off", miss.length > 0);
          n.textContent = miss.length ? t("co_need", { list: miss.join(", ") }) : "";
          n.hidden = !miss.length;
        };
        const sync = () => {
          const a = state.addrs[state.addrSel];
          $("#coName").value = a ? a.name : ""; $("#coPhone").value = a ? a.phone : "";
          $("#coCity").value = a ? a.city : ""; $("#coAddress").value = a ? a.address : "";
          if (a) $("#addrErr").hidden = true;
          need();
        };
        const redraw = () => { $("#addrList").innerHTML = addrListHtml(); sync(); };
        const sheet = $("#asheet", root);
        let editing = -1;
        const inline = $("#addrInline", root);
        const closeInline = () => { inline.hidden = true; inline.innerHTML = ""; $("#addrList").hidden = false; $("#addrAddBtn").hidden = false; };
        const openSheet = i => {
          state.draft = draftOf();
          const cur = (form.querySelector('input[name="delivery"]:checked') || {}).value;
          goAddrForm(i, "checkout", cur);
        };
        const closeSheet = () => { sheet.hidden = true; document.body.classList.remove("noscroll"); };
        root.addEventListener("click", e => {
          const b = e.target.closest("[data-action]");
          if (!b) return;
          const act = b.dataset.action;
          if (act === "addr-new") openSheet(-1);
          else if (act === "addr-close") closeSheet();
          else if (act === "addr-edit") { e.preventDefault(); openSheet(Number(b.dataset.i)); }
          else if (act === "addr-del") {
            e.preventDefault();
            const i = Number(b.dataset.i);
            state.addrs.splice(i, 1);
            if (state.addrSel === i) state.addrSel = state.addrs.length ? 0 : -1; else if (state.addrSel > i) state.addrSel--;
            storage.set("gd_addrs", state.addrs); redraw();
          } else if (act === "addr-save") {
            const v = { city: $("#aCity").value, address: $("#aAddress").value.trim(), name: $("#aName").value.trim(), phone: $("#aPhone").value.trim() };
            const dg = v.phone.replace(/\D/g, "");
            const errs = {};
            if (!v.address) errs.aAddress = t("err_address");
            if (!v.name) errs.aName = t("err_name");
            if (!/^998\d{9}$/.test(dg) && !/^\d{9}$/.test(dg)) errs.aPhone = t("err_phone");
            ["aAddress", "aName", "aPhone"].forEach(id => {
              const inp = $("#" + id), er = $("#" + id + "Err");
              if (errs[id]) { inp.setAttribute("aria-invalid", "true"); er.textContent = errs[id]; er.hidden = false; }
              else { inp.removeAttribute("aria-invalid"); er.hidden = true; }
            });
            const bad = Object.keys(errs)[0];
            if (bad) { $("#" + bad).focus(); return; }
            if (editing >= 0) state.addrs[editing] = v; else { state.addrs.push(v); state.addrSel = state.addrs.length - 1; }
            storage.set("gd_addrs", state.addrs); closeSheet(); redraw();
          }
        });
        sheet.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });
        if (state.addrSel < 0 && state.addrs.length) state.addrSel = 0;
        sync();
        form.addEventListener("input", () => { state.draft = draftOf(); need(); });
        form.addEventListener("change", e => {
          if (e.target.name === "addrPick") { state.addrSel = Number(e.target.value); sync(); }
          state.draft = draftOf();
          need();
        });
        form.addEventListener("submit", async e => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(form));
          if (!String(data.address || "").trim()) {
            $("#addrErr").hidden = false;
            openSheet(-1);
            return;
          }
          const built = buildOrder(data);
          let server = null;
          if (CFG.apiBase) {
            const btn = $("#coSubmit");
            btn.disabled = true;
            try {
              const r = await fetch(CFG.apiBase.replace(/\/$/, "") + "/api/orders", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: String(data.name).trim(), phone: String(data.phone).trim(), city: data.city,
                  address: String(data.address).trim(), delivery: data.delivery, pay: data.pay || "click", comment: String(data.comment || "").trim(),
                  items: state.cart.map(l => ({ product_id: l.id, size: l.size, qty: l.qty }))
                })
              });
              if (!r.ok) throw new Error(String(r.status));
              server = await r.json();
            } catch (err) {
              btn.disabled = false;
              toast(t("api_fail"));
              return;
            }
          }
          const o = createOrder({
            type: "cart",
            id: built.id,
            text: built.text,
            total: payTotal(),
            customer: { name: String(data.name).trim(), phone: String(data.phone).trim(), city: data.city, address: String(data.address).trim(), delivery: data.delivery, pay: data.pay || "click", promo: state.promo ? state.promo.code : "" },
            lines: state.cart.map(l => { const p = byId[l.id]; return { pid: p.id, title: p.brand + " " + p.name, size: l.size, qty: l.qty, price: priceAt(p, l.size), cny: (p.sizeCny && p.sizeCny[l.size]) || p.dewuCny }; }),
            ...(server ? { id: server.number, apiToken: server.token, total: server.total, payLinks: server.pay || {} } : {})
          });
          if (!o) { toast(t("store_full")); return; }
          state.cart = [];
          state.draft = null;
          state.promo = null;
          saveCart();
          location.hash = "order-" + o.id;
        });
      }
    };
  }

  function orderNumber() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return "GD-" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + Math.floor(1000 + Math.random() * 9000);
  }

  function buildOrder(data) {
    const id = orderNumber();
    const lines = state.cart.map((l, i) => {
      const p = byId[l.id];
      let s = `${i + 1}. ${p.brand} ${p.name}, ${t("size").toLowerCase()} ${sizeLabel(l.size)}, ${l.qty} ${t("pcs")}, ${money(priceAt(p, l.size) * l.qty)}\n   ${t("article")}: ${code(p)}`;
      if (p.poizonUrl) s += `\n   ${t("adm_link")}: ${p.poizonUrl}`;
      return s;
    });
    const comment = String(data.comment || "").trim();
    const text = [
      `${t("order_word")} ${id}`,
      `${t("f_name")}: ${String(data.name).trim()}`,
      `${t("f_phone")}: ${String(data.phone).trim()}`,
      `${t("f_delivery")}: ${t(data.delivery === "pickup" ? "get_pickup" : "get_courier")}`,
      `${t("f_city")}: ${data.city}`,
      `${t("f_address")}: ${String(data.address).trim()}`,
      `${t("pay_method")}: ${data.pay === "payme" ? "Payme" : "Click"}`,
      "",
      lines.join("\n"),
      "",
      ...(state.promo ? [`${t("promo_word")}: ${state.promo.code} (−${state.promo.pct}%, −${money(promoOff())})`] : []),
      `${t("total")}: ${money(payTotal())}`
    ].concat(comment ? [`${t("f_comment")}: ${comment}`] : []).join("\n");
    return { id, text };
  }

  function viewDone() {
    if (!state.order) return viewCart();
    const o = state.order;
    return {
      title: o.id,
      html: `<section class="wrap page narrow">
        <div class="page-head">
          <span class="eyebrow">${t("done_eyebrow")}</span>
          <h1>${t("done_title", { num: esc(o.id) })}</h1>
          <p class="muted">${t("done_sub")}</p>
        </div>
        ${sendPanel(o.text, t("order_word") + " " + o.id)}
        <button class="btn btn-ghost" type="button" data-action="clear-cart">${t("clear_cart")}</button>
      </section>`
    };
  }

  function viewLink() {
    const html = `<section class="wrap page">
      <div class="page-head">
        <span class="eyebrow">${t("link_eyebrow")}</span>
        <h1>${t("link_title")}</h1>
        <p class="muted prose">${t("link_sub")}</p>
      </div>
      <div class="cart-grid">
        <form class="form" id="linkForm" novalidate>
          ${field("lkUrl", t("f_link"), `<input id="lkUrl" name="url" inputmode="url" autocomplete="off" placeholder="${t("f_link_ph")}">`)}
          ${field("lkItem", t("f_item"), `<input id="lkItem" name="item" autocomplete="off" placeholder="${t("f_item_ph")}">`)}
          <div class="two">
            ${field("lkSize", t("size"), `<input id="lkSize" name="size" autocomplete="off" placeholder="${t("f_size_ph")}">`)}
            ${field("lkColor", t("f_color"), `<input id="lkColor" name="color" autocomplete="off" placeholder="${t("f_color_ph")}">`)}
          </div>
          ${field("lkShot", t("f_shot"), `<input id="lkShot" type="file" accept="image/*"><span class="small muted" id="lkShotMsg"></span><div id="lkShotPrev"></div>`)}
          <div class="two">
            ${field("lkCat", t("f_cat"), `<select id="lkCat" name="cat"><option value="">${t("choose")}</option>${CATS.map(c => `<option value="${c}">${catName(c)}</option>`).join("")}</select>`)}
            ${field("lkContact", t("f_contact"), `<input id="lkContact" name="contact" autocomplete="tel" placeholder="${t("f_contact_ph")}">`)}
          </div>
          <button class="btn btn-primary" type="submit">${t("link_submit")}</button>
        </form>
        <aside class="summary est">
          <span class="eyebrow">${t("link_how")}</span>
          <p>${t("link_how_text")}</p>
        </aside>
      </div>
      <div id="linkOut" class="sec narrow" hidden></div>
    </section>`;

    return {
      html,
      title: t("link_title"),
      mount(root) {
        const form = $("#linkForm", root);
        const estimate = () => null;
        state.linkShot = null;
        $("#lkShot", root).addEventListener("change", async e => {
          const f = e.target.files && e.target.files[0];
          state.linkShot = null;
          $("#lkShotMsg").textContent = "";
          $("#lkShotPrev").innerHTML = "";
          if (!f) return;
          try {
            state.linkShot = await readPhoto(f, 900);
            $("#lkShotMsg").textContent = t("shot_added");
            $("#lkShotPrev").innerHTML = photosHtml([state.linkShot]);
          } catch (err) { }
        });
        form.addEventListener("input", estimate);
        form.addEventListener("change", estimate);
        form.addEventListener("submit", e => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(form));
          const url = String(data.url || "").trim(), item = String(data.item || "").trim();
          const err = $("#lkUrlErr");
          if (!url && !item) {
            $("#lkUrl").setAttribute("aria-invalid", "true");
            err.textContent = t("err_link");
            err.hidden = false;
            $("#lkUrl").focus();
            return;
          }
          $("#lkUrl").removeAttribute("aria-invalid");
          err.hidden = true;
          const price = estimate();
          const rows = [
            t("link_word"),
            url && `${t("f_link")}: ${url}`,
            item && `${t("f_item")}: ${item}`,
            String(data.size || "").trim() && `${t("size")}: ${String(data.size).trim()}`,
            data.cat && `${t("f_cat")}: ${catName(data.cat)}`,
            String(data.cny || "").trim() && `${t("f_cny")}: ${String(data.cny).trim()}`,
            price !== null && `${t("est_price")}: ≈ ${money(price)}`,
            String(data.contact || "").trim() && `${t("f_contact")}: ${String(data.contact).trim()}`
          ].filter(Boolean).join("\n");
          const fields = {
            type: "link",
            text: rows,
            total: null,
            estimate: price,
            customer: { contact: String(data.contact || "").trim() },
            link: { url, item, size: String(data.size || "").trim(), color: String(data.color || "").trim(), cat: data.cat || "", cny: String(data.cny || "").trim(), shot: state.linkShot },
            lines: [{ title: item || url, size: String(data.size || "").trim(), qty: 1, price: null }]
          };
          let o = createOrder(fields);
          if (!o && state.linkShot) { fields.link.shot = null; o = createOrder(fields); }
          const out = $("#linkOut");
          out.innerHTML = `<div class="sec-head"><h2>${t("link_ready")}</h2>${o ? `<a class="btn btn-primary" href="#order-${esc(o.id)}">${t("track_link")}</a>` : ""}</div>
            ${state.linkShot ? `<p class="small muted">${t("shot_tg")}</p>` : ""}${sendPanel(rows, t("link_word"))}`;
          out.hidden = false;
          out.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        });
      }
    };
  }

  function viewDelivery() {
    return {
      title: t("del_title"),
      html: `
      <section class="dlv-hero">
        <div class="wrap">
          <h1>${t("dlv_h", { days: CFG.deliveryDays })}</h1>
          <p>${t("dlv_p")}</p>
          <div class="dlv-steps">
            ${[["cart", "dlv_s1"], ["box", "dlv_s2"], ["plane", "dlv_s3"], ["truck", "dlv_s4"]].map(([ic, k], i) => {
              const I = {
                cart: '<path d="M2.5 3.5h2.3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1l1.6-6.8H6.1"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
                box: '<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10M8 5l8 4"/>',
                plane: '<path d="M21 4.5c.6-.6.6-1.5 0-2.1s-1.5-.6-2.1 0L15 6.3 5.6 4 4 5.6l7.6 4.6-3.6 3.6-2.8-.4L4 14.6l3.4 1.9L9.3 20l1.2-1.2-.4-2.8 3.6-3.6 4.6 7.6 1.6-1.6L17.7 9Z"/>',
                truck: '<path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'
              };
              const d = (CFG.deliverySteps || [])[i];
              return `<div class="dlv-step"><span class="dlv-ico"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[ic]}</svg></span><b>${t(k)}</b>${d ? `<span>${esc(d)}</span>` : ""}</div>`;
            }).join("")}
          </div>
        </div>
      </section>
      <section class="dlv-help">
        <div class="wrap">
          <span class="dlv-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="13.5" width="4" height="6" rx="1.6"/><rect x="16.5" y="13.5" width="4" height="6" rx="1.6"/></svg></span>
          <h2>${t("help_h")}</h2>
          <p>${t("help_p")}</p>
          <a class="dlv-help-btn" href="${esc(tgUrl())}" target="_blank" rel="noopener">${t("help_btn")}</a>
        </div>
      </section>`
    };
  }

  function viewContacts() {
    const c = CFG.contacts;
    const block = (label, value, actions) => `<div class="ccard">
      <span class="eyebrow">${label}</span>
      <span class="val">${esc(value)}</span>
      <div class="row">${actions}<button class="btn btn-ghost" type="button" data-action="copy-val" data-val="${esc(value)}">${ICON.copy}${t("copy_short")}</button></div>
    </div>`;
    return {
      title: t("contacts_title"),
      html: `<section class="wrap page">
        <div class="page-head"><h1>${t("contacts_title")}</h1><p class="muted">${t("contacts_sub")}</p></div>
        <div class="cgrid">
          ${block("Telegram", "@" + c.telegram, `<a class="btn btn-primary" href="${esc(tgUrl())}" target="_blank" rel="noopener">${ICON.send}${t("open_tg")}</a>`)}
          ${block(t("email"), c.email, `<a class="btn btn-ghost" href="mailto:${esc(c.email)}">${ICON.mail}${t("write")}</a>`)}
          ${block(t("phone"), c.phoneDisplay, `<a class="btn btn-ghost" href="${esc(telUrl())}">${ICON.phone}${t("call")}</a>`)}
        </div>
      </section>`
    };
  }

  function viewPricing() {
    const pct = v => {
      const x = Math.round(v * 1000) / 10;
      return (Number.isInteger(x) ? String(x) : x.toFixed(1)) + "%";
    };
    const rows = PRODUCTS.map(p => {
      const comp = typeof p.competitorUzs === "number" && p.competitorUzs > 0 ? p.competitorUzs : null;
      return { p, comp, diff: comp ? (p.price - comp) / comp : null };
    });
    const compared = rows.filter(r => r.diff !== null);
    let summary = t("pr_no_comp");
    if (compared.length) {
      const avg = compared.reduce((s, r) => s + r.diff, 0) / compared.length;
      summary = t(avg <= 0 ? "pr_cheaper" : "pr_dearer", { pct: Math.abs(avg * 100).toFixed(1), n: compared.length });
    }
    const html = `<section class="wrap page">
      <div class="page-head"><h1>${t("pricing_title")}</h1><p class="muted prose">${t("pricing_note")}</p></div>
      <div class="kv">
        <div><span>${t("pr_rate")}</span><span>1 ¥ = ${money(CFG.cnyToUzs)}</span></div>
        <div><span>${t("pr_round")}</span><span>${t("pr_up_to", { n: num(CFG.roundTo) })}</span></div>
      </div>
      <div class="markups">${CATS.map(c => `<div><span>${catName(c)}</span><b>+${pct(CFG.markups[c] || 0)}</b></div>`).join("")}</div>
      <p class="callout">${summary}</p>
      <div class="tbl-wrap"><table>
        <thead><tr><th>${t("pr_item")}</th><th>${t("pr_cat")}</th><th class="num">${t("pr_base")}</th><th class="num">${t("pr_markup")}</th><th class="num">${t("pr_retail")}</th><th class="num">${t("pr_comp")}</th><th class="num">${t("pr_diff")}</th></tr></thead>
        <tbody>${rows.map(({ p, comp, diff }) => `<tr>
          <td><a href="#p-${esc(p.id)}">${esc(p.brand + " " + p.name)}</a></td>
          <td>${catName(p.category)}</td>
          <td class="num">¥${num(p.dewuCny)}</td>
          <td class="num">+${pct(CFG.markups[p.category])}</td>
          <td class="num">${money(p.price)}</td>
          <td class="num">${comp ? money(comp) : "—"}</td>
          <td class="num">${diff === null ? "—" : (diff > 0 ? "+" : "") + (diff * 100).toFixed(1) + "%"}</td>
        </tr>`).join("")}</tbody>
      </table></div>
    </section>`;
    return { html, title: t("pricing_title") };
  }

  function viewNotFound() {
    return {
      title: t("nf_title"),
      html: `<section class="wrap page"><div class="page-head"><h1>${t("nf_title")}</h1></div><div class="empty">
        <p>${t("nf_text")}</p>
        <div class="row"><a class="btn btn-primary" href="#home">${t("to_home")}</a><a class="btn btn-ghost" href="#catalog">${t("nav_catalog")}</a></div>
      </div></section>`
    };
  }

  /* Orders: demo, stored in this browser */

  const STATUS_FLOW = ["review", "awaiting_payment", "sent", "paid", "packing", "in_transit", "delivered"];
  const STAGE_OF = { review: 1, awaiting_payment: 1, sent: 1, cancelled: 1, paid: 2, packing: 2, refunded: 2, in_transit: 3, delivered: 3 };
  const ROLES = ["manager", "courier"];
  const ROLE_TASKS = { manager: ["review", "awaiting_payment", "sent", "paid", "packing"], courier: ["in_transit"] };
  const NEXT = { awaiting_payment: "paid", sent: "paid", paid: "packing", packing: "in_transit", in_transit: "delivered" };
  const NEXT_LABEL = { awaiting_payment: "adm_mark_paid", sent: "adm_mark_paid", paid: "adm_start_packing", packing: "adm_send", in_transit: "adm_delivered" };
  const COURIERS = ["Fargo", "Yandex Delivery", "BTS", "own"];
  const PAY_METHODS = ["Click", "Payme", "Uzum Pay", "Visa / Mastercard"];

  let ORDERS = storage.get("gd_orders", []);
  if (!Array.isArray(ORDERS)) ORDERS = [];
  const OLD_STATUS = { ready_to_buy: "paid", bought: "packing", at_warehouse: "packing", shipped: "in_transit", customs: "in_transit", released: "in_transit", tashkent: "in_transit", courier: "in_transit" };
  ORDERS.forEach(o => {
    if (OLD_STATUS[o.status]) o.status = OLD_STATUS[o.status];
    (o.history || []).forEach(h => { if (OLD_STATUS[h.status]) h.status = OLD_STATUS[h.status]; });
  });
  if (!["manager", "courier"].includes(state.role)) state.role = "manager";
  const pendingPhotos = {};

  function saveOrders() {
    try { localStorage.setItem("gd_orders", JSON.stringify(ORDERS)); return true; }
    catch (e) { return false; }
  }
  const orderById = id => ORDERS.find(o => o.id === id);
  const stLabel = s => t("st_" + s);
  const courierName = c => (c === "own" ? t("courier_own") : c);
  const byLabel = b => (b === "client" ? t("by_client") : t("role_" + b));
  function fmtDate(ms) {
    return new Date(ms).toLocaleString(state.lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function pushStatus(o, status, by, extra) {
    o.status = status;
    o.history.push(Object.assign({ status, at: Date.now(), by }, extra || {}));
  }

  function createOrder(fields) {
    const o = Object.assign({ id: orderNumber(), createdAt: Date.now(), history: [] }, fields);
    pushStatus(o, o.type === "link" ? "review" : "awaiting_payment", "client");
    ORDERS.unshift(o);
    if (saveOrders()) return o;
    ORDERS.shift();
    return null;
  }

  function readPhoto(file, max) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, (max || 900) / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
      img.src = url;
    });
  }

  function pill(o) {
    const tone = o.status === "delivered" ? "ok" : (o.status === "refunded" || o.status === "cancelled") ? "bad" : (o.status === "review" || o.status === "awaiting_payment" || o.status === "sent") ? "wait" : "go";
    return `<span class="pill pill-${tone}">${stLabel(o.status)}</span>`;
  }

  function photosHtml(list) {
    if (!list || !list.length) return "";
    return `<div class="photos">${list.map(src => `<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="" loading="lazy"></a>`).join("")}</div>`;
  }

  function timelineHtml(o) {
    const flow = STATUS_FLOW.filter(s => (o.type === "link" || s !== "review") && (s !== "sent" || o.status === "sent"));
    const hist = {};
    o.history.forEach(h => { hist[h.status] = h; });
    const terminal = o.status === "refunded" || o.status === "cancelled";
    let lastStage = 0;
    const items = flow.map((s, idx) => {
      const nextNewStage = idx < flow.length - 1 && STAGE_OF[flow[idx + 1]] !== STAGE_OF[s];
      const h = hist[s];
      const cls = h ? (s === o.status && s !== "delivered" ? "now" : "done") : (terminal ? "skip" : "todo");
      const st = STAGE_OF[s];
      const head = st !== lastStage ? `<li class="tl-stage">${t("stage_n", { n: st })} · ${t("stage_" + st)}</li>` : "";
      lastStage = st;
      const nowDelay = cls === "now" && h ? ` style="--tl-delay:-${Math.min(30, Math.max(0, (Date.now() - h.at) / 1000)).toFixed(1)}s"` : "";
      if (cls === "now" && h) o._tlDelay = Math.min(30, Math.max(0, (Date.now() - h.at) / 1000)).toFixed(1);
      return head + `<li class="tl-item tl-${cls}${nextNewStage ? " tl-last-in-stage" : ""}" data-st="${s}"${nowDelay}>
        <span class="tl-dot" aria-hidden="true"></span>
        <div class="tl-body">
          <span class="tl-label">${stLabel(s)}</span>
          ${h ? `<span class="tl-meta">${fmtDate(h.at)} · ${byLabel(h.by)}</span>` : ""}
          ${h && h.note ? `<p class="tl-note">${esc(h.note)}</p>` : ""}
          ${h && h.courier ? `<p class="tl-note">${esc(t("courier_via", { c: courierName(h.courier) }))}</p>` : ""}
          ${h ? photosHtml(h.photos) : ""}
        </div>
      </li>`;
    }).join("");
    const end = terminal ? (() => {
      const h = hist[o.status];
      return `<li class="tl-item tl-bad"><span class="tl-dot" aria-hidden="true"></span><div class="tl-body">
        <span class="tl-label">${stLabel(o.status)}</span>
        <span class="tl-meta">${fmtDate(h.at)} · ${byLabel(h.by)}</span>
        ${h.note ? `<p class="tl-note">${esc(h.note)}</p>` : ""}</div></li>`;
    })() : "";
    const nd = o._tlDelay ? ` style="--tl-next-delay:-${o._tlDelay}s"` : "";
    delete o._tlDelay;
    return `<ol class="timeline"${nd}>${items}${end}</ol>`;
  }

  function orderLinesHtml(o) {
    return `<ul class="mini">${o.lines.map(l => `<li><span>${esc(l.title)}${l.size ? " · " + esc(sizeLabel(l.size)) : ""}${l.qty > 1 ? " × " + l.qty : ""}</span><span>${l.price ? money(l.price * l.qty) : "—"}</span></li>`).join("")}</ul>`;
  }

  function viewFavs() {
    const list = state.favs.map(id => byId[id]).filter(Boolean);
    return {
      title: t("favs_title"),
      html: `<section class="wrap page">
        <div class="page-head"><h1>${t("nav_favs")}</h1></div>
        ${profTabs("favs")}
        <p class="prof-lead">${plural(list.length, "items")}</p>
        ${list.length ? `<div class="grid">${list.map(card).join("")}</div>`
          : `<div class="empty"><p>${t("favs_empty")}</p><a class="btn btn-primary" href="#catalog">${t("cta_catalog")}</a></div>`}
      </section>`
    };
  }

  function viewShop() {
    const row = (href, title, sub, ic) => `<a class="mrow" href="${href}"><span class="mrow-ic">${ic}</span><span class="mrow-t"><b>${title}</b>${sub ? `<span>${sub}</span>` : ""}</span><span class="mrow-go" aria-hidden="true">›</span></a>`;
    const cats = CATS.filter(c => WEAR(c) && PRODUCTS.some(p => p.category === c));
    const accCats = ACC.filter(c => PRODUCTS.some(p => p.category === c));
    return {
      title: t("tab_shop"),
      html: `<section class="wrap page">
        <div class="page-head"><h1>${t("tab_shop")}</h1></div>
        <div class="mlist">
          ${row("#catalog", t("nav_catalog"), plural(PRODUCTS.filter(p => WEAR(p.category)).length, "items"), art("shoes", "#F4F4EF"))}
          ${row("#brands", t("nav_brands"), plural(BRANDS.length, "brcount").replace(/товар\w*|items?/, t("brands_word")), art("accessories", "#BDFF14"))}
        </div>
        <h2 class="h-sm mlist-h">${t("dept_wear")}</h2>
        <div class="mlist">${cats.map(c => row("#catalog-" + c, catName(c), plural(PRODUCTS.filter(p => p.category === c).length, "items"), art(c, CAT_COLORS[c]))).join("")}</div>
        <h2 class="h-sm mlist-h">${t("dept_acc")}</h2>
        <div class="mlist">${row("#catalog-acc", t("dept_acc_all"), plural(PRODUCTS.filter(p => ACC.includes(p.category)).length, "items"), art("accessories", "#BDFF14"))}${accCats.map(c => row("#catalog-" + c, catName(c), plural(PRODUCTS.filter(p => p.category === c).length, "items"), art(c, CAT_COLORS[c]))).join("")}</div>
      </section>`
    };
  }

  const PI = {
    orders: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/></svg>`,
    favs: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.6 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.4 3.1 4.2 6.3C19.5 15.4 12 20 12 20z"/></svg>`,
    addr: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
    support: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/></svg>`,
    truck: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>`,
    globe: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>`,
    ext: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>`,
    go: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>`,
    out: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/></svg>`
  };

  const apiUrl = path => CFG.apiBase ? CFG.apiBase.replace(/\/$/, "") + path : "";
  let tgCfgPromise = null;
  function telegramConfig() {
    const onDomain = !CFG.siteDomain || location.hostname === CFG.siteDomain;
    if (onDomain && CFG.telegramBotId && /^\d+$/.test(String(CFG.telegramBotId))) return Promise.resolve({ enabled: true, bot_id: String(CFG.telegramBotId), bot_username: CFG.telegramBot });
    if (!CFG.apiBase || !CFG.telegramBot) return Promise.resolve(null);
    if (!tgCfgPromise) tgCfgPromise = fetch(apiUrl("/api/auth/telegram/config")).then(r => r.ok ? r.json() : null).then(c => (c && c.enabled ? c : null)).catch(() => null);
    return tgCfgPromise;
  }
  function telegramLoginUrl(cfg) {
    const back = location.origin + location.pathname;
    return "https://oauth.telegram.org/auth?bot_id=" + encodeURIComponent(cfg.bot_id) + "&origin=" + encodeURIComponent(location.origin) +
      "&request_access=write&return_to=" + encodeURIComponent(back);
  }
  async function finishTelegramLogin(raw) {
    const afterLogin = storage.get("gd_after_login", "") === "checkout" ? "#checkout" : "#account";
    storage.set("gd_after_login", "");
    history.replaceState(null, "", location.pathname + afterLogin);
    let data = null;
    try { data = JSON.parse(decodeURIComponent(escape(atob(raw.replace(/-/g, "+").replace(/_/g, "/"))))); } catch (e) { }
    if (!data || !data.id) { toast(t("tg_fail")); onRoute(); return; }
    if (!CFG.apiBase) {
      // no server yet: show the name Telegram returned (the server, when added, verifies the signature)
      storage.set("gd_loggedout", false);
      const old = storage.get("gd_profile", null) || {};
      storage.set("gd_profile", { name: [data.first_name, data.last_name].filter(Boolean).join(" "), phone: old.phone || "", tg: data.username || "", tgId: String(data.id), photo: data.photo_url || "" });
      toast(t("login_done"));
      onRoute();
      return;
    }
    try {
      const r = await fetch(apiUrl("/api/auth/telegram"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(String(r.status));
      const res = await r.json(), u = res.user || {};
      const old = storage.get("gd_profile", null) || {};
      storage.set("gd_profile", { name: [u.first_name, u.last_name].filter(Boolean).join(" "), phone: old.phone || "", tg: u.username || "", tgId: String(u.id), photo: u.photo_url || "", token: res.token });
      toast(t("login_done"));
    } catch (e) { toast(t("tg_fail")); }
    onRoute();
  }

  function getProfile() {
    const pr = storage.get("gd_profile", null);
    const a = state.addrs[0];
    return { name: (pr && pr.name) || (a && a.name) || "", phone: (pr && pr.phone) || (a && a.phone) || "", tg: (pr && pr.tg) || "", photo: (pr && pr.photo) || "" };
  }

  function profTabs(active) {
    return `<nav class="ptabs" aria-label="${t("tab_account")}">
      ${[["orders", "#orders", "nav_orders"], ["favs", "#favorites", "nav_favs"], ["cart", "#cart", "cart"], ["addr", "#addresses", "addr_caps"], ["settings", "#account", "prof_settings"]]
        .map(([k, h, l]) => `<a href="${h}" data-ptab="${k}" class="ptab${k === active ? " is-on" : ""}"${k === active ? ' aria-current="page"' : ""}>${k === "cart" ? ICON.bag.replace(/width="28" height="28"/, 'width="20" height="20"') : PI[k]}<span>${t(l)}</span>${k === "cart" && count() ? `<b class="ptab-n">${count()}</b>` : ""}</a>`).join("")}
    </nav>`;
  }

  // Google sign-in (Google Identity Services). Needs config.googleClientId; works only on the site's own domain.
  let gsiP = null;
  function loadGsi() {
    if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
    if (!gsiP) gsiP = new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "https://accounts.google.com/gsi/client"; sc.async = true; sc.onload = res; sc.onerror = () => { gsiP = null; rej(); }; document.head.appendChild(sc); });
    return gsiP;
  }
  function mountGoogle(el) {
    loadGsi().then(() => {
      if (!el.isConnected) return;
      google.accounts.id.initialize({ client_id: CFG.googleClientId, callback: r => {
        let d = null;
        try { const b = r.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); d = JSON.parse(decodeURIComponent(escape(atob(b)))); } catch (e) {}
        if (!d || !d.sub) { toast(state.lang === "ru" ? "Не удалось войти через Google" : "Google sign-in failed"); return; }
        const old = storage.get("gd_profile", null) || {};
        storage.set("gd_profile", { name: d.name || [d.given_name, d.family_name].filter(Boolean).join(" "), email: d.email || "", photo: d.picture || "", phone: old.phone || "", tg: "", gId: d.sub });
        storage.set("gd_loggedout", false);
        const back = storage.get("gd_after_login", "") === "checkout"; storage.set("gd_after_login", "");
        toast(t("login_done"));
        const ls = $("#loginSheet"); if (ls) { ls.remove(); document.body.classList.remove("noscroll"); }
        if (back) location.hash = "#checkout"; else rerender();
      } });
      const w = Math.min(360, Math.max(220, el.parentElement.clientWidth || 320));
      google.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: w, locale: state.lang === "ru" ? "ru" : "en" });
    }).catch(() => { const w = el.closest(".g-wrap"); if (w) w.hidden = true; });
  }

  // Bottom sheet "sign in to checkout" (opens from the cart, no page change)
  function openLoginSheet() {
    const L = (r, e) => (state.lang === "ru" ? r : e);
    let sh = $("#loginSheet");
    if (sh) sh.remove();
    sh = document.createElement("div");
    sh.className = "lsheet"; sh.id = "loginSheet";
    sh.innerHTML = `<div class="lsheet-back" data-ls="close"></div>
      <div class="lsheet-panel" role="dialog" aria-modal="true" aria-labelledby="lsTitle">
        <button type="button" class="lsheet-x" data-ls="close" aria-label="${t("close")}">×</button>
        <span class="plogin-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 8l4 4-4 4M13 12H3"/></svg></span>
        <h2 id="lsTitle">${L("Войдите, чтобы оформить заказ", "Sign in to check out")}</h2>
        <p>${L("Товары из корзины сохранятся. Вход — через Telegram" + (CFG.googleClientId ? " или Google" : "") + ", без пароля.", "Your cart is kept. Sign in with Telegram" + (CFG.googleClientId ? " or Google" : "") + ", no password.")}</p>
        <button type="button" class="tg-btn ls-tg" data-ls="tg"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M21.6 4.2 2.9 11.4c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.3-1.5ZM9.9 14.9l-.4 4.1-1.6-5 9.9-6.3-7.9 7.2Z"/></svg><span>${t("tg_login")}</span></button>
        ${CFG.googleClientId ? `<div class="g-wrap"><span class="g-or">${L("или", "or")}</span><div id="lsG" class="g-btn"></div></div>` : ""}
      </div>`;
    document.body.appendChild(sh);
    document.body.classList.add("noscroll");
    requestAnimationFrame(() => sh.classList.add("is-open"));
    storage.set("gd_after_login", "checkout");
    const close = () => { sh.classList.remove("is-open"); document.body.classList.remove("noscroll"); setTimeout(() => sh.remove(), 300); };
    sh.addEventListener("click", async e => {
      const b = e.target.closest("[data-ls]"); if (!b) return;
      if (b.dataset.ls === "close") close();
      else if (b.dataset.ls === "tg") {
        const cfg = await telegramConfig();
        if (cfg) { location.replace(telegramLoginUrl(cfg)); return; }
        close(); location.hash = "#checkout"; // no Telegram here (preview): name/phone form on the checkout page
      }
    });
    sh.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    if (CFG.googleClientId) mountGoogle($("#lsG", sh));
  }

  function viewAccount() {
    const pr = getProfile();
    const logged = !!storage.get("gd_profile", null);
    if (!/[\p{L}\p{N}]/u.test(pr.name || "")) pr.name = "";
    const initials = (pr.name || pr.tg || "").trim().split(/\s+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
    const link = (href, ico, label, ext) => `<a class="plink" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}><span class="plink-ico">${ico}</span><span class="plink-t">${label}</span><span class="plink-go">${ext ? PI.ext : PI.go}</span></a>`;
    return {
      title: t("prof_title"),
      html: `<section class="wrap page prof">
        <div class="page-head"><h1>${t("prof_settings")}</h1></div>
        ${profTabs("settings")}
        <p class="prof-lead">${t("prof_lead")}</p>
        ${logged ? `        <div class="pcard">
          <div class="pcard-top"><h2>${t("prof_data")}</h2><button type="button" class="pedit" id="profEditBtn">${t("edit")}</button></div>
          <div class="pwho">
            <span class="pav${initials ? " has" : ""}${pr.photo ? " ph" : ""}" aria-hidden="true">${pr.photo ? `<img src="${esc(pr.photo)}" alt="">` : initials ? esc(initials) : ""}</span>
            <span class="pwho-t"><b>${esc(pr.name || (pr.tg ? "@" + pr.tg : t("prof_guest")))}</b><span>${esc(pr.tg ? "@" + pr.tg : (pr.phone || t("prof_nophone")))}</span></span>
          </div>
          <dl class="prows" id="profRows">
            <div><dt>${t("f_name")}</dt><dd>${esc(pr.name || "—")}</dd></div>
            ${pr.tg ? `<div><dt>Username</dt><dd>@${esc(pr.tg)}</dd></div>` : ""}
            ${storage.get("gd_profile", {}) && (storage.get("gd_profile", {}) || {}).email ? `<div><dt>Email</dt><dd>${esc(storage.get("gd_profile", {}).email)}</dd></div>` : ""}
            ${pr.phone || !pr.tg ? `<div><dt>${t("f_phone")}</dt><dd>${esc(pr.phone || "—")}</dd></div>` : ""}
          </dl>
          <form class="form pform" id="profForm" hidden novalidate>
            ${field("pName", t("f_name"), `<input id="pName" autocomplete="name" value="${esc(pr.name)}">`)}
            ${field("pPhone", t("f_phone"), `<input id="pPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 XX XXX XX XX" value="${esc(pr.phone || "+998 ")}">`)}
            ${field("pTg", t("f_tg"), `<input id="pTg" autocomplete="off" autocapitalize="off" placeholder="@username" value="${esc(pr.tg ? "@" + pr.tg : "")}">`)}
            <div class="pform-btns"><button type="submit" class="btn cb-go">${t("save")}</button><button type="button" class="btn pcancel" id="profCancel">${t("cancel")}</button></div>
          </form>
        </div>` : `<!--plogin--><div class="pcard plogin">
          <span class="plogin-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 8l4 4-4 4M13 12H3"/></svg></span>
          <h2 class="plogin-h">${t("login_h")}</h2>
          <p class="plogin-p">${t("login_p_tg")}</p>
          <button type="button" class="tg-btn" id="loginBtn"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M21.6 4.2 2.9 11.4c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.3-1.5ZM9.9 14.9l-.4 4.1-1.6-5 9.9-6.3-7.9 7.2Z"/></svg><span>${t("tg_login")}</span></button>
          ${CFG.googleClientId ? `<div class="g-wrap"><span class="g-or">${state.lang === "ru" ? "или" : "or"}</span><div id="gBtn" class="g-btn"></div></div>` : ""}
          <p class="tg-fallback" id="tgFallback" hidden>${t("tg_fallback")}</p>
          ${storage.get("gd_loggedout", false) ? `<div class="pout-note"><b>${state.lang === "ru" ? "Вы вышли из аккаунта на сайте" : "You are signed out"}</b><span>${state.lang === "ru" ? "Telegram помнит этот телефон, поэтому при следующем входе может не спросить номер. Чтобы спросил: в Telegram откройте Настройки → Конфиденциальность → Активные сайты → этот сайт → Отключить." : "Telegram remembers this device, so next time it may not ask for your number. To make it ask: Telegram → Settings → Privacy → Active websites → this site → Disconnect."}</span></div>` : ""}
          <form class="form pform" id="profForm" hidden novalidate>
            ${field("pName", t("f_name"), `<input id="pName" autocomplete="name" value="${esc(pr.name)}">`)}
            ${field("pPhone", t("f_phone"), `<input id="pPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 XX XXX XX XX" value="${esc(pr.phone || "+998 ")}">`)}
            ${field("pTg", t("f_tg"), `<input id="pTg" autocomplete="off" autocapitalize="off" placeholder="@username" value="${esc(pr.tg ? "@" + pr.tg : "")}">`)}
            <div class="pform-btns"><button type="submit" class="btn cb-go">${t("login_go")}</button><button type="button" class="btn pcancel" id="profCancel">${t("cancel")}</button></div>
          </form>
          <ul class="plogin-list">
            <li>${PI.orders}<span>${t("login_l1")}</span></li>
            <li>${PI.favs}<span>${t("login_l2")}</span></li>
            <li>${PI.addr}<span>${t("login_l3")}</span></li>
          </ul>
        </div><!--/plogin-->`}
        <h2 class="prof-h2">${t("prof_links")}</h2>
        <div class="plinks">
          ${link(tgUrl(), PI.support, t("prof_support"), true)}
          ${link("#delivery", PI.truck, t("prof_delivery"))}
          ${link("#contacts", PI.phone, t("nav_contacts"))}
          ${link("#home", PI.globe, t("prof_site"))}
          <button type="button" class="plink" data-action="lang"><span class="plink-ico">${PI.globe}</span><span class="plink-t">${t("acct_lang")}: ${state.lang === "ru" ? "Русский" : "English"}</span><span class="plink-go">⇄</span></button>
        </div>
        ${logged ? `<button type="button" class="pout" id="profOut">${PI.out}<span>${t("prof_out")}</span></button>
        <div class="pout-ask" id="profOutAsk" hidden>
          <p>${t("prof_out_q")}</p>
          <div class="pform-btns"><button type="button" class="btn pout-yes" id="profOutYes">${t("prof_out_yes")}</button><button type="button" class="btn pcancel" id="profOutNo">${t("cancel")}</button></div>
        </div>` : ""}
      </section>`,
      mount(root) {
        const form = $("#profForm", root), rows = $("#profRows", root), btn = $("#profEditBtn", root) || $("#loginBtn", root);
        const extra = root.querySelector(".plogin-list");
        if (CFG.googleClientId && $("#gBtn", root)) mountGoogle($("#gBtn", root));
        const toggle = on => { form.hidden = !on; if (rows) rows.hidden = on; btn.hidden = on; if (extra) extra.hidden = on; if (on) $("#pName").focus(); };
        btn.addEventListener("click", async () => {
          if (btn.id === "loginBtn") {
            const cfg = await telegramConfig();
            if (cfg) { location.replace(telegramLoginUrl(cfg)); return; }
            const fb = $("#tgFallback", root); if (fb) fb.hidden = false;
          }
          toggle(true);
        });
        $("#profCancel", root).addEventListener("click", () => { toggle(false); const fb = $("#tgFallback", root); if (fb) fb.hidden = true; });
        form.addEventListener("submit", e => {
          e.preventDefault();
          const name = $("#pName").value.trim(), phone = $("#pPhone").value.trim();
          const tg = ($("#pTg") ? $("#pTg").value : "").trim().replace(/^@+/, "").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
          const dg = phone.replace(/\D/g, "");
          let bad = false;
          [["pName", !name, t("err_name")], ["pPhone", !/^998\d{9}$/.test(dg) && !/^\d{9}$/.test(dg), t("err_phone")]].forEach(([id, isBad, msg]) => {
            const inp = $("#" + id), er = $("#" + id + "Err");
            if (isBad) { inp.setAttribute("aria-invalid", "true"); er.textContent = msg; er.hidden = false; bad = bad || true; }
            else { inp.removeAttribute("aria-invalid"); er.hidden = true; }
          });
          if (bad) return;
          storage.set("gd_profile", { name, phone, tg });
          rerender();
          toast(t(logged ? "prof_saved" : "login_done"));
        });
        const outBtn = $("#profOut", root);
        if (outBtn) outBtn.addEventListener("click", () => { outBtn.hidden = true; $("#profOutAsk").hidden = false; $("#profOutYes").focus(); });
        if (outBtn) $("#profOutNo", root).addEventListener("click", () => { $("#profOutAsk").hidden = true; outBtn.hidden = false; outBtn.focus(); });
        if (outBtn) $("#profOutYes", root).addEventListener("click", () => {
          try { ["gd_profile", "gd_addrs"].forEach(k => localStorage.removeItem(k)); } catch (e) { }
          storage.set("gd_loggedout", true);
          state.addrs = []; state.addrSel = -1;
          rerender();
          toast(t("prof_out_done"));
        });
      }
    };
  }

  function goAddrForm(i, back, type) {
    state.addrBack = back || "addresses"; state.addrType = type || null;
    location.hash = i >= 0 ? "#addr-edit-" + i : "#addr-new";
  }
  function viewAddrForm(i) {
    const L = (r, e) => (state.lang === "ru" ? r : e);
    const a = state.addrs[i];
    if (i >= 0 && !a) return viewAddresses();
    const back = state.addrBack || "addresses";
    const p = getProfile();
    const base = a || { type: state.addrType === "pickup" ? "pickup" : "courier", name: p.name || "", phone: p.phone || "" };
    const backLbl = back === "checkout" ? L("Оформление заказа", "Checkout") : L("Адреса", "Addresses");
    return {
      title: t(a ? "addr_edit" : "addr_new"),
      html: `<section class="wrap page af-page">
        <a class="back-link af-back" href="#${back}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>${backLbl}</a>
        <h1 class="af-h">${t(a ? "addr_edit" : "addr_new")}</h1>
        <div class="ap-formbox af-pagebox" id="afPageBox">${addrFormHtml(base)}</div>
      </section>`,
      mount(root) {
        const box = $("#afPageBox", root);
        box.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") e.preventDefault(); });
        mountAddrForm(box, base, v => {
          if (i >= 0) state.addrs[i] = v; else { state.addrs.push(v); state.addrSel = state.addrs.length - 1; }
          storage.set("gd_addrs", state.addrs);
          if (back === "checkout") state.draft = Object.assign({}, state.draft || {}, { delivery: v.type });
          toast(L("Адрес сохранён", "Address saved"));
          location.hash = "#" + back;
        }, () => { location.hash = "#" + back; });
      }
    };
  }

  function viewAddresses() {
    const L = (r, e) => (state.lang === "ru" ? r : e);
    const PIN = `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#111" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.6"/></svg>`;
    const listHtml = () => state.addrs.length ? state.addrs.map((a, i) => `<div class="ap-card">
        <span class="ap-ico">${a.type === "pickup" ? AF_ICO.pickup : AF_ICO.courier}</span>
        <span class="ap-txt"><b>${esc(a.label || (a.type === "pickup" ? L("Самовывоз", "Pickup") : L("Курьер до двери", "Courier to the door")))}</b>
          <span>${esc(addrLine(a))}</span><small>${esc(a.name)} · ${esc(a.phone)}</small></span>
        <span class="ap-acts"><button type="button" class="ap-act" data-ap="edit" data-i="${i}">${t("edit")}</button><button type="button" class="ap-act ap-del" data-ap="del" data-i="${i}" aria-label="${t("remove")}">×</button></span>
      </div>`).join("")
      : `<div class="ap-empty"><span class="ap-pin">${PIN}</span><b>${L("Нет сохранённых адресов", "No saved addresses")}</b>
          <p>${L("Добавьте адрес доставки — курьер до двери или самовывоз. Он подставится при оформлении заказа.", "Add a delivery address — courier or pickup. It will be filled in at checkout.")}</p></div>`;
    return {
      title: t("addr_caps"),
      html: `<section class="wrap page prof">
        <div class="page-head"><h1>${t("addr_caps")}</h1></div>
        ${profTabs("addr")}
        <p class="ap-lead">${L("Курьер до двери или самовывоз — сохраните один раз.", "Courier to the door or pickup — save it once.")}</p>
        <div id="apList">${listHtml()}</div>
        <div id="apForm" class="ap-formbox" hidden></div>
        <button type="button" class="ap-add" id="apAdd"><span aria-hidden="true">+</span> ${t("addr_add")}</button>
      </section>`,
      mount(root) {
        const list = $("#apList", root), formBox = $("#apForm", root), addBtn = $("#apAdd", root);
        const close = () => { formBox.hidden = true; formBox.innerHTML = ""; addBtn.hidden = false; list.hidden = false; };
        const open = i => {
          const a = state.addrs[i];
          formBox.innerHTML = addrFormHtml(a); formBox.hidden = false; addBtn.hidden = true; list.hidden = true;
          mountAddrForm(formBox, a, v => {
            if (i >= 0) state.addrs[i] = v; else { state.addrs.push(v); state.addrSel = state.addrs.length - 1; }
            storage.set("gd_addrs", state.addrs); list.innerHTML = listHtml(); close();
            toast(L("Адрес сохранён", "Address saved"));
          }, close);
          formBox.scrollIntoView({ block: "start", behavior: "smooth" });
        };
        addBtn.addEventListener("click", () => goAddrForm(-1, "addresses"));
        list.addEventListener("click", e => {
          const b = e.target.closest("[data-ap]"); if (!b) return;
          const i = Number(b.dataset.i);
          if (b.dataset.ap === "edit") goAddrForm(i, "addresses");
          else { state.addrs.splice(i, 1); state.addrSel = state.addrs.length ? 0 : -1; storage.set("gd_addrs", state.addrs); list.innerHTML = listHtml(); }
        });
      }
    };
  }

  function viewOrders() {
    return {
      title: t("orders_title"),
      html: `<section class="wrap page">
        <div class="page-head"><h1>${t("nav_orders")}</h1></div>
        ${profTabs("orders")}
        <p class="prof-lead">${t("orders_demo")}</p>
        ${ORDERS.length ? `<div class="olist">${ORDERS.map(o => `<a class="ocard${["awaiting_payment","sent","paid","packing","in_transit"].includes(o.status) ? " is-checking" : ""}" href="#order-${esc(o.id)}">
            <span class="ocard-top"><b class="mono">${esc(o.id)}</b><span class="muted small">${fmtDate(o.createdAt)} · ${t("type_" + o.type)}</span></span>
            <span class="ocard-items">${esc(o.lines.map(l => l.title).join(", "))}</span>
            <span class="ocard-bottom">${pill(o)}<b>${o.total ? money(o.total) : (o.estimate ? t("est_short", { sum: money(o.estimate) }) : "—")}</b></span>
          </a>`).join("")}</div>`
          : `<div class="empty"><p>${t("orders_empty")}</p><a class="btn btn-primary" href="#catalog">${t("cta_catalog")}</a></div>`}
      </section>`
    };
  }

  function viewOrder(id) {
    const o = orderById(id);
    if (!o) return viewNotFound();
    let action = "";
    // Telegram is only for support now: a small help block instead of "send the order to the manager"
    const tgStep = `<div class="panel ord-help">
        <span class="ord-help-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="13.5" width="4" height="6" rx="1.6"/><rect x="16.5" y="13.5" width="4" height="6" rx="1.6"/></svg></span>
        <div><b>${t("help_h")}</b><p>${t("ord_help_p")}</p></div>
        <a class="dlv-help-btn ord-help-btn" href="${esc(tgUrl(t("ord_help_msg", { id: o.id })))}" target="_blank" rel="noopener">${t("help_btn")}</a>
      </div>`;
    const realPay = o.payLinks && Object.keys(o.payLinks).length;
    if (o.status === "awaiting_payment" && realPay) {
      action = `<div class="panel">
        <h2>${t("pay_real_title")}</h2>
        ${o.payLinks.payme ? `<a class="btn btn-primary btn-block" href="${esc(o.payLinks.payme)}" target="_blank" rel="noopener">${t("pay_with", { m: "Payme" })} · ${money(o.total)}</a>` : ""}
        ${o.payLinks.click ? `<a class="btn btn-primary btn-block" href="${esc(o.payLinks.click)}" target="_blank" rel="noopener">${t("pay_with", { m: "Click" })} · ${money(o.total)}</a>` : ""}
        <p class="muted small">${t("pay_real_note")}</p>
      </div>`;
    } else if (o.status === "review") {
      action = `<div class="panel"><p>${t("price_wait")}</p>${o.estimate ? `<p class="muted">${t("est_short", { sum: money(o.estimate) })}</p>` : ""}</div>`;
    } else if (o.status === "delivered") {
      action = o.review
        ? `<div class="panel"><h2>${t("your_review")}</h2><p class="stars-show" aria-label="${o.review.stars}/5">${"★".repeat(o.review.stars)}${"☆".repeat(5 - o.review.stars)}</p>${o.review.text ? `<p>${esc(o.review.text)}</p>` : ""}</div>`
        : `<form class="panel form" id="reviewForm">
            <h2>${t("review_title")}</h2>
            <fieldset class="stars"><legend>${t("review_stars")}</legend>
              ${[5, 4, 3, 2, 1].map(n => `<input type="radio" id="star${n}" name="stars" value="${n}" ${n === 5 ? "checked" : ""}><label for="star${n}" aria-label="${n}">★</label>`).join("")}
            </fieldset>
            ${field("rvText", t("review_text"), `<textarea id="rvText" name="text" placeholder="${t("review_ph")}"></textarea>`)}
            <button class="btn btn-primary" type="submit">${t("review_send")}</button>
          </form>`;
    }
    const c = o.customer || {};
    const who = [c.name, c.phone, c.contact, c.city, c.address].filter(Boolean).map(esc).join(" · ");
    const shot = o.link && o.link.shot ? `<div class="panel"><h2>${t("f_shot")}</h2>${photosHtml([o.link.shot])}</div>` : "";
    const html = `<section class="wrap page ord-page">
      <a class="back" href="#orders">← ${t("orders_title")}</a>
      <div class="page-head"><h1>${t("order_n", { id: esc(o.id) })}</h1><p>${pill(o)} <span class="muted small">${fmtDate(o.createdAt)} · ${t("type_" + o.type)}</span></p></div>
      <div class="cart-grid">
        <div>
          ${["paid", "packing", "in_transit", "delivered"].includes(o.status) ? `<div class="pay-ok" data-oid="${esc(o.id)}"><span class="pay-ok-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12.5 4 4L18 8.5"/></svg></span><div><b>${t("pay_ok_h")}</b><span>${t("pay_ok_p")}</span></div></div>` : ""}
          <h2 class="h-sm">${t("order_track")}</h2>
          ${timelineHtml(o)}
        </div>
        <aside class="ord-side">
          ${isOwner() && NEXT[o.status] ? `<div class="owner-box"><span>Только вы это видите (владелец)</span><button type="button" class="owner-paid" data-action="owner-paid" data-id="${esc(o.id)}">${{ awaiting_payment: "✓ Деньги пришли — подтвердить оплату", sent: "✓ Деньги пришли — подтвердить оплату", paid: "→ Начали собирать заказ", packing: "→ Отправили, заказ в пути", in_transit: "✓ Заказ доставлен" }[o.status]}</button><button type="button" class="owner-demo" data-action="owner-demo" data-id="${esc(o.id)}">${demoRuns[o.id] ? "■ Остановить демо" : "▶ Демо: сами по 30 секунд (только у вас)"}</button></div>` : ""}
          ${tgStep}
          ${action}
          <div class="summary${["paid", "packing", "in_transit", "delivered"].includes(o.status) ? " summary-paid" : ""}">
            <span class="eyebrow">${t("order_items")}</span>
            ${orderLinesHtml(o)}
            ${["paid", "packing", "in_transit", "delivered"].includes(o.status)
              ? `<div class="sum-row sum-total sum-paid"><span><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="m8 12.5 2.7 2.7L16.5 9.5"/></svg>${t("order_paid")}</span><span>${o.total ? money(o.total) : "—"}</span></div>`
              : ["awaiting_payment", "sent"].includes(o.status)
              ? `<div class="sum-row sum-total sum-check"><span><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3.2 2"/></svg>${t("st_awaiting_payment")}</span><span>${o.total ? money(o.total) : "—"}</span></div><p class="sum-check-note" data-since="${(o.history[o.history.length-1]||{}).at||Date.now()}">${state.lang === "ru" ? "Как только оплата подтвердится, здесь появится «Оплачено»" : "Once payment is confirmed, this will show “Paid”"}</p>`
              : `<div class="sum-row sum-total"><span>${t("order_total")}</span><span>${o.total ? money(o.total) : "—"}</span></div>`}
            ${who ? `<p class="small muted">${t("order_customer")}: ${who}</p>` : ""}
          </div>
          ${shot}
          ${o.text && !tgStep ? `<details class="panel"><summary>${t("order_send")}</summary>${sendPanel(o.text, t("order_word") + " " + o.id)}</details>` : ""}
        </aside>
      </div>
    </section>`;
    return {
      html,
      title: o.id,
      mount(root) {
        const form = $("#reviewForm", root);
        if (!form) return;
        form.addEventListener("submit", e => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(form));
          o.review = { stars: Math.max(1, Math.min(5, Number(d.stars) || 5)), text: String(d.text || "").trim(), at: Date.now() };
          saveOrders();
          toast(t("review_thanks"));
          rerender();
        });
      }
    };
  }

  function adminCard(o, role) {
    const c = o.customer || {};
    const canAct = ROLE_TASKS[role].includes(o.status);
    const note = `<input class="adm-note" id="note-${esc(o.id)}" placeholder="${t("adm_note_ph")}" autocomplete="off">`;
    let acts = "";
    if (canAct) {
      if (o.status === "review") {
        acts = `<label class="small" for="price-${esc(o.id)}">${t("adm_price")}</label>
          <input id="price-${esc(o.id)}" inputmode="numeric" value="${o.estimate || ""}" autocomplete="off">
          ${note}
          <div class="row"><button class="btn btn-primary" type="button" data-action="adm-price" data-id="${esc(o.id)}">${t("adm_send_price")}</button>
          <button class="btn btn-ghost" type="button" data-action="adm-cancel" data-id="${esc(o.id)}">${t("adm_reject")}</button></div>`;
      } else {
        const extra = o.status === "packing"
          ? `<label class="small" for="ph-${esc(o.id)}">${t("adm_photos_opt")}</label>
             <input type="file" id="ph-${esc(o.id)}" accept="image/*" multiple data-oid="${esc(o.id)}">
             <span class="small muted" id="phc-${esc(o.id)}">${pendingPhotos[o.id] ? t("photos_n", { n: pendingPhotos[o.id].length }) : ""}</span>
             ${photosHtml(pendingPhotos[o.id])}
             <label class="small" for="cr-${esc(o.id)}">${t("adm_courier_svc")}</label>
             <select id="cr-${esc(o.id)}">${COURIERS.map(x => `<option value="${esc(x)}">${esc(courierName(x))}</option>`).join("")}</select>`
          : "";
        acts = `${extra}${note}<div class="row">
          <button class="btn btn-primary" type="button" data-action="adm-next" data-id="${esc(o.id)}">${t(NEXT_LABEL[o.status])}</button>
          ${(o.status === "awaiting_payment" || o.status === "sent") ? `<button class="btn btn-ghost" type="button" data-action="adm-cancel" data-id="${esc(o.id)}">${t("adm_cancel_order")}</button>` : ""}
          ${o.status === "paid" ? `<button class="btn btn-ghost" type="button" data-action="adm-refund" data-id="${esc(o.id)}">${t("adm_refund")}</button>` : ""}
        </div>`;
      }
    }
    const link = o.link || null;
    const allPhotos = o.history.reduce((a, h) => a.concat(h.photos || []), []);
    return `<article class="acard${canAct ? " is-task" : ""}">
      <header class="acard-head"><a class="mono" href="#order-${esc(o.id)}"><b>${esc(o.id)}</b></a>${pill(o)}<span class="small muted">${t("type_" + o.type)} · ${fmtDate(o.createdAt)}</span></header>
      ${orderLinesHtml(o)}
      ${link ? `<dl class="facts">
        ${link.url ? `<dt>${t("adm_link")}</dt><dd class="wrap-any">${esc(link.url)}</dd>` : ""}
        ${link.color ? `<dt>${t("f_color")}</dt><dd>${esc(link.color)}</dd>` : ""}
        ${link.cat ? `<dt>${t("f_cat")}</dt><dd>${catName(link.cat)}</dd>` : ""}
        ${link.cny ? `<dt>${t("f_cny")}</dt><dd>¥${esc(link.cny)}</dd>` : ""}
        ${o.estimate ? `<dt>${t("adm_estimate")}</dt><dd>${money(o.estimate)}</dd>` : ""}
      </dl>${link.shot ? photosHtml([link.shot]) : ""}` : ""}
      <p class="small muted">${[c.name, c.phone, c.contact, c.city, c.address, c.pinfl && (t("f_pinfl") + " " + c.pinfl)].filter(Boolean).map(esc).join(" · ")}</p>
      ${o.total ? `<p class="small"><b>${t("order_total")}: ${money(o.total)}</b>${o.payMethod ? ` · ${esc(o.payMethod)}` : ""}</p>` : ""}
      ${!canAct && allPhotos.length ? photosHtml(allPhotos) : ""}
      ${acts ? `<div class="acard-acts">${acts}</div>` : ""}
    </article>`;
  }

  function ownerAllowed() {
    if (location.hostname !== CFG.siteDomain) return true; // claude.ai preview: for testing
    const pr = storage.get("gd_profile", null) || {};
    const list = (CFG.ownerTelegram || []).map(x => String(x).replace(/^@/, "").toLowerCase());
    return !!(list.length && ((pr.tg && list.includes(pr.tg.toLowerCase())) || (pr.tgId && list.includes(String(pr.tgId)))));
  }
  const demoRuns = {};
  function isOwner() { if (!ownerAllowed()) return false; try { return localStorage.getItem("gd_owner") === "1"; } catch (e) { return false; } }
  function viewAdmin() {
    try { localStorage.setItem("gd_owner", "1"); } catch (e) {}
    const role = ROLES.includes(state.role) ? state.role : "manager";
    const tasks = ORDERS.filter(o => ROLE_TASKS[role].includes(o.status));
    const list = state.adminAll ? ORDERS : tasks;
    const count = r => ORDERS.filter(o => ROLE_TASKS[r].includes(o.status)).length;
    const html = `<section class="wrap page">
      <div class="page-head"><h1>${t("adm_title")}</h1><p class="muted prose">${t("adm_note")}</p></div>
      <div class="seg adm-roles" role="group" aria-label="${t("adm_roles")}">
        ${ROLES.map(r => `<button type="button" data-action="adm-role" data-r="${r}" aria-pressed="${r === role}">${t("role_" + r)}${count(r) ? ` <span class="badge">${count(r)}</span>` : ""}</button>`).join("")}
      </div>
      <div class="chips adm-view">
        <button type="button" class="chip" data-action="adm-all" data-v="0" aria-pressed="${!state.adminAll}">${t("adm_tasks", { n: tasks.length })}</button>
        <button type="button" class="chip" data-action="adm-all" data-v="1" aria-pressed="${!!state.adminAll}">${t("adm_all", { n: ORDERS.length })}</button>
      </div>
      <div class="alist">${list.length ? list.map(o => adminCard(o, role)).join("") : `<div class="empty"><p>${t("adm_empty")}</p></div>`}</div>
      ${ORDERS.length ? `<button class="btn btn-ghost" type="button" data-action="adm-clear">${t("adm_clear")}</button>` : ""}
    </section>`;
    return {
      html,
      title: t("adm_title"),
      mount(root) {
        root.addEventListener("change", async e => {
          const input = e.target;
          if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.dataset.oid) return;
          const files = Array.from(input.files || []).slice(0, 6);
          try {
            pendingPhotos[input.dataset.oid] = await Promise.all(files.map(f => readPhoto(f, 900)));
          } catch (err) { pendingPhotos[input.dataset.oid] = []; }
          rerender();
        });
      }
    };
  }

  function adminAction(action, el) {
    const o = orderById(el.dataset.id);
    if (!o) return;
    const role = state.role || "manager";
    const noteEl = $("#note-" + CSS.escape(o.id));
    const note = noteEl ? noteEl.value.trim() : "";
    const extra = note ? { note } : {};
    if (action === "adm-price") {
      const v = Number(String($("#price-" + CSS.escape(o.id)).value).replace(/\D/g, ""));
      if (!(v > 0)) { toast(t("adm_price_err")); return; }
      o.total = v;
      o.lines[0].price = v;
      pushStatus(o, "awaiting_payment", "manager", extra);
    } else if (action === "adm-cancel") {
      pushStatus(o, "cancelled", "manager", extra);
    } else if (action === "adm-refund") {
      pushStatus(o, "refunded", "manager", { note: note || t("note_refund") });
    } else if (action === "adm-next") {
      const to = NEXT[o.status];
      if (!to) return;
      if (o.status === "packing") {
        const ph = pendingPhotos[o.id] || [];
        if (ph.length) extra.photos = ph;
        extra.courier = $("#cr-" + CSS.escape(o.id)).value;
      }
      if ((o.status === "awaiting_payment" || o.status === "sent") && !extra.note) extra.note = t("note_paid_tg");
      pushStatus(o, to, role, extra);
    }
    if (!saveOrders()) {
      o.history.pop();
      o.status = o.history[o.history.length - 1].status;
      toast(t("store_full"));
      return;
    }
    delete pendingPhotos[o.id];
    rerender();
  }

  /* Actions */

  function saveCart() {
    storage.set("gd_cart", state.cart);
    updateCartCount();
  }

  function addToCart(id, btn) {
    const size = state.sizes[id];
    if (!size) {
      const err = $("#sizeErr");
      if (err) err.hidden = false;
      const first = $(".sz") || $(".size-select") || $(".size");
      if (first) first.focus();
      return;
    }
    if (byId[id] && isSoldOut(byId[id], size)) { toast(state.lang === "ru" ? "Этого размера сейчас нет" : "Size sold out"); return; }
    const line = state.cart.find(l => l.id === id && l.size === size);
    if (line) line.qty += 1;
    else state.cart.push({ id, size, qty: 1 });
    saveCart();
    addedFx(btn);
    toast(t("added"), { href: "#cart", label: t("to_cart") });
  }

  function addedFx(btn) {
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cart = $$(".cartbtn").find(c => c.getBoundingClientRect().width > 0);
    // button: smooth "added" state
    if (btn && !btn._fx) {
      const html = btn.innerHTML;
      btn._fx = true;
      btn.classList.add("is-added");
      btn.innerHTML = `<span class="added-in"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>${esc(t("added_short"))}</span>`;
      setTimeout(() => { btn.classList.remove("is-added"); btn.innerHTML = html; btn._fx = false; }, 1500);
    }
    // badge bump
    const badge = $("#cartCount");
    if (badge) { badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump"); }
    if (cart) { cart.classList.remove("cart-bump"); void cart.offsetWidth; cart.classList.add("cart-bump"); }
    if (reduce) return;
    // picture flies to the cart
    const src = $(".pdp-media") || (btn && btn.closest(".card") && btn.closest(".card").querySelector(".card-art"));
    if (!src) return;
    const a = src.getBoundingClientRect();
    const size = Math.min(a.width, a.height, 220);
    const ghost = document.createElement("div");
    ghost.className = "fly-ghost";
    ghost.innerHTML = src.innerHTML;
    Object.assign(ghost.style, { left: a.left + (a.width - size) / 2 + "px", top: Math.max(a.top + (a.height - size) / 2, 70) + "px", width: size + "px", height: size + "px" });
    document.body.appendChild(ghost);
    const g = ghost.getBoundingClientRect();
    let tx, ty;
    if (cart) { const c = cart.getBoundingClientRect(); tx = c.left + c.width / 2 - (g.left + g.width / 2); ty = c.top + c.height / 2 - (g.top + g.height / 2); }
    else { tx = 0; ty = window.innerHeight - g.top; }
    const anim = ghost.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1, borderRadius: "16px" },
      { transform: `translate(${tx * 0.45}px, ${ty * 0.45 - 60}px) scale(.55)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${tx}px, ${ty}px) scale(.08)`, opacity: 0.3, borderRadius: "50%" }
    ], { duration: 750, easing: "cubic-bezier(.45,0,.25,1)" });
    anim.onfinish = () => ghost.remove();
    setTimeout(() => ghost.remove(), 1200);
  }

  function copyText(text, onDone, onFail) {
    try {
      navigator.clipboard.writeText(text).then(onDone, onFail);
    } catch (e) {
      onFail();
    }
  }

  document.addEventListener("click", e => {
    const more = e.target.closest("#pszMore");
    if (more) { const bar = more.closest(".psz-bar"); bar.classList.toggle("is-open"); more.setAttribute("aria-expanded", bar.classList.contains("is-open")); }
    if (e.target.closest(".ptab")) state.keepScroll = true;
  }, true);
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const f = state.filters;

    if (action === "owner-demo") {
      const id = el.dataset.id;
      if (demoRuns[id]) { clearInterval(demoRuns[id]); delete demoRuns[id]; rerender(); return; }
      const step = () => {
        const o = orderById(id);
        if (!o || !NEXT[o.status] || !isOwner()) { clearInterval(demoRuns[id]); delete demoRuns[id]; rerender(); return; }
        pushStatus(o, NEXT[o.status], "manager", NEXT[o.status] === "paid" ? { note: t("note_paid_tg") } : {});
        saveOrders(); rerender();
      };
      demoRuns[id] = setInterval(step, 30000); rerender();
      return;
    }
    if (action === "owner-paid") {
      const o = orderById(el.dataset.id);
      if (o && NEXT[o.status]) {
        const was = o.status;
        pushStatus(o, NEXT[was], "manager", NEXT[was] === "paid" ? { note: t("note_paid_tg") } : {});
        saveOrders(); rerender(); window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (action === "lang") {
      state.lang = state.lang === "ru" ? "en" : "ru";
      storage.set("gd_lang", state.lang);
      renderShell();
      rerender();
    } else if (action === "ad-go") {
      if (state.adGo) state.adGo(Number(el.dataset.i));
    } else if (action === "mq-brand") {
      const b = el.dataset.brand;
      if (PRODUCTS.some(p => p.brand === b)) {
        state.brandCat = "all"; navigate("brand-" + b);
      } else {
        state.brQ = b; state.brTab = "all"; state.brLetter = "all"; navigate("brands");
      }
    } else if (action === "open-filters") {
      const sh = $("#fsheet");
      if (sh) { sh.hidden = false; document.body.classList.add("noscroll"); const x = $(".fsheet-x", sh); if (x) x.focus(); }
    } else if (action === "close-filters") {
      const sh = $("#fsheet");
      if (sh) { sh.hidden = true; document.body.classList.remove("noscroll"); const b = $(".ftoggle"); if (b) b.focus(); }
    } else if (action === "clear-filters") {
      Object.assign(f, { gender: "all", brand: "all", color: "all", size: "all", price: "all", tier: "all" });
      ["brandSel", "sizeSel", "priceSel"].forEach(id => { const el2 = $("#" + id); if (el2) el2.value = "all"; });
      updateCatalog();
    } else if (action === "tier") {
      f.tier = el.dataset.k;
      updateCatalog();
    } else if (action === "color") {
      f.color = el.dataset.c;
      updateCatalog();
    } else if (action === "br-view") {
      state.brView = el.dataset.v;
      storage.set("gd_br_view", state.brView);
      rerender();
    } else if (action === "collection") {
      Object.assign(f, { gender: "all", brand: "all", sort: "popular", q: "", color: "all", size: "all", price: "all", tier: "all" });
      if (el.dataset.tier) f.tier = el.dataset.tier;
      if (el.dataset.price) f.price = el.dataset.price;
      if (el.dataset.sort) f.sort = el.dataset.sort;
      state.keepFilters = true;
    } else if (action === "gender") {
      f.gender = el.dataset.g;
      updateCatalog();
    } else if (action === "reset") {
      Object.assign(f, { gender: "all", brand: "all", sort: "popular", q: "", color: "all", size: "all", price: "all", tier: "all" });
      $("#q").value = "";
      navigate("catalog");
    } else if (action === "brand") {
      state.brandCat = "all";
      navigate("brand-" + el.dataset.brand);
    } else if (action === "brand-cat") {
      state.brandCat = el.dataset.c;
      updateBrandPage();
    } else if (action === "prefilter") {
      if (el.dataset.sort) f.sort = el.dataset.sort;
      if (el.dataset.g) f.gender = el.dataset.g;
    } else if (action === "fav") {
      const id = el.dataset.id;
      state.favs = isFav(id) ? state.favs.filter(x => x !== id) : state.favs.concat(id);
      storage.set("gd_favs", state.favs);
      const on = isFav(id);
      $$(`[data-action="fav"][data-id="${CSS.escape(id)}"]`).forEach(b => {
        b.setAttribute("aria-pressed", String(on));
        b.setAttribute("aria-label", t(on ? "fav_remove" : "fav_add"));
      });
      if (state.route === "favorites") rerender();
    } else if (action === "open-size-help") {
      e.preventDefault();
      const det = $$(".acc-caps details")[1];
      if (det) { det.open = true; det.scrollIntoView({ behavior: "smooth", block: "start" }); }
    } else if (action === "tg-sent") {
      const o = orderById(el.dataset.id);
      if (o && o.status === "awaiting_payment") {
        pushStatus(o, "sent", "client", { note: t("note_sent") });
        saveOrders();
        setTimeout(rerender, 300);
      }
    } else if (action === "adm-role") {
      state.role = el.dataset.r;
      storage.set("gd_role", state.role);
      rerender();
    } else if (action === "adm-all") {
      state.adminAll = el.dataset.v === "1";
      rerender();
    } else if (action === "adm-clear") {
      if (el.dataset.armed !== "1") {
        el.dataset.armed = "1";
        el.dataset.label = el.textContent;
        el.textContent = t("adm_clear_again");
        setTimeout(() => { if (el.isConnected) { el.dataset.armed = ""; el.textContent = el.dataset.label; } }, 4000);
        return;
      }
      ORDERS.length = 0;
      saveOrders();
      rerender();
    } else if (action.startsWith("adm-")) {
      adminAction(action, el);
    } else if (action === "br-tab") {
      state.brTab = el.dataset.k;
      updateBrands();
    } else if (action === "br-group") {
      state.brGroup = el.dataset.k;
      updateBrands();
    } else if (action === "br-letter") {
      state.brLetter = el.dataset.l;
      updateBrands();
    } else if (action === "home-gender") {
      state.homeGender = el.dataset.g === "women" ? "women" : "men";
      storage.set("gd_home_gender", state.homeGender);
      rerender();
    } else if (action === "slide") {
      if (state.showSlide) state.showSlide(Number(el.dataset.i));
    } else if (action === "go-checkout") {
      // not signed in: the checkout page itself shows the sign-in screen (like Pont)
    } else if (action === "size-out") {
      toast(state.lang === "ru" ? "Этого размера сейчас нет на Poizon" : "This size is sold out on Poizon");
    } else if (action === "size") {
      state.sizes[el.dataset.id] = el.dataset.size;
      $$(".size, .sz").forEach(b => b.setAttribute("aria-pressed", String(b === el)));
      const pp = byId[el.dataset.id], pv = priceAt(pp, el.dataset.size);
      const pe = $("#pdpPrice");
      if (pe) { pe.innerHTML = money(pv) + (pp.oldPrice ? ` <s>${money(Math.ceil(pp.oldPrice * sizeFactor(pp, el.dataset.size) / CFG.roundTo) * CFG.roundTo)}</s> <em class="sale-pct">−${pp.salePct}%</em>` : ""); pe.classList.remove("pop"); void pe.offsetWidth; pe.classList.add("pop"); }
      const ps = $("#pdpSplit"); if (ps) ps.innerHTML = splitLine(pv);
      const pb = $("#buyPrice"); if (pb) pb.textContent = money(pv);
      $$(".pbuy-price").forEach(x => { x.textContent = money(pv); });
      const err = $("#sizeErr");
      if (err) err.hidden = true;
    } else if (action === "addr-rm") {
      state.addrs.splice(Number(el.dataset.i), 1);
      state.addrSel = state.addrs.length ? 0 : -1;
      storage.set("gd_addrs", state.addrs);
      rerender();
    } else if (action === "sov-close") {
      closeSearch();
    } else if (action === "sov-g") {
      sovGender = el.dataset.g;
      drawSearch();
    } else if (action === "sov-pick") {
      doSearch(el.dataset.q);
    } else if (action === "sov-cat") {
      Object.assign(state.filters, { q: "", gender: sovGender, brand: "all", color: "all", size: "all", price: "all", tier: "all" });
      const hq = $("#q"); if (hq) hq.value = "";
      closeSearch();
      state.keepFilters = true;
      location.hash = "catalog-" + el.dataset.cat;
    } else if (action === "sov-del") {
      storage.set("gd_recent", recent().filter(x => x !== el.dataset.q));
      drawSearch();
    } else if (action === "sov-clear-all") {
      storage.set("gd_recent", []);
      drawSearch();
    } else if (action === "drawer-open") {
      e.preventDefault();
      openDrawer();
    } else if (action === "drawer-close") {
      closeDrawer();
      if (el.dataset.sort) {
        Object.assign(f, { gender: "all", brand: "all", sort: el.dataset.sort, q: "", color: "all", size: "all", price: "all", tier: "all" });
        state.keepFilters = true;
      }
    } else if (action === "promo") {
      const inp = $("#coPromo"), msg = $("#promoMsg");
      const code = String(inp.value || "").trim().toUpperCase();
      const promos = CFG.promos || {};
      const key = Object.keys(promos).find(k => k.toUpperCase() === code);
      if (!code) { state.promo = null; msg.hidden = true; }
      else if (key && promos[key] > 0) { state.promo = { code: key, pct: promos[key] }; msg.textContent = t("promo_ok", { n: promos[key] }); msg.className = "promo-msg ok"; msg.hidden = false; }
      else { state.promo = null; msg.textContent = t("promo_bad"); msg.className = "promo-msg bad"; msg.hidden = false; }
      const row = $("#promoRow");
      if (row) { row.hidden = !state.promo; row.querySelector(".cb-minus").textContent = "−" + money(promoOff()); }
      $("#coPay").textContent = money(payTotal());
    } else if (action === "add") {
      addToCart(el.dataset.id, el);
    } else if (action === "inc" || action === "dec" || action === "remove") {
      const line = state.cart[Number(el.dataset.i)];
      if (!line) return;
      if (action === "inc") line.qty += 1;
      else if (action === "dec") line.qty = Math.max(1, line.qty - 1);
      else state.cart.splice(Number(el.dataset.i), 1);
      saveCart();
      rerender();
    } else if (action === "thumb") {
      const img = $(".pdp-media img");
      if (img) img.src = el.dataset.src;
      $$(".thumb").forEach(b => b.setAttribute("aria-pressed", String(b === el)));
    } else if (action === "copy") {
      const box = $("#" + el.dataset.target);
      const msg = $("#copyMsg");
      copyText(box.textContent, () => { if (msg) msg.textContent = t("copied"); }, () => {
        const range = document.createRange();
        range.selectNodeContents(box);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        if (msg) msg.textContent = t("copy_fail");
      });
    } else if (action === "copy-val") {
      copyText(el.dataset.val, () => toast(t("copied")), () => toast(t("copy_fail")));
    } else if (action === "clear-cart") {
      state.cart = [];
      state.order = null;
      state.draft = null;
      saveCart();
      toast(t("cart_cleared"));
      navigate("catalog");
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { const sh = $("#fsheet"); if (sh && !sh.hidden) { sh.hidden = true; document.body.classList.remove("noscroll"); } }
  });
  window.addEventListener("hashchange", () => { document.body.classList.remove("noscroll"); onRoute(); });
  renderShell();
  onRoute();

  setInterval(() => {
    document.querySelectorAll(".sum-check-note[data-since]").forEach(el => {
      if (Date.now() - +el.dataset.since >= 30000 && !el.dataset.done) {
        el.dataset.done = 1;
        el.textContent = state.lang === "ru" ? "Проверка заняла дольше обычного — менеджер подтвердит оплату в ближайшее время" : "Taking a bit longer — a manager will confirm your payment shortly";
      }
    });
  }, 1000);

  // 🎉 celebration once per order, when it really becomes paid: fireworks + pop sound + vibration
  function celebrated() { try { return JSON.parse(localStorage.getItem("gd_celebrated") || "[]"); } catch (e) { return []; } }
  function popSound() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ac = popSound.ac || (popSound.ac = new AC()); if (ac.state === "suspended") ac.resume();
      const play = (t0, vol) => {
        const len = Math.floor(ac.sampleRate * 0.12), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
        const src = ac.createBufferSource(); src.buffer = buf;
        const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 0.7;
        const g = ac.createGain(); g.gain.value = vol;
        src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start(ac.currentTime + t0);
      };
      play(0, 1.4); play(0.35, 0.7); play(0.6, 0.5);
    } catch (e) {}
  }
  function fireworks(ox, oy) {
    const cv = document.createElement("canvas"); cv.className = "fw-canvas";
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; document.body.appendChild(cv);
    const cx = cv.getContext("2d"); cx.scale(dpr, dpr);
    const cols = ["#12B53C", "#BDFF14", "#3DDC62", "#FFD23F", "#FF5C8A", "#4FC3FF"];
    const parts = [];
    const burst = (x, y) => { for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 5.5;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: cols[i % cols.length], r: 2 + Math.random() * 2.5 }); } };
    if (ox != null) { burst(ox, oy); burst(ox, oy); }
    setTimeout(() => burst(W * 0.5, H * 0.3), ox != null ? 450 : 0);
    setTimeout(() => burst(W * 0.22, H * 0.22), 800); setTimeout(() => burst(W * 0.78, H * 0.26), 1100);
    setTimeout(() => burst(W * 0.5, H * 0.18), 1450);
    const t0 = performance.now();
    (function frame(now) {
      cx.clearRect(0, 0, W, H);
      parts.forEach(p => { p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.09; p.x += p.vx; p.y += p.vy; p.life -= 0.011;
        if (p.life > 0) { cx.globalAlpha = Math.max(0, p.life); cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill(); } });
      if (now - t0 < 4000) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }
  function celebrate(id) {
    const list = celebrated(); if (list.includes(id)) return;
    list.push(id); try { localStorage.setItem("gd_celebrated", JSON.stringify(list.slice(-50))); } catch (e) {}
    const dot = document.querySelector('.tl-item[data-st="paid"] .tl-dot');
    let ox = null, oy = null;
    if (dot) {
      dot.scrollIntoView({ block: "center" });
      const r = dot.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2;
      const ring = document.createElement("span"); ring.className = "boom-ring";
      ring.style.left = ox + "px"; ring.style.top = oy + "px"; document.body.appendChild(ring);
      const ring2 = ring.cloneNode(); ring2.style.animationDelay = ".15s"; document.body.appendChild(ring2);
      const tag = document.createElement("span"); tag.className = "boom-tag"; tag.textContent = "Оплачено!";
      tag.style.left = (ox + 30) + "px"; tag.style.top = oy + "px"; document.body.appendChild(tag);
      dot.closest(".tl-item").classList.add("tl-boom");
      setTimeout(() => { ring.remove(); ring2.remove(); tag.remove(); }, 2200);
    }
    fireworks(ox, oy); popSound(); setTimeout(popSound, 450);
    try { navigator.vibrate && navigator.vibrate([40, 60, 40, 60, 120]); } catch (e) {}
    const box = document.querySelector(".pay-ok"); if (box) box.classList.add("pay-ok-pop");
  }
  setInterval(() => { const el = document.querySelector(".pay-ok[data-oid]"); if (el) celebrate(el.dataset.oid); }, 500);

  // owner mode: tap the GD logo 5 times quickly (works inside the claude.ai preview where you can't type #admin)
  let logoTaps = [];
  document.addEventListener("click", e => {
    if (!e.target.closest("header .logo") || !ownerAllowed()) return;
    const now = Date.now(); logoTaps = logoTaps.filter(x => now - x < 2500); logoTaps.push(now);
    if (logoTaps.length >= 5) {
      logoTaps = [];
      const on = !isOwner();
      try { on ? localStorage.setItem("gd_owner", "1") : localStorage.removeItem("gd_owner"); } catch (err) {}
      toast(on ? "Режим владельца включён ✓" : "Режим владельца выключен");
      try { navigator.vibrate && navigator.vibrate(60); } catch (err) {}
      setTimeout(() => { if (on && ORDERS.length) location.hash = "#order-" + ORDERS[0].id; rerender(); }, 300);
    }
  }, true);

  // ===== Installable app (PWA): "Установить" button, works on Android, iPhone and computers =====
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; });
  window.addEventListener("appinstalled", () => { installEvt = null; const b = $("#appbar"); if (b) b.hidden = true; toast(state.lang === "ru" ? "Приложение установлено ✓" : "App installed ✓"); });
  if (window.matchMedia && matchMedia("(display-mode: standalone)").matches) { const b = $("#appbar"); if (b) b.hidden = true; }
  if ("serviceWorker" in navigator && location.protocol === "https:" && !/claude|claudeusercontent/.test(location.hostname)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  document.addEventListener("click", async e => {
    if (!e.target.closest("#appInstall")) return;
    if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (er) {} installEvt = null; return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const ru = state.lang === "ru";
    const msg = ios
      ? (ru ? "На iPhone: нажмите «Поделиться» внизу Safari → «На экран «Домой»» → «Добавить»." : "On iPhone: tap Share in Safari → “Add to Home Screen”.")
      : (ru ? "Откройте меню браузера ⋮ → «Установить приложение» или «Добавить на главный экран». На компьютере — значок ⊕ справа в адресной строке Chrome." : "Open the browser menu ⋮ → “Install app” / “Add to Home screen”. On a computer — the ⊕ icon at the right of Chrome's address bar.");
    toast(msg);
  });
})();
