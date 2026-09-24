const UPSTREAM = "https://freefirejornal.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function ffjHeaders(path) {
  const h = {
    "User-Agent": UA,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": UPSTREAM,
    "Referer": UPSTREAM + "/",
    "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "sec-fetch-user": "?1",
    "Upgrade-Insecure-Requests": "1",
  };
  if (path.includes("/profile-preview")) h["X-FFJ-FF-Profile"] = "preview";
  if (path.includes("/account-date")) { h["X-FFJ-FF-Tool"] = "account-date"; h["X-FFJ-Language"] = "en"; }
  if (path.includes("/ranks")) { h["X-FFJ-FF-Tool"] = "ranks"; h["X-FFJ-Language"] = "en"; }
  if (path.includes("/roles")) { h["X-FFJ-FF-Tool"] = "roles"; h["X-FFJ-Language"] = "en"; }
  if (path.includes("/online")) { h["X-FFJ-FF-Tool"] = "online"; h["X-FFJ-Language"] = "en"; }
  return h;
}

exports.handler = async function (event) {
  const params = Object.assign({}, event.queryStringParameters || {});
  const path = params.path || "";
  delete params.path;
  const qs = new URLSearchParams(params).toString();
  const url = UPSTREAM + path + (qs ? "?" + qs : "");

  const headers = ffjHeaders(path);
  const init = { method: event.httpMethod, headers };
  if (event.httpMethod === "POST" && event.body) {
    headers["Content-Type"] = "application/json";
    init.body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf-8") : event.body;
  }

  try {
    const r = await fetch(url, init);
    const text = await r.text();
    return {
      statusCode: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
      body: text,
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "error", message: String(e) }),
    };
  }
};
