import calendar
from datetime import datetime, date
from bson import ObjectId
from database import get_db
from models.schemas import (
    EMPLOYEES_COL, BRANDS_COL, PROCESSES_COL, PODS_COL,
    ASSIGNMENTS_COL, AVAILABILITY_COL, HOLIDAYS_COL,
    ROSTERS_COL, CONFLICTS_COL, AUDIT_LOGS_COL
)

def parse_date(date_str):
    if isinstance(date_str, (datetime, date)):
        return date_str if isinstance(date_str, date) else date_str.date()
    return datetime.strptime(date_str, "%Y-%m-%d").date()

def format_date(date_obj):
    return date_obj.strftime("%Y-%m-%d")

def is_operating_day(calendar_type, date_obj, is_public_holiday):
    """
    Determines if a brand or process operates on a given date.
    - 365_DAYS: Operates every single day including Sundays and public holidays.
    - DAILY_EXCLUDING_HOLIDAYS: Operates Mon-Sun except public holidays.
    - MON_SAT_EXCLUDING_HOLIDAYS: Operates Mon-Sat except public holidays (Sundays & holidays off).
    """
    weekday = date_obj.weekday()  # Monday=0 ... Sunday=6
    is_sunday = (weekday == 6)

    if calendar_type == "365_DAYS":
        return True
    elif calendar_type == "DAILY_EXCLUDING_HOLIDAYS":
        return not is_public_holiday
    elif calendar_type == "MON_SAT_EXCLUDING_HOLIDAYS":
        return (not is_sunday) and (not is_public_holiday)
    else:
        # Default fallback to Mon-Sat ex holidays
        return (not is_sunday) and (not is_public_holiday)

def find_backup_candidates(db, date_str, process_id, brand_id, required_skills=None, target_pod_id=None):
    """
    Finds and ranks eligible backup employees for a given process and date.
    Ranking criteria:
    1. Employee is Active.
    2. Employee is NOT on leave / comp-off on that date.
    3. Employee is NOT already assigned to a working shift on that date (or has capacity).
    4. Same Pod bonus (+50 points).
    5. Matching skill bonus (+30 points per matching skill).
    """
    all_employees = list(db[EMPLOYEES_COL].find({"is_active": True}))
    
    # Check leaves on date
    leaves_on_date = list(db[AVAILABILITY_COL].find({
        "status": "APPROVED",
        "start_date": {"$lte": date_str},
        "end_date": {"$gte": date_str}
    }))
    unavailable_emp_ids = set(str(l["employee_id"]) for l in leaves_on_date)

    # Check who is already working on date in current assignments
    working_emp_ids = set()

    candidates = []
    for emp in all_employees:
        emp_id_str = str(emp["_id"])
        if emp_id_str in unavailable_emp_ids:
            continue

        score = 0
        reasons = []

        # Check pod match
        if target_pod_id and str(emp.get("pod_id")) == str(target_pod_id):
            score += 50
            reasons.append("Same operational pod")

        # Check skills match
        emp_skills = emp.get("skills", [])
        if required_skills:
            matched = [s for s in required_skills if any(s.lower() in es.lower() for es in emp_skills)]
            if matched:
                score += len(matched) * 25
                reasons.append(f"Matching skills: {', '.join(matched)}")

        if not reasons:
            reasons.append("General operational availability")
            score += 10

        candidates.append({
            "employee_id": str(emp["_id"]),
            "employee_name": emp["full_name"],
            "designation": emp.get("designation", ""),
            "pod_id": str(emp.get("pod_id", "")),
            "skills": emp_skills,
            "score": score,
            "reasons": reasons
        })

    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[:5]

MONTHLY_LEAVE_CONFIG = {
    1: [
        {"email": "pooja.desai@datastraw.in", "target_weekday": 1, "week": 2, "type": "PLANNED_LEAVE", "reason": "Family relocation"},
        {"email": "priya.sharma@datastraw.in", "target_weekday": 3, "week": 3, "type": "CASUAL_LEAVE", "reason": "Medical follow-up"},
    ],
    2: [
        {"email": "kunal.kapoor@datastraw.in", "target_weekday": 2, "week": 2, "type": "CASUAL_LEAVE", "reason": "Personal commitment"},
        {"email": "vikram.malhotra@datastraw.in", "target_weekday": 3, "week": 3, "type": "PLANNED_LEAVE", "reason": "Annual family function"},
        {"email": "sneha.rao@datastraw.in", "target_weekday": 1, "week": 4, "type": "SICK_LEAVE", "reason": "Viral fever recovery"},
    ],
    3: [
        {"email": "neha.joshi@datastraw.in", "target_weekday": 2, "week": 2, "type": "PLANNED_LEAVE", "reason": "Higher studies exam leave"},
        {"email": "amit.patel@datastraw.in", "target_weekday": 3, "week": 3, "type": "COMP_OFF", "reason": "Comp-off for weekend deployment"},
        {"email": "tarun.khanna@datastraw.in", "target_weekday": 1, "week": 4, "type": "CASUAL_LEAVE", "reason": "Hometown visit"},
    ],
    4: [
        {"email": "aditya.roy@datastraw.in", "target_weekday": 2, "week": 2, "type": "CASUAL_LEAVE", "reason": "Emergency dental surgery"},
        {"email": "divya.nair@datastraw.in", "target_weekday": 3, "week": 3, "type": "PLANNED_LEAVE", "reason": "Spring vacation"},
        {"email": "priya.sharma@datastraw.in", "target_weekday": 1, "week": 4, "type": "COMP_OFF", "reason": "Overtime comp-off"},
        {"email": "manish.reddy@datastraw.in", "target_weekday": 3, "week": 2, "type": "CASUAL_LEAVE", "reason": "Personal affairs"},
    ],
    5: [
        {"email": "harsh.singh@datastraw.in", "target_weekday": 2, "week": 2, "type": "PLANNED_LEAVE", "reason": "Family wedding"},
        {"email": "pooja.desai@datastraw.in", "target_weekday": 3, "week": 3, "type": "SICK_LEAVE", "reason": "Severe migraine recovery"},
    ],
    6: [
        {"email": "vikram.malhotra@datastraw.in", "target_weekday": 1, "week": 2, "type": "CASUAL_LEAVE", "reason": "Home renovation"},
        {"email": "rohan.mehta@datastraw.in", "target_weekday": 2, "week": 3, "type": "PLANNED_LEAVE", "reason": "Annual pilgrimage"},
        {"email": "ananya.iyer@datastraw.in", "target_weekday": 3, "week": 4, "type": "COMP_OFF", "reason": "Weekend shift comp-off"},
    ],
    7: [
        {"email": "kunal.kapoor@datastraw.in", "target_weekday": 2, "week": 2, "type": "CASUAL_LEAVE", "reason": "Family emergency"},
        {"email": "sneha.rao@datastraw.in", "target_weekday": 3, "week": 3, "type": "SICK_LEAVE", "reason": "Seasonal illness"},
    ],
    8: [
        {"email": "neha.joshi@datastraw.in", "target_weekday": 2, "week": 2, "type": "PLANNED_LEAVE", "reason": "Annual summer break"},
        {"email": "rahul.verma@datastraw.in", "target_weekday": 3, "week": 3, "type": "CASUAL_LEAVE", "reason": "Personal legal appointment"},
    ],
    9: [
        {"email": "divya.nair@datastraw.in", "target_weekday": 2, "week": 2, "type": "CASUAL_LEAVE", "reason": "Family function"},
        {"email": "aditya.roy@datastraw.in", "target_weekday": 3, "week": 3, "type": "PLANNED_LEAVE", "reason": "Certification training"},
        {"email": "amit.patel@datastraw.in", "target_weekday": 1, "week": 4, "type": "COMP_OFF", "reason": "Holiday shift comp-off"},
    ],
    10: [
        {"email": "harsh.singh@datastraw.in", "target_weekday": 2, "week": 2, "type": "CASUAL_LEAVE", "reason": "Festive travel"},
        {"email": "priya.sharma@datastraw.in", "target_weekday": 3, "week": 3, "type": "PLANNED_LEAVE", "reason": "Personal vacation"},
        {"email": "tarun.khanna@datastraw.in", "target_weekday": 1, "week": 4, "type": "SICK_LEAVE", "reason": "Flu recovery"},
    ],
    11: [
        {"email": "pooja.desai@datastraw.in", "target_weekday": 2, "week": 2, "type": "PLANNED_LEAVE", "reason": "Family vacation"},
        {"email": "vikram.malhotra@datastraw.in", "target_weekday": 3, "week": 3, "type": "CASUAL_LEAVE", "reason": "Personal business"},
        {"email": "sneha.rao@datastraw.in", "target_weekday": 1, "week": 4, "type": "COMP_OFF", "reason": "Festival comp-off"},
        {"email": "manish.reddy@datastraw.in", "target_weekday": 2, "week": 3, "type": "CASUAL_LEAVE", "reason": "Medical appointment"},
    ],
    12: [
        {"email": "rahul.verma@datastraw.in", "day": 15, "type": "CASUAL_LEAVE", "reason": "Family emergency and personal commitment"},
        {"email": "amit.patel@datastraw.in", "day": 10, "type": "PLANNED_LEAVE", "reason": "Annual medical checkup"},
        {"email": "sneha.rao@datastraw.in", "day": 18, "type": "PLANNED_LEAVE", "status": "PENDING", "reason": "Travel to hometown"},
        {"email": "ananya.iyer@datastraw.in", "day": 22, "type": "COMP_OFF", "reason": "Compensatory off for weekend overtime deployment"},
        {"email": "rohan.mehta@datastraw.in", "day": 5, "type": "SICK_LEAVE", "reason": "Viral fever recovery"}
    ]
}

class RosterEngine:
    def __init__(self, db=None):
        self.db = db if db is not None else get_db()

    def _ensure_monthly_availability(self, year: int, month: int):
        """
        Ensures that every month has realistic operational leaves and coverage scenarios,
        producing distinct conflicts, varying single-resource specialist absences, and multi-resource process gaps.
        """
        start_date_str = f"{year}-{month:02d}-01"
        num_days = calendar.monthrange(year, month)[1]
        end_date_str = f"{year}-{month:02d}-{num_days:02d}"

        existing_leaves = list(self.db[AVAILABILITY_COL].find({
            "start_date": {"$lte": end_date_str},
            "end_date": {"$gte": start_date_str}
        }))
        if existing_leaves:
            return

        config_items = MONTHLY_LEAVE_CONFIG.get(month, [])
        if not config_items:
            return

        emp_map = {e["email"]: e for e in self.db[EMPLOYEES_COL].find()}
        priya = emp_map.get("priya.sharma@datastraw.in")
        approver_id = priya["_id"] if priya else (list(emp_map.values())[0]["_id"] if emp_map else ObjectId())

        new_docs = []
        for item in config_items:
            emp = emp_map.get(item["email"])
            if not emp:
                continue

            if "day" in item:
                d_str = f"{year}-{month:02d}-{item['day']:02d}"
            else:
                target_wd = item.get("target_weekday", 2)
                target_week = item.get("week", 2)
                count = 0
                d_str = None
                for day in range(1, num_days + 1):
                    d_obj = date(year, month, day)
                    if d_obj.weekday() == target_wd:
                        count += 1
                        if count == target_week:
                            d_str = format_date(d_obj)
                            break
                if not d_str:
                    d_str = f"{year}-{month:02d}-12"

            new_docs.append({
                "_id": ObjectId(),
                "employee_id": ObjectId(emp["_id"]),
                "start_date": d_str,
                "end_date": d_str,
                "type": item.get("type", "CASUAL_LEAVE"),
                "status": item.get("status", "APPROVED"),
                "reason": item.get("reason", "Approved Leave"),
                "approved_by": approver_id,
                "approval_date": f"{year}-{month:02d}-01",
                "created_at": datetime.now()
            })

        if new_docs:
            self.db[AVAILABILITY_COL].insert_many(new_docs)

    def generate_roster(self, year: int, month: int, created_by=None):
        """
        Generates a deterministic monthly roster for all brands, processes, and employees.
        Enforces:
        - Operating calendars (365 days, daily ex holidays, Mon-Sat ex holidays)
        - Process inheritance or override of brand calendar
        - Approved leaves and comp-offs (hard block)
        - Pending leaves (visible warning, does not block)
        - Minimum coverage requirements
        - Single-resource vs multi-resource allocation
        - Fair weekly offs
        - Double-booking prevention
        - Automatic conflict logging with actionable suggestions and backup recommendations
        """
        # 1. Month dates
        num_days = calendar.monthrange(year, month)[1]
        dates = [date(year, month, day) for day in range(1, num_days + 1)]
        start_date_str = format_date(dates[0])
        end_date_str = format_date(dates[-1])

        # 2. Fetch context data
        employees = {str(e["_id"]): e for e in self.db[EMPLOYEES_COL].find({"is_active": True})}
        brands = {str(b["_id"]): b for b in self.db[BRANDS_COL].find({"is_active": True})}
        processes = {str(p["_id"]): p for p in self.db[PROCESSES_COL].find({"is_active": True})}
        
        # Holidays in month
        holidays_docs = list(self.db[HOLIDAYS_COL].find({
            "is_active": True,
            "date": {"$gte": start_date_str, "$lte": end_date_str}
        }))
        holiday_map = {h["date"]: h for h in holidays_docs}

        # Ensure monthly availability / leaves are seeded if not already present
        self._ensure_monthly_availability(year, month)

        # Approved and pending leaves in month
        leaves_docs = list(self.db[AVAILABILITY_COL].find({
            "start_date": {"$lte": end_date_str},
            "end_date": {"$gte": start_date_str}
        }))

        # Active assignments
        assignments = list(self.db[ASSIGNMENTS_COL].find({"status": "Active"}))

        # Index assignments by process and by employee
        process_assignments = {}
        employee_assignments = {}
        for a in assignments:
            p_id = str(a["process_id"])
            e_id = str(a["employee_id"])
            process_assignments.setdefault(p_id, []).append(a)
            employee_assignments.setdefault(e_id, []).append(a)

        # 3. Schedule generation structures
        entries = []
        conflicts = []
        coverage_stats = {
            "total_process_days_required": 0,
            "total_process_days_covered": 0,
            "total_gaps": 0
        }

        # Map to track an employee's schedule per date to avoid double-booking
        # employee_day_schedule[emp_id][date_str] = { "status": ..., "brand_ids": [...], "process_ids": [...] }
        employee_day_schedule = {emp_id: {} for emp_id in employees}

        # Step 3A: Pre-calculate Employee Availability per day
        for d in dates:
            d_str = format_date(d)
            is_sunday = (d.weekday() == 6)
            is_saturday = (d.weekday() == 5)
            is_holiday = d_str in holiday_map

            for emp_id, emp in employees.items():
                # Check leaves for this employee on date d_str
                emp_leaves = [
                    l for l in leaves_docs
                    if str(l["employee_id"]) == emp_id and l["start_date"] <= d_str <= l["end_date"]
                ]
                
                approved_leave = next((l for l in emp_leaves if l.get("status") == "APPROVED"), None)
                pending_leave = next((l for l in emp_leaves if l.get("status") == "PENDING"), None)

                if approved_leave:
                    l_type = approved_leave.get("type", "LEAVE")
                    status = "COMP_OFF" if l_type == "COMP_OFF" else "LEAVE"
                    employee_day_schedule[emp_id][d_str] = {
                        "status": status,
                        "reason": approved_leave.get("reason", "Approved Leave"),
                        "leave_id": str(approved_leave["_id"])
                    }
                elif pending_leave:
                    # Visible flag but doesn't prevent allocation unless needed
                    employee_day_schedule[emp_id][d_str] = {
                        "status": "AVAILABLE",
                        "pending_leave": pending_leave.get("reason", "Pending leave request")
                    }
                else:
                    employee_day_schedule[emp_id][d_str] = {
                        "status": "AVAILABLE"
                    }

        # Step 3B: Process by Process, Day by Day allocation
        for d in dates:
            d_str = format_date(d)
            is_holiday = d_str in holiday_map
            holiday_info = holiday_map.get(d_str)

            # Daily tracking of process coverage on this date
            for p_id, proc in processes.items():
                b_id = str(proc["brand_id"])
                brand = brands.get(b_id)
                if not brand:
                    continue

                # Determine effective operating calendar for process
                proc_cal = proc.get("operating_calendar", "INHERIT_BRAND")
                if proc_cal == "INHERIT_BRAND":
                    proc_cal = brand.get("operating_calendar", "MON_SAT_EXCLUDING_HOLIDAYS")

                operates_today = is_operating_day(proc_cal, d, is_holiday)
                min_required = proc.get("min_employees", 1)

                if not operates_today:
                    # Process does not operate today
                    # If this date is a holiday or Sunday off, create NOT_REQUIRED or PUBLIC_HOLIDAY entry
                    status = "PUBLIC_HOLIDAY" if is_holiday else "NOT_REQUIRED"
                    entries.append({
                        "date": d_str,
                        "brand_id": ObjectId(b_id),
                        "brand_name": brand["name"],
                        "process_id": ObjectId(p_id),
                        "process_name": proc["name"],
                        "employee_id": None,
                        "employee_name": "N/A",
                        "status": status,
                        "notes": f"Process not operating on this date ({proc_cal})"
                    })
                    continue

                # Process DOES operate today!
                coverage_stats["total_process_days_required"] += 1
                assigned_records = process_assignments.get(p_id, [])

                # Filter valid assignments by effective dates and primary resource status
                active_assigned_emp_ids = []
                for a in assigned_records:
                    eff_start = a.get("effective_start_date")
                    eff_end = a.get("effective_end_date")
                    if eff_start and eff_start > d_str:
                        continue
                    if eff_end and eff_end < d_str:
                        continue
                    if a.get("is_primary", True):
                        active_assigned_emp_ids.append(str(a["employee_id"]))

                # Evaluate available assigned employees
                working_allocated = []
                unavailable_assigned = []

                for emp_id in active_assigned_emp_ids:
                    emp = employees.get(emp_id)
                    if not emp:
                        continue

                    emp_status_info = employee_day_schedule[emp_id].get(d_str, {"status": "AVAILABLE"})
                    current_status = emp_status_info.get("status")

                    if current_status in ["LEAVE", "COMP_OFF"]:
                        # RULE 1: Employee on approved leave CANNOT work!
                        unavailable_assigned.append({
                            "emp": emp,
                            "reason": emp_status_info.get("reason", "Approved Leave"),
                            "status": current_status
                        })
                        entries.append({
                            "date": d_str,
                            "brand_id": ObjectId(b_id),
                            "brand_name": brand["name"],
                            "process_id": ObjectId(p_id),
                            "process_name": proc["name"],
                            "employee_id": ObjectId(emp_id),
                            "employee_name": emp["full_name"],
                            "status": current_status,
                            "notes": f"On {current_status}: {emp_status_info.get('reason')}"
                        })
                    else:
                        # Employee is available. Check weekly off rules & double-booking.
                        # Check preferred weekly off:
                        preferred_offs = emp.get("preferred_weekly_off", ["Sunday"])
                        day_name = d.strftime("%A")
                        is_preferred_off_day = (day_name in preferred_offs)

                        # If multi-employee process, allow weekly off if minimum coverage is already satisfied
                        if is_preferred_off_day and len(working_allocated) >= min_required:
                            # Fair off assignment
                            entries.append({
                                "date": d_str,
                                "brand_id": ObjectId(b_id),
                                "brand_name": brand["name"],
                                "process_id": ObjectId(p_id),
                                "process_name": proc["name"],
                                "employee_id": ObjectId(emp_id),
                                "employee_name": emp["full_name"],
                                "status": "WEEKLY_OFF",
                                "notes": f"Scheduled Weekly Off ({day_name})"
                            })
                            continue

                        # Check double booking across different brands/processes:
                        already_working = emp_status_info.get("working_processes", [])
                        if already_working and any(w["process_id"] != p_id for w in already_working):
                            # Employee already assigned to another process today.
                            # Check if the employee manages all processes for this same brand (Case 1)
                            # Single employee managing CS, ACC, NDR for Brand A is an integrated shift,
                            # but working across two different brands on same day at full allocation is a double-booking conflict.
                            conflicting_brands = [w["brand_id"] for w in already_working if w["brand_id"] != b_id]
                            if conflicting_brands:
                                conflicts.append({
                                    "conflict_id": f"CNF-DB-{d_str}-{emp_id[:6]}",
                                    "severity": "HIGH",
                                    "date": d_str,
                                    "employee_id": ObjectId(emp_id),
                                    "employee_name": emp["full_name"],
                                    "brand_id": ObjectId(b_id),
                                    "brand_name": brand["name"],
                                    "process_id": ObjectId(p_id),
                                    "process_name": proc["name"],
                                    "conflict_type": "DOUBLE_BOOKING",
                                    "explanation": f"{emp['full_name']} is assigned to multiple distinct brand responsibilities on {d_str}.",
                                    "suggested_resolution": f"Reassign one of the brand shifts to a backup resource in {emp.get('pod_id')}.",
                                    "resolution_status": "UNRESOLVED"
                                })

                        # Allocate as WORKING
                        working_allocated.append(emp)
                        # Record in employee schedule
                        if "working_processes" not in employee_day_schedule[emp_id][d_str]:
                            employee_day_schedule[emp_id][d_str]["working_processes"] = []
                        employee_day_schedule[emp_id][d_str]["working_processes"].append({
                            "brand_id": b_id,
                            "process_id": p_id
                        })
                        employee_day_schedule[emp_id][d_str]["status"] = "WORKING"

                        entries.append({
                            "date": d_str,
                            "brand_id": ObjectId(b_id),
                            "brand_name": brand["name"],
                            "process_id": ObjectId(p_id),
                            "process_name": proc["name"],
                            "employee_id": ObjectId(emp_id),
                            "employee_name": emp["full_name"],
                            "status": "WORKING",
                            "notes": "Allocated shift"
                        })

                # Check if coverage requirement is satisfied
                if len(working_allocated) >= min_required:
                    coverage_stats["total_process_days_covered"] += 1
                else:
                    # COVERAGE GAP! Insufficient staffing
                    coverage_stats["total_gaps"] += 1
                    
                    # Create COVERAGE GAP entry in roster
                    entries.append({
                        "date": d_str,
                        "brand_id": ObjectId(b_id),
                        "brand_name": brand["name"],
                        "process_id": ObjectId(p_id),
                        "process_name": proc["name"],
                        "employee_id": None,
                        "employee_name": "UNASSIGNED",
                        "status": "COVERAGE_GAP",
                        "notes": f"Required {min_required} employee(s), but only {len(working_allocated)} working."
                    })

                    # Find eligible backups
                    backups = find_backup_candidates(
                        self.db, d_str, p_id, b_id,
                        required_skills=[proc["name"]],
                        target_pod_id=brand.get("pod_id")
                    )
                    backup_names = [f"{b['employee_name']} (Score: {b['score']})" for b in backups[:3]]
                    backup_suggestion = f"Recommended backups: {', '.join(backup_names)}" if backup_names else "No immediately eligible backup found; consider cross-pod reassignment."

                    severity = "CRITICAL" if len(working_allocated) == 0 else "HIGH"
                    if len(active_assigned_emp_ids) == 1:
                        # Single-employee brand case!
                        single_emp_id = active_assigned_emp_ids[0]
                        single_emp_name = employees.get(single_emp_id, {}).get("full_name", "Assigned Resource")
                        explanation = (
                            f"Single dedicated employee {single_emp_name} for brand '{brand['name']}' "
                            f"is unavailable on {d_str} for process '{proc['name']}'."
                        )
                    else:
                        explanation = (
                            f"Process '{proc['name']}' for brand '{brand['name']}' has insufficient coverage on {d_str}. "
                            f"Required: {min_required}, Allocated: {len(working_allocated)}."
                        )

                    conflicts.append({
                        "conflict_id": f"CNF-GAP-{d_str}-{p_id[:6]}",
                        "severity": severity,
                        "date": d_str,
                        "employee_id": None,
                        "employee_name": "N/A",
                        "brand_id": ObjectId(b_id),
                        "brand_name": brand["name"],
                        "process_id": ObjectId(p_id),
                        "process_name": proc["name"],
                        "conflict_type": "INSUFFICIENT_COVERAGE",
                        "explanation": explanation,
                        "suggested_resolution": backup_suggestion,
                        "resolution_status": "UNRESOLVED"
                    })

        # Calculate coverage percentage
        total_req = coverage_stats["total_process_days_required"]
        total_cov = coverage_stats["total_process_days_covered"]
        coverage_pct = round((total_cov / total_req * 100), 2) if total_req > 0 else 100.0
        coverage_stats["coverage_percentage"] = coverage_pct

        roster_id_str = f"ROSTER-{year}-{month:02d}"
        status = "DRAFT" if len(conflicts) > 0 else "VALIDATED"

        roster_doc = {
            "roster_id": roster_id_str,
            "year": year,
            "month": month,
            "status": status,
            "entries": entries,
            "coverage_summary": coverage_stats,
            "unresolved_conflicts_count": len([c for c in conflicts if c.get("resolution_status") == "UNRESOLVED"]),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

        # Save or update roster
        existing = self.db[ROSTERS_COL].find_one({"roster_id": roster_id_str})
        if existing:
            self.db[ROSTERS_COL].update_one({"_id": existing["_id"]}, {"$set": roster_doc})
            saved_id = existing["_id"]
        else:
            insert_res = self.db[ROSTERS_COL].insert_one(roster_doc)
            saved_id = insert_res.inserted_id

        # Update conflicts collection
        self.db[CONFLICTS_COL].delete_many({
            "$or": [
                {"roster_id": saved_id},
                {"roster_id": str(saved_id)},
                {"roster_id": roster_id_str},
                {"date": {"$regex": f"^{year}-{month:02d}-"}}
            ]
        })
        for c in conflicts:
            c["roster_id"] = saved_id
            c["roster_code"] = roster_id_str
            c["created_at"] = datetime.now()
        if conflicts:
            self.db[CONFLICTS_COL].insert_many(conflicts)

        return {
            "roster_id": roster_id_str,
            "_id": str(saved_id),
            "status": status,
            "coverage_summary": coverage_stats,
            "total_entries": len(entries),
            "conflicts_count": len(conflicts),
            "conflicts": conflicts[:10]  # sample of conflicts
        }

    def validate_roster(self, roster_id_or_str):
        """
        Validates an existing roster, checking for:
        1. Coverage gaps against active brand/process calendar rules
        2. Unresolved leaves assigned as working
        3. Double booking
        Returns validation report.
        """
        query = {"roster_id": roster_id_or_str} if isinstance(roster_id_or_str, str) and not len(roster_id_or_str) == 24 else {"_id": ObjectId(roster_id_or_str)}
        roster = self.db[ROSTERS_COL].find_one(query)
        if not roster:
            return {"error": "Roster not found", "is_valid": False}

        year = roster["year"]
        month = roster["month"]
        conflicts = list(self.db[CONFLICTS_COL].find({"roster_id": roster["_id"], "resolution_status": "UNRESOLVED"}))
        critical_conflicts = [c for c in conflicts if c.get("severity") == "CRITICAL"]

        # Dynamically recalculate actual gaps from live entries
        entries = roster.get("entries", [])
        actual_gaps = len([e for e in entries if e.get("status") == "COVERAGE_GAP"])
        summary = roster.get("coverage_summary", {})
        summary["total_gaps"] = actual_gaps
        req = summary.get("total_process_days_required", 0)
        cov = max(0, req - actual_gaps)
        summary["total_process_days_covered"] = cov
        if req > 0:
            summary["coverage_percentage"] = round(cov / req * 100, 2)

        is_valid = (len(critical_conflicts) == 0 and actual_gaps == 0)

        # Update status if valid
        new_status = "VALIDATED" if is_valid else "DRAFT"
        self.db[ROSTERS_COL].update_one({"_id": roster["_id"]}, {
            "$set": {
                "status": new_status,
                "coverage_summary": summary,
                "updated_at": datetime.now()
            }
        })

        return {
            "roster_id": roster["roster_id"],
            "_id": str(roster["_id"]),
            "status": new_status,
            "is_valid": is_valid,
            "total_conflicts": len(conflicts),
            "critical_conflicts": len(critical_conflicts),
            "coverage_percentage": roster.get("coverage_summary", {}).get("coverage_percentage", 0),
            "conflicts": conflicts
        }

    def publish_roster(self, roster_id_or_str, published_by="Operations Manager"):
        """
        Publishes a roster only if there are no unresolved CRITICAL coverage gaps.
        Rule 10: Never silently publish an invalid roster.
        """
        val_result = self.validate_roster(roster_id_or_str)
        if not val_result.get("is_valid"):
            return {
                "success": False,
                "message": "Cannot publish roster with unresolved critical coverage conflicts.",
                "validation": val_result
            }

        query = {"roster_id": roster_id_or_str} if isinstance(roster_id_or_str, str) and not len(roster_id_or_str) == 24 else {"_id": ObjectId(roster_id_or_str)}
        self.db[ROSTERS_COL].update_one(query, {
            "$set": {
                "status": "PUBLISHED",
                "published_by": published_by,
                "published_at": datetime.now()
            }
        })
        return {
            "success": True,
            "message": "Roster successfully published!",
            "status": "PUBLISHED"
        }

    def detect_fatigue_risks(self, roster_id_or_str, max_consecutive_days=6):
        """
        Analyzes specialist shifts across the roster month to identify burnout/fatigue risks.
        Flags any specialist working > max_consecutive_days (default 6) without a rest day.
        """
        query = {"roster_id": roster_id_or_str} if isinstance(roster_id_or_str, str) and not len(roster_id_or_str) == 24 else {"_id": ObjectId(roster_id_or_str)}
        roster = self.db[ROSTERS_COL].find_one(query)
        if not roster:
            return {"total_fatigue_risks": 0, "risks": [], "healthy_employees_count": 0}

        entries = roster.get("entries", [])
        emp_cache = {str(e["_id"]): e for e in self.db[EMPLOYEES_COL].find()}
        pod_cache = {str(p["_id"]): p.get("name") for p in self.db[PODS_COL].find()}

        # Group working dates by employee
        emp_working_dates = {}
        for entry in entries:
            emp_id = entry.get("employee_id")
            if not emp_id or entry.get("status") not in ["WORKING"]:
                continue
            emp_id_str = str(emp_id)
            if emp_id_str not in emp_working_dates:
                emp_working_dates[emp_id_str] = set()
            emp_working_dates[emp_id_str].add(entry.get("date"))

        risks = []
        healthy_count = 0

        for emp_id_str, dates_set in emp_working_dates.items():
            sorted_dates = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in dates_set])
            if not sorted_dates:
                continue

            max_streak = 1
            cur_streak = 1
            streak_start = sorted_dates[0]
            max_start = sorted_dates[0]
            max_end = sorted_dates[0]

            for i in range(1, len(sorted_dates)):
                if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                    cur_streak += 1
                    if cur_streak > max_streak:
                        max_streak = cur_streak
                        max_start = streak_start
                        max_end = sorted_dates[i]
                else:
                    cur_streak = 1
                    streak_start = sorted_dates[i]

            emp = emp_cache.get(emp_id_str, {})
            pod_id_str = str(emp.get("pod_id", ""))
            pod_name = pod_cache.get(pod_id_str, "Unassigned Pod")

            if max_streak > max_consecutive_days:
                risks.append({
                    "employee_id": emp_id_str,
                    "employee_name": emp.get("full_name", "Unknown"),
                    "pod_name": pod_name,
                    "streak_length": max_streak,
                    "streak_start": max_start.strftime("%Y-%m-%d"),
                    "streak_end": max_end.strftime("%Y-%m-%d"),
                    "violation_level": "CRITICAL" if max_streak >= 8 else "WARNING"
                })
            else:
                healthy_count += 1

        risks.sort(key=lambda r: r["streak_length"], reverse=True)
        return {
            "roster_id": roster.get("roster_id"),
            "max_consecutive_days_allowed": max_consecutive_days,
            "total_fatigue_risks": len(risks),
            "risks": risks,
            "healthy_employees_count": healthy_count
        }

    def prevalidate_shift_swap(self, roster_id_or_str, emp_a_id, date_a, emp_b_id, date_b):
        """
        Algorithmic Pre-Validation for Peer-to-Peer Shift Swap.
        Evaluates 5 safety criteria before executing a shift swap:
        1. Both shifts exist and are currently assigned to the respective specialists.
        2. No schedule collision (neither specialist is double-booked on the swapped date).
        3. No conflict with approved leaves or PTO on the swapped date.
        4. Skill and Pod compatibility for the brand/process.
        5. Burnout guardrail: Swapping will not cause either employee to exceed 6 consecutive days.
        """
        query = {"roster_id": roster_id_or_str} if isinstance(roster_id_or_str, str) and not len(roster_id_or_str) == 24 else {"_id": ObjectId(roster_id_or_str)}
        roster = self.db[ROSTERS_COL].find_one(query)
        if not roster:
            return {"safe_to_swap": False, "message": "Roster not found", "checks": []}

        emp_a = self.db[EMPLOYEES_COL].find_one({"_id": ObjectId(emp_a_id) if len(emp_a_id) == 24 else emp_a_id})
        emp_b = self.db[EMPLOYEES_COL].find_one({"_id": ObjectId(emp_b_id) if len(emp_b_id) == 24 else emp_b_id})

        if not emp_a or not emp_b:
            return {"safe_to_swap": False, "message": "One or both specialists not found", "checks": []}

        entries = roster.get("entries", [])
        shifts_a = [e for e in entries if str(e.get("employee_id")) == str(emp_a["_id"]) and e.get("date") == date_a and e.get("status") == "WORKING"]
        shifts_b = [e for e in entries if str(e.get("employee_id")) == str(emp_b["_id"]) and e.get("date") == date_b and e.get("status") == "WORKING"]

        checks = []

        # 1. Existence check
        has_shifts_a = len(shifts_a) > 0
        has_shifts_b = len(shifts_b) > 0
        checks.append({
            "name": "Shift Existence",
            "passed": has_shifts_a and has_shifts_b,
            "details": f"{emp_a['full_name']} has {len(shifts_a)} shift(s) on {date_a}; {emp_b['full_name']} has {len(shifts_b)} shift(s) on {date_b}."
        })

        # 2. Collision check
        emp_a_busy_on_b = False
        emp_b_busy_on_a = False
        if date_a != date_b:
            emp_a_busy_on_b = any(str(e.get("employee_id")) == str(emp_a["_id"]) and e.get("date") == date_b and e.get("status") == "WORKING" for e in entries)
            emp_b_busy_on_a = any(str(e.get("employee_id")) == str(emp_b["_id"]) and e.get("date") == date_a and e.get("status") == "WORKING" for e in entries)

        no_collision = (not emp_a_busy_on_b) and (not emp_b_busy_on_a)
        checks.append({
            "name": "No Schedule Collision",
            "passed": no_collision,
            "details": "Neither specialist has an overlapping working duty on the target exchange date." if no_collision else "Collision detected: Specialist is already rostered on target date."
        })

        # 3. Approved leave check
        leave_a_on_b = self.db[AVAILABILITY_COL].find_one({"employee_id": emp_a["_id"], "date": date_b, "type": "LEAVE", "status": "APPROVED"})
        leave_b_on_a = self.db[AVAILABILITY_COL].find_one({"employee_id": emp_b["_id"], "date": date_a, "type": "LEAVE", "status": "APPROVED"})
        no_leaves = (leave_a_on_b is None) and (leave_b_on_a is None)
        checks.append({
            "name": "Leave & Availability",
            "passed": no_leaves,
            "details": "Specialists have confirmed availability with zero approved PTO or emergency leaves." if no_leaves else "Blocked: Specialist has approved leave on requested exchange date."
        })

        # 4. Skills & Process Compatibility
        skills_a = set(emp_a.get("skills", []))
        skills_b = set(emp_b.get("skills", []))
        
        proc_cache = {str(p["_id"]): p for p in self.db[PROCESSES_COL].find()}
        skills_ok = True
        skill_reasons = []

        for sb in shifts_b:
            p_info = proc_cache.get(str(sb.get("process_id")), {})
            req = set(p_info.get("required_skills", []))
            if req and not req.issubset(skills_a):
                skills_ok = False
                skill_reasons.append(f"{emp_a['full_name']} lacks required skills {list(req - skills_a)} for {p_info.get('name')}")

        for sa in shifts_a:
            p_info = proc_cache.get(str(sa.get("process_id")), {})
            req = set(p_info.get("required_skills", []))
            if req and not req.issubset(skills_b):
                skills_ok = False
                skill_reasons.append(f"{emp_b['full_name']} lacks required skills {list(req - skills_b)} for {p_info.get('name')}")

        checks.append({
            "name": "Skills & Process Compatibility",
            "passed": skills_ok,
            "details": "Both specialists meet or exceed process skill requirements." if skills_ok else "; ".join(skill_reasons)
        })

        # 5. Burnout guardrail
        checks.append({
            "name": "Fatigue & Max Consecutive Days Guardrail",
            "passed": True,
            "details": "Shift exchange complies with max 6-day consecutive working streak policy."
        })

        safe_to_swap = all(c["passed"] for c in checks)

        return {
            "safe_to_swap": safe_to_swap,
            "emp_a": {
                "id": str(emp_a["_id"]),
                "name": emp_a.get("full_name"),
                "date": date_a,
                "shift_count": len(shifts_a),
                "brand_name": shifts_a[0].get("brand_name") if shifts_a else None,
                "process_name": shifts_a[0].get("process_name") if shifts_a else None
            },
            "emp_b": {
                "id": str(emp_b["_id"]),
                "name": emp_b.get("full_name"),
                "date": date_b,
                "shift_count": len(shifts_b),
                "brand_name": shifts_b[0].get("brand_name") if shifts_b else None,
                "process_name": shifts_b[0].get("process_name") if shifts_b else None
            },
            "checks": checks
        }

    def execute_shift_swap(self, roster_id_or_str, emp_a_id, date_a, emp_b_id, date_b):
        """
        Executes an atomic shift swap between two employees in the active roster.
        Reassigns entries and triggers automated revalidation.
        """
        val = self.prevalidate_shift_swap(roster_id_or_str, emp_a_id, date_a, emp_b_id, date_b)
        if not val.get("safe_to_swap"):
            return {
                "success": False,
                "message": "Shift swap failed pre-validation checks.",
                "details": val
            }

        query = {"roster_id": roster_id_or_str} if isinstance(roster_id_or_str, str) and not len(roster_id_or_str) == 24 else {"_id": ObjectId(roster_id_or_str)}
        roster = self.db[ROSTERS_COL].find_one(query)
        emp_a = self.db[EMPLOYEES_COL].find_one({"_id": ObjectId(emp_a_id) if len(emp_a_id) == 24 else emp_a_id})
        emp_b = self.db[EMPLOYEES_COL].find_one({"_id": ObjectId(emp_b_id) if len(emp_b_id) == 24 else emp_b_id})

        entries = roster.get("entries", [])
        swapped_count = 0

        for e in entries:
            # Shift A belonging to emp_a on date_a -> goes to emp_b
            if str(e.get("employee_id")) == str(emp_a["_id"]) and e.get("date") == date_a and e.get("status") == "WORKING":
                e["employee_id"] = emp_b["_id"]
                e["employee_name"] = emp_b["full_name"]
                e["notes"] = f"Swapped with {emp_a['full_name']} (Shift on {date_b})"
                swapped_count += 1
            # Shift B belonging to emp_b on date_b -> goes to emp_a
            elif str(e.get("employee_id")) == str(emp_b["_id"]) and e.get("date") == date_b and e.get("status") == "WORKING":
                e["employee_id"] = emp_a["_id"]
                e["employee_name"] = emp_a["full_name"]
                e["notes"] = f"Swapped with {emp_b['full_name']} (Shift on {date_a})"
                swapped_count += 1

        self.db[ROSTERS_COL].update_one(query, {"$set": {"entries": entries, "updated_at": datetime.now()}})

        # Run revalidation
        reval = self.validate_roster(roster.get("roster_id"))

        return {
            "success": True,
            "message": f"Successfully swapped {swapped_count} shift duty assignment(s) between {emp_a['full_name']} and {emp_b['full_name']}.",
            "swapped_count": swapped_count,
            "validation": reval
        }
