"""Automated test suite for the ImpactOS Budget Allocation Optimization Engine.

Tests Google OR-Tools CP-SAT formulation, mathematical constraints,
input validation, edge cases, and JSON serialization.
"""

import json
import os
import unittest
from typing import Any, Dict, List

from optimizer.solver import InputValidationError, solve_portfolio


def load_demo_projects() -> List[Dict[str, Any]]:
    path = os.path.join(os.path.dirname(__file__), "..", "data", "demo_projects.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class TestOptimizationSolver(unittest.TestCase):
    """Test suite covering the 20 required scenarios and edge cases."""

    def setUp(self) -> None:
        self.demo_projects = load_demo_projects()

    # 1. The ₹8 lakh demonstration
    def test_scenario_a_8_lakh(self) -> None:
        payload = {
            "budget_inr": 800000,
            "require_accessibility": True,
            "projects": self.demo_projects,
        }
        res = solve_portfolio(payload)
        self.assertEqual(res["status"], "OPTIMAL")
        self.assertEqual(set(res["selected_ids"]), {"ramps", "water", "lab", "led"})
        self.assertEqual(res["total_cost_inr"], 790000)
        self.assertEqual(res["total_benefit"], 139)
        self.assertEqual(res["remaining_budget_inr"], 10000)
        self.assertIn("Optimal", res["message"])

    # 2. The ₹7 lakh demonstration
    def test_scenario_b_7_lakh(self) -> None:
        payload = {
            "budget_inr": 700000,
            "require_accessibility": True,
            "projects": self.demo_projects,
        }
        res = solve_portfolio(payload)
        self.assertEqual(res["status"], "OPTIMAL")
        self.assertEqual(set(res["selected_ids"]), {"ramps", "water", "lab"})
        self.assertEqual(res["total_cost_inr"], 680000)
        self.assertEqual(res["total_benefit"], 119)
        self.assertEqual(res["remaining_budget_inr"], 20000)

    # 3. Zero budget with accessibility mandatory: INFEASIBLE
    def test_zero_budget_mandatory_accessibility(self) -> None:
        payload = {
            "budget_inr": 0,
            "require_accessibility": True,
            "projects": self.demo_projects,
        }
        res = solve_portfolio(payload)
        self.assertEqual(res["status"], "INFEASIBLE")
        self.assertEqual(res["selected_ids"], [])
        self.assertEqual(res["selected_projects"], [])
        self.assertIsNone(res["total_cost_inr"])
        self.assertIsNone(res["total_benefit"])
        self.assertIsNone(res["remaining_budget_inr"])
        self.assertTrue(len(res["rejected_reasons"]) > 0)
        for rej in res["rejected_reasons"]:
            self.assertEqual(
                rej["reason"],
                "No feasible allocation satisfies the current mandatory constraints.",
            )

    # 4. Zero budget with accessibility disabled: OPTIMAL empty portfolio
    def test_zero_budget_accessibility_disabled(self) -> None:
        payload = {
            "budget_inr": 0,
            "require_accessibility": False,
            "projects": self.demo_projects,
        }
        res = solve_portfolio(payload)
        self.assertEqual(res["status"], "OPTIMAL")
        self.assertEqual(res["selected_ids"], [])
        self.assertEqual(res["selected_projects"], [])
        self.assertEqual(res["total_cost_inr"], 0)
        self.assertEqual(res["total_benefit"], 0)
        self.assertEqual(res["remaining_budget_inr"], 0)

    # 5. Budget too small to satisfy mandatory accessibility
    def test_budget_too_small_for_accessibility(self) -> None:
        # Ramps costs 220000; budget of 219999 cannot fund any accessibility project
        payload = {
            "budget_inr": 219999,
            "require_accessibility": True,
            "projects": self.demo_projects,
        }
        res = solve_portfolio(payload)
        self.assertEqual(res["status"], "INFEASIBLE")
        self.assertIsNone(res["total_cost_inr"])

    # 6. Wi-Fi can never be selected without electrical substation upgrade
    def test_wifi_dependency_enforced(self) -> None:
        # Scenario 6a: With demo projects at 8 lakh, substation is not selected;
        # wifi must not be selected and must state its prerequisite is missing.
        res_demo = solve_portfolio({"budget_inr": 800000, "require_accessibility": True, "projects": self.demo_projects})
        self.assertNotIn("substation", res_demo["selected_ids"])
        self.assertNotIn("wifi", res_demo["selected_ids"])
        rej_wifi_demo = next(r for r in res_demo["rejected_reasons"] if r["id"] == "wifi")
        self.assertIn("prerequisite", rej_wifi_demo["reason"].lower())

        # Scenario 6b: Wifi has huge benefit (1000) and cost 170000.
        # Budget is 200000 (enough for wifi alone, but not substation 150000 + wifi 170000 = 320000).
        # Without dependency, wifi would be selected. With dependency, wifi CANNOT be selected.
        custom_projects = [
            {
                "id": "substation",
                "name": "Substation",
                "cost_inr": 150000,
                "benefit_score": 1,
                "is_accessibility": False,
                "depends_on": [],
            },
            {
                "id": "wifi",
                "name": "Wi-Fi",
                "cost_inr": 170000,
                "benefit_score": 1000,
                "is_accessibility": False,
                "depends_on": ["substation"],
            },
        ]
        res = solve_portfolio({
            "budget_inr": 200000,
            "require_accessibility": False,
            "projects": custom_projects,
        })
        self.assertEqual(res["status"], "OPTIMAL")
        # Wifi must not be selected because its prerequisite cannot be funded alongside it
        self.assertNotIn("wifi", res["selected_ids"])
        # If wifi is ever selected (e.g. with budget 350000), substation MUST also be selected
        res_large = solve_portfolio({
            "budget_inr": 350000,
            "require_accessibility": False,
            "projects": custom_projects,
        })
        self.assertIn("wifi", res_large["selected_ids"])
        self.assertIn("substation", res_large["selected_ids"])

    # 7. A project with multiple dependencies requires every prerequisite
    def test_multiple_dependencies_required(self) -> None:
        projects = [
            {"id": "A", "name": "Req A", "cost_inr": 100, "benefit_score": 10, "is_accessibility": False, "depends_on": []},
            {"id": "B", "name": "Req B", "cost_inr": 100, "benefit_score": 10, "is_accessibility": False, "depends_on": []},
            {"id": "C", "name": "Target C", "cost_inr": 100, "benefit_score": 500, "is_accessibility": False, "depends_on": ["A", "B"]},
        ]
        # Budget 250 allows two projects (200), but not all three (300).
        # C requires both A and B, which would cost 300 total.
        res = solve_portfolio({"budget_inr": 250, "require_accessibility": False, "projects": projects})
        self.assertEqual(res["status"], "OPTIMAL")
        self.assertNotIn("C", res["selected_ids"])

        # With budget 300, all three are funded
        res300 = solve_portfolio({"budget_inr": 300, "require_accessibility": False, "projects": projects})
        self.assertEqual(res300["status"], "OPTIMAL")
        self.assertEqual(set(res300["selected_ids"]), {"A", "B", "C"})

    # 8. Missing dependency IDs are rejected during input validation
    def test_missing_dependency_rejected(self) -> None:
        projects = [
            {"id": "proj1", "name": "Project 1", "cost_inr": 100, "benefit_score": 10, "is_accessibility": False, "depends_on": ["ghost_project"]},
        ]
        with self.assertRaises(InputValidationError) as ctx:
            solve_portfolio({"budget_inr": 1000, "require_accessibility": False, "projects": projects})
        self.assertIn("ghost_project", str(ctx.exception))

    # 9. Duplicate project IDs are rejected
    def test_duplicate_project_ids_rejected(self) -> None:
        projects = [
            {"id": "dup", "name": "Dup 1", "cost_inr": 100, "benefit_score": 10, "is_accessibility": False, "depends_on": []},
            {"id": "dup", "name": "Dup 2", "cost_inr": 100, "benefit_score": 10, "is_accessibility": False, "depends_on": []},
        ]
        with self.assertRaises(InputValidationError) as ctx:
            solve_portfolio({"budget_inr": 1000, "require_accessibility": False, "projects": projects})
        self.assertIn("Duplicate project ID", str(ctx.exception))

    # 10. Negative budget or cost is rejected
    def test_negative_budget_and_cost_rejected(self) -> None:
        with self.assertRaises(InputValidationError):
            solve_portfolio({"budget_inr": -500, "require_accessibility": False, "projects": self.demo_projects})

        bad_cost_projects = [
            {"id": "p1", "name": "P1", "cost_inr": -100, "benefit_score": 10, "is_accessibility": False, "depends_on": []}
        ]
        with self.assertRaises(InputValidationError):
            solve_portfolio({"budget_inr": 500, "require_accessibility": False, "projects": bad_cost_projects})

    # 11. Boolean values supplied as monetary integers are rejected
    def test_booleans_rejected_for_integers(self) -> None:
        # budget_inr is True
        with self.assertRaises(InputValidationError) as ctx:
            solve_portfolio({"budget_inr": True, "require_accessibility": False, "projects": self.demo_projects})
        self.assertIn("budget_inr", str(ctx.exception))

        # cost_inr is False
        bad_cost = [
            {"id": "p1", "name": "P1", "cost_inr": False, "benefit_score": 10, "is_accessibility": False, "depends_on": []}
        ]
        with self.assertRaises(InputValidationError):
            solve_portfolio({"budget_inr": 500, "require_accessibility": False, "projects": bad_cost})

        # benefit_score is True
        bad_score = [
            {"id": "p1", "name": "P1", "cost_inr": 100, "benefit_score": True, "is_accessibility": False, "depends_on": []}
        ]
        with self.assertRaises(InputValidationError):
            solve_portfolio({"budget_inr": 500, "require_accessibility": False, "projects": bad_score})

    # 12. Malformed project objects are rejected
    def test_malformed_project_objects_rejected(self) -> None:
        # Missing name
        bad_p1 = [{"id": "p1", "cost_inr": 100, "benefit_score": 10, "is_accessibility": False}]
        with self.assertRaises(InputValidationError):
            solve_portfolio({"budget_inr": 1000, "require_accessibility": False, "projects": bad_p1})

        # Float cost
        bad_p2 = [{"id": "p1", "name": "P1", "cost_inr": 100.5, "benefit_score": 10, "is_accessibility": False}]
        with self.assertRaises(InputValidationError):
            solve_portfolio({"budget_inr": 1000, "require_accessibility": False, "projects": bad_p2})

        # Non-dict project
        with self.assertRaises(InputValidationError):
            solve_portfolio({"budget_inr": 1000, "require_accessibility": False, "projects": ["not_a_dict"]})

    # 13. An empty project list behaves correctly when accessibility is not required
    def test_empty_projects_accessibility_disabled(self) -> None:
        payload = {"budget_inr": 500000, "require_accessibility": False, "projects": []}
        res = solve_portfolio(payload)
        self.assertEqual(res["status"], "OPTIMAL")
        self.assertEqual(res["selected_ids"], [])
        self.assertEqual(res["total_cost_inr"], 0)
        self.assertEqual(res["total_benefit"], 0)
        self.assertEqual(res["remaining_budget_inr"], 500000)

    # 14. An empty project list is INFEASIBLE when accessibility is mandatory
    def test_empty_projects_accessibility_mandatory(self) -> None:
        payload = {"budget_inr": 500000, "require_accessibility": True, "projects": []}
        res = solve_portfolio(payload)
        self.assertEqual(res["status"], "INFEASIBLE")
        self.assertEqual(res["selected_ids"], [])
        self.assertIsNone(res["total_cost_inr"])

    # 15. Input with no feasible combination is reported accurately
    def test_no_feasible_combination(self) -> None:
        # require_accessibility is True, but no accessibility projects are provided
        projects_no_acc = [
            {"id": "p1", "name": "P1", "cost_inr": 100, "benefit_score": 50, "is_accessibility": False, "depends_on": []}
        ]
        res = solve_portfolio({"budget_inr": 1000, "require_accessibility": True, "projects": projects_no_acc})
        self.assertEqual(res["status"], "INFEASIBLE")
        self.assertIn("No feasible allocation", res["message"])

    # 16. Modifying costs, scores, or budget results in a newly calculated allocation
    def test_dynamic_recalculation_not_hardcoded(self) -> None:
        # Boost desks benefit from 15 to 200 (desks costs 120000)
        modified_projects = [dict(p) for p in self.demo_projects]
        for p in modified_projects:
            if p["id"] == "desks":
                p["benefit_score"] = 200

        payload = {
            "budget_inr": 800000,
            "require_accessibility": True,
            "projects": modified_projects,
        }
        res = solve_portfolio(payload)
        self.assertEqual(res["status"], "OPTIMAL")
        # Desks must now be selected due to its massive benefit score
        self.assertIn("desks", res["selected_ids"])
        self.assertNotEqual(set(res["selected_ids"]), {"ramps", "water", "lab", "led"})

    # 17. The sum of selected project costs equals total_cost_inr
    def test_cost_sum_accounting(self) -> None:
        res = solve_portfolio({"budget_inr": 800000, "require_accessibility": True, "projects": self.demo_projects})
        self.assertEqual(res["status"], "OPTIMAL")
        calculated_cost = sum(p["cost_inr"] for p in res["selected_projects"])
        self.assertEqual(calculated_cost, res["total_cost_inr"])

    # 18. The sum of selected benefit scores equals total_benefit
    def test_benefit_sum_accounting(self) -> None:
        res = solve_portfolio({"budget_inr": 800000, "require_accessibility": True, "projects": self.demo_projects})
        self.assertEqual(res["status"], "OPTIMAL")
        calculated_benefit = sum(p["benefit_score"] for p in res["selected_projects"])
        self.assertEqual(calculated_benefit, res["total_benefit"])

    # 19. Remaining budget equals budget_inr minus total_cost_inr for valid solutions
    def test_remaining_budget_accounting(self) -> None:
        budget = 800000
        res = solve_portfolio({"budget_inr": budget, "require_accessibility": True, "projects": self.demo_projects})
        self.assertEqual(res["remaining_budget_inr"], budget - res["total_cost_inr"])

    # 20. Every selected project satisfies its prerequisites
    def test_all_selected_prerequisites_satisfied(self) -> None:
        # Scenario where wifi and substation are both chosen
        # If budget is large enough (e.g. 1,500,000)
        res = solve_portfolio({"budget_inr": 1500000, "require_accessibility": True, "projects": self.demo_projects})
        self.assertEqual(res["status"], "OPTIMAL")
        selected_set = set(res["selected_ids"])
        for p in res["selected_projects"]:
            for dep in p.get("depends_on", []):
                self.assertIn(dep, selected_set, f"Prerequisite {dep} for {p['id']} was not selected!")

    # 21. Dependency cycles rejected
    def test_cyclic_dependencies_rejected(self) -> None:
        # Direct cycle: A -> B -> A
        cycle_projects = [
            {"id": "A", "name": "A", "cost_inr": 100, "benefit_score": 10, "is_accessibility": False, "depends_on": ["B"]},
            {"id": "B", "name": "B", "cost_inr": 100, "benefit_score": 10, "is_accessibility": False, "depends_on": ["A"]},
        ]
        with self.assertRaises(InputValidationError) as ctx:
            solve_portfolio({"budget_inr": 1000, "require_accessibility": False, "projects": cycle_projects})
        self.assertIn("Cyclic dependency", str(ctx.exception))

        # Self-dependency: A -> A
        self_dep_projects = [
            {"id": "A", "name": "A", "cost_inr": 100, "benefit_score": 10, "is_accessibility": False, "depends_on": ["A"]},
        ]
        with self.assertRaises(InputValidationError) as ctx:
            solve_portfolio({"budget_inr": 1000, "require_accessibility": False, "projects": self_dep_projects})
        self.assertIn("cannot depend on itself", str(ctx.exception))

    # 22. JSON serializability of all results
    def test_json_serializability(self) -> None:
        # Test optimal
        res_opt = solve_portfolio({"budget_inr": 800000, "require_accessibility": True, "projects": self.demo_projects})
        serialized_opt = json.dumps(res_opt)
        self.assertIsInstance(serialized_opt, str)

        # Test infeasible
        res_inf = solve_portfolio({"budget_inr": 0, "require_accessibility": True, "projects": self.demo_projects})
        serialized_inf = json.dumps(res_inf)
        self.assertIsInstance(serialized_inf, str)

    # 23. Order independence of project input
    def test_input_order_independence(self) -> None:
        reversed_projects = list(reversed(self.demo_projects))
        res1 = solve_portfolio({"budget_inr": 800000, "require_accessibility": True, "projects": self.demo_projects})
        res2 = solve_portfolio({"budget_inr": 800000, "require_accessibility": True, "projects": reversed_projects})
        self.assertEqual(set(res1["selected_ids"]), set(res2["selected_ids"]))
        self.assertEqual(res1["total_cost_inr"], res2["total_cost_inr"])
        self.assertEqual(res1["total_benefit"], res2["total_benefit"])


if __name__ == "__main__":
    unittest.main()
