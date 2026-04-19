# AffordaScope

A full-stack analytics dashboard for exploring food price trends and regional affordability across the Philippines. Built on Philippine Statistics Authority (PSA) data, AffordaScope combines a Node.js/Express API, a PostgreSQL database, and a React frontend to surface regional price disparities, affordability indices, and income comparisons through interactive charts.

---

## Features

- **Overview** — KPI cards, price trend line chart, food category breakdown pie chart, and regional price/affordability bar charts with region and year filters
- **Income Analysis** — Average household income by region and over time
- **Regional Analysis** — Per-region food price comparison across all Philippine administrative regions
- **Affordability** — Affordability index (avg food price ÷ avg income) ranked by region, with dual-axis bar chart
- **Reports** — Top 5 ranked lists for most expensive, most/least affordable, and highest-income regions; full price summary with proportional bar visualization
- **Dark / Light theme** — Persisted via `localStorage`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v6, Recharts, CSS custom properties |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (hosted on Supabase) |
| DB Client | `pg` (node-postgres) |
| Data Processing | Node.js (`csv-parse/sync`, `csv-stringify`) |
| Environment | `dotenv` |

---

## Project Structure

```
price-affordability-analytics-dashboard/
├── backend/
│   ├── server.js          # Express API server (7 endpoints)
│   └── .env               # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/    # Sidebar, PageLayout, KpiCard, ChartCard, RightPanel
│   │   ├── context/       # AppDataContext — shared data fetching and state
│   │   └── pages/         # Overview, Income, Regional, Affordability, Reports
│   └── index.html
├── data-processing/
│   ├── clean_data.cjs     # Cleans and normalizes raw PSA CSV files
│   └── load_data.cjs      # Loads cleaned CSVs into PostgreSQL
└── data/
    └── cleaned/           # Output of clean_data.cjs (not committed)
```

---

## Database Schema

### `food_prices`

| Column | Type | Description |
|---|---|---|
| `id` | `SERIAL` | Primary key, auto-incremented |
| `date` | `DATE` | Full date of the price observation |
| `year` | `INT` | Extracted year, used as the primary time dimension |
| `region` | `TEXT` | Philippine administrative region (e.g., NCR, Region IV-A, BARMM) |
| `category` | `TEXT` | Food group (e.g., *meat, fish and eggs*; *cereals and tubers*) |
| `commodity` | `TEXT` | Specific food item (e.g., rice, pork, tomatoes) |
| `unit` | `TEXT` | Unit of measure (e.g., kg, piece) |
| `pricetype` | `TEXT` | Retail or wholesale designation |
| `currency` | `TEXT` | Currency of the price value (PHP) |
| `price` | `NUMERIC` | Observed retail price |
| `price_zscore` | `NUMERIC` | Z-score normalized price for outlier detection and cross-commodity comparison |

### `regional_income`

| Column | Type | Description |
|---|---|---|
| `id` | `SERIAL` | Primary key, auto-incremented |
| `region` | `TEXT` | Philippine administrative region, matches `food_prices.region` for joins |
| `year` | `INT` | PSA FIES survey year (2018, 2021, or 2023) |
| `avg_income_thousands` | `NUMERIC` | Average household income in PHP thousands |
| `income_zscore` | `NUMERIC` | Z-score normalized income for cross-regional comparison |

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/kurtbryancruz/price-affordability-analytics-dashboard.git
cd price-affordability-analytics-dashboard
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` directory:

```
DATABASE_URL=postgresql://your-user:your-password@your-host:5432/your-database?sslmode=require
```

> The `DATABASE_URL` must point to a PostgreSQL instance with the `food_prices` and `regional_income` tables already created and populated. See **Data Loading** below if starting from scratch.

---

## Running Locally

Start both servers in separate terminals.

**Backend** (runs on `http://localhost:3001`):

```bash
cd backend
node server.js
```

**Frontend** (runs on `http://localhost:5173`):

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

> **The backend must be running before the frontend loads** — the React app fetches all data from the API on mount.

---

## Data Processing (Optional)

Use these scripts only if you need to rebuild the database from raw PSA CSV sources.

### Step 1 — Clean raw data

Place the raw CSV files in `data/raw/`, then run:

```bash
node data-processing/clean_data.cjs
```

This normalizes region names, reshapes the PSA income pivot table into flat rows, computes z-scores, removes outliers, and outputs:

- `data/cleaned/food_prices_cleaned.csv`
- `data/cleaned/regional_income_cleaned.csv`

### Step 2 — Load into database

```bash
node data-processing/load_data.cjs
```

This truncates the existing tables and reloads them from the cleaned CSVs inside a single transaction. Progress is logged to the console every 1,000 rows.

---

## API Endpoints

All endpoints are served from `http://localhost:3001/api`.

| Endpoint | Description |
|---|---|
| `GET /api/kpis` | Total record count and overall average food price |
| `GET /api/price-by-region` | Average food price per region |
| `GET /api/price-trend` | Average food price per year |
| `GET /api/affordability-by-region` | Affordability index (price ÷ income) per region |
| `GET /api/income-by-region` | Average household income per region |
| `GET /api/income-trend` | Average household income per year |
| `GET /api/category-breakdown` | Average price per food category |

---

## Notes

- All regions follow the official Philippine regional sort order (NCR → CAR → Region I–XIII → BARMM).
- Acronyms NCR, CAR, and BARMM are preserved as all-caps throughout the pipeline and frontend.
- The affordability index is computed as `AVG(food_price) / AVG(income_thousands)` — a lower value indicates a more affordable region.
- The frontend applies client-side filtering for region and year selections without additional API calls.

---

## Team

**Pampamilyang IT**

- Cruz, Kurt Bryan
- Dialogo, Fritz Gerald
- Dimal, Lancer Johndrix
- Mayagma, Guillmar
- Nilo, Harry
- Paghunasan, Jeroen Gil
