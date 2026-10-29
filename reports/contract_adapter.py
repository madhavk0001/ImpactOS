"""Adapter between the ImpactOS API contract and the PDF report generator."""

from pathlib import Path
from typing import Any


class ContractAdapterError(ValueError):
    """Raised when an API payload doesn't match the agreed draft contract."""


def adapt_project_inputs(payload: dict[str, Any]) -> dict[str, Any]:
    """Convert the API request into the report generator's input format."""

    if not isinstance(payload, dict):
        raise ContractAdapterError("Project inputs must be a JSON object.")

    budget = payload.get("budget_inr")

    if isinstance(budget, bool) or not isinstance(budget, int) or budget < 0:
        raise ContractAdapterError(
            "'budget_inr' must be a non-negative integer."
        )

    projects = payload.get("projects")

    if not isinstance(projects, list) or not projects:
        raise ContractAdapterError(
            "'projects' must be a non-empty array."
        )

    converted_projects = []
    project_ids = set()

    for index, project in enumerate(projects):
        if not isinstance(project, dict):
            raise ContractAdapterError(
                f"Project at index {index} must be an object."
            )

        project_id = project.get("id")
        name = project.get("name")
        cost = project.get("cost_inr")
        benefit = project.get("benefit")
        dependencies = project.get("dependencies", [])
        accessibility = project.get("is_accessibility_project", False)

        if not isinstance(project_id, str) or not project_id.strip():
            raise ContractAdapterError(
                f"Project at index {index} needs a non-empty ID."
            )

        if project_id in project_ids:
            raise ContractAdapterError(
                f"Duplicate project ID: {project_id}"
            )

        if not isinstance(name, str) or not name.strip():
            raise ContractAdapterError(
                f"Project '{project_id}' needs a non-empty name."
            )

        if (
            isinstance(cost, bool)
            or not isinstance(cost, int)
            or cost < 0
        ):
            raise ContractAdapterError(
                f"Project '{project_id}' needs a non-negative integer cost_inr."
            )

        if (
            isinstance(benefit, bool)
            or not isinstance(benefit, int)
            or benefit < 0
        ):
            raise ContractAdapterError(
                f"Project '{project_id}' needs a non-negative integer benefit."
            )

        if (
            not isinstance(dependencies, list)
            or not all(isinstance(item, str) for item in dependencies)
        ):
            raise ContractAdapterError(
                f"Project '{project_id}' has invalid dependencies."
            )

        if not isinstance(accessibility, bool):
            raise ContractAdapterError(
                f"Project '{project_id}' needs a Boolean "
                "'is_accessibility_project' field."
            )

        project_ids.add(project_id)

        converted_projects.append(
            {
                "id": project_id,
                "name": name,
                "department": project.get("department", "Not specified"),
                "cost": cost,
                "benefit": benefit,
                "accessibility": accessibility,
                "dependencies": dependencies,
            }
        )

    # Check dependency references after collecting all project IDs.
    for project in converted_projects:
        for dependency in project["dependencies"]:
            if dependency == project["id"]:
                raise ContractAdapterError(
                    f"Project '{project['id']}' cannot depend on itself."
                )

            if dependency not in project_ids:
                raise ContractAdapterError(
                    f"Project '{project['id']}' depends on unknown "
                    f"project ID '{dependency}'."
                )

    policy = payload.get("policy", {})

    if not isinstance(policy, dict):
        raise ContractAdapterError("'policy' must be an object.")

    require_accessibility = policy.get(
        "require_accessibility_project", False
    )

    if not isinstance(require_accessibility, bool):
        raise ContractAdapterError(
            "'require_accessibility_project' must be a Boolean."
        )

    scenario = payload.get(
        "scenario",
        {
            "id": "impactos-allocation",
            "name": "ImpactOS Allocation",
        },
    )

    scoring = payload.get(
        "scoring",
        {
            "method": "Benefit scores supplied in the request",
            "weights": {},
        },
    )

    if not isinstance(scenario, dict):
        raise ContractAdapterError("'scenario' must be an object.")

    if not isinstance(scoring, dict):
        raise ContractAdapterError("'scoring' must be an object.")

    default_constraints = [
        "Total selected project cost must not exceed the available budget.",
        "Every selected project's dependencies must also be selected.",
    ]

    if require_accessibility:
        default_constraints.append(
            "At least one accessibility project must be selected."
        )

    constraints = payload.get("constraints", default_constraints)

    if (
        not isinstance(constraints, list)
        or not all(isinstance(item, str) for item in constraints)
    ):
        raise ContractAdapterError(
            "'constraints' must be an array of strings."
        )

    return {
        "scenario": scenario,
        "budget": budget,
        "policies": {
            "require_accessibility": require_accessibility,
        },
        "scoring": scoring,
        "constraints": constraints,
        "projects": converted_projects,
    }


def adapt_optimization_result(result: dict[str, Any]) -> dict[str, Any]:
    """Convert the proposed API response into the report format."""

    if not isinstance(result, dict):
        raise ContractAdapterError(
            "Optimization result must be a JSON object."
        )

    status = result.get("status")

    if not isinstance(status, str) or not status.strip():
        raise ContractAdapterError(
            "Optimization result needs a non-empty status."
        )

    selected_ids = result.get("selected_project_ids", [])

    if (
        not isinstance(selected_ids, list)
        or not all(isinstance(item, str) for item in selected_ids)
    ):
        raise ContractAdapterError(
            "'selected_project_ids' must be an array of strings."
        )

    if (
        status.upper() in {"OPTIMAL", "FEASIBLE"}
        and "selected_project_ids" not in result
    ):
        raise ContractAdapterError(
            "Successful results must include 'selected_project_ids'."
        )

    converted = {
        "status": status,
        "selected_project_ids": selected_ids,
    }

    field_mapping = {
        "total_cost_inr": "total_cost",
        "total_benefit": "total_benefit",
        "remaining_budget_inr": "budget_remaining",
        "run_id": "run_id",
        "created_at": "created_at",
    }

    for source_field, report_field in field_mapping.items():
        if source_field in result:
            converted[report_field] = result[source_field]

    return converted


def generate_impactos_report(
    project_inputs: dict[str, Any],
    optimization_result: dict[str, Any],
    output_path: str | Path,
) -> dict[str, Any]:
    """Adapt the draft API payloads and generate the audit PDF."""

    # Import here to keep the mapping functions independently testable.
    from reports.report_generator import generate_report

    adapted_inputs = adapt_project_inputs(project_inputs)
    adapted_result = adapt_optimization_result(optimization_result)

    return generate_report(
        adapted_inputs,
        adapted_result,
        output_path,
    )
