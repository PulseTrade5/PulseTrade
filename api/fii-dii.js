// api/fii-dii.js
// Fetches FII/DII provisional cash data from NSE India and caches it in Supabase.
// Two responsibilities:
//  - GET ?action=fetch  -> scrapes NSE (intended to be called by a daily cron, e.g. Vercel Cron at 6 PM IST)
//  - GET (default)      -> returns cached data from Supabase (trend + latest), used by the frontend

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service role needed to write
);

const NSE_BASE = "https://www.nseindia.com";
const NSE_FII_DII_URL = "https://www.nseindia.com/api/fiidiiTradeReact";

const NSE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/reports/fii-dii",
};

// NSE blocks requests without a valid session cookie. We first hit the
// homepage to get cookies, then reuse them on the data endpoint.
async function fetchNseCookies() {
  const res = await fetch(NSE_BASE, { headers: NSE_HEADERS });
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("Failed to get NSE session cookies");
  return setCookie;
}

async function fetchFiiDiiFromNse() {
  const cookies = await fetchNseCookies();

  const res = await fetch(NSE_FII_DII_URL, {
    headers: {
      ...NSE_HEADERS,
      Cookie: cookies,
    },
  });

  if (!res.ok) {
    throw new Error(`NSE responded with ${res.status}`);
  }

  const data = await res.json();
  // NSE returns an array like:
  // [{ category: "DII **", date: "30-Jun-2026", buyValue: "...", sellValue: "...", netValue: "..." },
  //  { category: "FII/FPI *", date: "30-Jun-2026", buyValue: "...", sellValue: "...", netValue: "..." }]
  const fiiRow = data.find((r) => r.category?.toLowerCase().includes("fii"));
  const diiRow = data.find((r) => r.category?.toLowerCase().includes("dii"));

  if (!fiiRow || !diiRow) {
    throw new Error("Unexpected NSE response shape");
  }

  return {
    trade_date: parseNseDate(fiiRow.date),
    fii_net: parseFloat(fiiRow.netValue),
    fii_buy: parseFloat(fiiRow.buyValue),
    fii_sell: parseFloat(fiiRow.sellValue),
    dii_net: parseFloat(diiRow.netValue),
    dii_buy: parseFloat(diiRow.buyValue),
    dii_sell: parseFloat(diiRow.sellValue),
  };
}

function parseNseDate(d) {
  // "30-Jun-2026" -> "2026-06-30"
  const months = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const [day, mon, year] = d.split("-");
  return `${year}-${months[mon]}-${day.padStart(2, "0")}`;
}

async function handleFetchAndStore(res) {
  try {
    const row = await fetchFiiDiiFromNse();

    const { error } = await supabase
      .from("fii_dii_data")
      .upsert(row, { onConflict: "trade_date" });

    if (error) throw error;

    return res.status(200).json({ ok: true, data: row });
  } catch (err) {
    console.error("FII/DII fetch failed:", err.message);
    return res.status(502).json({ ok: false, error: err.message });
  }
}

async function handleGetCached(res, days = 30) {
  const { data, error } = await supabase
    .from("fii_dii_data")
    .select("*")
    .order("trade_date", { ascending: false })
    .limit(days);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, data });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { action, days } = req.query;

  // Protect the scrape trigger so randoms can't hammer NSE via your route.
  // Vercel Cron automatically sends "Authorization: Bearer <CRON_SECRET>"
  // when the CRON_SECRET env var is set, so we check against that.
  if (action === "fetch") {
    const authHeader = req.headers["authorization"];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    return handleFetchAndStore(res);
  }

  return handleGetCached(res, days ? parseInt(days, 10) : 30);
}
