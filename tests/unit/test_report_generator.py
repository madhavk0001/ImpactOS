import tempfile
import unittest
from pathlib import Path

from reports.report_generator import InputDataError, generate_report


class ReportGeneratorTests(unittest.TestCase):
    def setUp(self):
        self.inputs = {
            "scenario": {"id": "test-1", "name": "Test Scenario"},
            "budget": 100,
            "policies": {"require_accessibility": True},
            "scoring": {"method": "Demo weights", "weights": {"reach": 1.0}},
            "constraints": ["Do not exceed budget"],
            "projects": [
                {"id": "ramps", "name": "Ramps", "cost": 60, "benefit": 7, "accessibility": True, "dependencies": []},
                {"id": "wifi", "name": "Wi-Fi", "cost": 40, "benefit": 5, "accessibility": False, "dependencies": ["ramps"]},
                {"id": "chairs", "name": "Chairs", "cost": 50, "benefit": 4, "accessibility": False, "dependencies": []}
            ]
        }
        self.result = {
            "status": "OPTIMAL",
            "run_id": "test-run",
            "selected_project_ids": ["ramps", "wifi"],
            "total_cost": 100,
            "total_benefit": 12,
            "budget_remaining": 0
        }

    def test_generates_pdf_and_recalculates_totals(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "report.pdf"
            summary = generate_report(self.inputs, self.result, output)
            self.assertTrue(output.exists())
            self.assertGreater(output.stat().st_size, 1000)
            self.assertEqual(summary["computed_total_cost"], 100)
            self.assertEqual(summary["computed_total_benefit"], 12)
            self.assertEqual(summary["warnings"], [])

    def test_flags_budget_or_totals_mismatch(self):
        altered = dict(self.result)
        altered["total_cost"] = 99
        with tempfile.TemporaryDirectory() as temp_dir:
            summary = generate_report(self.inputs, altered, Path(temp_dir) / "report.pdf")
            self.assertTrue(any("reported total_cost" in warning for warning in summary["warnings"]))

    def test_infeasible_does_not_present_selected_projects(self):
        failed = {"status": "INFEASIBLE", "selected_project_ids": ["ramps"]}
        with tempfile.TemporaryDirectory() as temp_dir:
            summary = generate_report(self.inputs, failed, Path(temp_dir) / "report.pdf")
            self.assertFalse(summary["is_success"])
            self.assertEqual(summary["selected_project_ids"], [])
            self.assertTrue(any("ignored in this report" in warning for warning in summary["warnings"]))

    def test_unknown_dependency_fails_clearly(self):
        bad_inputs = dict(self.inputs)
        bad_inputs["projects"] = [dict(self.inputs["projects"][0]), dict(self.inputs["projects"][1])]
        bad_inputs["projects"][1]["dependencies"] = ["missing-id"]
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaises(InputDataError):
                generate_report(bad_inputs, self.result, Path(temp_dir) / "report.pdf")


if __name__ == "__main__":
    unittest.main()
