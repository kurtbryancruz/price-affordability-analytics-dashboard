-- Task 2B - Analytical Queries for the cleaned dataset
-- Assumes these tables already exist in Supabase/PostgreSQL:
--   food_prices(region, date, year, commodity, category, unit, price, price_zscore)
--   regional_income(region, year, avg_income_thousands, income_zscore)

-- Query 1
-- Business question:
-- Which regions have the highest average food prices in each available year?
SELECT
  year,
  region,
  ROUND(AVG(price)::numeric, 2) AS avg_price_php
FROM food_prices
GROUP BY year, region
ORDER BY year, avg_price_php DESC;

-- Optional CSV export in psql:
-- \copy (
--   SELECT year, region, ROUND(AVG(price)::numeric, 2) AS avg_price_php
--   FROM food_prices
--   GROUP BY year, region
--   ORDER BY year, avg_price_php DESC
-- ) TO 'query1_price_by_region.csv' CSV HEADER;


-- Query 2
-- Business question:
-- Which categories contributed the most to the overall food price increase from 2018 to 2023?
WITH category_year_avg AS (
  SELECT category, year, AVG(price) AS avg_price
  FROM food_prices
  WHERE year IN (2018, 2023)
  GROUP BY category, year
),
category_change AS (
  SELECT
    category,
    MAX(CASE WHEN year = 2018 THEN avg_price END) AS avg_price_2018,
    MAX(CASE WHEN year = 2023 THEN avg_price END) AS avg_price_2023
  FROM category_year_avg
  GROUP BY category
),
category_increase AS (
  SELECT
    category,
    ROUND((avg_price_2023 - avg_price_2018)::numeric, 2) AS price_increase
  FROM category_change
  WHERE avg_price_2018 IS NOT NULL
    AND avg_price_2023 IS NOT NULL
    AND avg_price_2023 > avg_price_2018
),
total_increase AS (
  SELECT SUM(price_increase) AS total_delta
  FROM category_increase
)
SELECT
  c.category,
  c.price_increase,
  ROUND((c.price_increase / t.total_delta * 100)::numeric, 2) AS contribution_percent
FROM category_increase c
CROSS JOIN total_increase t
ORDER BY contribution_percent DESC;


-- Query 3
-- Business question:
-- Which regions are the least affordable when food prices are compared to average income?
SELECT
  f.year,
  f.region,
  ROUND(AVG(f.price)::numeric, 2) AS avg_price_php,
  ROUND(AVG(i.avg_income_thousands)::numeric, 2) AS avg_income_thousands,
  ROUND((AVG(f.price) / NULLIF(AVG(i.avg_income_thousands), 0))::numeric, 4) AS affordability_index
FROM food_prices f
JOIN regional_income i
  ON f.region = i.region
 AND f.year = i.year
GROUP BY f.year, f.region
ORDER BY f.year, affordability_index DESC;


-- Query 4 (optional extra)
-- Business question:
-- Which commodities have the most volatile prices across all available periods?
SELECT
  commodity,
  unit,
  ROUND(STDDEV_POP(price)::numeric, 2) AS price_volatility,
  ROUND(AVG(price)::numeric, 2) AS avg_price_php
FROM food_prices
GROUP BY commodity, unit
HAVING COUNT(*) >= 3
ORDER BY price_volatility DESC
LIMIT 10;
