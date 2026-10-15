const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SOURCE_URL = "https://i.jzj9999.com/quoteh5";
const CACHE_MS = 60 * 1000;

let browserPromise = null;
let cache = null;
let scrapePromise = null;

function numberFromText(value) {
  if (value == null) return null;
  const match = String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"]
    }).catch(err => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

async function scrapeGold9999() {
  const browser = await getBrowser();
  const page = await browser.newPage({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36"
  });

  try {
    await page.goto(SOURCE_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector(".price-table-row", { timeout: 15000 });

    await page.waitForFunction(() => {
      return [...document.querySelectorAll(".price-table-row")]
        .some(row => (row.querySelector(".symbol-name")?.textContent || "").trim() === "黄金9999");
    }, { timeout: 15000 });

    const raw = await page.evaluate(() => {
      const rows = [...document.querySelectorAll(".price-table-row")];
      const row = rows.find(r => (r.querySelector(".symbol-name")?.textContent || "").trim() === "黄金9999");
      if (!row) return null;
      const text = sel => row.querySelector(sel)?.textContent?.trim() || null;
      return {
        name: text(".symbol-name"),
        bidPrice: text(".el-col:nth-child(2) .symbole-price span"),
        askPrice: text(".el-col:nth-child(3) .symbole-price span"),
        high: text(".el-col:nth-child(4) .symbol-price-rise"),
        low: text(".el-col:nth-child(4) .symbol-price-fall")
      };
    });

    if (!raw) throw new Error("页面中未找到黄金9999");
    const result = {
      name: raw.name,
      bidPrice: numberFromText(raw.bidPrice),
      askPrice: numberFromText(raw.askPrice),
      high: numberFromText(raw.high),
      low: numberFromText(raw.low),
      fetchedAt: new Date().toISOString(),
      source: "融通金",
      sourceUrl: SOURCE_URL
    };

    if (!Number.isFinite(result.askPrice) || result.askPrice <= 0) {
      throw new Error("黄金9999销售价解析失败");
    }
    return result;
  } finally {
    await page.close().catch(() => {});
  }
}

async function getGold9999(force = false) {
  const now = Date.now();
  if (!force && cache && now - cache.cachedAt < CACHE_MS) {
    return { ...cache.data, stale: false, cache: true };
  }

  if (!scrapePromise) {
    scrapePromise = scrapeGold9999()
      .then(data => {
        cache = { data, cachedAt: Date.now() };
        return { ...data, stale: false, cache: false };
      })
      .finally(() => { scrapePromise = null; });
  }

  try {
    return await scrapePromise;
  } catch (err) {
    if (cache) {
      return {
        ...cache.data,
        stale: true,
        cache: true,
        warning: "融通金页面本次采集失败，返回最近一次融通金成功数据"
      };
    }
    throw err;
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "jewelry-quote-v3.3", time: new Date().toISOString() });
});

app.get("/api/gold", async (req, res) => {
  try {
    const data = await getGold9999(req.query.force === "1");
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, ...data });
  } catch (err) {
    console.error("gold scrape failed:", err);
    res.status(503).json({
      ok: false,
      error: "融通金黄金9999暂时无法读取",
      detail: process.env.NODE_ENV === "production" ? undefined : String(err.message || err)
    });
  }
});

app.get("/mobile-v4.css", (req, res) => {
  res.type("text/css").set("Cache-Control", "no-store");
  res.sendFile(path.join(process.cwd(), "mobile-v4.css"));
});

app.get("/ux-v4.js", (req, res) => {
  res.type("application/javascript").set("Cache-Control", "no-store");
  res.sendFile(path.join(process.cwd(), "ux-v4.js"));
});

app.get("*", (req, res) => {
  const file = path.join(process.cwd(), "index.html");
  let html = fs.readFileSync(file, "utf8");
  html = html.replace("</head>", '<link rel="stylesheet" href="/mobile-v4.css?v=33"></head>');
  html = html.replace("</body>", '<script src="/ux-v4.js?v=33"></script></body>');
  res.type("html").set("Cache-Control", "no-store").send(html);
});

const server = app.listen(PORT, () => {
  console.log(`Jewelry Quote V3.3 listening on :${PORT}`);
});

async function shutdown() {
  server.close();
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      await browser.close();
    } catch (_) {}
  }
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
