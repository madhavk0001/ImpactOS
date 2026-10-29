"""Budget Allocation Optimization Engine for ImpactOS.

Formulates and solves public infrastructure project portfolio selection
using Google OR-Tools CP-SAT constraint programming solver.
"""

from typing import Any, Dict, List, Optional, Set, Tuple
from ortools.sat.python import cp_model


class InputValidationError(ValueError):
    """Raised when the optimization input payload fails validation."""
    pass


def validate_payload(payload: Dict[str, Any]) -> Tuple[int, bool, List[Dict[str, Any]]]:
    """Validate input payload strictly according to the Person 3 specification.

    Args:
        payload: Dictionary containing budget_inr, require_accessibility, and projects.

    Returns:
        A tuple of (budget_inr, require_accessibility, normalized_projects).

    Raises:
        InputValidationError: If any required field is missing, malformed, negative,
                              contains invalid types, duplicate IDs, self-dependencies,
                              missing dependencies, or cyclic dependencies.
    """
    if not isinstance(payload, dict):
        raise InputValidationError("Request payload must be a JSON dictionary/object.")

    # 1. Validate budget_inr
    if "budget_inr" not in payload:
        raise InputValidationError("Missing required field: 'budget_inr'.")
    budget_inr = payload["budget_inr"]
    if isinstance(budget_inr, bool) or not isinstance(budget_inr, int):
        raise InputValidationError(
            f"'budget_inr' must be a non-negative integer, got {type(budget_inr).__name__}."
        )
    if budget_inr < 0:
        raise InputValidationError(
            f"'budget_inr' cannot be negative, got {budget_inr}."
        )

    # 2. Validate require_accessibility
    require_accessibility = payload.get("require_accessibility", True)
    if not isinstance(require_accessibility, bool):
        raise InputValidationError(
            f"'require_accessibility' must be a boolean, got {type(require_accessibility).__name__}."
        )

    # 3. Validate projects list
    if "projects" not in payload:
        raise InputValidationError("Missing required field: 'projects'.")
    raw_projects = payload["projects"]
    if not isinstance(raw_projects, list):
        raise InputValidationError(
            f"'projects' must be a list of project objects, got {type(raw_projects).__name__}."
        )

    normalized_projects: List[Dict[str, Any]] = []
    seen_ids: Set[str] = set()

    for idx, p in enumerate(raw_projects):
        if not isinstance(p, dict):
            raise InputValidationError(f"Project at index {idx} must be a dictionary.")

        # Project ID
        if "id" not in p:
            raise InputValidationError(f"Project at index {idx} is missing required field 'id'.")
        pid = p["id"]
        if not isinstance(pid, str) or not pid.strip():
            raise InputValidationError(
                f"Project at index {idx} 'id' must be a non-empty string, got {pid!r}."
            )
        if pid in seen_ids:
            raise InputValidationError(f"Duplicate project ID found: '{pid}'.")
        seen_ids.add(pid)

        # Project Name
        if "name" not in p:
            raise InputValidationError(f"Project '{pid}' is missing required field 'name'.")
        name = p["name"]
        if not isinstance(name, str) or not name.strip():
            raise InputValidationError(
                f"Project '{pid}' 'name' must be a non-empty string, got {name!r}."
            )

        # Cost INR
        if "cost_inr" not in p:
            raise InputValidationError(f"Project '{pid}' is missing required field 'cost_inr'.")
        cost = p["cost_inr"]
        if isinstance(cost, bool) or not isinstance(cost, int):
            raise InputValidationError(
                f"Project '{pid}' 'cost_inr' must be an integer, got {type(cost).__name__}."
            )
        if cost < 0:
            raise InputValidationError(
                f"Project '{pid}' 'cost_inr' cannot be negative, got {cost}."
            )

        # Benefit Score
        if "benefit_score" not in p:
            raise InputValidationError(f"Project '{pid}' is missing required field 'benefit_score'.")
        score = p["benefit_score"]
        if isinstance(score, bool) or not isinstance(score, int):
            raise InputValidationError(
                f"Project '{pid}' 'benefit_score' must be an integer, got {type(score).__name__}."
            )
        if score < 0:
            raise InputValidationError(
                f"Project '{pid}' 'benefit_score' cannot be negative, got {score}."
            )

        # Accessibility flag
        if "is_accessibility" not in p:
            raise InputValidationError(f"Project '{pid}' is missing required field 'is_accessibility'.")
        is_acc = p["is_accessibility"]
        if not isinstance(is_acc, bool):
            raise InputValidationError(
                f"Project '{pid}' 'is_accessibility' must be a boolean, got {type(is_acc).__name__}."
            )

        # Dependencies
        depends_on = p.get("depends_on", [])
        if depends_on is None:
            depends_on = []
        if not isinstance(depends_on, list):
            raise InputValidationError(
                f"Project '{pid}' 'depends_on' must be a list of strings, got {type(depends_on).__name__}."
            )
        for dep in depends_on:
            if not isinstance(dep, str) or not dep.strip():
                raise InputValidationError(
                    f"Project '{pid}' dependency ID must be a non-empty string, got {dep!r}."
                )
            if dep == pid:
                raise InputValidationError(
                    f"Project '{pid}' cannot depend on itself (self-dependency detected)."
                )

        normalized_projects.append({
            "id": pid,
            "name": name,
            "cost_inr": cost,
            "benefit_score": score,
            "is_accessibility": is_acc,
            "depends_on": list(depends_on),
        })

    # Validate that all dependencies reference existing project IDs
    for p in normalized_projects:
        for dep in p["depends_on"]:
            if dep not in seen_ids:
                raise InputValidationError(
                    f"Project '{p['id']}' depends on '{dep}', which does not exist in the projects list."
                )

    # Detect cycles in the dependency graph
    _check_dependency_cycles(normalized_projects)

    return budget_inr, require_accessibility, normalized_projects


def _check_dependency_cycles(projects: List[Dict[str, Any]]) -> None:
    """Detect cyclic dependencies using depth-first search cycle detection.

    Args:
        projects: List of normalized project dictionaries.

    Raises:
        InputValidationError: If a directed cycle is found in the dependency graph.
    """
    graph = {p["id"]: p["depends_on"] for p in projects}
    visited: Dict[str, int] = {}  # 0: unvisited, 1: visiting (in stack), 2: visited

    def dfs(node: str, path: List[str]) -> Optional[List[str]]:
        visited[node] = 1
        path.append(node)
        for prereq in graph.get(node, []):
            if visited.get(prereq, 0) == 1:
                # Cycle found
                cycle_start = path.index(prereq)
                return path[cycle_start:] + [prereq]
            if visited.get(prereq, 0) == 0:
                cycle = dfs(prereq, path)
                if cycle:
                    return cycle
        path.pop()
        visited[node] = 2
        return None

    for p in projects:
        node = p["id"]
        if visited.get(node, 0) == 0:
            cycle = dfs(node, [])
            if cycle:
                raise InputValidationError(
                    f"Cyclic dependency detected: {' -> '.join(cycle)}."
                )


def solve_portfolio(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Solve the budget allocation optimization problem using OR-Tools CP-SAT.

    Formulation:
        Maximize sum(benefit_score_i * x_i)
        Subject to:
            sum(cost_inr_i * x_i) <= budget_inr
            sum(x_i for is_accessibility) >= 1  (if require_accessibility is True)
            x_i <= x_j                          (for each j in depends_on_i)
            x_i in {0, 1}

    Args:
        payload: Input dictionary conforming to the required schema.

    Returns:
        Structured dictionary containing solver status, selected projects,
        cost accounting, benefit totals, rejection explanations, and status message.

    Raises:
        InputValidationError: If input validation fails.
    """
    budget_inr, require_accessibility, projects = validate_payload(payload)

    # Edge case: Empty project list
    if not projects:
        if require_accessibility:
            return {
                "status": "INFEASIBLE",
                "selected_ids": [],
                "selected_projects": [],
                "total_cost_inr": None,
                "total_benefit": None,
                "remaining_budget_inr": None,
                "rejected_reasons": [],
                "message": "No feasible allocation: accessibility requirement is mandatory, but no projects are available.",
            }
        else:
            return {
                "status": "OPTIMAL",
                "selected_ids": [],
                "selected_projects": [],
                "total_cost_inr": 0,
                "total_benefit": 0,
                "remaining_budget_inr": budget_inr,
                "rejected_reasons": [],
                "message": "Optimal allocation found.",
            }

    # Initialize CP-SAT model
    model = cp_model.CpModel()

    # 1. Decision variables: x_i in {0, 1}
    x_vars: Dict[str, cp_model.IntVar] = {}
    for p in projects:
        x_vars[p["id"]] = model.new_bool_var(f"x_{p['id']}")

    # 2. Objective function: Maximize total benefit
    model.maximize(
        cp_model.LinearExpr.weighted_sum(
            [x_vars[p["id"]] for p in projects],
            [p["benefit_score"] for p in projects],
        )
    )

    # 3. Budget constraint: sum(cost_inr_i * x_i) <= budget_inr
    model.add(
        cp_model.LinearExpr.weighted_sum(
            [x_vars[p["id"]] for p in projects],
            [p["cost_inr"] for p in projects],
        )
        <= budget_inr
    )

    # 4. Mandatory accessibility constraint
    if require_accessibility:
        accessibility_vars = [
            x_vars[p["id"]] for p in projects if p["is_accessibility"]
        ]
        if accessibility_vars:
            model.add(cp_model.LinearExpr.sum(accessibility_vars) >= 1)
        else:
            # Accessibility required, but no accessibility projects in candidate set
            model.add(0 >= 1)

    # 5. Dependency constraints: x_i <= x_j for each prerequisite j
    for p in projects:
        pid = p["id"]
        for prereq_id in p["depends_on"]:
            model.add(x_vars[pid] <= x_vars[prereq_id])

    # 6. Solve with CP-SAT
    solver = cp_model.CpSolver()
    solver.parameters.random_seed = 42
    solver.parameters.max_time_in_seconds = 10.0
    status_code = solver.solve(model)

    # Map solver status
    if status_code == cp_model.OPTIMAL:
        status_str = "OPTIMAL"
    elif status_code == cp_model.FEASIBLE:
        status_str = "FEASIBLE"
    elif status_code == cp_model.INFEASIBLE:
        status_str = "INFEASIBLE"
    elif status_code == cp_model.MODEL_INVALID:
        status_str = "MODEL_INVALID"
    else:
        status_str = "UNKNOWN"

    # Build response based on solver status
    if status_str in ("OPTIMAL", "FEASIBLE"):
        selected_projects = [
            p for p in projects if solver.value(x_vars[p["id"]]) == 1
        ]
        selected_ids = [p["id"] for p in selected_projects]
        total_cost = sum(p["cost_inr"] for p in selected_projects)
        total_benefit = sum(p["benefit_score"] for p in selected_projects)
        remaining_budget = budget_inr - total_cost

        rejected_reasons: List[Dict[str, str]] = []
        for p in projects:
            if p["id"] not in selected_ids:
                # Check if unselected because prerequisites were unselected
                unmet_prereqs = [
                    prereq for prereq in p["depends_on"] if prereq not in selected_ids
                ]
                if unmet_prereqs:
                    reason = "Its prerequisite is not included in the recommended allocation."
                else:
                    reason = (
                        "Not selected in the highest-benefit allocation under the "
                        "current budget and constraints."
                    )
                rejected_reasons.append({
                    "id": p["id"],
                    "name": p["name"],
                    "reason": reason,
                })

        message = (
            "Optimal allocation found."
            if status_str == "OPTIMAL"
            else "Feasible allocation found (optimality not proven within time limit)."
        )

        return {
            "status": status_str,
            "selected_ids": selected_ids,
            "selected_projects": selected_projects,
            "total_cost_inr": total_cost,
            "total_benefit": total_benefit,
            "remaining_budget_inr": remaining_budget,
            "rejected_reasons": rejected_reasons,
            "message": message,
        }

    if status_str == "INFEASIBLE":
        return {
            "status": "INFEASIBLE",
            "selected_ids": [],
            "selected_projects": [],
            "total_cost_inr": None,
            "total_benefit": None,
            "remaining_budget_inr": None,
            "rejected_reasons": [
                {
                    "id": p["id"],
                    "name": p["name"],
                    "reason": "No feasible allocation satisfies the current mandatory constraints.",
                }
                for p in projects
            ],
            "message": (
                "No feasible allocation satisfies the current mandatory constraints "
                "(e.g., mandatory accessibility requirement cannot be satisfied within the available budget)."
            ),
        }

    if status_str == "MODEL_INVALID":
        return {
            "status": "MODEL_INVALID",
            "selected_ids": [],
            "selected_projects": [],
            "total_cost_inr": None,
            "total_benefit": None,
            "remaining_budget_inr": None,
            "rejected_reasons": [],
            "message": "The optimization model was invalid.",
        }

    # UNKNOWN or any unexpected status
    return {
        "status": "UNKNOWN",
        "selected_ids": [],
        "selected_projects": [],
        "total_cost_inr": None,
        "total_benefit": None,
        "remaining_budget_inr": None,
        "rejected_reasons": [],
        "message": "Solver could not establish a solution status within the allotted time.",
    }

