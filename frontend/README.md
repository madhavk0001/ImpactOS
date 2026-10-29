# ImpactOS — University Capital-Budget Allocation & Decision-Support System

> **Frontend Implementation Release · Version 1.0.0**  
> Built strictly against the approved visual design specifications inspired by **Armonia** (editorial layout, generous whitespace, inset panels) and **Elias Varr** (high-contrast display serif typography, three-zone sticky top navbar, hairline-separated flat financial tables).

---

## 1. Executive Summary & Architecture

ImpactOS is a decision-support frontend engineered for university administrators, provosts, and facilities directors to review capital project proposals, calibrate budget envelopes, submit multi-criteria portfolio optimization requests, and inspect auditable results.

### Architectural Core Rules
- **Decoupled Backend Engine:** Mathematical optimization is computed by an external Python FastAPI service backed by **Google OR-Tools**. The frontend **never** runs a competing heuristic solver in JavaScript.
- **Transparent Local Demo Mode:** When disconnected from the Python backend, ImpactOS operates in a clearly disclosed demo mode.
- **Rigorous Separation of Illustrative Samples:** An optional illustrative preview fixture is available for visual inspection. It is **off by default**, labeled strictly `ILLUSTRATIVE`, excluded from genuine baseline comparisons, and barred from audit report downloads. Failed real API requests are never silently converted into mock success.
- **Strict Horizontal Navigation:** Permanent left sidebars are prohibited. Navigation is handled by a sticky 64px horizontal `TopNavbar` across all authenticated views, responsive down to mobile viewports via an accessible drawer.

---

## 2. Approved Earthy Color System & Design Tokens

ImpactOS implements the mandatory six-color earthy palette supplemented by warm paper neutrals:

| Token | Hex Code | Semantic Role in ImpactOS |
| :--- | :--- | :--- |
| **Obsidian** | `#1F1D20` | Inset dashboard hero, high-contrast dark panels, brand monograms |
| **Burgundy** | `#4A2427` | Active top navigation pill, selected states, optimized allocation bars |
| **Terracotta** | `#803E2F` | Primary actions ("Optimize Allocation", "Add Project"), key highlights |
| **Warm Taupe** | `#A79986` | Decorative elements, pre-optimization requested capital bars, subtle borders |
| **Dark Charcoal** | `#38302D` | Primary body text, table row content, high-contrast dark accents |
| **Stone Charcoal**| `#3E3D38` | Secondary metrics, deferred project breakdowns, muted borders |

### Supporting Warm Neutrals & Status Tokens
- **Page Canvas:** `#F3EEE6` (Warm ivory)
- **Card Surface:** `#FBF8F3` (Soft paper)
- **Alternate Surface:** `#E9E2D6`
- **Secondary Text:** `#6B5E55`
- **Input Borders:** `#857762`
- **Decorative Hairlines:** `#D6CCBC`
- **Terracotta Hover:** `#6B3326`
- **Status Success:** `#3F6B4A` (`bg: #EAF2EC`)
- **Status Warning:** `#855710` (`bg: #F9F3E5`)
- **Status Error:** `#A32D2D` (`bg: #FBEBEB`)

---

## 3. Approved Typography & Font Integration

All fonts are self-hosted using pinned `@fontsource` packages to eliminate third-party CDN latency and tracking:

- **Display & Headings:** `Cormorant Garamond` (Weights 400, 500, and 400-italic). Used for page titles, numeric monetary displays, and editorial emphasis.
- **UI & Data Tables:** `Inter` (Weights 400, 500, 600, 700). Used for navigation, forms, buttons, table rows, and Recharts axes.
- **Financial Numerals:** Always rendered with `tabular-nums` for strict vertical alignment of Indian rupee amounts.

---

## 4. Prerequisites & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher (Tested on Node v24.14.0)
- **Package Manager:** `npm` (v9+) or `pnpm`

### Installation Steps
```bash
# 1. Unpack project archive
unzip impactos-frontend.zip
cd impactos-frontend

# 2. Install exact pinned dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

---

## 5. Development & Production Commands

```bash
# Start local development server (Vite on http://localhost:5173)
npm run dev

# Run full production build and asset optimization
npm run build

# Preview production build locally
npm run preview
```

---

## 6. Environment Configuration (`.env`)

All transport parameters are centralized in `src/services/api.js`:

```env
# Target Python FastAPI Optimization Service
VITE_API_BASE_URL=http://localhost:8000

# Toggle verbose debug telemetry
VITE_DEBUG_LOGGING=false
```

*Note: The target backend URL can also be changed and tested at runtime via the in-app **Settings** module.*

---

## 7. Provisional Backend Integration Contract

The FastAPI optimization backend is being implemented by your teammate. The frontend defines a provisional transport adapter in `src/services/api.js` with the following endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server heartbeat and OR-Tools readiness probe |
| `GET` | `/scenarios/demo` | Fetch institutional candidate portfolio |
| `POST` | `/optimize` | Submit multi-criteria optimization problem |
| `GET` | `/runs` | Fetch immutable institutional run history |
| `GET` | `/runs/{id}` | Fetch full run details and constraint evaluations |
| `GET` | `/runs/{id}/report` | Download official audit manifest |

### Draft `/optimize` Request Shape
```json
{
  "budget_inr": 50000000,
  "projects": [
    {
      "id": "PRJ-001",
      "name": "Central Science Lab HVAC Modernization",
      "department": "Engineering & Sciences",
      "cost_inr": 12500000,
      "benefit_score": 84.5,
      "accessible": true,
      "dependencies": []
    }
  ]
}
```

### Draft `/optimize` Response Contract
```json
{
  "run_id": "RUN-2026-0891A",
  "status": "OPTIMAL",
  "total_budget_inr": 50000000,
  "total_cost_inr": 46000000,
  "remaining_budget_inr": 4000000,
  "total_benefit": 420.0,
  "funded_ids": ["PRJ-001", "PRJ-002", "PRJ-003", "PRJ-005", "PRJ-006"],
  "solver_message": "Optimality established within 14ms using Google OR-Tools CBC/SCIP solver."
}
```

### Solver Status Handling
The frontend normalizes and explicitly distinguishes:
1. `OPTIMAL`: Proven mathematical optimality.
2. `FEASIBLE`: Feasible candidate found, optimality not mathematically proven.
3. `INFEASIBLE`: Active constraints cannot be satisfied simultaneously.
4. `ERROR`: Server or transport failure.
5. `UNRECOGNIZED`: Any novel solver status is displayed with its raw string.

---

## 8. Replacing the Placeholder Dataset

The 7 candidate projects included in this release are synthetic mock records. Every item is visibly marked with:
`“PLACEHOLDER — NOT REAL IMPACTOS DATA”`

### How to update:
Open `src/data/demoProjects.js` and edit or replace the `DEMO_PROJECTS` array:
```javascript
export const DEMO_PROJECTS = [
  {
    id: "PRJ-001",
    name: "Real Institutional Project Title",
    department: "Engineering & Sciences",
    cost_inr: 15000000, // Raw integer rupees
    benefit_score: 88.0,
    accessible: true,
    dependencies: [],
    isPlaceholder: false, // Set to false for real data
    description: "Scope description..."
  },
  // ...
];
```
Alternatively, once the backend is running, the app can fetch genuine projects directly via `GET /scenarios/demo`.

---

## 9. Illustrative Results Preview (Policy Constraints)

To demonstrate the Results, Charts, and Differential screens when the FastAPI backend is not running, an optional illustrative preview is provided in `src/data/illustrativeResults.js`.

### Strict Operational Rules:
1. **Disabled by Default:** Must be explicitly enabled via the UI toggle in Settings, Dashboard, or Results.
2. **Auto-Disabling:** Disables automatically when the FastAPI backend is detected online.
3. **No Solver Masking:** Failed real backend requests remain failed requests; they are never converted to illustrative mock previews.
4. **No Audit Storage:** Illustrative runs are never saved to audit history.
5. **No Audit Downloads:** Audit report downloads are disabled for illustrative previews with a visible explanatory alert.
6. **No Baseline Claims:** Illustrative fixtures are barred from generating baseline vs. optimized delta metrics.

---

## 10. Financial Formatting & Currencies

- All monetary values are maintained in state and API payloads as **raw integer rupees** (`cost_inr`, `budget_inr`).
- Formatted presentation strings are computed at render time via `src/utils/formatters.js`:
  - `INR_LAKH_CRORE` (Default): `₹1.25 Cr`, `₹68.00 L`, `₹15,000`
  - `INR_FULL`: `₹1,25,00,000`
  - `USD_MILLIONS`: `$1.51M`, `$820.0K` (Configurable in Settings)

---

## 11. Implemented Application Modules

1. **TopNavbar:** Sticky horizontal 64px header, three-zone composition, active burgundy pill, live backend connection indicator, scenario selector, user profile menu, and accessible mobile drawer (<1100px).
2. **Login:** Split-layout screen with obsidian hero, brand monogram, explicit demo access disclaimer, form validation, and quick-fill demo roles (`admin@impactos.edu` / `demo123`). Pluggable auth adapter in `src/services/authAdapter.js`.
3. **Dashboard:** Inset obsidian hero (`#1F1D20`), prominent unallocated budget display, "Optimize Allocation" trigger, hairline-separated metrics row (shows "Not yet optimized" prior to solver run), Recharts department distribution, funding breakdown, and portfolio summary.
4. **Projects:** Elias Varr inspired flat table, hairline dividers, Indian lakh/crore formatting, slide-over drawer for adding and editing projects without page reload, confirmation dialog for removals, search bar, and department filters.
5. **Optimization Results:** Tab-based layout (Summary, Funded Projects, Unfunded Projects, Constraint Inspector), solver status badges, constraint satisfaction verification (Budget ceiling, Accessibility quota, Prerequisite chains).
6. **Scenarios:** Interactive budget envelope slider with quick presets (₹3.50 Cr to ₹8.00 Cr), snapshot-based stale result detection banner, and comparative delta analysis vs baseline (identifying newly funded, dropped, and retained projects).
7. **Audit Reports:** Immutable log of real solver runs, download action for JSON audit manifests, session history tracking, and strict exclusion of illustrative mocks.
8. **Settings:** Financial notation selector, display density toggle, customizable backend URL with live `/health` connection tester, and demo mode disclosures.

---

## 12. Verification & Test Execution Status

- **Dependency Installation:** Verified (`npm install` succeeded with 179 packages installed).
- **Vite Production Build:** Verified (`npm run build` completed with code `0`, generating optimized chunks and preloaded WOFF2 fonts).
- **TypeScript / JSX Syntax:** Verified without transpilation errors.
- **Font Hosting:** Verified self-hosted `@fontsource/cormorant-garamond` and `@fontsource/inter`.
- **Packaging:** Project packaged into `impactos-frontend.zip`.

