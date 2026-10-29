import tempfile
import unittest
from pathlib import Path

from reports.contract_adapter import (
    ContractAdapterError,
    adapt_optimization_result,
    adapt_project_inputs,
    generate_impactos_report,
)


class ContractAdapterTests(unittest.TestCase):

    def setUp(self):
        self.inputs = {
            "budget_inr": 100000,
            "projects": [
                {
                    "id": "ramps",
                    "name": "Accessibility Ramps",
                    "cost_inr": 60000,
                    "benefit": 7,
                    "dependencies": [],
                    "is_accessibility_project": True,
                },
                {
                    "id": "lab",
                    "name": "Teaching Laboratory",
                    "cost_inr": 40000,
                    "benefit": 5,
                    "dependencies": [],
                    "is_accessibility_project": False,
                },
            ],
            "policy": {
                "require_accessibility_project": True,
            },
        }

        self.result = {
            "status": "optimal",
            "selected_project_ids": ["ramps", "lab"],
            "total_cost_inr": 100000,
            "total_benefit": 12,
            "remaining_budget_inr": 0,
        }

    def test_maps_api_input_fields(self):
        converted = adapt_project_inputs(self.inputs)

        self.assertEqual(converted["budget"], 100000)
        self.assertEqual(converted["projects"][0]["cost"], 60000)
        self.assertTrue(
            converted["projects"][0]["accessibility"]
        )
        self.assertTrue(
            converted["policies"]["require_accessibility"]
        )

    def test_maps_optimization_result_fields(self):
        converted = adapt_optimization_result(self.result)

        self.assertEqual(converted["status"], "optimal")
        self.assertEqual(converted["total_cost"], 100000)
        self.assertEqual(converted["total_benefit"], 12)
        self.assertEqual(converted["budget_remaining"], 0)

    def test_rejects_float_currency(self):
        invalid = dict(self.inputs)
        invalid["budget_inr"] = 100000.50

        with self.assertRaises(ContractAdapterError):
            adapt_project_inputs(invalid)

    def test_rejects_unknown_dependency(self):
        invalid = {
            "budget_inr": 100000,
            "projects": [
                {
                    "id": "wifi",
                    "name": "Campus Wi-Fi",
                    "cost_inr": 40000,
                    "benefit": 5,
                    "dependencies": ["missing-project"],
                    "is_accessibility_project": False,
                }
            ],
        }

        with self.assertRaises(ContractAdapterError):
            adapt_project_inputs(invalid)

    def test_generates_pdf_using_draft_api_schema(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "audit.pdf"

            summary = generate_impactos_report(
                self.inputs,
                self.result,
                output,
            )

            self.assertTrue(output.exists())
            self.assertGreater(output.stat().st_size, 1000)
            self.assertEqual(summary["computed_total_cost"], 100000)
            self.assertEqual(summary["computed_total_benefit"], 12)
            self.assertEqual(summary["warnings"], [])


if __name__ == "__main__":
    unittest.main()

