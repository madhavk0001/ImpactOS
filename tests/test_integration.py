"""FastAPI integration tests for ImpactOS optimization endpoints."""

import json
import os
import unittest
from fastapi.testclient import TestClient

from example_fastapi_integration import app


class TestFastAPIIntegration(unittest.TestCase):
    """Integration test suite verifying REST API contracts."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)
        demo_path = os.path.join(os.path.dirname(__file__), "..", "data", "demo_projects.json")
        with open(demo_path, "r", encoding="utf-8") as f:
            cls.demo_projects = json.load(f)

    def test_health_check_endpoint(self) -> None:
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("Google OR-Tools CP-SAT", data["engine"])

    def test_optimize_endpoint_scenario_a(self) -> None:
        payload = {
            "budget_inr": 800000,
            "require_accessibility": True,
            "projects": self.demo_projects,
        }
        response = self.client.post("/api/optimize", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "OPTIMAL")
        self.assertEqual(set(data["selected_ids"]), {"ramps", "water", "lab", "led"})
        self.assertEqual(data["total_cost_inr"], 790000)
        self.assertEqual(data["total_benefit"], 139)
        self.assertEqual(data["remaining_budget_inr"], 10000)

    def test_optimize_endpoint_scenario_b(self) -> None:
        payload = {
            "budget_inr": 700000,
            "require_accessibility": True,
            "projects": self.demo_projects,
        }
        response = self.client.post("/api/optimize", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "OPTIMAL")
        self.assertEqual(set(data["selected_ids"]), {"ramps", "water", "lab"})
        self.assertEqual(data["total_cost_inr"], 680000)
        self.assertEqual(data["total_benefit"], 119)
        self.assertEqual(data["remaining_budget_inr"], 20000)

    def test_optimize_endpoint_infeasible(self) -> None:
        payload = {
            "budget_inr": 0,
            "require_accessibility": True,
            "projects": self.demo_projects,
        }
        response = self.client.post("/api/optimize", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "INFEASIBLE")
        self.assertEqual(data["selected_ids"], [])
        self.assertIsNone(data["total_cost_inr"])

    def test_optimize_endpoint_validation_error(self) -> None:
        # Negative budget
        payload = {
            "budget_inr": -100,
            "require_accessibility": True,
            "projects": self.demo_projects,
        }
        response = self.client.post("/api/optimize", json=payload)
        self.assertEqual(response.status_code, 422)  # Pydantic validation error


if __name__ == "__main__":
    unittest.main()

