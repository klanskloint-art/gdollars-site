// G&Dllars — Poizon import (admin).
// Takes a JSON export from an AUTHORISED Poizon source (official API / partner feed / your own export file),
// keeps only products whose brand already exists in the store (window.GD_BRANDS), and maps them to store items:
// all photos, model name, article, current price (¥) and per-size prices when present.
// This module never downloads anything from Poizon by itself — it only reads the file/URL you give it.
(function () {
  "use strict";

  // ---------- Data structure for imported products ----------
  // window.GD_POIZON = {
  //   importedAt: "2026-10-20T18:00:00.000Z",
  //   source: "poizon-feed.json",
  //   stats: { total, matched, skipped, invalid, duplicates },
  //   items: [ PoizonItem, ... ]
  // }
  // PoizonItem = {
  //   id: "pz-DD8959-100",          // stable id from the article
  //   source: "poizon",
  //   brand: "Nike",                // brand name exactly as in the store (GD_BRANDS)
  //   name: "Air Force 1 '07",      // model name without the brand
  //   article: "DD8959-100",        // style code / артикул
  //   category: "shoes",            // store category (guessed when the feed has none)
  //   gender: "unisex",
  //   dewuCny: 689,                 // lowest current price on Poizon, ¥
  //   sizeCny: { "42": 689, ... },  // price per size, ¥ (optional)
  //   sizes: ["40", "41", ...],
  //   soldOut: ["36"],              // sizes listed without a price (optional)
  //   images: ["https://...", ...], // all photos, in feed order
  //   poizonUrl: "https://...",     // optional link for the buyer
  //   updatedAt: "2026-10-20T18:00:00.000Z"
  // }
  const STORE_KEY = "gd_poizon_import";
  window.GD_POIZON = window.GD_POIZON || { importedAt: null, source: "", stats: {}, items: [] };

  // ---------- Brand matching ----------
  const norm = s => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9一-鿿]+/g, "");
  // Common Poizon spellings → store brand names (only applied if that brand exists in the store)
  const ALIASES = {
    "airjordan": "Jordan", "nikejordan": "Jordan", "jordanbrand": "Jordan",
    "newbalancenb": "New Balance", "nb": "New Balance", "asicstiger": "Asics", "thenorthfacetnf": "The North Face", "tnf": "The North Face",
    "usPoloassn": "U.S. Polo Assn.", "uspa": "U.S. Polo Assn.", "lining": "Li-Ning", "levis": "Levi's", "stussy": "Stüssy",
    "耐克": "Nike", "阿迪达斯": "Adidas", "新百伦": "New Balance", "彪马": "Puma", "匡威": "Converse", "万斯": "Vans",
    "亚瑟士": "Asics", "斯凯奇": "Skechers", "安踏": "Anta", "李宁": "Li-Ning", "北面": "The North Face", "鬼塚虎": "Onitsuka Tiger",
    "锐步": "Reebok", "斐乐": "Fila", "卡骆驰": "Crocs", "添柏岚": "Timberland", "萨洛蒙": "Salomon", "拉夫劳伦": "Ralph Lauren"
  };
  function brandIndex() {
    const idx = new Map();
    (window.GD_BRANDS || []).forEach(b => idx.set(norm(b.name), b.name));
    Object.keys(ALIASES).forEach(k => { const target = ALIASES[k]; if (idx.has(norm(target))) idx.set(norm(k), target); });
    return idx;
  }
  function matchBrand(raw, title, idx) {
    const n = norm(raw);
    if (n && idx.has(n)) return idx.get(n);
    // feeds sometimes put the brand only in the title: try the longest store brand that starts the title
    const t = norm(title);
    if (!n && t) {
      let best = null;
      idx.forEach((name, key) => { if (key.length >= 3 && t.startsWith(key) && (!best || key.length > norm(best).length)) best = name; });
      return best;
    }
    return null;
  }

  // ---------- Field mapping (tolerant to different JSON shapes) ----------
  const pick = (o, keys) => { for (const k of keys) { const v = k.split(".").reduce((a, p) => (a == null ? a : a[p]), o); if (v !== undefined && v !== null && v !== "") return v; } return undefined; };
  const isUrl = u => typeof u === "string" && /^https?:\/\/[^\s"'<>]+$/i.test(u.trim());
  function listOf(json) {
    if (Array.isArray(json)) return json;
    for (const k of ["items", "products", "data", "list", "rows", "result", "data.list", "data.items", "data.products"]) {
      const v = pick(json, [k]); if (Array.isArray(v)) return v;
    }
    return [];
  }
  function imagesOf(r) {
    const out = [];
    const add = v => {
      if (!v) return;
      if (Array.isArray(v)) return v.forEach(add);
      if (typeof v === "object") return add(v.url || v.src || v.imgUrl || v.image || v.originUrl);
      if (isUrl(v) && !out.includes(v.trim())) out.push(v.trim());
    };
    ["images", "imageList", "imgList", "pics", "pictures", "photos", "gallery", "logoUrl", "img", "image", "cover", "mainImage", "spuImages"].forEach(k => add(r[k]));
    return out.slice(0, 15);
  }
  function priceNum(v, fen) {
    const n = typeof v === "number" ? v : parseFloat(String(v || "").replace(/[^\d.]/g, ""));
    if (!(n > 0)) return null;
    return Math.round(fen ? n / 100 : n);
  }
  function sizesOf(r, fen) {
    const raw = pick(r, ["sizes", "skus", "skuList", "sizeList", "sizePrices"]);
    const sizeCny = {}, sizes = [], soldOut = [];
    if (Array.isArray(raw)) raw.forEach(s => {
      if (typeof s === "string" || typeof s === "number") { sizes.push(String(s)); return; }
      const z = String(pick(s, ["size", "sizeName", "eu", "EU", "name", "propertyValue"]) || "").replace(/\s*(码|EU)\s*$/i, "").trim();
      if (!z) return;
      const p = priceNum(pick(s, ["price", "minPrice", "lowestPrice", "salePrice", "amount"]), fen);
      sizes.push(z);
      if (p) sizeCny[z] = p; else soldOut.push(z);
    });
    else if (raw && typeof raw === "object") Object.keys(raw).forEach(z => { const p = priceNum(raw[z], fen); sizes.push(z); if (p) sizeCny[z] = p; else soldOut.push(z); });
    return { sizes: Array.from(new Set(sizes)), sizeCny, soldOut };
  }
  function categoryOf(r, title) {
    const c = norm(pick(r, ["category", "categoryName", "category.name", "catName", "type"]) || "");
    const s = (c + " " + String(title || "").toLowerCase());
    if (/鞋|shoe|sneaker|boot|slide|sandal|trainer|кросс|обув/.test(s)) return "shoes";
    if (/hood|卫衣|sweat|худи/.test(s)) return "hoodies";
    if (/t-?shirt|tee|短袖|polo|футбол/.test(s)) return "tshirts";
    if (/jacket|外套|夹克|coat|parka|down|羽绒|куртк/.test(s)) return "jackets";
    if (/short|短裤|шорт/.test(s)) return "shorts";
    if (/pant|jean|trouser|jogger|裤|брюк|джинс/.test(s)) return "pants";
    if (/sock|袜|носк/.test(s)) return "socks";
    if (/cap|hat|帽|кепк/.test(s)) return "caps";
    if (/bag|backpack|包|сумк|рюкзак/.test(s)) return "bags";
    if (/watch|表|час/.test(s)) return "watches";
    return "shoes";
  }

  // ---------- Import (chunked so the admin sees progress) ----------
  function runImport(json, opts, onProgress) {
    return new Promise(resolve => {
      const rows = listOf(json), idx = brandIndex();
      const stats = { total: rows.length, matched: 0, skipped: 0, invalid: 0, duplicates: 0 };
      const ignored = {}, invalidReasons = {}, items = [], seen = new Set();
      const now = new Date().toISOString();
      let i = 0;
      const step = () => {
        const end = Math.min(rows.length, i + 400);
        for (; i < end; i++) {
          const r = rows[i] || {};
          const title = String(pick(r, ["title", "name", "productName", "spuName", "modelName"]) || "").trim();
          const rawBrand = pick(r, ["brand", "brandName", "brand_name", "brand.name", "brandInfo.name"]);
          const brand = matchBrand(rawBrand, title, idx);
          if (!brand) { stats.skipped++; const k = String(rawBrand || "(без бренда)").slice(0, 40); ignored[k] = (ignored[k] || 0) + 1; continue; }
          const article = String(pick(r, ["articleNumber", "article", "styleCode", "style_code", "sku", "spuCode", "productCode", "code"]) || "").trim();
          const sz = sizesOf(r, opts.fen);
          const prices = Object.values(sz.sizeCny);
          const price = priceNum(pick(r, ["price", "minPrice", "lowestPrice", "salePrice", "authPrice"]), opts.fen) || (prices.length ? Math.min.apply(null, prices) : null);
          const images = imagesOf(r);
          const why = !title ? "нет названия" : !article ? "нет артикула" : !price ? "нет цены" : !images.length ? "нет фото" : "";
          if (why) { stats.invalid++; invalidReasons[why] = (invalidReasons[why] || 0) + 1; continue; }
          const key = (brand + "|" + article).toLowerCase();
          if (seen.has(key)) { stats.duplicates++; continue; }
          seen.add(key);
          const name = title.replace(new RegExp("^\\s*" + brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*", "i"), "").trim() || title;
          const category = categoryOf(r, title);
          items.push({
            id: "pz-" + article.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40), source: "poizon", brand, name, article, category,
            gender: /women|wmns|女/.test(title.toLowerCase()) ? "women" : "unisex",
            dewuCny: price, sizeCny: sz.sizeCny, sizes: sz.sizes.length ? sz.sizes : undefined, soldOut: sz.soldOut.length ? sz.soldOut : undefined,
            images, poizonUrl: isUrl(pick(r, ["url", "link", "productUrl", "shareUrl"])) ? String(pick(r, ["url", "link", "productUrl", "shareUrl"])).trim() : undefined,
            updatedAt: now
          });
          stats.matched++;
        }
        onProgress && onProgress(i, rows.length, stats);
        if (i < rows.length) setTimeout(step, 0);
        else resolve({ importedAt: now, source: opts.source || "", stats, ignored, invalidReasons, items });
      };
      step();
    });
  }

  // ---------- Saved preview (owner device) + export file ----------
  function loadSaved() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { return null; } }
  function save(res) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ importedAt: res.importedAt, source: res.source, stats: res.stats, items: res.items })); return true; }
    catch (e) { return false; }
  }
  function exportFile(res) {
    const data = { importedAt: res.importedAt, source: res.source, stats: res.stats, items: res.items };
    const js = "// Poizon import for G&Dllars — generated in #admin-import. Put this file into data/ on the site.\nwindow.GD_POIZON = " + JSON.stringify(data, null, 1) + ";\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([js], { type: "text/javascript" }));
    a.download = "poizon-import.js"; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  // Items the store should show: the published file, plus a local preview on the owner's device.
  function storeItems() {
    const pub = (window.GD_POIZON && window.GD_POIZON.items) || [];
    let local = [];
    try { if (localStorage.getItem("gd_owner") === "1") local = (loadSaved() || {}).items || []; } catch (e) {}
    const byId = new Map(); pub.concat(local).forEach(p => byId.set(p.id, p));
    return Array.from(byId.values());
  }

  window.GDPoizon = { runImport, save, loadSaved, exportFile, storeItems, STORE_KEY, clear() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} } };
})();
