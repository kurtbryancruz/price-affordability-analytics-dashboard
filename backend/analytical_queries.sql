-- Task 2B - Analytical Queries for the cleaned dataset
-- Assumes these tables already exist in Supabase/PostgreSQL:
--   food_prices(region, date, year, commodity, category, unit, price, price_zscore)
--   regional_income(region, year, avg_income_thousands, income_zscore)

-- Query 1 – Highest Average Food Prices by Region per Year
-- Business question:
-- Which regions have the highest average food prices in each available year?
SELECT
  year,
  region,
  ROUND(AVG(price)::numeric, 2) AS avg_price_php
FROM food_prices
GROUP BY year, region
ORDER BY year, avg_price_php DESC;
/*
This query identifies which regions have the highest average food prices for each year. 
It highlights regional disparities in food costs and helps determine which areas consistently 
experience higher price levels. This insight is useful for comparing economic conditions across 
regions over time.
*/




-- Query 2 – Category Contribution to Price Increase (2018–2023)
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
/*
This query determines which food categories contributed the most to the overall 
increase in food prices between 2018 and 2023. By calculating both the absolute 
increase and percentage contribution, it shows which categories are driving overall 
price inflation. This helps identify key sectors that have the greatest impact on 
rising food costs.
*/





-- Query 3 – Least Affordable Regions
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
/*
This query measures affordability by comparing average food prices to average regional income. 
Regions with higher affordability index values are considered less affordable, meaning food costs 
take up a larger portion of income. This insight helps identify regions where residents may face 
greater economic pressure in accessing food.
*/





-- Query 4 – Price Anomalies Using Z-Score
-- Business question:
-- Which commodities have the most unusual (anomalous) prices?
SELECT
  commodity,
  region,
  year,
  price,
  price_zscore
FROM food_prices
WHERE ABS(price_zscore) > 2
ORDER BY ABS(price_zscore) DESC
LIMIT 10;
/*
This query identifies commodities with unusually high or low prices using z-score normalization. 
Values with high absolute z-scores indicate significant deviations from the average, helping detect 
outliers or irregular pricing patterns. This is useful for spotting anomalies that may indicate 
market disruptions or data inconsistencies.
*/