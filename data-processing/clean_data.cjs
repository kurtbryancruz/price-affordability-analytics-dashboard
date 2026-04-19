/**
 * Task 2A — Data Cleaning & Transformation
 * Datasets: food_prices + regional_income
 *
 * Operations:
 * - Handle missing values (drop rows)
 * - Standardize region names
 * - Filter years (2018, 2021, 2023)
 * - Remove outliers using IQR
 * - Normalize price/income (z-score)
 * - Export cleaned datasets
 *
 * Fixes applied:
 * [food_prices]   Raw CSV uses 'admin1' not 'region', and 'date' not 'year'.
 *                 → Added column-normalization step after parse, before filter.
 *
 * [regional_income] Two issues:
 *   1. UTF-8 BOM (EF BB BF) → fixed with bom:true in csv-parse config.
 *   2. PSA pivot/crosstab structure (not flat rows) → reshapeIncomePivot()
 *      extracts { region, year, avg_income_thousands } before the pipeline.
 *
 * ⚠  DATA NOTE: The current raw regional_income.csv is PSA Table 1a
 *    (Coefficient of Variation), not average income. Replace it with
 *    the PSA Average Annual Family Income table (same pivot layout)
 *    to produce correct avg_income_thousands values.
 */

const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

// ─── Utility Functions ───────────────────────────────────────────────────────

function normalizeRegion(region) {
  if (!region) return null;
  const r = region.toUpperCase().trim();

  const map = {
    // Standard names
    "NATIONAL CAPITAL REGION":                         "NCR",
    "CORDILLERA ADMINISTRATIVE REGION":                "CAR",
    "AUTONOMOUS REGION IN MUSLIM MINDANAO":            "BARMM",
    // Aliases present in income CSV pivot rows
    "CAR - CORDILLERA ADMINISTRATIVE REGION":          "CAR",
    "REGION IVA - CALABARZON":                         "Region IV-A",
    "MIMAROPA REGION":                                 "Region IV-B",
    // Aliases present in food_prices admin1 column
    "MIMAROPA":                                        "Region IV-B",
    "CALABARZON":                                      "Region IV-A",
  };

  if (map[r]) return map[r];

  // BARMM rows in the income CSV have a long footnote-laden name
  if (r.startsWith("BARMM")) return "BARMM";

  return r;
}

// Z-score normalization
function computeZScore(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std =
    Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length) || 1;
  return values.map((v) => (v - mean) / std);
}

// IQR outlier filter
function removeOutliers(data, key) {
  const values = data.map((d) => d[key]).sort((a, b) => a - b);
  const q1 = values[Math.floor(values.length * 0.25)];
  const q3 = values[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return data.filter((d) => d[key] >= lower && d[key] <= upper);
}

// ─── Income Pivot Reshaper ────────────────────────────────────────────────────
//
// The PSA FIES income CSV is a crosstab, not a flat table:
//   Row 0 : Table title (quoted, triggers BOM error without bom:true)
//   Row 1 : Year headers      →  2018 | (empty×10) | 2021 | (empty×10) | 2023p | …
//   Row 2 : Decile subheaders →  All Income Groups | 1st Decile | … per year
//   Row 3 : Empty
//   Data  : Region/Province name | 33 numeric columns
//
// "All Income Groups" column index per year:
//   2018 → col 1  |  2021 → col 12  |  2023p → col 23

// Exact region-level row names as they appear in the file (uppercased)
const INCOME_REGION_KEYS = new Set([
  "NATIONAL CAPITAL REGION",
  "CAR - CORDILLERA ADMINISTRATIVE REGION",
  "REGION I - ILOCOS REGION",
  "REGION II - CAGAYAN VALLEY",
  "REGION III - CENTRAL LUZON",
  "REGION IVA - CALABARZON",
  "MIMAROPA REGION",
  "REGION V - BICOL REGION",
  "REGION VI - WESTERN VISAYAS",
  "REGION VII - CENTRAL VISAYAS",
  "REGION VIII - EASTERN VISAYAS",
  "REGION IX - ZAMBOANGA PENINSULA",
  "REGION X - NORTHERN MINDANAO",
  "REGION XI - DAVAO REGION",
  "CARAGA",
]);

function isIncomeRegionRow(cleanUpper) {
  if (INCOME_REGION_KEYS.has(cleanUpper)) return true;
  if (cleanUpper.startsWith("REGION XII")) return true;  // "REGION XII - SOCCSKSARGEN1/" after trim
  if (cleanUpper.startsWith("BARMM")) return true;
  return false;
}

function reshapeIncomePivot(rawBuffer) {
  // Parse without column headers — raw access to handle non-standard row counts
  const allRows = parse(rawBuffer, {
    bom: true,              // strip UTF-8 BOM (EF BB BF) before parsing
    columns: false,         // treat each row as plain array
    skip_empty_lines: false,
    relax_column_count: true, // title row has 1 cell; data rows have 33
    relax_quotes: true,     // tolerate Excel-style quote inconsistencies
  });

  const flat = [];
  for (const row of allRows) {
    const rawName = (row[0] || "").trim();

    // Strip PSA footnote markers appended to region names (e.g., "SOCCSKSARGEN1/")
    const cleanName = rawName.replace(/\s*\d+\/.*$/, "").trim();
    const cleanUpper = cleanName.toUpperCase();

    if (!isIncomeRegionRow(cleanUpper)) continue;

    // Extract "All Income Groups" value for each target year
    for (const [year, colIdx] of [[2018, 1], [2021, 12], [2023, 23]]) {
      const val = (row[colIdx] || "").trim();
      if (val !== "") {
        flat.push({ region: cleanName, year: String(year), avg_income_thousands: val });
      }
    }
  }

  console.log(`  [reshape] Extracted ${flat.length} flat rows from income pivot`);
  return flat;
}

// ─── FOOD PRICES CLEANING ────────────────────────────────────────────────────

function cleanFoodPrices(inputPath, outputPath) {
  const raw = fs.readFileSync(inputPath);
  let data = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,    // harmless if no BOM, protective if present
    trim: true,   // strip leading/trailing whitespace from cell values
  });

  // Debug: confirm what the raw CSV actually loaded
  const rawCols = Object.keys(data[0] || {}).join(", ");
  console.log(`  [food] Loaded ${data.length} raw rows`);
  console.log(`  [food] Detected columns: ${rawCols}`);

  // FIX: Raw CSV uses 'admin1' (not 'region') and 'date' (not 'year').
  //      Normalize both before the missing-value filter runs.
  data = data.map((row) => ({
    ...row,
    region: row.region || row.admin1 || null,
    year:   row.year   || (row.date ? row.date.slice(0, 4) : null),
  }));

  // 1. Drop rows missing any required field
  data = data.filter((row) => row.region && row.price && row.year);
  console.log(`  [food] After missing-value drop: ${data.length} rows`);

  // 2. Convert types
  data = data.map((row) => ({
    ...row,
    region: normalizeRegion(row.region),
    price:  parseFloat(row.price),
    year:   parseInt(row.year),
  }));

  // 3. Filter to target years
  data = data.filter((row) => [2018, 2021, 2023].includes(row.year));
  console.log(`  [food] After year filter (2018 / 2021 / 2023): ${data.length} rows`);

  // 4. Remove outliers via IQR on price
  const beforeOutliers = data.length;
  data = removeOutliers(data, "price");
  console.log(`  [food] After outlier removal: ${data.length} rows (removed ${beforeOutliers - data.length})`);

  // 5. Z-score normalize price
  const prices  = data.map((d) => d.price);
  const zscores = computeZScore(prices);
  data = data.map((d, i) => ({ ...d, price_zscore: zscores[i] }));

  // 6. Export
  const csv = stringify(data, { header: true });
  fs.writeFileSync(outputPath, csv);
  console.log(`✓ Food prices → ${outputPath}  (${data.length} rows)`);
}

// ─── INCOME CLEANING ─────────────────────────────────────────────────────────

function cleanIncome(inputPath, outputPath) {
  const raw = fs.readFileSync(inputPath);

  // FIX: Reshape PSA pivot table → flat rows before entering the standard pipeline
  let data = reshapeIncomePivot(raw);

  const rawCols = Object.keys(data[0] || {}).join(", ");
  console.log(`  [income] Loaded ${data.length} rows`);
  console.log(`  [income] Detected columns: ${rawCols}`);

  // 1. Drop rows missing any required field
  data = data.filter((row) => row.region && row.avg_income_thousands && row.year);
  console.log(`  [income] After missing-value drop: ${data.length} rows`);

  // 2. Convert types
  data = data.map((row) => ({
    ...row,
    region:               normalizeRegion(row.region),
    avg_income_thousands: parseFloat(row.avg_income_thousands),
    year:                 parseInt(row.year),
  }));

  // 3. Filter to target years
  data = data.filter((row) => [2018, 2021, 2023].includes(row.year));
  console.log(`  [income] After year filter (2018 / 2021 / 2023): ${data.length} rows`);

  // 4. Z-score normalize income
  const incomes = data.map((d) => d.avg_income_thousands);
  const zscores = computeZScore(incomes);
  data = data.map((d, i) => ({ ...d, income_zscore: zscores[i] }));

  // 5. Export
  const csv = stringify(data, { header: true });
  fs.writeFileSync(outputPath, csv);
  console.log(`✓ Income → ${outputPath}  (${data.length} rows)`);
}

// ─── RUN ─────────────────────────────────────────────────────────────────────

function run() {
  const foodInput    = "./data/raw/food_prices.csv";
  const incomeInput  = "./data/raw/regional_income.csv";
  const foodOutput   = "./data/cleaned/food_prices_cleaned.csv";
  const incomeOutput = "./data/cleaned/regional_income_cleaned.csv";

  console.log("\n── Food Prices ──────────────────────────────────────────────");
  cleanFoodPrices(foodInput, foodOutput);

  console.log("\n── Regional Income ──────────────────────────────────────────");
  cleanIncome(incomeInput, incomeOutput);
}

run();
