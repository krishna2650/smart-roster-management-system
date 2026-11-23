from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from models.schemas import (
    PROCESSES_COL, BRANDS_COL, ASSIGNMENTS_COL,
    serialize_doc, to_object_id, validate_process_payload
)

processes_bp = Blueprint("processes", __name__, url_prefix="/api/processes")

@processes_bp.route("", methods=["GET"])
def get_processes():
    db = get_db()
    brand_id = request.args.get("brand_id")
    query = {}
    if brand_id:
        query["brand_id"] = to_object_id(brand_id)

    processes = list(db[PROCESSES_COL].find(query))
    brands = {str(b["_id"]): b["name"] for b in db[BRANDS_COL].find({})}
    for p in processes:
        p["brand_name"] = brands.get(str(p.get("brand_id", "")), "Unknown Brand")

    return jsonify({"processes": serialize_doc(processes), "total": len(processes)})

@processes_bp.route("/<p_id>", methods=["GET"])
def get_process(p_id):
    db = get_db()
    target_id = to_object_id(p_id)
    proc = db[PROCESSES_COL].find_one({"$or": [{"_id": target_id}, {"process_id": p_id}]})
    if not proc:
        return jsonify({"error": "Process not found"}), 404

    brand = db[BRANDS_COL].find_one({"_id": to_object_id(proc.get("brand_id"))})
    proc_data = serialize_doc(proc)
    proc_data["brand_name"] = brand["name"] if brand else "Unknown Brand"
    return jsonify({"process": proc_data})

@processes_bp.route("", methods=["POST"])
def create_process():
    db = get_db()
    data = request.get_json(silent=True) or {}
    errors = validate_process_payload(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    process_id = data.get("process_id").strip()
    if db[PROCESSES_COL].find_one({"process_id": process_id}):
        return jsonify({"error": f"Process ID '{process_id}' already exists"}), 409

    brand_id = to_object_id(data.get("brand_id"))
    brand = db[BRANDS_COL].find_one({"_id": brand_id})
    if not brand:
        return jsonify({"error": "Specified brand does not exist"}), 404

    new_proc = {
        "_id": ObjectId(),
        "process_id": process_id,
        "name": data.get("name").strip(),
        "description": data.get("description", "").strip(),
        "brand_id": brand_id,
        "operating_calendar": data.get("operating_calendar", "INHERIT_BRAND"),
        "min_employees": int(data.get("min_employees", 1)),
        "max_staffing": int(data.get("max_staffing", 2)) if data.get("max_staffing") else None,
        "working_day_rules": data.get("working_day_rules", {}),
        "is_active": data.get("is_active", True),
        "created_at": datetime.now()
    }
    db[PROCESSES_COL].insert_one(new_proc)
    return jsonify({"success": True, "process": serialize_doc(new_proc)}), 201

@processes_bp.route("/<p_id>", methods=["PUT"])
def update_process(p_id):
    db = get_db()
    target_id = to_object_id(p_id)
    proc = db[PROCESSES_COL].find_one({"$or": [{"_id": target_id}, {"process_id": p_id}]})
    if not proc:
        return jsonify({"error": "Process not found"}), 404

    data = request.get_json(silent=True) or {}
    update_fields = {}
    for f in ["name", "description", "operating_calendar", "min_employees", "max_staffing", "working_day_rules", "is_active"]:
        if f in data:
            update_fields[f] = data[f]
    if "brand_id" in data:
        update_fields["brand_id"] = to_object_id(data["brand_id"])

    update_fields["updated_at"] = datetime.now()
    db[PROCESSES_COL].update_one({"_id": proc["_id"]}, {"$set": update_fields})
    updated = db[PROCESSES_COL].find_one({"_id": proc["_id"]})
    return jsonify({"success": True, "process": serialize_doc(updated)})

@processes_bp.route("/<p_id>", methods=["DELETE"])
def delete_process(p_id):
    db = get_db()
    target_id = to_object_id(p_id)
    proc = db[PROCESSES_COL].find_one({"$or": [{"_id": target_id}, {"process_id": p_id}]})
    if not proc:
        return jsonify({"error": "Process not found"}), 404

    active_assignments = db[ASSIGNMENTS_COL].count_documents({"process_id": proc["_id"], "status": "Active"})
    if active_assignments > 0:
        return jsonify({"error": "Cannot delete process with active employee assignments"}), 400

    db[PROCESSES_COL].delete_one({"_id": proc["_id"]})
    return jsonify({"success": True, "message": f"Process {proc['name']} deleted successfully."})
