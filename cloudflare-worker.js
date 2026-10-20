const APIS = ["https://poparce.ru/api/dewu", "https://poizon-api.com/api/dewu"];
const ALLOWED_PATHS = ["/searchProducts", "/productDetail", "/productsDetailSimple", "/getCategories"];

export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "x-api-key, content-type, accept",
      "Access-Control-Expose-Headers": "x-upstream"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (!ALLOWED_PATHS.includes(url.pathname)) {
      return new Response(JSON.stringify({ error: "path not allowed" }), { status: 404, headers: { ...cors, "content-type": "application/json" } });
    }
    const key = request.headers.get("x-api-key") || url.searchParams.get("key") || "";
    url.searchParams.delete("key");
    const reqBody = request.method === "POST" ? await request.text() : undefined;
    let last = null, lastBody = "", lastApi = "";
    for (const api of APIS) {
      const res = await fetch(api + url.pathname + url.search, {
        method: request.method,
        headers: {
          "x-api-key": key,
          "accept": "application/json",
          "content-type": request.headers.get("content-type") || "application/json",
          "user-agent": "Mozilla/5.0 (G&Dllars shop)"
        },
        body: reqBody
      });
      last = res; lastBody = await res.text(); lastApi = api;
      if (res.status !== 403 && res.status !== 404 && res.status < 500) break;
    }
    return new Response(lastBody, {
      status: last.status,
      headers: { ...cors, "x-upstream": lastApi, "content-type": last.headers.get("content-type") || "application/json", "cache-control": "public, max-age=600" }
    });
  }
};
