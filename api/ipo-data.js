// api/ipo-data.js
// Fetches live IPO data from NSE India and caches it in Supabase.
// GET ?action=fetch  -> scrapes NSE (called by daily Vercel Cron at 9 AM IST)
// GET (default)      -> returns cached IPO data from Supabase

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const NSE_BASE = "https://www.nseindia.com";
const NSE_IPO_URL = "https://www.nseindia.com/api/allIpo";

const NSE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
};

const CHALDEAN = { a:1,b:2,c:3,d:4,e:5,f:8,g:3,h:5,i:1,j:1,k:2,l:3,m:4,n:5,o:7,p:8,q:1,r:2,s:3,t:4,u:6,v:6,w:6,x:5,y:1,z:7 };

function calcNumerology(name) {
  if (!name) return { score: null, msg: "" };
  const n = name.toLowerCase().replace(/[^a-z]/g, "").split("").reduce((s, c) => s + (CHALDEAN[c] || 0), 0);
  const root = n > 9 ? Math.floor(n / 10) + (n % 10) : n;
  const msgs = { 1:"Leadership energy! Strong listing potential.", 2:"Balance needed. Moderate outlook.", 3:"Creative energy — good vibes!", 4:"Stability number. Safe long term.", 5:"Dynamic & risky. High volatility.", 6:"Harmony number. Steady growth.", 7:"Mystical number. Unpredictable.", 8:"Prosperity! Strong listing expected.", 9:"Completion cycle. Watch carefully." };
  return { score: root, msg: msgs[root] || "Neutral energy." };
}

function parseDate(d) {
  if (!d) return null;
  const months = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12" };
  if (d.includes("-")) {
    const [day, mon, year] = d.split("-");
    return `${year}-${months[mon]}-${day.padStart(2,"0")}`;
  }
  return d;
}

function mapStatus(row) {
  if (row.series === "Listed" || row.listingDate) return "listed";
  const today = new Date().toISOString().split("T")[0];
  const open = parseDate(row.bidOpenDate || row.openDate);
  const close = parseDate(row.bidCloseDate || row.closeDate);
  if (open && close) {
    if (today >= open && today <= close) return "open";
    if (today < open) return "upcoming";
    return "listed";
  }
  return "upcoming";
}

async function fetchNseCookies() {
  const res = await fetch(NSE_BASE, { headers: NSE_HEADERS });
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("Failed to get NSE cookies");
  return setCookie;
}

async function fetchIposFromNse() {
  const cookies = await fetchNseCookies();
  const res = await fetch(NSE_IPO_URL, { headers: { ...NSE_HEADERS, Cookie: cookies } });
  if (!res.ok) throw new Error(`NSE responded with ${res.status}`);
  const data = await res.json();

  const allIpos = [
    ...(data.upcoming || []),
    ...(data.open || []),
    ...(data.listed || []),
  ];

  return allIpos.map((row) => {
    const name = row.companyName || row.name || "";
    const num = calcNumerology(name);
    return {
      symbol: row.symbol || null,
      company_name: name,
      sector: row.industry || row.sector || null,
      price_band_low: row.priceBandLow ? parseFloat(row.priceBandLow) : null,
      price_band_high: row.priceBandHigh ? parseFloat(row.priceBandHigh) : null,
      open_date: parseDate(row.bidOpenDate || row.openDate),
      close_date: parseDate(row.bidCloseDate || row.closeDate),
      listing_date: parseDate(row.listingDate),
      status: mapStatus(row),
      subscription_times: row.subscriptionTimes ? parseFloat(row.subscriptionTimes) : null,
      gmp: null,
      gmp_percent: null,
      numerology_score: num.score,
      numerology_msg: num.msg,
      issue_size: row.issueSize || null,
      lot_size: row.lotSize ? parseInt(row.lotSize) : null,
      apply_link: "https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
      fetched_at: new Date().toISOString(),
    };
  });
}

async function handleFetchAndStore(res) {
  try {
    const ipos = await fetchIposFromNse();
    if (ipos.length === 0) {
      return res.status(200).json({ ok: true, message: "No IPOs found", count: 0 });
    }

    // Clear old data and insert fresh
    await supabase.from("ipos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await supabase.from("ipos").insert(ipos);
    if (error) throw error;

    return res.status(200).json({ ok: true, count: ipos.length });
  } catch (err) {
    console.error("IPO fetch failed:", err.message);
    return res.status(502).json({ ok: false, error: err.message });
  }
}

async function handleGetCached(res) {
  const { data, error } = await supabase
    .from("ipos")
    .select("*")
    .order("open_date", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true, data });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { action } = req.query;

  if (action === "fetch") {
    const authHeader = req.headers["authorization"];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    return handleFetchAndStore(res);
  }

  return handleGetCached(res);
}
