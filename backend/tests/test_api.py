import os
import sys
import unittest
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from seeds.seed_data import seed_database

class TestApiEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_database()
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")

    def test_auth_login(self):
        res = self.client.post("/api/auth/login", json={
            "email": "manager@datastraw.com",
            "password": "manager123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data)
        self.assertEqual(data["user"]["role"], "OPERATIONS_MANAGER")

    def test_get_employees_list(self):
        res = self.client.get("/api/employees")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(data["total"], 30)

    def test_get_brands_list(self):
        res = self.client.get("/api/brands")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(data["total"], 10)

    def test_get_processes_list(self):
        res = self.client.get("/api/processes")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(data["total"], 4)

    def test_dashboard_stats(self):
        res = self.client.get("/api/dashboard/stats")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("stats", data)
        self.assertGreaterEqual(data["stats"]["total_employees"], 30)
        self.assertIn("pod_distribution", data["charts"])

    def test_leave_creation_and_approval(self):
        # Fetch an employee
        emp_res = self.client.get("/api/employees")
        emp = emp_res.get_json()["employees"][0]

        # Request a new leave
        leave_res = self.client.post("/api/availability", json={
            "employee_id": emp["_id"],
            "start_date": "2027-01-10",
            "end_date": "2027-01-12",
            "type": "CASUAL_LEAVE",
            "status": "PENDING",
            "reason": "Family vacation"
        })
        self.assertEqual(leave_res.status_code, 201)
        leave_data = leave_res.get_json()["record"]

        # Approve the leave
        approve_res = self.client.post(f"/api/availability/{leave_data['_id']}/approve", json={
            "approved_by": emp["_id"]
        })
        self.assertEqual(approve_res.status_code, 200)
        self.assertEqual(approve_res.get_json()["record"]["status"], "APPROVED")

    def test_roster_generation_and_validation(self):
        res = self.client.post("/api/rosters/generate", json={"year": 2026, "month": 12})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["result"]
        self.assertIn("roster_id", data)

        # Validate
        val_res = self.client.post(f"/api/rosters/{data['roster_id']}/validate")
        self.assertEqual(val_res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
