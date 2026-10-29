# ImpactOS frontend / backend / optimizer contract

The frontend should use OpenAPI as source of truth: `http://127.0.0.1:8000/openapi.json`.

## Demo and optimize
`GET /api/scenarios/demo` returns the precise body accepted by `POST /api/optimize`.
`POST /api/optimize` requires `{budget_inr: integer, projects: Project[], require_accessibility?: boolean, weights?: Weights, scenario_name?: string}`.
Project required keys: `project_id`, `project_name`, `cost_inr`; other fields optional or have defaults. Currency unit: integer INR. `depends_on` is a list of project IDs. `is_accessibility` and `mandatory` booleans. Default weights sum to 1.
Response success: top-level `status`, `selected_ids`, `total_cost_inr`, `remaining_budget_inr`, `total_benefit`, plus `score_breakdown`, `weights`, `solver_result`, and notices. Infeasible: status INFEASIBLE without allocation totals. No attached solver: HTTP 503. Invalid input: HTTP 422. Solver contract failure: HTTP 502.

## Data workflows
`POST /api/projects/import/csv` multipart file key `file`. CSV starter columns use `cost_lakh` converted exactly to integer INR. Project CRUD is persisted in local SQLite. `/api/scores/preview` can explain scoring prior to optimization, but does not fund projects.
`POST /api/reports/pdf` accepts `{name,request,result}` where request is OptimizationRequest and result is a real optimizer response. Returns application/pdf.

## Do not pretend
No authentication or role-based security has been implemented. Frontend login should say DEMO only. No optimizer included. No CSV evidence dataset-to-project inference. No claims of real government authorization.
