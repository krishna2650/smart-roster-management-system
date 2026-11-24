from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from models.schemas import (
    CONFLICTS_COL, ROSTERS_COL, BRANDS_COL, PROCESSES_COL,
    serialize_doc, to_object_id
)
from scheduler.engine import find_backup_candidates, RosterEngine

conflicts_bp = Blueprint("conflicts", __name__, url_prefix="/api/conflicts")

@conflicts_bp.route("", methods=["GET"])
def get_conflicts():
    db = get_db()
    severity = request.args.get("severity")
    brand_id = request.args.get("brand_id")
    process_id = request.args.get("process_id")
    status = request.args.get("status")
    date_filter = request.args.get("date")
    roster_id = request.args.get("roster_id")
    month = request.args.get("month")
    year = request.args.get("year")

    query = {}
    if severity:
        query["severity"] = severity.upper()
    if brand_id:
        query["brand_id"] = to_object_id(brand_id)
    if process_id:
        query["process_id"] = to_object_id(process_id)
    if status:
        query["resolution_status"] = status.upper()
    if date_filter:
        query["date"] = date_filter
    if roster_id:
        query["roster_id"] = to_object_id(roster_id)
    if month and year:
        query["date"] = {"$regex": f"^{year}-{int(month):02d}-"}
    elif month:
        query["date"] = {"$regex": f"-{int(month):02d}-"}

    conflicts = list(db[CONFLICTS_COL].find(query).sort("date", 1))

    # Summary counts
    total = len(conflicts)
    if status == "RESOLVED":
        critical_count = len([c for c in conflicts if c.get("severity") == "CRITICAL"])
    else:
        critical_count = len([c for c in conflicts if c.get("severity") == "CRITICAL" and c.get("resolution_status", "UNRESOLVED") == "UNRESOLVED"])

    unresolved_count = len([c for c in conflicts if c.get("resolution_status", "UNRESOLVED") == "UNRESOLVED"])

    # Base query for scope (e.g. Month/Year scope if specified)
    scope_query = {}
    if month and year:
        scope_query["date"] = {"$regex": f"^{year}-{int(month):02d}-"}
    elif month:
        scope_query["date"] = {"$regex": f"-{int(month):02d}-"}
    elif roster_id:
        scope_query["roster_id"] = to_object_id(roster_id)

    global_total = db[CONFLICTS_COL].count_documents(scope_query)
    global_unresolved = db[CONFLICTS_COL].count_documents({**scope_query, "resolution_status": "UNRESOLVED"})
    global_critical_unresolved = db[CONFLICTS_COL].count_documents({**scope_query, "severity": "CRITICAL", "resolution_status": "UNRESOLVED"})
    global_resolved = db[CONFLICTS_COL].count_documents({**scope_query, "resolution_status": "RESOLVED"})

    return jsonify({
        "conflicts": serialize_doc(conflicts),
        "total": total,
        "critical_count": critical_count,
        "unresolved_count": unresolved_count,
        "global_total": global_total,
        "global_unresolved": global_unresolved,
        "global_critical_unresolved": global_critical_unresolved,
        "global_resolved": global_resolved
    })

@conflicts_bp.route("/<c_id>/backups", methods=["GET"])
def get_conflict_backups(c_id):
    db = get_db()
    target_id = to_object_id(c_id)
    conflict = db[CONFLICTS_COL].find_one({"$or": [{"_id": target_id}, {"conflict_id": c_id}]})
    if not conflict:
        return jsonify({"error": "Conflict not found"}), 404

    brand = db[BRANDS_COL].find_one({"_id": conflict.get("brand_id")}) if conflict.get("brand_id") else None
    proc = db[PROCESSES_COL].find_one({"_id": conflict.get("process_id")}) if conflict.get("process_id") else None

    candidates = find_backup_candidates(
        db,
        date_str=conflict["date"],
        process_id=str(conflict.get("process_id", "")),
        brand_id=str(conflict.get("brand_id", "")),
        required_skills=[proc["name"]] if proc else None,
        target_pod_id=brand.get("pod_id") if brand else None
    )

    return jsonify({
        "conflict": serialize_doc(conflict),
        "backup_candidates": serialize_doc(candidates)
    })

@conflicts_bp.route("/<c_id>/resolve", methods=["PUT"])
def resolve_conflict(c_id):
    """
    Section 14: Allow managers to mark conflicts resolved after fixing
    the underlying issue and rerunning validation.
    """
    db = get_db()
    target_id = to_object_id(c_id)
    conflict = db[CONFLICTS_COL].find_one({"$or": [{"_id": target_id}, {"conflict_id": c_id}]})
    if not conflict:
        return jsonify({"error": "Conflict not found"}), 404

    data = request.get_json(silent=True) or {}
    notes = data.get("notes", "Resolution verified by operations manager")

    db[CONFLICTS_COL].update_one({"_id": conflict["_id"]}, {
        "$set": {
            "resolution_status": "RESOLVED",
            "resolution_notes": notes,
            "resolved_at": datetime.now()
        }
    })

    # Trigger revalidation of roster
    if conflict.get("roster_id"):
        engine = RosterEngine(db)
        engine.validate_roster(conflict["roster_id"])

    updated = db[CONFLICTS_COL].find_one({"_id": conflict["_id"]})
    return jsonify({"success": True, "conflict": serialize_doc(updated)})
