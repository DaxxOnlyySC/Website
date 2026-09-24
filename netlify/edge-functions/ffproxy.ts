const UPSTREAM = "https://freefirejornal.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export default async (req: Request): Promise<Response> => {
  const u = new URL(req.url);
  const target = UPSTREAM + u.pathname + u.search;

  const h = new Headers();
  h.set("User-Agent", UA);
  h.set("Accept", req.headers.get("accept") || "application/json");
  h.set("Accept-Language", "en-US,en;q=0.9");
  h.set("Origin", UPSTREAM);
  h.set("Referer", UPSTREAM + "/");
  const ct = req.headers.get("content-type");
  if (ct) h.set("Content-Type", ct);
  req.headers.forEach((v, k) => {
    const key = k.toLowerCase();
    if (key.startsWith("x-ffj-")) h.set(k, v);
  });

  const init: RequestInit = { method: req.method, headers: h, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") init.body = await req.text();

  try {
    const r = await fetch(target, init);
    const text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ state: "error", message: String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/*" };
