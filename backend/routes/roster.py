from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from models.schemas import (
    ROSTERS_COL, CONFLICTS_COL, EMPLOYEES_COL, BRANDS_COL,
    PROCESSES_COL, PODS_COL, serialize_doc, to_object_id
)
from scheduler.engine import RosterEngine

roster_bp = Blueprint("roster", __name__, url_prefix="/api/rosters")

@roster_bp.route("/generate", methods=["POST"])
def generate():
    data = request.get_json() or {}
    now = datetime.now()
    year = int(data.get("year", now.year))
    month = int(data.get("month", now.month))

    db = get_db()
    engine = RosterEngine(db)
    result = engine.generate_roster(year=year, month=month)
    return jsonify({"success": True, "result": serialize_doc(result)})

@roster_bp.route("", methods=["GET"])
def get_rosters():
    db = get_db()
    rosters = list(db[ROSTERS_COL].find({}).sort("year", -1))
    # Exclude massive raw entries list in list overview for speed
    summary_list = []
    for r in rosters:
        summary_list.append({
            "_id": str(r["_id"]),
            "roster_id": r.get("roster_id"),
            "year": r.get("year"),
            "month": r.get("month"),
            "status": r.get("status"),
            "coverage_summary": r.get("coverage_summary"),
            "unresolved_conflicts_count": r.get("unresolved_conflicts_count", 0),
            "created_at": r.get("created_at"),
            "published_at": r.get("published_at")
        })
    return jsonify({"rosters": summary_list, "total": len(summary_list)})

@roster_bp.route("/<r_id>", methods=["GET"])
def get_roster_details(r_id):
    db = get_db()
    query = {"roster_id": r_id} if not (len(r_id) == 24 and all(c in "0123456789abcdefABCDEF" for c in r_id)) else {"_id": to_object_id(r_id)}
    roster = db[ROSTERS_COL].find_one(query)
    if not roster:
        return jsonify({"error": "Roster not found"}), 404

    # Format entries and supplementary metadata for various views
    view_mode = request.args.get("view", "company") # company, pod, brand, process, employee
    pod_id_filter = request.args.get("pod_id")
    brand_id_filter = request.args.get("brand_id")
    emp_id_filter = request.args.get("employee_id")

    entries = roster.get("entries", [])
    if pod_id_filter:
        # Filter by employees in this pod
        pod_emps = set(str(e["_id"]) for e in db[EMPLOYEES_COL].find({"pod_id": to_object_id(pod_id_filter)}))
        entries = [e for e in entries if str(e.get("employee_id")) in pod_emps]
    if brand_id_filter:
        entries = [e for e in entries if str(e.get("brand_id")) == str(brand_id_filter)]
    if emp_id_filter:
        entries = [e for e in entries if str(e.get("employee_id")) == str(emp_id_filter)]

    conflicts = list(db[CONFLICTS_COL].find({"roster_id": roster["_id"]}))

    roster_data = serialize_doc(roster)
    roster_data["entries"] = serialize_doc(entries)
    roster_data["conflicts"] = serialize_doc(conflicts)

    return jsonify({"roster": roster_data})

@roster_bp.route("/<r_id>/validate", methods=["POST"])
def validate(r_id):
    db = get_db()
    engine = RosterEngine(db)
    val_result = engine.validate_roster(r_id)
    return jsonify({"success": True, "validation": serialize_doc(val_result)})

@roster_bp.route("/<r_id>/publish", methods=["POST"])
def publish(r_id):
    db = get_db()
    data = request.get_json() or {}
    published_by = data.get("published_by", "Operations Manager")
    engine = RosterEngine(db)
    result = engine.publish_roster(r_id, published_by=published_by)
    if not result.get("success"):
        return jsonify(result), 400
    return jsonify(result)

@roster_bp.route("/<r_id>/entry", methods=["PUT"])
def update_entry(r_id):
    """
    Allows operations manager to manually update an individual entry cell.
    Triggers automatic validation and conflict re-evaluation!
    """
    db = get_db()
    query = {"roster_id": r_id} if not (len(r_id) == 24 and all(c in "0123456789abcdefABCDEF" for c in r_id)) else {"_id": to_object_id(r_id)}
    roster = db[ROSTERS_COL].find_one(query)
    if not roster:
        return jsonify({"error": "Roster not found"}), 404

    data = request.get_json() or {}
    target_date = data.get("date")
    target_proc_id = data.get("process_id")
    new_employee_id = to_object_id(data.get("employee_id"))
    new_status = data.get("status", "WORKING")
    notes = data.get("notes", "Manual adjustment by manager")

    emp = db[EMPLOYEES_COL].find_one({"_id": new_employee_id}) if new_employee_id else None

    # Update or add entry
    entries = roster.get("entries", [])
    updated = False
    for e in entries:
        if e.get("date") == target_date and str(e.get("process_id")) == str(target_proc_id):
            e["employee_id"] = new_employee_id
            e["employee_name"] = emp["full_name"] if emp else "UNASSIGNED"
            e["status"] = new_status
            e["notes"] = notes
            updated = True
            break

    if not updated and target_date and target_proc_id:
        proc = db[PROCESSES_COL].find_one({"_id": to_object_id(target_proc_id)})
        brand = db[BRANDS_COL].find_one({"_id": proc["brand_id"]}) if proc else None
        entries.append({
            "date": target_date,
            "brand_id": proc["brand_id"] if proc else None,
            "brand_name": brand["name"] if brand else "Brand",
            "process_id": to_object_id(target_proc_id),
            "process_name": proc["name"] if proc else "Process",
            "employee_id": new_employee_id,
            "employee_name": emp["full_name"] if emp else "UNASSIGNED",
            "status": new_status,
            "notes": notes
        })

    db[ROSTERS_COL].update_one({"_id": roster["_id"]}, {
        "$set": {"entries": entries, "updated_at": datetime.now()}
    })

    # Section 13: After every manual change, run validation again!
    engine = RosterEngine(db)
    val_report = engine.validate_roster(roster["roster_id"])

    return jsonify({
        "success": True,
        "message": "Entry updated and roster revalidated.",
        "validation": serialize_doc(val_report)
    })

@roster_bp.route("/<r_id>/reassign-backup", methods=["POST"])
def reassign_backup(r_id):
    """
    Demonstrates Section 15 Change Management Workflow:
    Manager selects a date, process, and assigns a backup employee.
    Replaces coverage gap with working backup, resolves corresponding conflict, and revalidates!
    """
    db = get_db()
    query = {"roster_id": r_id} if not (len(r_id) == 24 and all(c in "0123456789abcdefABCDEF" for c in r_id)) else {"_id": to_object_id(r_id)}
    roster = db[ROSTERS_COL].find_one(query)
    if not roster:
        return jsonify({"error": "Roster not found"}), 404

    data = request.get_json() or {}
    target_date = data.get("date")
    process_id = data.get("process_id")
    backup_employee_id = to_object_id(data.get("employee_id"))

    emp = db[EMPLOYEES_COL].find_one({"_id": backup_employee_id})
    if not emp:
        return jsonify({"error": "Backup employee not found"}), 404

    entries = roster.get("entries", [])
    gap_fixed = False
    for e in entries:
        if e.get("date") == target_date and str(e.get("process_id")) == str(process_id) and e.get("status") == "COVERAGE_GAP":
            e["employee_id"] = backup_employee_id
            e["employee_name"] = emp["full_name"]
            e["status"] = "WORKING"
            e["notes"] = f"Relief backup assigned ({emp['full_name']})"
            gap_fixed = True
            break

    if gap_fixed:
        # Update roster coverage count
        summary = roster.get("coverage_summary", {})
        if summary.get("total_gaps", 0) > 0:
            summary["total_gaps"] -= 1
            summary["total_process_days_covered"] += 1
            if summary.get("total_process_days_required", 0) > 0:
                summary["coverage_percentage"] = round(
                    summary["total_process_days_covered"] / summary["total_process_days_required"] * 100, 2
                )

        db[ROSTERS_COL].update_one({"_id": roster["_id"]}, {
            "$set": {
                "entries": entries,
                "coverage_summary": summary,
                "updated_at": datetime.now()
            }
        })

        # Mark conflict as RESOLVED
        db[CONFLICTS_COL].update_one(
            {
                "roster_id": roster["_id"],
                "date": target_date,
                "process_id": to_object_id(process_id)
            },
            {
                "$set": {
                    "resolution_status": "RESOLVED",
                    "resolution_notes": f"Resolved by assigning backup: {emp['full_name']}"
                }
            }
        )

    engine = RosterEngine(db)
    val_report = engine.validate_roster(roster["roster_id"])

    return jsonify({
        "success": True,
        "message": f"Backup employee {emp['full_name']} assigned successfully.",
        "validation": serialize_doc(val_report)
    })
