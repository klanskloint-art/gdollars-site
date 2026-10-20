// G&Dllars × Poparce (poizon-api.com) — live photos, sizes, stock and prices from Poizon (Dewu).
// API: GET {base}/searchProducts?keyword=&limit=&page=   → { total, page, lastId, productList: [{ title, spuId, logoUrl, images[], articleNumber }] }
//      GET {base}/productDetail?spuId=                     → DetailResponseTypeV5 { detail, image, price, saleProperties, skus, layerModel, ... }
// Auth: header "x-api-key". Settings: window.GD_CONFIG.poparce = { token, base, fen }.
(function () {
  "use strict";
  const CFG = (window.GD_CONFIG || {}).poparce || {};
  const BASE = (CFG.base || "https://poizon-api.com/api/dewu").replace(/\/$/, "");
  const ON = !!CFG.token;
  const FEN = CFG.fen !== false;              // Dewu prices are in fen (1/100 ¥)
  const TTL_MATCH = 7 * 864e5, TTL_DETAIL = 3 * 3600e3;
  const LS = "gd_pp_cache";
  let disabledReason = "";

  // ---------- cache (per device) ----------
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { cache = {}; }
  let saveTm;
  const persist = () => { clearTimeout(saveTm); saveTm = setTimeout(() => {
    try {
      const keys = Object.keys(cache);
      if (keys.length > 3000) keys.sort((a, b) => (cache[a].t || 0) - (cache[b].t || 0)).slice(0, keys.length - 2500).forEach(k => delete cache[k]);
      localStorage.setItem(LS, JSON.stringify(cache));
    } catch (e) {}
  }, 400); };
  const fresh = (e, ttl) => e && Date.now() - (e.t || 0) < ttl;

  // ---------- requests (max 3 at a time) ----------
  // Poparce limit: 3 requests per second → start at most one request every 400 ms.
  let running = 0, lastStart = 0, timer = null; const queue = [];
  function pump() {
    if (timer || !queue.length || running >= 2) return;
    const wait = Math.max(0, lastStart + 400 - Date.now());
    timer = setTimeout(() => {
      timer = null;
      if (!queue.length || running >= 2) return;
      const job = queue.shift(); running++; lastStart = Date.now();
      job().finally(() => { running--; pump(); });
      pump();
    }, wait);
  }
  function get(path, params) {
    if (!ON) return Promise.reject(new Error("no token"));
    if (disabledReason) return Promise.reject(new Error(disabledReason));
    const url = BASE + path + "?" + new URLSearchParams(params).toString();
    return new Promise((resolve, reject) => {
      queue.push(() => fetch(url, { headers: { "x-api-key": CFG.token, "Accept": "application/json" } })
        .then(async r => {
          if (r.status === 401) { disabledReason = "Токен не принят (401)"; throw new Error(disabledReason); }
          if (!r.ok) { let t = ""; try { t = (await r.text()).slice(0, 160); } catch (e) {} throw new Error("HTTP " + r.status + (t ? " — " + t : "") + (r.headers.get("x-upstream") ? " [" + r.headers.get("x-upstream") + "]" : "")); }
          return r.json();
        })
        .then(resolve, err => {
          if (err instanceof TypeError) disabledReason = "Сервер не разрешил запрос из браузера (CORS) или нет сети";
          reject(err);
        }));
      pump();
    });
  }

  // ---------- helpers ----------
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9一-鿿]+/g, " ").trim();
  const yuan = v => { const n = Number(v); if (!(n > 0)) return 0; return Math.round(FEN ? n / 100 : n); };
  const cleanSize = s => String(s || "").replace(/[　-鿿＀-￯()（）【】\[\]]+/g, " ").replace(/\s+/g, " ").trim();
  const isUrl = u => typeof u === "string" && /^https?:\/\//.test(u);

  // ---------- search: product → Poizon spu ----------
  function keywordFor(p) {
    if (p.article) return p.article;
    return [p.brand, p.name].join(" ").replace(/['"]/g, " ").replace(/\s+/g, " ").trim();
  }
  function pick(list, p) {
    if (!Array.isArray(list) || !list.length) return null;
    const art = norm(p.article);
    if (art) { const hit = list.find(x => norm(x.articleNumber) === art); if (hit) return hit; }
    const brand = norm(p.brand);
    const words = norm(p.name).split(" ").filter(w => w.length > 1 || /\d/.test(w));
    let best = null, bestScore = -1;
    list.forEach((x, i) => {
      const b = norm(x.brandName), t = norm(x.title) + " " + norm(x.seriesName);
      if (b && brand && !b.includes(brand) && !brand.includes(b)) return;
      const hits = words.filter(w => t.includes(w)).length;
      const score = (words.length ? hits / words.length : 0) * 100 - i;
      if (score > bestScore) { best = x; bestScore = score; }
    });
    return bestScore >= 55 ? best : null;
  }
  function match(p) {
    const key = "m:" + p.id, e = cache[key];
    if (fresh(e, TTL_MATCH)) return Promise.resolve(e.v);
    return get("/searchProducts", { keyword: keywordFor(p), limit: 20, page: 0 }).then(res => {
      const x = pick(res && (res.productList || res.list || res.data), p);
      const v = x ? { spuId: x.spuId || x.productId, img: (Array.isArray(x.images) && x.images.find(isUrl)) || (isUrl(x.logoUrl) ? x.logoUrl : ""), title: x.title || "", article: x.articleNumber || "" } : null;
      cache[key] = { t: Date.now(), v }; persist();
      return v;
    });
  }

  // ---------- product detail: photos, sizes, stock, prices ----------
  function parseDetail(d) {
    const det = d.detail || {};
    const images = [];
    const imgs = (((d.image || {}).spuImage || {}).images) || [];
    imgs.forEach(im => { const u = im && (im.url || im); if (isUrl(u) && !images.includes(u)) images.push(u); });
    if (!images.length && isUrl(det.logoUrl)) images.push(det.logoUrl);

    // sale properties: propertyValueId → { name, value }
    const props = {};
    (((d.saleProperties || {}).list) || []).forEach(sp => { props[sp.propertyValueId] = sp; });
    const isSizeProp = sp => sp && /尺码|码|size|尺寸|eu|us|uk/i.test(String(sp.name || "")) ;

    // per-sku price/stock from layerModel (when present)
    const skuInfo = {};
    const layer = (d.layerModel || {}).layer || (d.layerModel || {});
    ((layer && layer.skuInfoList) || []).forEach(s => {
      const ch = (s.tradeChannelInfoList || []).map(c => yuan(c.price)).filter(Boolean);
      const price = yuan(s.minPrice) || (ch.length ? Math.min.apply(null, ch) : 0) || yuan(s.finalPrice);
      skuInfo[s.skuId] = { price, qty: typeof s.remainQty === "number" ? s.remainQty : null };
    });

    const bySize = {};
    (d.skus || []).forEach(sku => {
      const ps = (sku.properties || []).map(pr => props[pr.propertyValueId]).filter(Boolean);
      const sp = ps.find(isSizeProp) || ps[ps.length - 1];
      const size = cleanSize(sp && sp.value);
      if (!size) return;
      const info = skuInfo[sku.skuId] || {};
      const price = info.price || yuan(sku.authPrice);
      const inStock = price > 0 && info.qty !== 0 && (sku.status === undefined || sku.status === 1 || info.price > 0);
      const cur = bySize[size];
      if (!cur || (inStock && (!cur.ok || price < cur.price))) bySize[size] = { price, ok: inStock };
    });
    const sizes = Object.keys(bySize);
    const num = s => { const n = parseFloat(s); return isNaN(n) ? 999 : n; };
    sizes.sort((a, b) => num(a) - num(b) || a.localeCompare(b));
    const sizeCny = {}, soldOut = [];
    sizes.forEach(z => { if (bySize[z].ok) sizeCny[z] = bySize[z].price; else soldOut.push(z); });
    const avail = Object.values(sizeCny);
    const base = yuan(((d.price || {}).item || {}).price);
    return {
      spuId: det.spuId, title: det.title || "", article: det.articleNumber || "", category: det.categoryName || "",
      images, sizes, sizeCny, soldOut, minCny: avail.length ? Math.min.apply(null, avail) : base, anyStock: avail.length > 0 || base > 0
    };
  }
  function detail(spuId) {
    const key = "d:" + spuId, e = cache[key];
    if (fresh(e, TTL_DETAIL)) return Promise.resolve(e.v);
    return get("/productDetail", { spuId }).then(d => {
      const v = parseDetail(d || {});
      cache[key] = { t: Date.now(), v }; persist();
      return v;
    });
  }
  function full(p) {
    const go = spuId => detail(spuId);
    if (p.spuId) return go(p.spuId);
    return match(p).then(m => (m ? go(m.spuId).then(v => Object.assign({ matchTitle: m.title }, v)) : null));
  }

  window.GDPoparce = {
    on: ON, base: BASE,
    status: () => disabledReason,
    cachedImage: p => { const e = cache["m:" + p.id]; return e && e.v && e.v.img ? e.v.img : ""; },
    match, detail, full,
    test: () => get("/searchProducts", { keyword: "nike air force 1", limit: 3, page: 0 }),
    clearCache: () => { cache = {}; try { localStorage.removeItem(LS); } catch (e) {} }
  };
})();
