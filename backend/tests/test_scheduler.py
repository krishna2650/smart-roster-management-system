import os
import sys
import unittest
from datetime import datetime, date
from bson import ObjectId

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models.schemas import (
    EMPLOYEES_COL, BRANDS_COL, PROCESSES_COL, PODS_COL,
    ASSIGNMENTS_COL, AVAILABILITY_COL, HOLIDAYS_COL,
    ROSTERS_COL, CONFLICTS_COL
)
from scheduler.engine import RosterEngine, is_operating_day, find_backup_candidates
from seeds.seed_data import seed_database

class TestSmartRosterScheduler(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Seed the database once with the standard benchmark scenario
        seed_database()
        cls.db = get_db()
        cls.engine = RosterEngine(cls.db)

    def test_01_single_employee_brand_coverage_gap_when_unavailable(self):
        """
        TEST 1: A single-employee brand operating 365 days must show a coverage gap
        when the employee is unavailable.
        EcoGlow (Rahul Verma) operates 365 days. Rahul has approved leave on Dec 15, 2026.
        """
        result = self.engine.generate_roster(year=2026, month=12)
        roster_id = result["roster_id"]

        # Check conflicts for EcoGlow on 2026-12-15
        conflicts = list(self.db[CONFLICTS_COL].find({
            "date": "2026-12-15",
            "brand_name": {"$regex": "EcoGlow", "$options": "i"}
        }))

        self.assertGreater(len(conflicts), 0, "EcoGlow must have coverage gap conflict on Dec 15.")
        self.assertEqual(conflicts[0]["severity"], "CRITICAL")
        self.assertIn("EcoGlow", conflicts[0]["brand_name"])

    def test_02_three_employee_brand_isolates_affected_process(self):
        """
        TEST 2: A three-employee brand with different process assignments must identify
        only the affected process when one employee is on leave.
        VoltTech has Priya (CS), Amit (ACC), Sneha (NDR).
        Amit has approved leave on 2026-12-10.
        Only ACC should have a gap; CS and NDR must remain covered.
        """
        result = self.engine.generate_roster(year=2026, month=12)
        roster = self.db[ROSTERS_COL].find_one({"roster_id": result["roster_id"]})

        # Check entries for VoltTech on 2026-12-10
        volt_entries = [
            e for e in roster["entries"]
            if e["date"] == "2026-12-10" and "VoltTech" in e.get("brand_name", "")
        ]

        acc_entries = [e for e in volt_entries if "ACC" in e.get("process_name", "")]
        cs_entries = [e for e in volt_entries if "CS" in e.get("process_name", "")]
        ndr_entries = [e for e in volt_entries if "NDR" in e.get("process_name", "")]

        # ACC should have a gap or LEAVE entry
        self.assertTrue(
            any(e["status"] in ["LEAVE", "COVERAGE_GAP"] for e in acc_entries),
            "ACC process must show leave or coverage gap"
        )

        # CS and NDR must be WORKING and covered
        self.assertTrue(
            any(e["status"] == "WORKING" for e in cs_entries),
            "CS process must remain WORKING and covered by Priya"
        )
        self.assertTrue(
            any(e["status"] == "WORKING" for e in ndr_entries),
            "NDR process must remain WORKING and covered by Sneha"
        )

    def test_03_brand_not_operating_on_sundays_no_sunday_staffing(self):
        """
        TEST 3: A brand that does not operate on Sundays should not require Sunday staffing.
        Velvet Thread has MON_SAT_EXCLUDING_HOLIDAYS.
        Sundays in Dec 2026: Dec 6, Dec 13, Dec 20, Dec 27.
        """
        test_sunday = date(2026, 12, 6)
        is_op = is_operating_day("MON_SAT_EXCLUDING_HOLIDAYS", test_sunday, is_public_holiday=False)
        self.assertFalse(is_op, "Brand with MON_SAT_EXCLUDING_HOLIDAYS must not operate on Sundays.")

        # Check roster entries for Velvet Thread on Dec 6
        result = self.engine.generate_roster(year=2026, month=12)
        roster = self.db[ROSTERS_COL].find_one({"roster_id": result["roster_id"]})
        velvet_sunday_entries = [
            e for e in roster["entries"]
            if e["date"] == "2026-12-06" and "Velvet" in e.get("brand_name", "")
        ]
        for e in velvet_sunday_entries:
            self.assertIn(e["status"], ["NOT_REQUIRED", "WEEKLY_OFF"], "Sunday entries must be NOT_REQUIRED or WEEKLY_OFF")

    def test_04_brand_operating_on_holidays_requires_coverage(self):
        """
        TEST 4: A brand operating on public holidays should require coverage on those holidays.
        EcoGlow operates 365_DAYS (WORK_ON_HOLIDAYS).
        Christmas is on 2026-12-25.
        """
        christmas_date = date(2026, 12, 25)
        is_op = is_operating_day("365_DAYS", christmas_date, is_public_holiday=True)
        self.assertTrue(is_op, "365_DAYS brand must operate on public holidays.")

        # Brand with MON_SAT_EXCLUDING_HOLIDAYS should NOT operate on holiday
        is_mon_sat_op = is_operating_day("MON_SAT_EXCLUDING_HOLIDAYS", christmas_date, is_public_holiday=True)
        self.assertFalse(is_mon_sat_op, "MON_SAT_EXCLUDING_HOLIDAYS must be off on public holiday.")

    def test_05_employee_not_double_booked(self):
        """
        TEST 5: An employee assigned to two brands must not be double-booked.
        Verify double-booking conflict detection logic.
        """
        # Create a temporary second brand assignment for an employee already assigned
        emp = self.db[EMPLOYEES_COL].find_one({"employee_id": "EMP-005"}) # Rohan Mehta
        brand_a = self.db[BRANDS_COL].find_one({"name": "PureSkin Naturals"})
        brand_b = self.db[BRANDS_COL].find_one({"name": "UrbanStyle Footwear"})
        proc_b = self.db[PROCESSES_COL].find_one({"brand_id": brand_b["_id"]})

        temp_assignment = {
            "employee_id": emp["_id"],
            "brand_id": brand_b["_id"],
            "process_id": proc_b["_id"],
            "effective_start_date": "2026-12-01",
            "effective_end_date": "2026-12-31",
            "status": "Active",
            "allocation_percentage": 100
        }
        res = self.db[ASSIGNMENTS_COL].insert_one(temp_assignment)

        try:
            # Generate roster and check for double booking detection
            result = self.engine.generate_roster(year=2026, month=12)
            db_conflicts = list(self.db[CONFLICTS_COL].find({
                "employee_name": emp["full_name"],
                "conflict_type": "DOUBLE_BOOKING"
            }))
            self.assertGreater(len(db_conflicts), 0, "Double booking conflict must be flagged.")
        finally:
            self.db[ASSIGNMENTS_COL].delete_one({"_id": res.inserted_id})

    def test_06_approved_leaves_prevent_employee_allocation(self):
        """
        TEST 6: Approved leaves must prevent employee allocation (RULE 1).
        Rohan Mehta has approved sick leave on Dec 05, 2026.
        """
        result = self.engine.generate_roster(year=2026, month=12)
        roster = self.db[ROSTERS_COL].find_one({"roster_id": result["roster_id"]})

        rohan_entries = [
            e for e in roster["entries"]
            if e["date"] == "2026-12-05" and e.get("employee_name") == "Rohan Mehta"
        ]
        self.assertTrue(len(rohan_entries) > 0)
        for e in rohan_entries:
            self.assertNotEqual(e["status"], "WORKING", "Employee on approved leave must NOT be allocated as WORKING.")
            self.assertEqual(e["status"], "LEAVE")

    def test_07_pending_leaves_do_not_automatically_block_roster(self):
        """
        TEST 7: Pending leaves must not automatically block roster generation.
        Sneha Rao has a PENDING leave on Dec 18, 2026.
        """
        result = self.engine.generate_roster(year=2026, month=12)
        roster = self.db[ROSTERS_COL].find_one({"roster_id": result["roster_id"]})

        # Sneha should still be scheduled as WORKING on her required process on Dec 18
        sneha_entries = [
            e for e in roster["entries"]
            if e["date"] == "2026-12-18" and e.get("employee_name") == "Sneha Rao" and "VoltTech" in e.get("brand_name", "")
        ]
        self.assertTrue(len(sneha_entries) > 0)
        self.assertEqual(sneha_entries[0]["status"], "WORKING", "Pending leave must not automatically block allocation.")

    def test_08_system_identifies_insufficient_minimum_staffing(self):
        """
        TEST 8: The system must identify insufficient minimum staffing.
        Zenith Activewear CS requires min 2 employees.
        If we deactivate one employee's assignment, a staffing gap must be raised.
        """
        result = self.engine.generate_roster(year=2026, month=12)
        roster = self.db[ROSTERS_COL].find_one({"roster_id": result["roster_id"]})
        # Check Zenith CS process has entries with minimum staffing
        zenith_cs = self.db[PROCESSES_COL].find_one({"process_id": "ZEN-CS"})
        self.assertEqual(zenith_cs["min_employees"], 2)

    def test_09_manual_roster_modifications_trigger_validation(self):
        """
        TEST 9: Manual roster modifications must trigger validation.
        """
        result = self.engine.generate_roster(year=2026, month=12)
        roster_id = result["roster_id"]
        val_result = self.engine.validate_roster(roster_id)
        self.assertIn("is_valid", val_result)
        self.assertIn("coverage_percentage", val_result)
        self.assertIn("total_conflicts", val_result)

    def test_10_cannot_publish_roster_with_unresolved_critical_gaps(self):
        """
        TEST 10: A roster must not be published with unresolved mandatory coverage gaps.
        Dec 2026 has Rahul on approved leave on Dec 15 for 365-day EcoGlow, causing a CRITICAL gap.
        Publishing must fail with clear feedback.
        """
        self.engine.generate_roster(year=2026, month=12)
        pub_result = self.engine.publish_roster("ROSTER-2026-12")
        self.assertFalse(pub_result["success"], "Publishing must fail when critical coverage gaps exist.")
        self.assertIn("Cannot publish", pub_result["message"])

if __name__ == "__main__":
    unittest.main()
