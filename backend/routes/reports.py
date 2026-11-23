import io
import csv
from datetime import datetime
from flask import Blueprint, request, jsonify, Response
from bson import ObjectId
from database import get_db
from models.schemas import (
    ROSTERS_COL, CONFLICTS_COL, EMPLOYEES_COL, BRANDS_COL,
    PROCESSES_COL, AVAILABILITY_COL, serialize_doc, to_object_id
)

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

@reports_bp.route("/summary", methods=["GET"])
def get_reports_summary():
    db = get_db()
    roster_id = request.args.get("roster_id")
    query = {"roster_id": roster_id} if roster_id else {}
    roster = db[ROSTERS_COL].find_one(query) or db[ROSTERS_COL].find_one({})

    if not roster:
        return jsonify({"error": "No roster available"}), 404

    conflicts = list(db[CONFLICTS_COL].find({"roster_id": roster["_id"]}))
    leaves = list(db[AVAILABILITY_COL].find({}))

    # Brand-wise coverage calculation
    entries = roster.get("entries", [])
    brands = list(db[BRANDS_COL].find({}))
    brand_stats = []
    for b in brands:
        b_name = b["name"]
        b_entries = [e for e in entries if e.get("brand_name") == b_name and e.get("status") in ["WORKING", "COVERAGE_GAP"]]
        total_shifts = len(b_entries)
        covered_shifts = len([e for e in b_entries if e.get("status") == "WORKING"])
        gaps = len([e for e in b_entries if e.get("status") == "COVERAGE_GAP"])
        pct = round((covered_shifts / total_shifts * 100), 1) if total_shifts > 0 else 100.0
        brand_stats.append({
            "brand_id": str(b["_id"]),
            "brand_name": b_name,
            "operating_calendar": b.get("operating_calendar"),
            "total_shifts_required": total_shifts,
            "covered_shifts": covered_shifts,
            "gaps": gaps,
            "coverage_percentage": pct
        })

    return jsonify({
        "roster_id": roster.get("roster_id"),
        "coverage_summary": roster.get("coverage_summary"),
        "brand_coverage": brand_stats,
        "total_conflicts": len(conflicts),
        "total_leaves": len(leaves)
    })

@reports_bp.route("/export-csv", methods=["GET"])
def export_csv():
    db = get_db()
    roster_id = request.args.get("roster_id")
    export_type = request.args.get("type", "company") # company, conflicts, leaves, brand

    query = {"roster_id": roster_id} if roster_id else {}
    roster = db[ROSTERS_COL].find_one(query) or db[ROSTERS_COL].find_one({})
    if not roster:
        return jsonify({"error": "Roster not found"}), 404

    output = io.StringIO()
    writer = csv.writer(output)

    if export_type == "conflicts":
        conflicts = list(db[CONFLICTS_COL].find({"roster_id": roster["_id"]}))
        writer.writerow(["Conflict ID", "Date", "Severity", "Brand", "Process", "Employee", "Type", "Explanation", "Suggested Resolution", "Status"])
        for c in conflicts:
            writer.writerow([
                c.get("conflict_id", ""),
                c.get("date", ""),
                c.get("severity", ""),
                c.get("brand_name", ""),
                c.get("process_name", ""),
                c.get("employee_name", ""),
                c.get("conflict_type", ""),
                c.get("explanation", ""),
                c.get("suggested_resolution", ""),
                c.get("resolution_status", "")
            ])
        filename = f"conflicts-{roster.get('roster_id', 'export')}.csv"

    elif export_type == "leaves":
        leaves = list(db[AVAILABILITY_COL].find({}))
        employees = {str(e["_id"]): e["full_name"] for e in db[EMPLOYEES_COL].find({})}
        writer.writerow(["Employee", "Start Date", "End Date", "Leave Type", "Status", "Reason", "Approval Date"])
        for l in leaves:
            writer.writerow([
                employees.get(str(l.get("employee_id")), "Unknown"),
                l.get("start_date", ""),
                l.get("end_date", ""),
                l.get("type", ""),
                l.get("status", ""),
                l.get("reason", ""),
                l.get("approval_date", "")
            ])
        filename = f"leaves-summary-{roster.get('roster_id', 'export')}.csv"

    else:
        # Default: Full monthly company roster schedule
        entries = roster.get("entries", [])
        writer.writerow(["Date", "Brand", "Process", "Employee Assigned", "Status", "Notes"])
        for e in entries:
            writer.writerow([
                e.get("date", ""),
                e.get("brand_name", ""),
                e.get("process_name", ""),
                e.get("employee_name", "UNASSIGNED"),
                e.get("status", ""),
                e.get("notes", "")
            ])
        filename = f"roster-schedule-{roster.get('roster_id', 'export')}.csv"

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )
