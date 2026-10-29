#!/usr/bin/env python3
"""Generate an ImpactOS allocation audit PDF from two JSON files.

This module is intentionally independent of FastAPI, React, and OR-Tools.
It consumes the validated project inputs and the optimizer's JSON response.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import datetime
from html import escape
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# Theme colors are deliberately centralized so the team can adjust the look easily.
NAVY = colors.HexColor("#14243A")
BLUE = colors.HexColor("#2367A8")
PALE_BLUE = colors.HexColor("#EAF2FA")
PALE_GREEN = colors.HexColor("#E8F5EC")
GREEN = colors.HexColor("#267345")
PALE_RED = colors.HexColor("#FCEBEC")
RED = colors.HexColor("#A62932")
PALE_AMBER = colors.HexColor("#FFF4D8")
AMBER = colors.HexColor("#805B00")
LIGHT_GREY = colors.HexColor("#F3F5F7")
MID_GREY = colors.HexColor("#667085")
DARK = colors.HexColor("#202938")
GRID = colors.HexColor("#D9E0E7")
WHITE = colors.white

SUCCESS_STATUSES = {"OPTIMAL", "FEASIBLE"}


class InputDataError(ValueError):
    """Raised when the JSON input does not match the report contract."""


def load_json(path: str | Path) -> dict[str, Any]:
    """Load a JSON file and require an object at the top level."""
    file_path = Path(path)
    try:
        with file_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError as exc:
        raise InputDataError(f"File not found: {file_path}") from exc
    except json.JSONDecodeError as exc:
        raise InputDataError(
            f"Invalid JSON in {file_path} at line {exc.lineno}, column {exc.colno}: {exc.msg}"
        ) from exc
    if not isinstance(data, dict):
        raise InputDataError(f"Expected a JSON object at the top level in {file_path}.")
    return data


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _is_integer_rupees(value: Any) -> bool:
    """Money in the project contract is represented as whole INR, never float."""
    return isinstance(value, int) and not isinstance(value, bool)


def _money(value: int | float | None) -> str:
    """Format Indian rupees without relying on a font-specific rupee glyph."""
    if value is None:
        return "Not provided"
    amount = int(round(value))
    sign = "-" if amount < 0 else ""
    digits = str(abs(amount))
    if len(digits) <= 3:
        formatted = digits
    else:
        last_three = digits[-3:]
        rest = digits[:-3]
        groups: list[str] = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        formatted = ",".join(groups + [last_three])
    return f"INR {sign}{formatted}"


def _score(value: Any) -> str:
    if value is None:
        return "Not provided"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _p(text: Any, style: ParagraphStyle) -> Paragraph:
    """Create a Paragraph safely, escaping values that may contain HTML characters."""
    if text is None:
        text = "-"
    return Paragraph(escape(str(text)).replace("\n", "<br/>"), style)


def _validate_and_summarize(
    project_inputs: dict[str, Any], result: dict[str, Any]
) -> dict[str, Any]:
    if "budget" not in project_inputs or not _is_integer_rupees(project_inputs["budget"]):
        raise InputDataError("project_inputs.json must contain 'budget' as an integer number of INR (no decimals).")
    budget = project_inputs["budget"]
    if budget < 0:
        raise InputDataError("'budget' cannot be negative.")

    projects = project_inputs.get("projects")
    if not isinstance(projects, list) or not projects:
        raise InputDataError("project_inputs.json must contain a non-empty 'projects' array.")

    by_id: dict[str, dict[str, Any]] = {}
    for index, project in enumerate(projects):
        if not isinstance(project, dict):
            raise InputDataError(f"Project at index {index} must be a JSON object.")
        project_id = project.get("id")
        if not isinstance(project_id, str) or not project_id.strip():
            raise InputDataError(f"Project at index {index} must have a non-empty string 'id'.")
        if project_id in by_id:
            raise InputDataError(f"Duplicate project id: {project_id}")
        if not isinstance(project.get("name"), str) or not project["name"].strip():
            raise InputDataError(f"Project '{project_id}' must have a non-empty 'name'.")
        if not _is_integer_rupees(project.get("cost")) or project["cost"] < 0:
            raise InputDataError(f"Project '{project_id}' must have a non-negative integer 'cost' in INR (no decimals).")
        if not _is_number(project.get("benefit")):
            raise InputDataError(f"Project '{project_id}' must have a numeric 'benefit' score.")
        dependencies = project.get("dependencies", [])
        if not isinstance(dependencies, list) or not all(isinstance(item, str) for item in dependencies):
            raise InputDataError(f"Project '{project_id}' field 'dependencies' must be an array of project IDs.")
        by_id[project_id] = project

    # Dependencies must refer to existing projects; otherwise explanations can be misleading.
    for project_id, project in by_id.items():
        for dependency in project.get("dependencies", []):
            if dependency not in by_id:
                raise InputDataError(
                    f"Project '{project_id}' depends on unknown project ID '{dependency}'."
                )

    status = str(result.get("status", "UNKNOWN")).upper()
    is_success = status in SUCCESS_STATUSES
    selected_ids_raw = result.get("selected_project_ids", [])
    if not isinstance(selected_ids_raw, list) or not all(isinstance(item, str) for item in selected_ids_raw):
        raise InputDataError("optimization_result.json field 'selected_project_ids' must be an array of IDs.")

    if is_success and "selected_project_ids" not in result:
        raise InputDataError("A successful result must include 'selected_project_ids'.")

    selected_ids = selected_ids_raw if is_success else []
    unknown_ids = sorted(set(selected_ids) - set(by_id))
    if unknown_ids:
        raise InputDataError("Solver selected unknown project ID(s): " + ", ".join(unknown_ids))
    if len(selected_ids) != len(set(selected_ids)):
        raise InputDataError("'selected_project_ids' contains duplicate project IDs.")

    selected_projects = [by_id[project_id] for project_id in selected_ids]
    computed_cost = sum(project["cost"] for project in selected_projects) if is_success else None
    computed_benefit = sum(project["benefit"] for project in selected_projects) if is_success else None
    computed_remaining = budget - computed_cost if is_success else None

    checks: list[tuple[str, bool | None, str]] = []
    warnings: list[str] = []
    if is_success:
        budget_ok = computed_cost <= budget
        checks.append(("Budget limit", budget_ok, f"Selected cost {_money(computed_cost)}; budget {_money(budget)}."))
        if not budget_ok:
            warnings.append("The returned allocation exceeds the budget in project_inputs.json.")

        missing_dependencies: list[str] = []
        selected_set = set(selected_ids)
        for project in selected_projects:
            for dependency in project.get("dependencies", []):
                if dependency not in selected_set:
                    missing_dependencies.append(f"{project['name']} requires {by_id[dependency]['name']}")
        dependency_ok = not missing_dependencies
        checks.append(("Dependencies", dependency_ok, "All selected-project dependencies are included." if dependency_ok else "; ".join(missing_dependencies)))
        if not dependency_ok:
            warnings.append("One or more selected projects are missing required dependencies.")

        policies = project_inputs.get("policies", {})
        if not isinstance(policies, dict):
            raise InputDataError("'policies' must be a JSON object when provided.")
        if policies.get("require_accessibility", False):
            has_accessibility = any(bool(project.get("accessibility", False)) for project in selected_projects)
            checks.append(("Accessibility policy", has_accessibility, "At least one accessibility project is selected." if has_accessibility else "Accessibility is required, but no accessibility project is selected."))
            if not has_accessibility:
                warnings.append("The result does not satisfy the configured accessibility policy.")

        # The project inputs are the source of truth for recalculated totals. Compare them to the solver output.
        reported_comparisons = [
            ("total_cost", computed_cost, "reported total_cost"),
            ("total_benefit", computed_benefit, "reported total_benefit"),
            ("budget_remaining", computed_remaining, "reported budget_remaining"),
        ]
        for key, calculated, label in reported_comparisons:
            if key in result and _is_number(result[key]):
                if not math.isclose(float(calculated), float(result[key]), rel_tol=0, abs_tol=0.000001):
                    warnings.append(
                        f"{label} ({result[key]}) does not match the value recalculated from the original inputs ({calculated})."
                    )
        for name, ok, detail in checks:
            if not ok:
                continue
    else:
        checks.append(("Solver status", False, f"No allocation is presented because solver status is {status}."))
        if selected_ids_raw:
            warnings.append("The result includes selected IDs despite a non-success status; they were ignored in this report.")

    scenario = project_inputs.get("scenario", {})
    if not isinstance(scenario, dict):
        raise InputDataError("'scenario' must be a JSON object when provided.")
    scoring = project_inputs.get("scoring", {})
    if not isinstance(scoring, dict):
        raise InputDataError("'scoring' must be a JSON object when provided.")
    policies = project_inputs.get("policies", {})
    constraints = project_inputs.get("constraints", [])
    if not isinstance(constraints, list):
        raise InputDataError("'constraints' must be an array of strings when provided.")

    return {
        "budget": budget,
        "projects": projects,
        "by_id": by_id,
        "status": status,
        "is_success": is_success,
        "selected_ids": selected_ids,
        "selected_set": set(selected_ids),
        "computed_cost": computed_cost,
        "computed_benefit": computed_benefit,
        "computed_remaining": computed_remaining,
        "checks": checks,
        "warnings": warnings,
        "scenario": scenario,
        "scoring": scoring,
        "policies": policies,
        "constraints": constraints,
        "result": result,
        "project_inputs": project_inputs,
    }


def _build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ImpactTitle", parent=base["Title"], fontName="Helvetica-Bold", fontSize=22,
            leading=26, textColor=NAVY, alignment=TA_LEFT, spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "ImpactSubtitle", parent=base["Normal"], fontName="Helvetica", fontSize=9.5,
            leading=13, textColor=MID_GREY, spaceAfter=5,
        ),
        "section": ParagraphStyle(
            "ImpactSection", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=12,
            leading=15, textColor=NAVY, spaceBefore=12, spaceAfter=6, keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "ImpactBody", parent=base["BodyText"], fontName="Helvetica", fontSize=8.5,
            leading=12, textColor=DARK, spaceAfter=3,
        ),
        "small": ParagraphStyle(
            "ImpactSmall", parent=base["BodyText"], fontName="Helvetica", fontSize=7.3,
            leading=9.3, textColor=DARK,
        ),
        "small_grey": ParagraphStyle(
            "ImpactSmallGrey", parent=base["BodyText"], fontName="Helvetica", fontSize=7.3,
            leading=9.3, textColor=MID_GREY,
        ),
        "table_header": ParagraphStyle(
            "ImpactTableHeader", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7.2,
            leading=8.5, textColor=WHITE,
        ),
        "table_cell": ParagraphStyle(
            "ImpactTableCell", parent=base["BodyText"], fontName="Helvetica", fontSize=7.2,
            leading=9, textColor=DARK,
        ),
        "table_cell_bold": ParagraphStyle(
            "ImpactTableCellBold", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7.2,
            leading=9, textColor=DARK,
        ),
        "metric_label": ParagraphStyle(
            "MetricLabel", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7,
            leading=9, textColor=MID_GREY, alignment=TA_LEFT,
        ),
        "metric_value": ParagraphStyle(
            "MetricValue", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=12,
            leading=15, textColor=NAVY, alignment=TA_LEFT,
        ),
        "note": ParagraphStyle(
            "ImpactNote", parent=base["BodyText"], fontName="Helvetica", fontSize=8,
            leading=11, textColor=DARK,
        ),
    }


def _make_table(data: list[list[Any]], widths: list[float], header: bool = True, font_size: int = 8) -> Table:
    table = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands: list[tuple[Any, ...]] = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
    ]
    if header:
        commands.extend([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ])
        if len(data) > 1:
            commands.append(("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]))
    table.setStyle(TableStyle(commands))
    return table


def _header_footer(canvas: Any, document: Any) -> None:
    canvas.saveState()
    width, height = A4
    if document.page > 1:
        canvas.setStrokeColor(GRID)
        canvas.setLineWidth(0.5)
        canvas.line(18 * mm, height - 14 * mm, width - 18 * mm, height - 14 * mm)
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.setFillColor(NAVY)
        canvas.drawString(18 * mm, height - 11 * mm, "ImpactOS | Allocation Audit")
    canvas.setStrokeColor(GRID)
    canvas.line(18 * mm, 13 * mm, width - 18 * mm, 13 * mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MID_GREY)
    canvas.drawString(18 * mm, 8.5 * mm, "Generated from the supplied inputs and optimization result")
    canvas.drawRightString(width - 18 * mm, 8.5 * mm, f"Page {document.page}")
    canvas.restoreState()


def generate_report(
    project_inputs: dict[str, Any], result: dict[str, Any], output_path: str | Path
) -> dict[str, Any]:
    """Generate a PDF report. Returns summary/check details for tests and logs."""
    audit = _validate_and_summarize(project_inputs, result)
    styles = _build_styles()
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output), pagesize=A4,
        rightMargin=17 * mm, leftMargin=17 * mm,
        topMargin=20 * mm, bottomMargin=19 * mm,
        title="ImpactOS - Budget Allocation Audit Report",
        author="ImpactOS",
        subject="Budget allocation optimization audit",
    )
    story: list[Any] = []
    scenario = audit["scenario"]
    result_data = audit["result"]
    scenario_name = scenario.get("name", "Untitled scenario")
    scenario_id = scenario.get("id", "Not provided")
    timestamp = (
        result_data.get("created_at")
        or result_data.get("timestamp")
        or scenario.get("created_at")
        or datetime.now().astimezone().isoformat(timespec="seconds")
    )
    status = audit["status"]

    story.append(Paragraph("ImpactOS", styles["title"]))
    story.append(Paragraph("BUDGET ALLOCATION AUDIT REPORT", styles["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.2, color=BLUE, spaceBefore=3, spaceAfter=10))
    story.append(Paragraph(f"<b>Scenario:</b> {_safe_inline(scenario_name)}", styles["body"]))
    story.append(Paragraph(f"<b>Scenario ID:</b> {_safe_inline(scenario_id)} &nbsp;&nbsp; <b>Run ID:</b> {_safe_inline(result_data.get('run_id', 'Not provided'))}", styles["body"]))
    story.append(Paragraph(f"<b>Report timestamp:</b> {_safe_inline(timestamp)}", styles["body"]))

    status_color = GREEN if status == "OPTIMAL" else (BLUE if status == "FEASIBLE" else RED)
    status_bg = PALE_GREEN if status == "OPTIMAL" else (PALE_BLUE if status == "FEASIBLE" else PALE_RED)
    status_message = {
        "OPTIMAL": "Optimality established for the supplied mathematical model.",
        "FEASIBLE": "A valid allocation was returned; optimality has not necessarily been proven.",
        "INFEASIBLE": "No allocation satisfies all constraints in the supplied model.",
        "MODEL_INVALID": "The solver reports that the optimization model is invalid. No allocation is presented.",
        "UNKNOWN": "The solver did not establish a valid result. This is not proof of infeasibility.",
        "ERROR": "The optimization run failed. No allocation is presented.",
        "FAILED": "The optimization run failed. No allocation is presented.",
    }.get(status, "No valid allocation is presented for this solver status.")
    status_table = Table(
        [[Paragraph(f"<b>Solver status: {escape(status)}</b><br/>{escape(status_message)}", styles["note"])]],
        colWidths=[doc.width],
    )
    status_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), status_bg),
        ("BOX", (0, 0), (-1, -1), 0.8, status_color),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(Spacer(1, 5))
    story.append(status_table)

    story.append(Paragraph("Executive Summary", styles["section"]))
    metrics = [
        [Paragraph("AVAILABLE BUDGET", styles["metric_label"]), Paragraph("ALLOCATED", styles["metric_label"]), Paragraph("BUDGET REMAINING", styles["metric_label"]), Paragraph("TOTAL BENEFIT", styles["metric_label"])],
    ]
    if audit["is_success"]:
        metrics.append([
            Paragraph(escape(_money(audit["budget"])), styles["metric_value"]),
            Paragraph(escape(_money(audit["computed_cost"])), styles["metric_value"]),
            Paragraph(escape(_money(audit["computed_remaining"])), styles["metric_value"]),
            Paragraph(escape(_score(audit["computed_benefit"])), styles["metric_value"]),
        ])
    else:
        metrics.append([
            Paragraph(escape(_money(audit["budget"])), styles["metric_value"]),
            Paragraph("Not available", styles["metric_value"]),
            Paragraph("Not available", styles["metric_value"]),
            Paragraph("Not available", styles["metric_value"]),
        ])
    metric_table = Table(metrics, colWidths=[doc.width / 4] * 4)
    metric_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREY),
        ("BOX", (0, 0), (-1, -1), 0.5, GRID),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(metric_table)
    story.append(Spacer(1, 4))

    if not audit["is_success"]:
        story.append(Paragraph(
            "<b>No recommended portfolio is shown.</b> The solver did not return an OPTIMAL or FEASIBLE result. Review the solver status and input constraints, then run the scenario again.",
            styles["body"],
        ))

    # Validation checks and any mismatches are intentionally visible in the PDF.
    story.append(Paragraph("Validation Checks", styles["section"]))
    check_rows: list[list[Any]] = [[_p("Check", styles["table_header"]), _p("Outcome", styles["table_header"]), _p("Details", styles["table_header"])]]
    for check_name, passed, detail in audit["checks"]:
        outcome = "PASS" if passed else ("REVIEW" if passed is None else "FAIL")
        check_rows.append([
            _p(check_name, styles["table_cell_bold"]),
            _p(outcome, styles["table_cell_bold"]),
            _p(detail, styles["table_cell"]),
        ])
    check_table = _make_table(check_rows, [100, 60, doc.width - 160])
    for row_idx, (_, passed, _) in enumerate(audit["checks"], start=1):
        shade = PALE_GREEN if passed is True else (PALE_AMBER if passed is None else PALE_RED)
        check_table.setStyle(TableStyle([("BACKGROUND", (1, row_idx), (1, row_idx), shade)]))
    story.append(check_table)

    if audit["warnings"]:
        story.append(Paragraph("Review Notes", styles["section"]))
        for warning in audit["warnings"]:
            story.append(Paragraph(f"• {escape(warning)}", styles["body"]))

    story.append(Paragraph("Project Allocation", styles["section"]))
    project_rows: list[list[Any]] = [[
        _p("Project", styles["table_header"]),
        _p("Department", styles["table_header"]),
        _p("Cost", styles["table_header"]),
        _p("Benefit", styles["table_header"]),
        _p("Access", styles["table_header"]),
        _p("Dependencies", styles["table_header"]),
        _p("Decision", styles["table_header"]),
    ]]
    for project in audit["projects"]:
        project_id = project["id"]
        if not audit["is_success"]:
            decision = "No allocation"
        else:
            decision = "Funded" if project_id in audit["selected_set"] else "Deferred"
        dependency_names = [audit["by_id"][dep]["name"] for dep in project.get("dependencies", [])]
        project_rows.append([
            _p(project["name"], styles["table_cell_bold"]),
            _p(project.get("department", "-"), styles["table_cell"]),
            _p(_money(project["cost"]), styles["table_cell"]),
            _p(_score(project["benefit"]), styles["table_cell"]),
            _p("Yes" if project.get("accessibility", False) else "No", styles["table_cell"]),
            _p(", ".join(dependency_names) if dependency_names else "None", styles["table_cell"]),
            _p(decision, styles["table_cell_bold"]),
        ])
    allocation_table = _make_table(
        project_rows,
        [92, 58, 67, 43, 43, 95, doc.width - (92 + 58 + 67 + 43 + 43 + 95)],
    )
    # Highlight decisions without hiding the project values.
    for row_idx, project in enumerate(audit["projects"], start=1):
        if not audit["is_success"]:
            shade = PALE_AMBER
        else:
            shade = PALE_GREEN if project["id"] in audit["selected_set"] else LIGHT_GREY
        allocation_table.setStyle(TableStyle([("BACKGROUND", (6, row_idx), (6, row_idx), shade)]))
    story.append(allocation_table)

    if audit["is_success"]:
        story.append(Paragraph("Selected Portfolio", styles["section"]))
        selected_projects = [p for p in audit["projects"] if p["id"] in audit["selected_set"]]
        if selected_projects:
            selected_rows: list[list[Any]] = [[
                _p("Selected project", styles["table_header"]),
                _p("Cost", styles["table_header"]),
                _p("Benefit", styles["table_header"]),
            ]]
            for project in selected_projects:
                selected_rows.append([
                    _p(project["name"], styles["table_cell"]),
                    _p(_money(project["cost"]), styles["table_cell"]),
                    _p(_score(project["benefit"]), styles["table_cell"]),
                ])
            selected_rows.append([
                _p("TOTAL", styles["table_cell_bold"]),
                _p(_money(audit["computed_cost"]), styles["table_cell_bold"]),
                _p(_score(audit["computed_benefit"]), styles["table_cell_bold"]),
            ])
            selected_table = _make_table(selected_rows, [doc.width * 0.58, doc.width * 0.24, doc.width * 0.18])
            selected_table.setStyle(TableStyle([("BACKGROUND", (0, -1), (-1, -1), PALE_BLUE)]))
            story.append(selected_table)
        else:
            story.append(Paragraph("The solver returned a valid empty portfolio.", styles["body"]))

    story.append(Paragraph("Policies, Scoring and Constraints", styles["section"]))
    policy_rows: list[list[Any]] = [[_p("Setting", styles["table_header"]), _p("Value", styles["table_header"])]]
    policy_rows.append([_p("Require accessibility project", styles["table_cell"]), _p(str(bool(audit["policies"].get("require_accessibility", False))), styles["table_cell"])])
    scoring = audit["scoring"]
    policy_rows.append([_p("Scoring method", styles["table_cell"]), _p(scoring.get("method", "Not specified"), styles["table_cell"])])
    weights = scoring.get("weights", {})
    if isinstance(weights, dict) and weights:
        for weight_name, weight_value in weights.items():
            if _is_number(weight_value):
                display_weight = f"{weight_value * 100:g}%" if abs(weight_value) <= 1 else f"{weight_value:g}"
            else:
                display_weight = str(weight_value)
            policy_rows.append([_p(f"Weight: {weight_name.replace('_', ' ')}", styles["table_cell"]), _p(display_weight, styles["table_cell"])])
    if audit["constraints"]:
        for index, constraint in enumerate(audit["constraints"], start=1):
            if isinstance(constraint, dict):
                label = constraint.get("name", f"Constraint {index}")
                detail = constraint.get("description", json.dumps(constraint, ensure_ascii=False))
                value = f"{label}: {detail}"
            else:
                value = str(constraint)
            policy_rows.append([_p(f"Constraint {index}", styles["table_cell"]), _p(value, styles["table_cell"])])
    policy_table = _make_table(policy_rows, [155, doc.width - 155])
    story.append(policy_table)

    story.append(Spacer(1, 9))
    story.append(Paragraph(
        "Interpretation: this report documents the supplied model inputs and the optimization result. Benefit scores depend on the scoring method, weights, and source data provided by the institution. A higher modeled score is not, by itself, proof of real-world impact or fairness.",
        styles["small_grey"],
    ))

    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    return {
        "output_path": str(output.resolve()),
        "status": audit["status"],
        "is_success": audit["is_success"],
        "selected_project_ids": list(audit["selected_ids"]),
        "computed_total_cost": audit["computed_cost"],
        "computed_total_benefit": audit["computed_benefit"],
        "computed_budget_remaining": audit["computed_remaining"],
        "checks": audit["checks"],
        "warnings": audit["warnings"],
    }


def _safe_inline(value: Any) -> str:
    return escape(str(value if value is not None else "Not provided"))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate an ImpactOS PDF audit report from project inputs and an optimization result."
    )
    parser.add_argument("--inputs", required=True, help="Path to original project-inputs JSON")
    parser.add_argument("--result", required=True, help="Path to optimizer-result JSON")
    parser.add_argument("--output", default="output/impactos_audit_report.pdf", help="PDF output path")
    args = parser.parse_args()

    try:
        project_inputs = load_json(args.inputs)
        result = load_json(args.result)
        summary = generate_report(project_inputs, result, args.output)
    except (InputDataError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:  # Keep a helpful CLI error while leaving tracebacks for developers.
        print(f"ERROR: Could not generate the report: {exc}", file=sys.stderr)
        print("Run the command again from the project directory and inspect the JSON structure.", file=sys.stderr)
        return 3

    print(f"PDF generated: {summary['output_path']}")
    print(f"Solver status: {summary['status']}")
    if summary["is_success"]:
        print(f"Recalculated allocation: {_money(summary['computed_total_cost'])}")
        print(f"Recalculated benefit score: {_score(summary['computed_total_benefit'])}")
        print(f"Budget remaining: {_money(summary['computed_budget_remaining'])}")
    if summary["warnings"]:
        print("Review notes:")
        for warning in summary["warnings"]:
            print(f"  - {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
