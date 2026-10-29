# ImpactOS Backend (no optimizer included)

A working modular FastAPI service with Pydantic validation, explainable scoring, SQLite project/scenario CRUD, CSV project imports, PDF generation and an optimizer **integration bridge**. Solver implementation is intentionally absent.

## Run (from repository root)

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
# IMPORTANT: run from repository ROOT for optimizer import compatibility:
cd ..
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

Open http://127.0.0.1:8000/docs. If run from an existing ImpactOS repo, **merge only the backend/** contents and sample_data/ (or update demo.py path); do not overwrite your teammates' frontend or optimizer.

## API

- `GET /api/health`: API health.
- `GET /api/scenarios/demo`: demo OptimizationRequest, synthetic records.
- `POST /api/scores/preview`: explainable scores, no solver.
- `POST /api/optimize`: real solver bridge, returns HTTP 503 until optimizer is integrated.
- `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/{id}`: SQLite CRUD.
- `POST /api/projects/import/csv`: import CSV with `file` multipart key; supports `cost_lakh` or `cost_inr`.
- `GET /api/projects/imports/history`: import log.
- `GET/POST /api/scenarios`, `GET/DELETE /api/scenarios/{id}`: scenarios CRUD.
- `POST /api/reports/pdf`: PDF from caller-supplied saved scenario with *actual* result.

Scoring preview formula default: 30% need + 25% reach + 20% urgency + 15% equity + 10% readiness; all source inputs are 0–100. Reach = 100 * beneficiaries / max beneficiaries in submitted portfolio. Defaults are demo policy choices, not official standards. Cost is integer INR.

## Optimizer handoff (Person 3)

Place solver at `<REPO_ROOT>/optimizer/solver.py` with `solve_portfolio(payload: dict) -> dict`.
Input keys: `budget_inr` int, `projects` list (each has `project_id`, `cost_inr`, `benefit_score`, `depends_on`, `mandatory`, `is_accessibility`), `require_accessibility` bool.
Result requires `status` one of `OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `UNKNOWN`. For OPTIMAL/FEASIBLE, also `selected_ids` list. Backend validates selected IDs, budget, dependencies, mandatory and accessibility and derives totals itself. For infeasible runs, results carry no funded allocation. Backend does not silently calculate a substitute allocation.

If the existing starter optimizer expects a different schema (e.g. `id` vs `project_id`), update **only** `app/services/optimizer_bridge.py` with an explicit adapter after comparing against Person 3's actual solver. Do not change the frontend and optimizer contracts independently.

### Example integration return
```python
return {'status': 'OPTIMAL', 'selected_ids': ['P001','P003']}
```

## Frontend integration
Set `VITE_API_URL=http://127.0.0.1:8000` in `frontend/.env` and use `/api/...` endpoints; CORS allows Vite 5173 by default. `GET /api/scenarios/demo` supplies a fully valid request body for POST `/api/optimize`.

## Tests
From root with dependencies installed:
```bash
PYTHONPATH=backend pytest backend/tests -q
```
PowerShell: `$env:PYTHONPATH="backend"; pytest backend/tests -q`

## Scope and security
This is a hackathon MVP. There is no login or authorization, no multi-tenant isolation, no production audit immutability, and local SQLite data is not suitable for multi-instance deployment. Only run locally or behind a secured proxy; do not expose the CRUD endpoints publicly. CSV imports overwrite matching IDs; validate source/provenance before use. Do not confuse synthetic records and real government datasets.
