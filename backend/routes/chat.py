import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from models.schemas import (
    EMPLOYEES_COL, BRANDS_COL, PROCESSES_COL, PODS_COL,
    ASSIGNMENTS_COL, ROSTERS_COL, CONFLICTS_COL, AVAILABILITY_COL,
    HOLIDAYS_COL, serialize_doc
)

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@chat_bp.route("/message", methods=["POST"])
def chat_message():
    db = get_db()
    data = request.get_json(silent=True) or {}
    msg = data.get("message", "").strip()

    if not msg:
        return jsonify({
            "reply": "Hello! I am your DataStraw Ops Copilot. Ask me anything about employee schedules, client brand operating rules, roster coverage, active conflicts, or scheduling rules.",
            "suggestions": [
                "What is the roster coverage for June 2026?",
                "Who manages EcoGlow Skincare?",
                "Show active conflicts",
                "Explain the 10 scheduling rules"
            ]
        })

    lower_msg = msg.lower()

    # --- 1. Roster Coverage & Generation ---
    if any(k in lower_msg for k in ["coverage", "roster status", "june 2026", "december 2026", "dec 2026", "jun 2026"]):
        target_roster_id = "ROSTER-2026-06" if ("june" in lower_msg or "jun" in lower_msg) else "ROSTER-2026-12"
        roster = db[ROSTERS_COL].find_one({"roster_id": target_roster_id}) or db[ROSTERS_COL].find_one({})
        if roster:
            cov = roster.get("coverage_summary", {})
            status = roster.get("status", "DRAFT")
            gaps = cov.get("total_gaps", 0)
            reply = (
                f"### 📅 Roster Status for **{roster.get('roster_id')}**\n\n"
                f"* **Current Lifecycle Status:** `{status}`\n"
                f"* **Process Coverage:** **{cov.get('coverage_percentage', 0)}%**\n"
                f"* **Covered Shifts:** {cov.get('total_process_days_covered', 0)} of {cov.get('total_process_days_required', 0)} required\n"
                f"* **Unresolved Gaps:** {gaps}\n\n"
            )
            if gaps > 0:
                reply += (
                    f"⚠️ There are **{gaps} critical coverage gap(s)** in this roster. "
                    f"Under Rule 10, publishing is strictly prohibited until relief resources are assigned."
                )
            else:
                reply += "✅ All mandatory client process shifts are fully staffed with 100% SLA compliance."

            return jsonify({
                "reply": reply,
                "action": {"label": "Open Roster Engine", "url": "/roster"},
                "suggestions": ["Show active conflicts", "Who manages EcoGlow?", "Explain candidate backup ranking"]
            })

    # --- 2. Conflicts & Gaps ---
    if any(k in lower_msg for k in ["conflict", "gap", "unresolved", "breach", "sla issue"]):
        conflicts = list(db[CONFLICTS_COL].find({"resolution_status": "UNRESOLVED"}))
        crit_count = len([c for c in conflicts if c.get("severity") == "CRITICAL"])
        if conflicts:
            reply = (
                f"### 🚨 Active Operational Conflicts\n\n"
                f"Currently detecting **{len(conflicts)} unresolved conflict(s)** "
                f"({crit_count} Critical Coverage Gaps):\n\n"
            )
            for c in conflicts[:4]:
                reply += (
                    f"* **{c.get('date')}** | **{c.get('brand_name')}** ({c.get('process_name')}): "
                    f"`{c.get('severity')}` — {c.get('explanation')}\n"
                )
            if len(conflicts) > 4:
                reply += f"\n*...and {len(conflicts) - 4} more conflict(s).*"
            reply += "\n\nYou can resolve these with one click in the **Conflict Center** using algorithmic backup recommendations."
            return jsonify({
                "reply": reply,
                "action": {"label": "Open Conflict Center", "url": "/conflicts"},
                "suggestions": ["How does backup ranking work?", "Who is Rahul Verma?", "What is EcoGlow's calendar?"]
            })
        else:
            return jsonify({
                "reply": "✅ **No Unresolved Conflicts Detected!** All client processes have verified coverage across all scheduled operating days.",
                "action": {"label": "View Roster Management", "url": "/roster"},
                "suggestions": ["What is June 2026 coverage?", "List operational pods", "Explain the 10 scheduling rules"]
            })

    # --- 3. Employee Specific Inquiry ---
    # Check if any employee name or ID is mentioned
    employees = list(db[EMPLOYEES_COL].find({}))
    matched_emp = None
    for emp in employees:
        if emp["full_name"].lower() in lower_msg or emp["employee_id"].lower() in lower_msg:
            matched_emp = emp
            break

    if matched_emp:
        pod = db[PODS_COL].find_one({"_id": matched_emp.get("pod_id")})
        assignments = list(db[ASSIGNMENTS_COL].find({"employee_id": matched_emp["_id"]}))
        leaves = list(db[AVAILABILITY_COL].find({"employee_id": matched_emp["_id"]}))
        
        reply = (
            f"### 👤 Specialist Profile: **{matched_emp['full_name']}** ({matched_emp['employee_id']})\n\n"
            f"* **Designation:** {matched_emp.get('designation', 'Operations Associate')}\n"
            f"* **Operational Pod:** {pod.get('name', 'Unassigned') if pod else 'Unassigned'}\n"
            f"* **Employment Status:** {matched_emp.get('employment_status', 'Full-time')}\n"
            f"* **Skills:** {', '.join(matched_emp.get('skills', []))}\n"
            f"* **Preferred Weekly Off:** {', '.join(matched_emp.get('preferred_weekly_off', ['Sunday']))}\n\n"
            f"**Brand & Process Assignments ({len(assignments)}):**\n"
        )
        for a in assignments:
            brand = db[BRANDS_COL].find_one({"_id": a.get("brand_id")})
            proc = db[PROCESSES_COL].find_one({"_id": a.get("process_id")})
            reply += f"* **{brand.get('name', 'Brand')}** — {proc.get('name', 'Process')} ({a.get('allocation_percentage', 100)}% allocation)\n"

        if leaves:
            reply += f"\n**Logged Leaves / Availability ({len(leaves)}):**\n"
            for l in leaves:
                reply += f"* {l.get('start_date')} to {l.get('end_date')} ({l.get('type')}) — Status: `{l.get('status')}` ({l.get('reason')})\n"

        return jsonify({
            "reply": reply,
            "action": {"label": "View Employee Profile", "url": "/employees"},
            "suggestions": ["Show Alpha Pod members", "What happens if this employee takes leave?", "Explain single-resource brands"]
        })

    # --- 4. Brand Specific Inquiry ---
    brands = list(db[BRANDS_COL].find({}))
    matched_brand = None
    for b in brands:
        if b["name"].lower() in lower_msg or b["brand_id"].lower() in lower_msg:
            matched_brand = b
            break

    if matched_brand:
        procs = list(db[PROCESSES_COL].find({"brand_id": matched_brand["_id"]}))
        assigns = list(db[ASSIGNMENTS_COL].find({"brand_id": matched_brand["_id"]}))
        emp_ids = list(set(a["employee_id"] for a in assigns))
        assigned_emps = list(db[EMPLOYEES_COL].find({"_id": {"$in": emp_ids}}))
        is_single = len(assigned_emps) == 1

        reply = (
            f"### 🏷️ Client Account: **{matched_brand['name']}** ({matched_brand['brand_id']})\n\n"
            f"* **Operating Calendar:** `{matched_brand.get('operating_calendar')}`\n"
            f"* **Holiday Policy:** `{matched_brand.get('holiday_policy')}`\n"
            f"* **Staffing Model:** {'**Single-Resource Dedicated Model (~80% pattern)**' if is_single else '**Multi-Employee Specialized Model (~20% pattern)**'}\n"
            f"* **Minimum Daily Staffing:** {matched_brand.get('min_coverage_required', 1)} specialist(s)\n\n"
            f"**Operational Processes ({len(procs)}):**\n"
        )
        for p in procs:
            reply += f"* {p.get('name')} (Min: {p.get('min_employees', 1)}, Calendar: {p.get('operating_calendar')})\n"

        reply += f"\n**Assigned Specialists ({len(assigned_emps)}):**\n"
        for e in assigned_emps:
            reply += f"* **{e.get('full_name')}** ({e.get('designation')})\n"

        if is_single:
            reply += (
                f"\n⚠️ *Note: Because {matched_brand['name']} is a single-resource brand, "
                f"{assigned_emps[0]['full_name']} manages all operational processes. An absence by this specialist "
                f"creates a critical brand-wide coverage gap requiring immediate relief reassignment.*"
            )

        return jsonify({
            "reply": reply,
            "action": {"label": "View Brand Accounts", "url": "/brands"},
            "suggestions": ["Run Change Simulator on EcoGlow", "Explain single vs multi-resource brands", "Show all brands"]
        })

    # --- 5. Pod Inquiries ---
    if any(k in lower_msg for k in ["pod", "pods", "team", "alpha pod", "beta pod", "gamma pod", "delta pod"]):
        pods = list(db[PODS_COL].find({}))
        reply = "### 🛡️ Operational Pods Overview\n\n"
        for p in pods:
            lead = db[EMPLOYEES_COL].find_one({"_id": p.get("lead_id")})
            emps_count = db[EMPLOYEES_COL].count_documents({"pod_id": p["_id"]})
            reply += (
                f"* **{p.get('name')}**\n"
                f"  * **Pod Lead:** {lead.get('full_name', 'Assigned Lead') if lead else 'Assigned Lead'}\n"
                f"  * **Specialists in Pod:** {emps_count}\n"
            )
        return jsonify({
            "reply": reply,
            "action": {"label": "View Operational Pods", "url": "/pods"},
            "suggestions": ["Who is in Alpha Pod?", "What is EcoGlow Skincare?", "What are the 10 scheduling rules?"]
        })

    # --- 6. Scheduling Rules Explanation ---
    if any(k in lower_msg for k in ["rule", "rules", "algorithm", "scheduling logic", "how does engine work"]):
        reply = (
            "### ⚙️ The 10 Deterministic Scheduling Rules\n\n"
            "The system engine (`backend/scheduler/engine.py`) enforces 10 strict constraint rules:\n\n"
            "1. **Rule 1 (Leave Blocking):** Approved leave or comp-off = hard unavailability (`LV`/`CO`). Specialists cannot work while on leave.\n"
            "2. **Rule 2 (No Double Booking):** Specialists working across multiple brands cannot exceed 100% capacity on the same day.\n"
            "3. **Rule 3 (Mandatory Coverage):** Every active operating process must receive its configured `min_employees` staffing.\n"
            "4. **Rule 4 (365-Day Sunday Coverage):** Brands operating 365 days mandate Sunday staffing; missing staff triggers a CRITICAL coverage gap.\n"
            "5. **Rule 5 (Holiday Policy Compliance):** Brands with `WORK_ON_HOLIDAYS` must work on public holidays; others receive `PH` status.\n"
            "6. **Rule 6 (Process Overrides):** Individual sub-processes can override the parent brand operating calendar.\n"
            "7. **Rule 7 (Cross-Brand Conflict Tracking):** Continuous collision monitoring across multi-brand specialists.\n"
            "8. **Rule 8 (Fair Weekly Off Rotation):** Rest days (`WO`) are rotated evenly among multi-employee teams without dropping coverage.\n"
            "9. **Rule 9 (Client SLA Priority):** Mandatory client coverage strictly overrides soft weekly off preferences.\n"
            "10. **Rule 10 (Zero Silent Failures):** Invalid rosters are never published silently; publishing is locked until critical gaps are resolved."
        )
        return jsonify({
            "reply": reply,
            "action": {"label": "Open Roster Matrix", "url": "/roster"},
            "suggestions": ["How does candidate backup ranking work?", "Explain single vs multi-resource brands", "Show active conflicts"]
        })

    # --- 7. Candidate Backup Ranking Heuristics ---
    if any(k in lower_msg for k in ["backup", "candidate", "ranking", "relief", "reassignment"]):
        reply = (
            "### 🎯 Algorithmic Candidate Ranking Formula\n\n"
            "When an unstaffed shift or leave creates a coverage gap, the recommendation engine scans all 30+ specialists across pods. "
            "Eligible candidates (not on approved leave and not scheduled to work on that date) are scored using:\n\n"
            "$$\\text{Suitability Score} = 10\\text{ (Base)} + 50 \\times \\text{IsSamePod} + 25 \\times \\text{MatchingSkillsCount}$$\n\n"
            "* **+50 pts** for belonging to the same operational pod (under the same Pod Lead for operational continuity).\n"
            "* **+25 pts** per matching process skill (e.g., Customer Support certification).\n"
            "* Ranked candidates are presented in the **Conflict Center** and **Change Management** for instant one-click reassignment."
        )
        return jsonify({
            "reply": reply,
            "action": {"label": "Test in Change Simulator", "url": "/change-workflow"},
            "suggestions": ["Explain single vs multi-resource brands", "Who is Rahul Verma?", "Show active conflicts"]
        })

    # --- 8. Single-Resource vs Multi-Employee Brands ---
    if any(k in lower_msg for k in ["single-resource", "single resource", "multi-employee", "80%", "20%", "asymmetrical"]):
        reply = (
            "### 🏢 Single-Resource vs Multi-Employee Brands\n\n"
            "* **~80% Single-Resource Brands (e.g., EcoGlow Skincare with Rahul Verma):**\n"
            "  * One dedicated specialist owns every process (CS, ACC, NDR, Retention) as an integrated daily shift.\n"
            "  * **Fragility:** If that specialist takes unplanned leave on a required working day, the entire brand suffers a critical coverage gap across all processes.\n"
            "  * **Resolution:** The relief specialist assigned takes over the entire brand shift for that day.\n\n"
            "* **~20% Multi-Employee Brands (e.g., VoltTech Mobile & Gadgets):**\n"
            "  * Staffed with multiple specialists handling separate processes (Priya on CS, Amit on ACC, Sneha on NDR).\n"
            "  * **Process Isolation:** An absence by Amit only impacts ACC while CS continues running uninterrupted."
        )
        return jsonify({
            "reply": reply,
            "action": {"label": "Open Brand Accounts", "url": "/brands"},
            "suggestions": ["Who manages EcoGlow Skincare?", "How does backup ranking work?", "What is the tech stack?"]
        })

    # --- 8b. Cross-Brand Allocation ---
    if any(k in lower_msg for k in ["across brands", "multiple brands", "cross-brand", "share process", "across multiple"]):
        reply = (
            "### 🔗 Cross-Brand Resource Allocation (Section 9)\n\n"
            "**Yes, absolutely.** The system fully supports specialists working across multiple distinct brands:\n\n"
            "* **Case 4 (Cross-Brand Specialist):** An employee can be assigned to Brand A for Customer Support (e.g. 50% allocation) and Brand B for Abandoned Cart (50% allocation).\n"
            "* **Double-Booking Protection (Rule 2):** The scheduling engine actively tracks daily capacity. An employee cannot be scheduled to exceed 100% total allocation across brands on the same calendar day.\n"
            "* **Collision Tracking (Rule 7):** If a specialist is allocated to two conflicting operating calendars (e.g., Brand A operates on Sunday while Brand B does not), the engine checks for shift collisions and logs conflicts if overlapping hours occur."
        )
        return jsonify({
            "reply": reply,
            "action": {"label": "Open Assignments Matrix", "url": "/assignments"},
            "suggestions": ["Explain the 10 scheduling rules", "Who manages EcoGlow Skincare?", "Show active conflicts"]
        })

    # --- 8c. Leave Impact & Absence Handling ---
    if any(k in lower_msg for k in ["leave impact", "takes leave", "someone takes leave", "what happens if", "emergency leave"]):
        reply = (
            "### 🏖️ Operational Impact of Leave Requests\n\n"
            "Under the system's deterministic engine:\n\n"
            "1. **Single-Resource Brands (~80%):** Because one specialist handles all brand processes (CS, ACC, NDR), an approved leave immediately creates a **CRITICAL coverage gap** across the entire brand.\n"
            "2. **Multi-Employee Brands (~20%):** An absence by one specialist only flags a gap on their specific process (e.g., Amit on leave only impacts ACC, while Priya maintains 100% CS coverage).\n"
            "3. **Relief Reassignment:** The system alerts managers in the **Conflict Center** and scores candidate backups from the same operational pod for immediate relief assignment."
        )
        return jsonify({
            "reply": reply,
            "action": {"label": "Try Change Management Simulator", "url": "/change-workflow"},
            "suggestions": ["Who is Rahul Verma?", "How does candidate backup ranking work?", "What is EcoGlow's calendar?"]
        })

    # --- 9. Tech Stack & Architecture ---
    if any(k in lower_msg for k in ["tech stack", "technology", "architecture", "database", "python", "react"]):
        reply = (
            "### 💻 System Technology Stack & Architecture\n\n"
            "* **Frontend:** React 18, Vite, Bootstrap 5, Custom CSS, Lucide React icons, Recharts.\n"
            "* **Backend:** Python 3.13, Flask 3.1 REST API, Flask-CORS, python-dotenv.\n"
            "* **Database:** MongoDB Atlas / PyMongo with 11 normalized collections and ObjectId references.\n"
            "* **Testing:** 18 automated unit tests (10 scheduling constraint tests + 8 API tests) with 100% pass rate.\n"
            "* **Deployment:** Render Static Site (Frontend) + Render Web Service (Backend) via `render.yaml`."
        )
        return jsonify({
            "reply": reply,
            "action": {"label": "View Reports & Analytics", "url": "/reports"},
            "suggestions": ["Explain the 10 scheduling rules", "What is June 2026 coverage?", "Show active conflicts"]
        })

    # --- 10. General / Open-ended Fallback ---
    # Smart overview answering anything else
    total_emps = db[EMPLOYEES_COL].count_documents({})
    total_brands = db[BRANDS_COL].count_documents({})
    conflicts_count = db[CONFLICTS_COL].count_documents({"resolution_status": "UNRESOLVED"})
    
    reply = (
        f"### 🤖 DataStraw Ops Copilot\n\n"
        f"I can answer any operational, scheduling, workforce, or architectural question regarding DataStraw's operations:\n\n"
        f"* **Workforce Status:** {total_emps} active specialists across 4 operational pods.\n"
        f"* **Client Coverage:** {total_brands} brands monitored under 3 operating calendar models.\n"
        f"* **Current Unresolved Gaps:** {conflicts_count} conflict(s).\n\n"
        f"You can ask me questions like:\n"
        f"* *\"Who is Rahul Verma?\"* or *\"Show specialists in Alpha Pod\"*\n"
        f"* *\"What is EcoGlow's calendar?\"* or *\"List single-resource brands\"*\n"
        f"* *\"What is the coverage for June 2026?\"*\n"
        f"* *\"Why can't I publish an invalid roster?\"*\n"
        f"* *\"Explain how candidate backup ranking works\"*"
    )

    return jsonify({
        "reply": reply,
        "suggestions": [
            "What is the roster coverage for June 2026?",
            "Who manages EcoGlow Skincare?",
            "Explain the 10 scheduling rules",
            "Show active conflicts"
        ]
    })
