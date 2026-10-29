# ImpactOS — Data Model

## 1. Purpose

This document proposes the data fields and validation rules shared by the ImpactOS frontend, backend, optimization engine, and reporting module.

**Status:** Draft for team review. The team must agree on this model before implementation.

## 2. Budget

The budget represents the maximum amount available for project allocation.

| Field | Type | Description |
|---|---|---|
| `budget_inr` | Integer | Total available budget in Indian rupees |

Rules:
- The budget must be a non-negative integer.
- Monetary values must not be represented as floating-point numbers.
- The total cost of selected projects must not exceed the budget.

## 3. Project

Each proposed project has the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | String | Yes | Unique project identifier |
| `name` | String | Yes | Human-readable project name |
| `cost_inr` | Integer | Yes | Project cost in Indian rupees |
| `benefit` | Integer | Yes | Benefit score used by the optimization objective |
| `dependencies` | Array of strings | Yes | IDs of projects that must also be selected |
| `is_accessibility_project` | Boolean | Yes | Whether the project satisfies the agreed accessibility classification |

Example:

```json
{
  "id": "P001",
  "name": "Accessibility Ramps",
  "cost_inr": 220000,
  "benefit": 32,
  "dependencies": [],
  "is_accessibility_project": true
}
```

Validation rules:

- Project IDs must be unique within a request.
- Project names must not be empty.
- Project costs and benefit scores must be non-negative integers.
- Every dependency must refer to a project in the same request.
- A project must not depend on itself.
- The team must decide how circular dependencies will be handled.

## 4. Optimization Request

The frontend sends the user's budget, project list, and policy settings to the backend.

Proposed structure:

```json
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
```

The values are illustrative examples, not actual application results.

## 5. Policy Settings

| Field | Type | Description |
|---|---|---|
| `require_accessibility_project` | Boolean | Whether the allocation must include at least one qualifying accessibility project |

When this policy is enabled, a feasible allocation must include at least one selected project classified as an accessibility project.

The exact policy definition and classification rules must be approved by the team.

## 6. Optimization Result

The proposed successful response is:

```json
{
  "status": "optimal",
  "selected_project_ids": ["P001", "P002"],
  "total_cost_inr": 420000,
  "total_benefit": 62,
  "remaining_budget_inr": 380000
}
```

The example is illustrative. It is not the result of a verified optimizer run.

| Field | Type | Description |
|---|---|---|
| `status` | String | Optimization outcome |
| `selected_project_ids` | Array of strings | IDs of projects selected by the optimizer |
| `total_cost_inr` | Integer | Sum of selected project costs |
| `total_benefit` | Integer | Sum of selected project benefit scores |
| `remaining_budget_inr` | Integer | Budget minus the total selected project cost |

The team must define the exact response schema for infeasible requests and unexpected errors.

## 7. Consistency Rules

For every successful allocation:

1. Every selected project ID must exist in the request.
2. The total cost must equal the sum of selected project costs.
3. The total cost must not exceed the available budget.
4. Every selected project's dependencies must also be selected.
5. The accessibility policy must be satisfied when enabled.
6. The remaining budget must equal the available budget minus the total cost.
7. The reported benefit must equal the sum of selected project benefit scores.

The reporting module should validate these calculations instead of blindly trusting returned totals.

## 8. Optimization Status

The proposed statuses are:

- `optimal`: An optimal allocation has been found.
- `feasible`: A valid allocation has been found, but optimality has not been established.
- `infeasible`: No allocation satisfies the configured constraints.

Unexpected errors must not be represented as successful results.

The backend, optimizer, and reporting module must agree on the exact status and error formats.

## 9. Open Decisions

Before implementation, the team must confirm:

- Whether all project benefit scores are integers.
- The exact optimization objective.
- The handling of circular dependencies.
- The precise accessibility classification and policy.
- The response format for infeasible requests.
- Whether rejected projects and their rejection reasons will be included in the response.
- The exact API schema expected by the frontend and reporting module.
