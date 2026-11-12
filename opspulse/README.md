# OpsPulse – Operations Performance & MIS Dashboard (Sam Tech Builds)
React + Vite + TypeScript + Tailwind + Recharts + Lucide + PapaParse + SheetJS. Data lives in browser localStorage (`opspulse-v1`). No backend or API keys.

## Run
    npm install
    npm run dev       # http://localhost:5173
    npm run build     # typecheck + production build to dist/
    npm test          # regenerates sample files, then runs 35 logic tests (parsing, validation, KPIs, filters)

## Using it
1. **Dashboard** opens with 120 fictional sample records. KPI cards, six charts and insights all follow the filter bar (Apply / Clear; date filter = created date).
2. **Import**: upload CSV/XLSX → preview + detected columns → map columns (auto-detected from common header names) → validate → review rejected rows (downloadable CSV) and duplicate IDs → import. Choose *Replace existing data* or append. Samples in `public/samples/` (clean CSV, XLSX, and a messy CSV with different headers, 5 invalid rows and 2 duplicates).
3. **Records**: search, filter, sort, paginate, view/add/edit/delete, export filtered CSV.
4. **Reports**: summary, department and employee tables, insights; CSV, Excel and print.
5. **Import page → Data management**: Restore Sample Dataset, Clear All Data (both confirmed).

## Calculation rules
- Completed = status Completed **and** a completed date (rows without one are rejected, never counted).
- Overdue = not completed and due date earlier than today.
- SLA compliance = among Completed records with both an SLA target and resolution time, share where resolution ≤ target. No eligible records → "n/a".
- Avg resolution = mean resolution hours of completed records (if blank, derived as days from created→completed × 24).
- Divisions by zero return 0 (or n/a for SLA). Insights are fixed rules with stated thresholds (≥1.5× average open workload, 30-day vs prior 30-day completion), not AI.
- Duplicate = a Record ID already stored or repeated in the file; skipped and reported.

## Deploy to Cloudflare Pages
Push to GitHub → Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git. Build command `npm run build`, output `dist`. `public/_redirects` handles SPA routing. (CLI: `npm run build && npx wrangler pages deploy dist`.)

## Limitations
Only the first sheet of a workbook is read; dates accepted as ISO, dd/mm/yyyy and Excel serials (mm/dd/yyyy is not supported); single JS bundle (~1.1 MB, 335 kB gzip) because of SheetJS; no automated browser/UI tests.
