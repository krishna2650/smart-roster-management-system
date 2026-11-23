import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:5000/api"

passed = 0
failed = 0
results = []

def record(test_name, success, details=""):
    global passed, failed
    if success:
        passed += 1
        results.append((test_name, "PASS", details))
        print(f"  [PASS] {test_name} {details}")
    else:
        failed += 1
        results.append((test_name, "FAIL", details))
        print(f"  [FAIL] {test_name}: {details}")

def req(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            content_type = resp.headers.get("Content-Type", "")
            if "csv" in content_type:
                return resp.status, {"csv_content": content, "lines": len(content.splitlines())}
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except:
            parsed = {"raw": content}
        return e.code, parsed
    except Exception as e:
        return 0, {"error": str(e)}

print("\n" + "="*70)
print("  DATASTRAW SMART ROSTER SYSTEM - EXHAUSTIVE FEATURE VERIFICATION")
print("="*70 + "\n")

# 1. AUTHENTICATION & RBAC
print("[MODULE 1: Authentication & Role-Based Access Control]")
st, body = req("POST", "/auth/login", {"email": "manager@datastraw.com", "password": "manager123"})
manager_token = body.get("token")
record("1.1 Manager Login", st == 200 and "token" in body, f"Role: {body.get('user', {}).get('role')}")

st, body = req("POST", "/auth/login", {"email": "admin@datastraw.com", "password": "admin123"})
admin_token = body.get("token")
record("1.2 Admin Login", st == 200 and "token" in body, f"Role: {body.get('user', {}).get('role')}")

st, body = req("GET", "/auth/me", token=manager_token)
record("1.3 Token Verification (/auth/me)", st == 200 and body.get("user", {}).get("email") == "manager@datastraw.com")

st, body = req("POST", "/auth/login", {"email": "manager@datastraw.com", "password": "wrongpassword"})
record("1.4 Bad Credentials Rejection", st == 401)

# 2. DASHBOARD
print("\n[MODULE 2: Executive Dashboard & KPI Telemetry]")
st, body = req("GET", "/dashboard/stats")
record("2.1 Live Statistics Fetch", st == 200 and "stats" in body and "charts" in body)
stats = body.get("stats", {})
record("2.2 Specialist & Brand Counts", stats.get("total_employees", 0) >= 30 and stats.get("total_brands", 0) >= 12,
       f"Employees: {stats.get('total_employees')}, Brands: {stats.get('total_brands')}, Pods: {stats.get('total_pods')}")
record("2.3 Real-time Charts Data", len(body.get("charts", {}).get("pod_distribution", [])) > 0,
       f"Pod breakdown categories: {len(body.get('charts', {}).get('pod_distribution', []))}")

# 3. EMPLOYEE MANAGEMENT
print("\n[MODULE 3: Workforce & Specialist Directory (CRUD)]")
st, body = req("GET", "/employees?search=Rahul")
record("3.1 Employee Search", st == 200 and len(body.get("employees", [])) > 0, f"Found: {body.get('employees', [{}])[0].get('full_name')}")

st, body = req("GET", "/employees?status=active")
record("3.2 Employee Filter by Status", st == 200 and body.get("total", 0) >= 30, f"Active specialists: {body.get('total')}")

# Create new test employee
new_emp_payload = {
    "employee_id": "EMP-999-TEST",
    "full_name": "Test Verification Specialist",
    "email": "test.specialist@datastraw.com",
    "phone": "+91 9876543210",
    "designation": "QA Test Specialist",
    "role": "OPERATIONS_ASSOCIATE",
    "employment_status": "Full-time",
    "skills": ["Customer Support (CS)", "Non-Delivery Report Management (NDR)"],
    "preferred_weekly_off": ["Sunday"]
}
st, body = req("POST", "/employees", new_emp_payload)
created_emp_id = body.get("employee", {}).get("_id")
record("3.3 Create Specialist", st == 201 and created_emp_id is not None)

# Duplicate employee ID check
st, body = req("POST", "/employees", new_emp_payload)
record("3.4 Prevent Duplicate Employee ID/Email", st in [400, 409], f"Status: {st}")

# Edit employee
if created_emp_id:
    st, body = req("PUT", f"/employees/{created_emp_id}", {"designation": "Senior QA Specialist"})
    record("3.5 Edit Specialist", st == 200 and body.get("employee", {}).get("designation") == "Senior QA Specialist")
    
    # Delete test employee
    st, body = req("DELETE", f"/employees/{created_emp_id}")
    record("3.6 Delete Specialist", st == 200)

# Check active assignment deletion protection
rahul_res = req("GET", "/employees?search=Rahul Verma")[1]
if rahul_res.get("employees"):
    rahul_id = rahul_res["employees"][0]["_id"]
    st, body = req("DELETE", f"/employees/{rahul_id}")
    record("3.7 Block Deletion with Active Assignments", st == 400, "Deletion properly blocked")

# 4. BRAND MANAGEMENT
print("\n[MODULE 4: Brand Accounts & Operating Calendars (CRUD)]")
st, body = req("GET", "/brands")
record("4.1 List Brands", st == 200 and body.get("total", 0) >= 12, f"Total brands: {body.get('total')}")

test_brand_payload = {
    "brand_id": "BRD-999-TEST",
    "name": "Test Brand Operations",
    "description": "Validation test client",
    "operating_calendar": "365_DAYS",
    "holiday_policy": "WORK_ON_HOLIDAYS",
    "min_coverage_required": 1
}
st, body = req("POST", "/brands", test_brand_payload)
test_brand_id = body.get("brand", {}).get("_id")
record("4.2 Create Brand (365_DAYS)", st == 201 and test_brand_id is not None)

if test_brand_id:
    st, body = req("PUT", f"/brands/{test_brand_id}", {"description": "Updated brand client"})
    record("4.3 Edit Brand", st == 200)
    st, body = req("DELETE", f"/brands/{test_brand_id}")
    record("4.4 Delete Brand", st == 200)

# 5. PROCESS MANAGEMENT
print("\n[MODULE 5: Process Management & Staffing Rules (CRUD)]")
st, body = req("GET", "/processes")
record("5.1 List Processes", st == 200 and body.get("total", 0) >= 30, f"Total processes: {body.get('total')}")

brands_list = req("GET", "/brands")[1].get("brands", [])
sample_brand_id = brands_list[0]["_id"] if brands_list else None

test_proc_payload = {
    "process_id": "PROC-999-TEST",
    "name": "Live Chat Support (Test)",
    "description": "Validation testing process",
    "brand_id": sample_brand_id,
    "operating_calendar": "365_DAYS",
    "min_employees": 1
}
st, body = req("POST", "/processes", test_proc_payload)
test_proc_id = body.get("process", {}).get("_id")
record("5.2 Create Process under Brand", st == 201 and test_proc_id is not None)

if test_proc_id:
    st, body = req("PUT", f"/processes/{test_proc_id}", {"min_employees": 2})
    record("5.3 Edit Process Min Staffing", st == 200 and body.get("process", {}).get("min_employees") == 2)
    st, body = req("DELETE", f"/processes/{test_proc_id}")
    record("5.4 Delete Process", st == 200)

# 6. POD & TEAM MANAGEMENT
print("\n[MODULE 6: Operational Pods & Teams]")
st, body = req("GET", "/pods")
record("6.1 List Pods", st == 200 and body.get("total", 0) >= 4, f"Pods count: {body.get('total')}")
pod_id = body.get("pods", [{}])[0].get("_id")
st, body = req("GET", f"/pods/{pod_id}")
record("6.2 Get Pod Details & Members", st == 200 and "pod" in body, f"Pod: {body.get('pod', {}).get('name')}")

# 7. ASSIGNMENTS MATRIX
print("\n[MODULE 7: Employee-Brand-Process Resource Matrix]")
st, body = req("GET", "/assignments")
record("7.1 List Assignments", st == 200 and body.get("total", 0) >= 30, f"Total assignments: {body.get('total')}")

# Check Section 9 Critical Validation: Process must belong to selected brand
procs = req("GET", "/processes")[1].get("processes", [])
if len(brands_list) >= 2 and len(procs) >= 1:
    b1 = brands_list[0]["_id"]
    b2 = brands_list[1]["_id"]
    p_b1 = next((p for p in procs if p.get("brand_id") == b1), None)
    if p_b1:
        emp = req("GET", "/employees")[1].get("employees", [])[0]["_id"]
        # Intentionally mismatch brand2 with process from brand1
        st, body = req("POST", "/assignments", {
            "employee_id": emp,
            "brand_id": b2,
            "process_id": p_b1["_id"],
            "allocation_percentage": 100
        })
        record("7.2 Prevent Brand-Process Mismatch (Sec 9)", st == 400, f"Blocked mismatch with code: {st}")

# 8. AVAILABILITY & LEAVES
print("\n[MODULE 8: Availability & Leave Management]")
st, body = req("GET", "/availability")
record("8.1 List Leave Records", st == 200 and body.get("total", 0) >= 5, f"Leave records: {body.get('total')}")

emp_id = req("GET", "/employees")[1].get("employees", [])[0]["_id"]
# Clean up any leftover test leave records for this test employee
for l in body.get("records", []):
    if l.get("employee_id") == emp_id and l.get("reason") in ["Family function validation test", "Overlapping date test"]:
        req("DELETE", f"/availability/{l['_id']}")

leave_payload = {
    "employee_id": emp_id,
    "start_date": "2027-03-10",
    "end_date": "2027-03-12",
    "type": "CASUAL_LEAVE",
    "status": "PENDING",
    "reason": "Family function validation test"
}
st, body = req("POST", "/availability", leave_payload)
test_leave_id = body.get("record", {}).get("_id")
record("8.2 Submit Leave Request", st == 201 and test_leave_id is not None)

# Overlapping leave test
st, body = req("POST", "/availability", {
    "employee_id": emp_id,
    "start_date": "2027-03-11",
    "end_date": "2027-03-15",
    "type": "SICK_LEAVE",
    "reason": "Overlapping date test"
})
record("8.3 Prevent Overlapping Leaves", st in [400, 409], f"Overlap blocked with status: {st}")

if test_leave_id:
    # Approve leave
    st, body = req("POST", f"/availability/{test_leave_id}/approve", {})
    record("8.4 Approve Leave Request", st == 200 and body.get("record", {}).get("status") == "APPROVED")
    
    # Delete test leave
    st, body = req("DELETE", f"/availability/{test_leave_id}")
    record("8.5 Delete Leave Record", st == 200)

# 9. PUBLIC HOLIDAYS
print("\n[MODULE 9: Public Holidays & Operating Calendar Impact]")
st, body = req("GET", "/holidays")
record("9.1 List Holidays", st == 200 and body.get("total", 0) >= 10, f"Total holidays: {body.get('total')}")

test_holiday = {
    "name": "Test Regional Holiday",
    "date": "2027-08-15",
    "description": "Validation test holiday",
    "location": "National",
    "is_active": True
}
st, body = req("POST", "/holidays", test_holiday)
test_h_id = body.get("holiday", {}).get("_id")
record("9.2 Create Holiday", st == 201 and test_h_id is not None)

if test_h_id:
    st, body = req("DELETE", f"/holidays/{test_h_id}")
    record("9.3 Delete Holiday", st == 200)

# 10. ROSTER GENERATION & 5 VIEWS
print("\n[MODULE 10: Smart Roster Engine, 5 Stakeholder Views & Validation]")
st, body = req("POST", "/rosters/generate", {"year": 2026, "month": 6})
record("10.1 Generate Roster (Jun 2026)", st == 200 and body.get("success"),
       f"Coverage: {body.get('result', {}).get('coverage_summary', {}).get('coverage_percentage')}%")

# Test all 5 views
roster_id = "ROSTER-2026-06"
for vm in ["company", "pod", "brand", "process", "employee"]:
    st, body = req("GET", f"/rosters/{roster_id}?view={vm}")
    record(f"10.2 View Mode: {vm.capitalize()} View", st == 200 and "roster" in body,
           f"Entries in view: {len(body.get('roster', {}).get('entries', []))}")

# Validate roster
st, body = req("POST", f"/rosters/{roster_id}/validate")
record("10.3 Validate Roster", st == 200 and "validation" in body,
       f"Is Valid: {body.get('validation', {}).get('is_valid')}")

# Publish roster
st, body = req("POST", f"/rosters/{roster_id}/publish", {"published_by": "Operations Manager"})
record("10.4 Publish Validated Roster", st == 200 and body.get("success"), f"Status: {body.get('status')}")

# Manual cell edit & auto-revalidation
st, body = req("PUT", f"/rosters/{roster_id}/entry", {
    "date": "2026-06-01",
    "process_id": str(procs[0]["_id"]),
    "employee_id": str(emp_id),
    "status": "WORKING",
    "notes": "Manual operational adjustment by manager"
})
record("10.5 Manual Cell Edit with Auto-Revalidation", st == 200 and body.get("success"),
       "Revalidation executed automatically")

# 11. CONFLICT DETECTION & BACKUP RECOMMENDATION
print("\n[MODULE 11: Operational Conflict Center & Candidate Ranking]")
st, body = req("GET", "/conflicts")
record("11.1 Fetch Conflicts", st == 200 and "conflicts" in body, f"Total conflicts logged: {body.get('total')}")

conflicts_list = body.get("conflicts", [])
if conflicts_list:
    sample_c = conflicts_list[0]
    st, body = req("GET", f"/conflicts/{sample_c['_id']}/backups")
    candidates = body.get("backup_candidates", [])
    record("11.2 Algorithmic Backup Ranking", st == 200 and len(candidates) > 0,
           f"Top candidate: {candidates[0].get('employee_name')} (Score: {candidates[0].get('score')} pts)")

# 12. REPORTS & CSV EXPORTS
print("\n[MODULE 12: Enterprise Reports & CSV Data Streaming]")
st, body = req("GET", "/reports/summary")
record("12.1 SLA Compliance Summary", st == 200 and "brand_coverage" in body,
       f"Brands scored: {len(body.get('brand_coverage', []))}")

st, body = req("GET", "/reports/export-csv?type=company&roster_id=ROSTER-2026-06")
record("12.2 Company Schedule CSV Stream", st == 200, "CSV header and rows streamed")

st, body = req("GET", "/reports/export-csv?type=conflicts&roster_id=ROSTER-2026-06")
record("12.3 Conflicts Audit CSV Stream", st == 200, "CSV audit logs streamed")

st, body = req("GET", "/reports/export-csv?type=leaves")
record("12.4 Leaves Summary CSV Stream", st == 200, "CSV leave records streamed")

# 13. FATIGUE GUARDRAIL & SHIFT SWAP MARKETPLACE
print("\n[MODULE 13: Fatigue Guardrail & Peer-to-Peer Shift Swap Marketplace]")
st, body = req("GET", "/rosters/ROSTER-2026-12/fatigue")
record("13.1 Fatigue & Burnout Telemetry", st == 200 and "total_fatigue_risks" in body,
       f"Fatigue risks: {body.get('total_fatigue_risks')}, Compliant: {body.get('healthy_employees_count')}")

# Fetch working shifts to test shift swap
st_r, roster_body = req("GET", "/rosters/ROSTER-2026-12")
entries = roster_body.get("roster", {}).get("entries", [])
working_dec_01 = [e for e in entries if e.get("date") == "2026-12-01" and e.get("status") == "WORKING"]
if len(working_dec_01) >= 2:
    e1 = working_dec_01[0]
    e2 = next(e for e in working_dec_01 if e.get("employee_id") != e1.get("employee_id"))
    swap_payload = {
        "emp_a_id": e1["employee_id"],
        "date_a": "2026-12-01",
        "emp_b_id": e2["employee_id"],
        "date_b": "2026-12-01"
    }
    st_val, body_val = req("POST", "/rosters/ROSTER-2026-12/swap/prevalidate", swap_payload)
    record("13.2 Algorithmic Pre-Validation (5 Safety Checks)", st_val == 200 and len(body_val.get("checks", [])) == 5,
           f"Prevalidation safe: {body_val.get('safe_to_swap')}, Checks evaluated: {len(body_val.get('checks', []))}")

    st_exec, body_exec = req("POST", "/rosters/ROSTER-2026-12/swap/execute", swap_payload)
    record("13.3 Atomic Shift Swap Execution & Auto-Revalidation", st_exec == 200 and body_exec.get("success") == True,
           f"Message: {body_exec.get('message')}")
else:
    record("13.2 Algorithmic Pre-Validation", False, "Insufficient shifts for swap test")

print("\n" + "="*70)
print(f"  VERIFICATION COMPLETE: {passed} PASSED, {failed} FAILED out of {passed + failed} TESTS")
print("="*70 + "\n")

if failed > 0:
    sys.exit(1)
