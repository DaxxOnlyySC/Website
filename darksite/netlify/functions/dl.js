exports.handler = async function () {
  const page = "https://www.mediafire.com/file/0ss36xs41aaikjl/LuaByDax.zip/file";
  try {
    const r = await fetch(page, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0" } });
    const html = await r.text();
    let m = html.match(/https:\/\/download\d*\.mediafire\.com\/[^"']+LuaByDax\.zip/);
    if (!m) m = html.match(/https:\/\/download[^"']+\.mediafire\.com\/[^"']+\.zip/);
    if (m) {
      return { statusCode: 302, headers: { Location: m[0] }, body: "" };
    }
  } catch (e) {}
  return { statusCode: 302, headers: { Location: page }, body: "" };
};
