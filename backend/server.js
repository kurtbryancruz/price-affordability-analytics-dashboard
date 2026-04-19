import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

// ─── Region name formatting & ordering ───────────────────────

/*
  Exact-match map (keyed by the UPPERCASED raw DB value).
  Covers every known alias for regions that need a canonical
  display name rather than generic title-casing.
*/
const REGION_ABBR = {
  // Special abbreviations
  'NATIONAL CAPITAL REGION':                           'NCR',
  'CORDILLERA ADMINISTRATIVE REGION':                  'CAR',
  'AUTONOMOUS REGION IN MUSLIM MINDANAO':              'BARMM',
  'BANGSAMORO AUTONOMOUS REGION IN MUSLIM MINDANAO':   'BARMM',

  // Region IV-A aliases (DB may store the colloquial name)
  'REGION IV-A':                                       'Region IV-A',
  'REGION IV-A (CALABARZON)':                          'Region IV-A',
  'CALABARZON':                                        'Region IV-A',
  'CALABARZON REGION':                                 'Region IV-A',

  // Region IV-B aliases — DB may store "MIMAROPA" variants
  // instead of the numbered form, which title-casing alone cannot fix
  'REGION IV-B':                                       'Region IV-B',
  'REGION IV-B (MIMAROPA)':                            'Region IV-B',
  'MIMAROPA':                                          'Region IV-B',
  'MIMAROPA REGION':                                   'Region IV-B',
};

// Roman numerals that must stay uppercase when they appear as word tokens
const ROMAN = new Set(['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII']);

function formatRegionName(raw) {
  if (!raw) return raw;
  const upper = raw.trim().toUpperCase();

  // Exact aliases take full priority — no further processing needed
  if (REGION_ABBR[upper]) return REGION_ABBR[upper];

  // Generic title-case: preserves Roman numerals and hyphenated codes (e.g. IV-A)
  return raw
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => {
            const u = part.toUpperCase();
            return ROMAN.has(u) ? u : part.charAt(0).toUpperCase() + part.slice(1);
          })
          .join('-');
      }
      const u = word.toUpperCase();
      return ROMAN.has(u) ? u : word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Apply formatRegionName to the region field of every row
const formatRows = (rows) =>
  rows.map((row) => ({ ...row, region: formatRegionName(row.region) }));

/*
  Official Philippine regional sort order.
  Regions not found in this list (unexpected DB values) are
  appended after known regions, sorted alphabetically.
*/
const REGION_ORDER = [
  'NCR', 'CAR',
  'Region I', 'Region II', 'Region III',
  'Region IV-A', 'Region IV-B', 'Region V',
  'Region VI', 'Region VII', 'Region VIII',
  'Region IX', 'Region X', 'Region XI',
  'Region XII', 'Region XIII', 'BARMM',
];

function sortByRegionOrder(rows) {
  return [...rows].sort((a, b) => {
    const ai = REGION_ORDER.indexOf(a.region);
    const bi = REGION_ORDER.indexOf(b.region);
    if (ai === -1 && bi === -1) return a.region.localeCompare(b.region);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

// ─────────────────────────────────────────────────────────────

const app = express();
app.use(cors());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get("/api/kpis", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS total_records, AVG(price::numeric) AS avg_price
      FROM food_prices
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("kpis error:", err);
    res.status(500).json({ error: "Failed to load KPIs", details: err.message });
  }
});

app.get("/api/affordability-by-region", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        f.region,
        AVG(f.price::numeric) AS avg_price,
        AVG(i.avg_income_thousands::numeric) AS avg_income_thousands,
        AVG(f.price::numeric) / NULLIF(AVG(i.avg_income_thousands::numeric), 0) AS affordability_index
      FROM food_prices f
      JOIN regional_income i
        ON f.region = i.region
       AND f.year = i.year
      GROUP BY f.region
      ORDER BY affordability_index DESC
    `);
    res.json(sortByRegionOrder(formatRows(result.rows)));
  } catch (err) {
    console.error("affordability-by-region error:", err);
    res.status(500).json({ error: "Failed to load affordability data", details: err.message });
  }
});

app.get("/api/price-by-region", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT region, AVG(price::numeric) AS avg_price
      FROM food_prices
      GROUP BY region
      ORDER BY avg_price DESC
    `);
    res.json(sortByRegionOrder(formatRows(result.rows)));
  } catch (err) {
    console.error("price-by-region error:", err);
    res.status(500).json({ error: "Failed to load price by region data", details: err.message });
  }
});

app.get("/api/category-breakdown", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT category, AVG(price::numeric) AS avg_price
      FROM food_prices
      GROUP BY category
      ORDER BY avg_price DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("category-breakdown error:", err);
    res.status(500).json({ error: "Failed to load category breakdown", details: err.message });
  }
});

app.get("/api/price-trend", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT year, AVG(price::numeric) AS avg_price
      FROM food_prices
      GROUP BY year
      ORDER BY year ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("price-trend error:", err);
    res.status(500).json({ error: "Failed to load price trend data", details: err.message });
  }
});

app.get("/api/income-by-region", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT region, AVG(avg_income_thousands::numeric) AS avg_income
      FROM regional_income
      GROUP BY region
    `);
    res.json(sortByRegionOrder(formatRows(result.rows)));
  } catch (err) {
    console.error("income-by-region error:", err);
    res.status(500).json({ error: "Failed to load income by region", details: err.message });
  }
});

app.get("/api/income-trend", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT year, AVG(avg_income_thousands::numeric) AS avg_income
      FROM regional_income
      GROUP BY year
      ORDER BY year ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("income-trend error:", err);
    res.status(500).json({ error: "Failed to load income trend", details: err.message });
  }
});

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});