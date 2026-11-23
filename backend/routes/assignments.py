from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from models.schemas import (
    ASSIGNMENTS_COL, EMPLOYEES_COL, BRANDS_COL, PROCESSES_COL,
    serialize_doc, to_object_id
)
from scheduler.engine import find_backup_candidates

assignments_bp = Blueprint("assignments", __name__, url_prefix="/api/assignments")

@assignments_bp.route("", methods=["GET"])
def get_assignments():
    db = get_db()
    emp_id = request.args.get("employee_id")
    brand_id = request.args.get("brand_id")
    process_id = request.args.get("process_id")
    status = request.args.get("status")

    query = {}
    if emp_id:
        query["employee_id"] = to_object_id(emp_id)
    if brand_id:
        query["brand_id"] = to_object_id(brand_id)
    if process_id:
        query["process_id"] = to_object_id(process_id)
    if status:
        query["status"] = status

    assignments = list(db[ASSIGNMENTS_COL].find(query))
    employees = {str(e["_id"]): e for e in db[EMPLOYEES_COL].find({})}
    brands = {str(b["_id"]): b for b in db[BRANDS_COL].find({})}
    processes = {str(p["_id"]): p for p in db[PROCESSES_COL].find({})}

    for a in assignments:
        e = employees.get(str(a.get("employee_id", "")), {})
        b = brands.get(str(a.get("brand_id", "")), {})
        p = processes.get(str(a.get("process_id", "")), {})
        a["employee_name"] = e.get("full_name", "Unknown Employee")
        a["employee_code"] = e.get("employee_id", "")
        a["brand_name"] = b.get("name", "Unknown Brand")
        a["process_name"] = p.get("name", "Unknown Process")

    return jsonify({"assignments": serialize_doc(assignments), "total": len(assignments)})

@assignments_bp.route("", methods=["POST"])
def create_assignment():
    db = get_db()
    data = request.get_json(silent=True) or {}

    emp_id = to_object_id(data.get("employee_id"))
    brand_id = to_object_id(data.get("brand_id"))
    process_id = to_object_id(data.get("process_id"))

    # Validation: Employee, Brand, Process must exist
    emp = db[EMPLOYEES_COL].find_one({"_id": emp_id})
    if not emp:
        return jsonify({"error": "Selected employee does not exist"}), 404

    brand = db[BRANDS_COL].find_one({"_id": brand_id})
    if not brand:
        return jsonify({"error": "Selected brand does not exist"}), 404

    proc = db[PROCESSES_COL].find_one({"_id": process_id})
    if not proc:
        return jsonify({"error": "Selected process does not exist"}), 404

    # CRITICAL VALIDATION (Section 9): Ensure the process belongs to the selected brand!
    if str(proc.get("brand_id")) != str(brand_id):
        return jsonify({
            "error": f"Process '{proc['name']}' does not belong to Brand '{brand['name']}'."
        }), 400

    # Check for duplicate active assignment
    existing = db[ASSIGNMENTS_COL].find_one({
        "employee_id": emp_id,
        "brand_id": brand_id,
        "process_id": process_id,
        "status": "Active"
    })
    if existing:
        return jsonify({"error": "This employee is already actively assigned to this brand and process."}), 409

    new_assignment = {
        "_id": ObjectId(),
        "employee_id": emp_id,
        "brand_id": brand_id,
        "process_id": process_id,
        "effective_start_date": data.get("effective_start_date", datetime.now().strftime("%Y-%m-%d")),
        "effective_end_date": data.get("effective_end_date") or None,
        "status": data.get("status", "Active"),
        "allocation_percentage": int(data.get("allocation_percentage", 100)),
        "is_primary": data.get("is_primary", True),
        "created_at": datetime.now()
    }

    db[ASSIGNMENTS_COL].insert_one(new_assignment)
    return jsonify({"success": True, "assignment": serialize_doc(new_assignment)}), 201

@assignments_bp.route("/<a_id>", methods=["PUT"])
def update_assignment(a_id):
    db = get_db()
    target_id = to_object_id(a_id)
    assign = db[ASSIGNMENTS_COL].find_one({"_id": target_id})
    if not assign:
        return jsonify({"error": "Assignment not found"}), 404

    data = request.get_json(silent=True) or {}
    update_fields = {}
    for f in ["effective_start_date", "effective_end_date", "status", "allocation_percentage", "is_primary"]:
        if f in data:
            update_fields[f] = data[f]

    if "employee_id" in data:
        update_fields["employee_id"] = to_object_id(data["employee_id"])

    update_fields["updated_at"] = datetime.now()
    db[ASSIGNMENTS_COL].update_one({"_id": assign["_id"]}, {"$set": update_fields})
    updated = db[ASSIGNMENTS_COL].find_one({"_id": assign["_id"]})
    return jsonify({"success": True, "assignment": serialize_doc(updated)})

@assignments_bp.route("/<a_id>", methods=["DELETE"])
def delete_assignment(a_id):
    db = get_db()
    target_id = to_object_id(a_id)
    assign = db[ASSIGNMENTS_COL].find_one({"_id": target_id})
    if not assign:
        return jsonify({"error": "Assignment not found"}), 404

    db[ASSIGNMENTS_COL].delete_one({"_id": assign["_id"]})
    return jsonify({"success": True, "message": "Assignment removed successfully."})

@assignments_bp.route("/backup-recommendations", methods=["GET"])
def get_backups():
    db = get_db()
    date_str = request.args.get("date", datetime.now().strftime("%Y-%m-%d"))
    brand_id = request.args.get("brand_id")
    process_id = request.args.get("process_id")

    brand = db[BRANDS_COL].find_one({"_id": to_object_id(brand_id)}) if brand_id else None
    proc = db[PROCESSES_COL].find_one({"_id": to_object_id(process_id)}) if process_id else None

    candidates = find_backup_candidates(
        db, date_str, process_id, brand_id,
        required_skills=[proc["name"]] if proc else None,
        target_pod_id=brand.get("pod_id") if brand else None
    )
    return jsonify({"date": date_str, "candidates": serialize_doc(candidates)})
