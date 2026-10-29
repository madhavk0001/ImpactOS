# ImpactOS API Contract

## 1. Purpose

This document defines the proposed interface between the ImpactOS
frontend, backend, optimization engine, and reporting module.

The team must review and agree on this contract before implementation.

## 2. API Base URL

Local development:

http://localhost:8000

## 3. Health Check

### GET /health

Purpose:
Verify that the backend API is running.

Proposed response:

{
  "status": "ok"
}

## 4. Optimize Projects

### POST /api/optimize

Purpose:
Select a portfolio of projects under the available budget
and configured policy constraints.

Proposed request:

{
  "budget_inr": 800000,
  "projects": [
    {
      "id": "P001",
      "name": "Accessibility Ramps",
      "cost_inr": 220000,
      "benefit": 32,
      "dependencies": [],
      "is_accessibility_project": true
    },
    {
      "id": "P002",
      "name": "Water Pipeline",
      "cost_inr": 200000,
      "benefit": 30,
      "dependencies": [],
      "is_accessibility_project": false
    }
  ],
  "policy": {
    "require_accessibility_project": true
  }
}

The example values are illustrative, not actual application results.

## 5. Proposed Optimization Response

{
  "status": "optimal",
  "selected_project_ids": ["P001", "P002"],
  "total_cost_inr": 420000,
  "total_benefit": 62,
  "remaining_budget_inr": 380000
}

The example response is illustrative and must not be treated
as evidence of an actual optimization run.

## 6. Validation Rules

- Budget and project costs must be non-negative integers in INR.
- Project IDs must be unique within a request.
- Every dependency must reference a valid project ID.
- Selected projects must not exceed the available budget.
- Project dependencies must be satisfied.
- The configured accessibility policy must be enforced.
- The backend must reject malformed requests with a clear error.

## 7. Optimization Status

The final response schema must distinguish:

- optimal: an optimal solution was found.
- feasible: a valid solution was found, but optimality was not established.
- infeasible: no solution satisfies the configured constraints.

Unexpected backend or solver errors must be reported clearly
and must not be presented as valid allocation results.

The team must agree on the exact status representation.

## 8. Integration Responsibilities

Frontend:
Submit validated user inputs and display the returned result.

Backend:
Validate requests, invoke the optimizer, and return structured responses.

Optimizer:
Apply the objective function and enforce the agreed constraints.

Reporting:
Generate an audit report from validated inputs and optimization results.

## 9. Open Decisions

Before implementation, the team must agree on:

- The exact project fields and their data types.
- The benefit scale and optimization objective.
- The representation of project dependencies.
- The exact accessibility policy.
- API endpoint names and error formats.
- How rejected projects and their reasons will be represented.
