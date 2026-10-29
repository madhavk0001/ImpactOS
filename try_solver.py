#!/usr/bin/env python3
"""ImpactOS Optimization Engine Demonstration CLI.

Executes Google OR-Tools CP-SAT solver against real university capital
project portfolios under varying budget constraints.
"""

import json
import os
import sys
from typing import Any, Dict

from optimizer.solver import solve_portfolio


def print_banner(title: str) -> None:
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)


def print_result_summary(scenario_name: str, result: Dict[str, Any]) -> None:
    print(f"\n[+] {scenario_name}")
    print(f"    Status:               {result['status']}")
    print(f"    Message:              {result['message']}")
    print(f"    Selected IDs:         {', '.join(result['selected_ids']) if result['selected_ids'] else 'None'}")
    
    if result.get("selected_projects"):
        print("    Selected Projects:")
        for p in result["selected_projects"]:
            acc_tag = "[Accessibility]" if p.get("is_accessibility") else ""
            print(f"      - {p['id']:12} | INR {p['cost_inr']:>8,} | Benefit: {p['benefit_score']:>3} | {p['name']} {acc_tag}")

    cost_str = f"INR {result['total_cost_inr']:,}" if result['total_cost_inr'] is not None else "N/A"
    rem_str = f"INR {result['remaining_budget_inr']:,}" if result['remaining_budget_inr'] is not None else "N/A"
    benefit_str = f"{result['total_benefit']}" if result['total_benefit'] is not None else "N/A"

    print(f"    Total Cost:           {cost_str}")
    print(f"    Total Benefit Score:  {benefit_str}")
    print(f"    Remaining Budget:     {rem_str}")

    if result.get("rejected_reasons"):
        print("    Rejected Projects & Reasons:")
        for rej in result["rejected_reasons"]:
            print(f"      - {rej['id']:12} ({rej['name']}): {rej['reason']}")


def run_demo() -> bool:
    data_path = os.path.join(os.path.dirname(__file__), "data", "demo_projects.json")
    if not os.path.exists(data_path):
        print(f"Error: Demo dataset file not found at {data_path}")
        return False

    with open(data_path, "r", encoding="utf-8") as f:
        projects = json.load(f)

    print_banner("IMPACTOS - BUDGET ALLOCATION OPTIMIZATION ENGINE")
    print(f"Loaded {len(projects)} candidate projects from data/demo_projects.json")

    success = True

    # =========================================================================
    # SCENARIO A: Budget INR 8,00,000 (Accessibility Mandatory)
    # =========================================================================
    payload_a = {
        "budget_inr": 800000,
        "require_accessibility": True,
        "projects": projects,
    }
    result_a = solve_portfolio(payload_a)
    print_result_summary("SCENARIO A: Budget INR 8,00,000 (Mandatory Accessibility)", result_a)

    expected_ids_a = {"ramps", "water", "lab", "led"}
    if (
        result_a["status"] == "OPTIMAL"
        and set(result_a["selected_ids"]) == expected_ids_a
        and result_a["total_cost_inr"] == 790000
        and result_a["total_benefit"] == 139
        and result_a["remaining_budget_inr"] == 10000
    ):
        print("    --> SCENARIO A PASSED [Verified against specification]")
    else:
        print("    --> [!] SCENARIO A FAILED verification checks!")
        success = False

    # =========================================================================
    # SCENARIO B: Budget INR 7,00,000 (Accessibility Mandatory)
    # =========================================================================
    payload_b = {
        "budget_inr": 700000,
        "require_accessibility": True,
        "projects": projects,
    }
    result_b = solve_portfolio(payload_b)
    print_result_summary("SCENARIO B: Budget INR 7,00,000 (Mandatory Accessibility)", result_b)

    expected_ids_b = {"ramps", "water", "lab"}
    if (
        result_b["status"] == "OPTIMAL"
        and set(result_b["selected_ids"]) == expected_ids_b
        and result_b["total_cost_inr"] == 680000
        and result_b["total_benefit"] == 119
        and result_b["remaining_budget_inr"] == 20000
    ):
        print("    --> SCENARIO B PASSED [Verified against specification]")
    else:
        print("    --> [!] SCENARIO B FAILED verification checks!")
        success = False

    # =========================================================================
    # SCENARIO C: Zero Budget with Accessibility Mandatory -> INFEASIBLE
    # =========================================================================
    payload_c = {
        "budget_inr": 0,
        "require_accessibility": True,
        "projects": projects,
    }
    result_c = solve_portfolio(payload_c)
    print_result_summary("SCENARIO C: Zero Budget with Mandatory Accessibility", result_c)

    if (
        result_c["status"] == "INFEASIBLE"
        and result_c["selected_ids"] == []
        and result_c["total_cost_inr"] is None
        and result_c["total_benefit"] is None
    ):
        print("    --> SCENARIO C PASSED [Infeasibility correctly handled]")
    else:
        print("    --> [!] SCENARIO C FAILED verification checks!")
        success = False

    # =========================================================================
    # SCENARIO D: Zero Budget with Accessibility Disabled -> OPTIMAL Empty
    # =========================================================================
    payload_d = {
        "budget_inr": 0,
        "require_accessibility": False,
        "projects": projects,
    }
    result_d = solve_portfolio(payload_d)
    print_result_summary("SCENARIO D: Zero Budget with Accessibility Disabled", result_d)

    if (
        result_d["status"] == "OPTIMAL"
        and result_d["selected_ids"] == []
        and result_d["total_cost_inr"] == 0
        and result_d["total_benefit"] == 0
        and result_d["remaining_budget_inr"] == 0
    ):
        print("    --> SCENARIO D PASSED [Empty portfolio correctly solved]")
    else:
        print("    --> [!] SCENARIO D FAILED verification checks!")
        success = False

    # =========================================================================
    # JSON Serialization Verification
    # =========================================================================
    try:
        json.dumps(result_a)
        json.dumps(result_b)
        json.dumps(result_c)
        json.dumps(result_d)
        print("\n[+] JSON serialization verified for all solver output responses.")
    except Exception as e:
        print(f"\n[!] JSON serialization check failed: {e}")
        success = False

    print("\n" + "=" * 70)
    if success:
        print(" ALL DEMONSTRATION SCENARIOS EXECUTED AND VERIFIED SUCCESSFULLY.")
    else:
        print(" ONE OR MORE DEMONSTRATION SCENARIOS FAILED.")
    print("=" * 70 + "\n")

    return success


if __name__ == "__main__":
    ok = run_demo()
    sys.exit(0 if ok else 1)

