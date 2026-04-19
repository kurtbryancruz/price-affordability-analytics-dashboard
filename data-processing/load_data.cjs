const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { Pool } = require("pg");
const dotenvResult = require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
console.log("[1] dotenv loaded —", dotenvResult.error ? `WARN: ${dotenvResult.error.message}` : "OK");
if (!process.env.DATABASE_URL) {
  console.error("[FATAL] DATABASE_URL is not set. Check that backend/.env exists and contains DATABASE_URL.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    trim: true,
  });
}

async function loadFoodPrices(client, rows) {
  console.log("[5] Truncating food_prices...");
  await client.query("TRUNCATE TABLE food_prices RESTART IDENTITY");
  console.log("[6] food_prices truncated.");

  const sql = `
    INSERT INTO food_prices
    (date, year, region, category, commodity, unit, pricetype, currency, price, price_zscore)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  `;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    await client.query(sql, [
      row.date || null,
      row.year ? Number(row.year) : null,
      row.region || null,
      row.category || null,
      row.commodity || null,
      row.unit || null,
      row.pricetype || null,
      row.currency || null,
      row.price ? Number(row.price) : null,
      row.price_zscore ? Number(row.price_zscore) : null,
    ]);
    if ((i + 1) % 1000 === 0) console.log(`  food_prices: inserted ${i + 1} / ${rows.length} rows...`);
  }
}

async function loadRegionalIncome(client, rows) {
  console.log("[8] Truncating regional_income...");
  await client.query("TRUNCATE TABLE regional_income RESTART IDENTITY");
  console.log("[9] regional_income truncated.");

  const sql = `
    INSERT INTO regional_income
    (region, year, avg_income_thousands, income_zscore)
    VALUES ($1,$2,$3,$4)
  `;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    await client.query(sql, [
      row.region || null,
      row.year ? Number(row.year) : null,
      row.avg_income_thousands ? Number(row.avg_income_thousands) : null,
      row.income_zscore ? Number(row.income_zscore) : null,
    ]);
    if ((i + 1) % 1000 === 0) console.log(`  regional_income: inserted ${i + 1} / ${rows.length} rows...`);
  }
}

async function main() {
  console.log("[2] Connecting to database...");
  const client = await pool.connect();
  console.log("[3] Database connection established.");

  try {
    const foodPath   = path.join(__dirname, "../data/cleaned/food_prices_cleaned.csv");
    const incomePath = path.join(__dirname, "../data/cleaned/regional_income_cleaned.csv");

    console.log("[4] Reading CSV files:");
    console.log("     food_prices   :", foodPath);
    console.log("     regional_income:", incomePath);

    if (!fs.existsSync(foodPath))   throw new Error(`CSV not found: ${foodPath}`);
    if (!fs.existsSync(incomePath)) throw new Error(`CSV not found: ${incomePath}`);

    const foodRows   = readCsv(foodPath);
    const incomeRows = readCsv(incomePath);
    console.log(`     food_prices rows read  : ${foodRows.length}`);
    console.log(`     regional_income rows read: ${incomeRows.length}`);

    await client.query("BEGIN");

    await loadFoodPrices(client, foodRows);
    console.log(`[7] Inserted ${foodRows.length} rows into food_prices.`);

    await loadRegionalIncome(client, incomeRows);
    console.log(`[10] Inserted ${incomeRows.length} rows into regional_income.`);

    await client.query("COMMIT");
    console.log("[11] Transaction committed.");
    console.log("[12] Data import completed successfully.");
  } catch (error) {
    console.error("[ERROR] Import failed:", error.message);
    console.error(error.stack);
    await client.query("ROLLBACK").catch(() => {});
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[FATAL] Unhandled error in main():", err.message);
  console.error(err.stack);
  process.exit(1);
});