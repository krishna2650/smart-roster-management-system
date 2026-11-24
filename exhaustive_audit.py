import sys
import os
import time
import json

sys.path.insert(0, os.path.abspath('backend'))
from app import create_app

app = create_app()
client = app.test_client()

total_tests = 0
passed_tests = 0
failed_tests = 0
report = []

def test(name, condition, detail=""):
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    if condition:
        passed_tests += 1
        report.append(f"  [PASS] {name} - {detail}")
        print(f"  [PASS] {name} - {detail}")
    else:
        failed_tests += 1
        report.append(f"  [FAIL] {name} - {detail}")
        print(f"  [FAIL] {name} - {detail}")

print("\n" + "="*70)
print("  EXHAUSTIVE SYSTEM-WIDE FEATURE AUDIT - DATASTRAW ROSTER SYSTEM")
print("="*70)

# ==============================================================================
# MODULE 1: AUTHENTICATION & RBAC
# ==============================================================================
print("\n[1/10] MODULE 1: Authentication & Role-Based Access Control")

res = client.post('/api/auth/login', json={'email': 'manager@datastraw.com', 'password': 'manager123'})
data = res.get_json() or {}
mgr_token = data.get('token')
test("1.1 Operations Manager Login", res.status_code == 200 and data.get('user', {}).get('role') == 'OPERATIONS_MANAGER', f"Token: {bool(mgr_token)}")

res = client.post('/api/auth/login', json={'email': 'admin@datastraw.com', 'password': 'admin123'})
data = res.get_json() or {}
admin_token = data.get('token')
test("1.2 Admin Login", res.status_code == 200 and data.get('user', {}).get('role') == 'ADMIN', f"Role: {data.get('user', {}).get('role')}")

res = client.post('/api/auth/login', json={'email': 'podlead@datastraw.com', 'password': 'lead123'})
data = res.get_json() or {}
lead_token = data.get('token')
test("1.3 Pod Lead Login", res.status_code == 200 and data.get('user', {}).get('role') == 'POD_LEAD', f"Role: {data.get('user', {}).get('role')}")

res = client.post('/api/auth/login', json={'email': 'manager@datastraw.com', 'password': 'wrongpassword'})
test("1.4 Bad Credentials Rejection", res.status_code in [400, 401], f"Status: {res.status_code}")

res = client.get('/api/auth/me', headers={'Authorization': f'Bearer {mgr_token}'})
data = res.get_json() or {}
test("1.5 Token Verification (/auth/me)", res.status_code == 200 and data.get('user', {}).get('email') == 'manager@datastraw.com', f"Verified: {data.get('user', {}).get('email')}")

# ==============================================================================
# MODULE 2: WORKFORCE & POD HIERARCHY
# ==============================================================================
print("\n[2/10] MODULE 2: Workforce, Brand & Pod Hierarchy")

res = client.get('/api/employees')
data = res.get_json() or {}
employees = data.get('employees', [])
test("2.1 Specialist Roster Count", len(employees) == 32, f"Total specialists: {len(employees)}/32")

res = client.get('/api/pods')
data = res.get_json() or {}
pods = data.get('pods', [])
test("2.2 Operational Pods Count", len(pods) == 4, f"Total pods: {len(pods)}/4")

res = client.get('/api/dashboard/stats?month=2026-12')
d_stats = (res.get_json() or {}).get('stats', {})
test("2.3 Brand Directory & Single-Resource Count", d_stats.get('total_brands') == 12 and d_stats.get('single_resource_brands_count') == 10, f"Total brands: {d_stats.get('total_brands')}, Single-resource: {d_stats.get('single_resource_brands_count')} (83.3%)")

res = client.get('/api/processes')
data = res.get_json() or {}
processes = data.get('processes', [])
test("2.4 Mandatory Processes Count", len(processes) == 35, f"Total processes: {len(processes)}/35")

res = client.get('/api/assignments')
data = res.get_json() or {}
assignments = data.get('assignments', [])
test("2.5 Skill Assignments Matrix", len(assignments) == 52, f"Total assignments: {len(assignments)}/52")

# ==============================================================================
# MODULE 3: DETERMINISTIC ROSTER GENERATION & BENCHMARK
# ==============================================================================
print("\n[3/10] MODULE 3: Deterministic Roster Generation & Speed Benchmark")

t0 = time.time()
res = client.post('/api/rosters/generate', json={'year': 2026, 'month': 12})
gen_duration = time.time() - t0
data = res.get_json() or {}
result = data.get('result', {})
conflicts = result.get('conflicts', [])
cov = result.get('coverage_summary', {})

test("3.1 Sub-Second Generation Speed", gen_duration < 1.0, f"Executed in {gen_duration:.3f}s (Threshold: < 1.0s)")
test("3.2 Dec 2026 Benchmark 10 Conflicts", len(conflicts) == 10, f"Detected: {len(conflicts)} conflicts")
test("3.3 Dec 2026 99.0% Coverage SLA", cov.get('coverage_percentage') == 99.0, f"Coverage: {cov.get('coverage_percentage')}%")

all_have_reasons = all(bool(c.get('explanation') and c.get('description')) for c in conflicts)
test("3.4 All Conflicts Have Non-Empty Explanations", all_have_reasons and len(conflicts) > 0, f"Sample: '{conflicts[0].get('explanation')[:60]}...'")

# ==============================================================================
# MODULE 4: DYNAMIC MULTI-MONTH CONFLICT ISOLATION
# ==============================================================================
print("\n[4/10] MODULE 4: Dynamic Multi-Month Conflict Isolation")

expected_monthly_total = {
    (2026, 11): 8,
    (2026, 12): 10,
    (2027, 1): 4,
    (2027, 2): 7,
    (2027, 3): 5,
    (2027, 4): 8,
    (2027, 5): 6,
    (2027, 6): 9,
    (2027, 7): 4,
    (2027, 8): 6,
    (2027, 9): 7,
    (2027, 10): 5,
    (2027, 11): 8,
    (2027, 12): 10,
}

month_checks_passed = 0
for (y, m), expected_total in expected_monthly_total.items():
    r_id = f"ROSTER-{y}-{m:02d}"
    res = client.get(f'/api/rosters/{r_id}')
    m_data = res.get_json() or {}
    m_roster = m_data.get('roster', {})
    m_confs = m_roster.get('conflicts', [])
    if len(m_confs) == expected_total:
        month_checks_passed += 1

test("4.1 Distinct Monthly Conflicts (14 Months Audited)", month_checks_passed == len(expected_monthly_total), f"{month_checks_passed}/{len(expected_monthly_total)} months matched deterministic conflict targets")

# ==============================================================================
# MODULE 5: CONFLICT CENTER FILTERING
# ==============================================================================
print("\n[5/10] MODULE 5: Conflict Center Query Engine & Filters")

res = client.get('/api/conflicts?month=2026-12&severity=CRITICAL')
data = res.get_json() or {}
c_list = data.get('conflicts', [])
test("5.1 Conflict Center Dec 2026 Scope", len(c_list) == 10, f"Returned: {len(c_list)} critical gaps")

res = client.get('/api/conflicts?month=2027-04&severity=CRITICAL')
data = res.get_json() or {}
c_list_apr = data.get('conflicts', [])
test("5.2 Conflict Center April 2027 Scope", len(c_list_apr) == 8, f"Returned: {len(c_list_apr)} critical gaps")

res = client.get('/api/conflicts?month=2026-12&status=UNRESOLVED')
data = res.get_json() or {}
unres = data.get('conflicts', [])
test("5.3 Conflict Center Status Filter", len(unres) == 10, f"Unresolved: {len(unres)}")

# ==============================================================================
# MODULE 6: RELIEF BACKUP RECOMMENDATION & ASSIGNMENT
# ==============================================================================
print("\n[6/10] MODULE 6: Relief Backup Recommendation & Reassignment")

target_conflict = conflicts[0]
target_id = target_conflict.get('_id') or target_conflict.get('conflict_id')

res = client.get(f'/api/conflicts/{target_id}/backups')
data = res.get_json() or {}
cands = data.get('backup_candidates', [])
test("6.1 Backup Recommendation Engine", len(cands) > 0 and 'score' in cands[0], f"Found {len(cands)} ranked candidates. Top: {cands[0].get('employee_name') if cands else 'None'} ({cands[0].get('score') if cands else 0} pts)")

if cands:
    chosen = cands[0]
    res = client.post('/api/rosters/ROSTER-2026-12/reassign-backup', json={
        'date': target_conflict['date'],
        'process_id': str(target_conflict['process_id']),
        'brand_id': str(target_conflict['brand_id']),
        'employee_id': chosen['employee_id']
    })
    assign_res = res.get_json() or {}
    test("6.2 Relief Backup Reassignment & Roster Update", res.status_code == 200 and assign_res.get('success'), f"Assigned {chosen['employee_name']}. Verified update: {assign_res.get('success')}")

# ==============================================================================
# MODULE 7: SHIFT SWAP MARKETPLACE
# ==============================================================================
print("\n[7/10] MODULE 7: Shift Swap Marketplace & Eligibility Validation")

alpha_emps = [e for e in employees if 'Alpha' in e.get('pod_name', '')]
emp_a = str(alpha_emps[0]['_id'])
emp_b = str(alpha_emps[1]['_id'])
res = client.post('/api/rosters/ROSTER-2026-12/swap/prevalidate', json={
    'emp_a_id': emp_a,
    'date_a': '2026-12-07',
    'emp_b_id': emp_b,
    'date_b': '2026-12-08'
})
swap_val = res.get_json() or {}
test("7.1 Shift Swap Prevalidation Engine", res.status_code == 200 and 'checks' in swap_val and len(swap_val.get('checks', [])) == 5, f"All 5 constraint checks evaluated. safe_to_swap: {swap_val.get('safe_to_swap')}")

# ==============================================================================
# MODULE 8: FATIGUE & BURNOUT GUARDRAILS
# ==============================================================================
print("\n[8/10] MODULE 8: Fatigue & Burnout Guardrail Monitoring")

res = client.get('/api/rosters/ROSTER-2026-12/fatigue')
data = res.get_json() or {}
test("8.1 Max Consecutive Days Policy", data.get('max_consecutive_days_allowed') == 6, f"Max consecutive days policy configured: {data.get('max_consecutive_days_allowed')} days")
test("8.2 Fatigue Risk Telemetry", 'total_fatigue_risks' in data, f"Total fatigue risk signals: {data.get('total_fatigue_risks')}")
test("8.3 Healthy Specialists Monitored", data.get('healthy_employees_count', 0) > 0, f"Healthy specialists: {data.get('healthy_employees_count')}")

# ==============================================================================
# MODULE 9: EXECUTIVE DASHBOARD & REPORTS EXPORT
# ==============================================================================
print("\n[9/10] MODULE 9: Executive Dashboard Telemetry & CSV Reports")

res = client.get('/api/dashboard/stats?month=2026-12')
data = res.get_json() or {}
d_stats = data.get('stats', {})
test("9.1 Dashboard Telemetry API", res.status_code == 200 and d_stats.get('total_employees') == 32, f"Total employees: {d_stats.get('total_employees')}, Pods: {d_stats.get('total_pods')}")

res = client.get('/api/reports/export-csv?type=roster&roster_id=ROSTER-2026-12')
test("9.2 CSV Roster Export", res.status_code == 200 and 'text/csv' in res.content_type, f"Content-Type: {res.content_type}, Size: {len(res.data)} bytes")

res = client.get('/api/reports/export-csv?type=conflicts&roster_id=ROSTER-2026-12')
test("9.3 CSV Conflicts Export", res.status_code == 200 and 'text/csv' in res.content_type, f"Content-Type: {res.content_type}, Size: {len(res.data)} bytes")

# ==============================================================================
# MODULE 10: FRONTEND BUILD & ROUTING INTEGRITY
# ==============================================================================
print("\n[10/10] MODULE 10: Frontend Build & Static SPA Routing")

pub_redir = os.path.exists('frontend/public/_redirects')
dist_redir = os.path.exists('frontend/dist/_redirects')
test("10.1 Static SPA Routing Rule (_redirects)", pub_redir and dist_redir, f"public: {pub_redir}, dist: {dist_redir}")

dist_index = os.path.exists('frontend/dist/index.html') and os.path.getsize('frontend/dist/index.html') > 500
test("10.2 Production Bundle (dist/index.html)", dist_index, f"Present: {dist_index}")

with open('frontend/src/services/api.js', 'r') as f:
    api_js = f.read()
correct_render_url = 'https://smart-roster-management-system-y3zb.onrender.com/api'
test("10.3 Render API URL Wiring in api.js", correct_render_url in api_js, f"Target: {correct_render_url}")

print("\n" + "="*70)
print(f"  AUDIT SUMMARY: {passed_tests}/{total_tests} Tests Passed ({(passed_tests/total_tests)*100:.1f}%)")
print("="*70)
