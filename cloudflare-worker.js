// G&Dllars — посредник для Poparce API (Cloudflare Workers).
// Сайт обращается сюда, Worker пересылает запрос на poizon-api.com и добавляет разрешение CORS.
// Вставьте этот код целиком в Cloudflare → Workers → Edit code → Deploy.
const API = "https://poizon-api.com/api/dewu";
const ALLOWED_PATHS = ["/searchProducts", "/productDetail", "/productsDetailSimple", "/getCategories"];

export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "x-api-key, content-type, accept"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (!ALLOWED_PATHS.includes(url.pathname)) {
      return new Response(JSON.stringify({ error: "path not allowed" }), { status: 404, headers: { ...cors, "content-type": "application/json" } });
    }
    const upstream = await fetch(API + url.pathname + url.search, {
      method: request.method,
      headers: {
        "x-api-key": request.headers.get("x-api-key") || "",
        "accept": "application/json",
        "content-type": request.headers.get("content-type") || "application/json"
      },
      body: request.method === "POST" ? await request.text() : undefined
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { ...cors, "content-type": upstream.headers.get("content-type") || "application/json", "cache-control": "public, max-age=600" }
    });
  }
};
