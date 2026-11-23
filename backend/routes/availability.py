from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from models.schemas import (
    AVAILABILITY_COL, EMPLOYEES_COL, serialize_doc, to_object_id
)

availability_bp = Blueprint("availability", __name__, url_prefix="/api/availability")

@availability_bp.route("", methods=["GET"])
def get_availability():
    db = get_db()
    emp_id = request.args.get("employee_id")
    status = request.args.get("status")
    type_filter = request.args.get("type")

    query = {}
    if emp_id:
        query["employee_id"] = to_object_id(emp_id)
    if status:
        query["status"] = status.upper()
    if type_filter:
        query["type"] = type_filter.upper()

    records = list(db[AVAILABILITY_COL].find(query).sort("start_date", -1))
    employees = {str(e["_id"]): e for e in db[EMPLOYEES_COL].find({})}

    for r in records:
        e = employees.get(str(r.get("employee_id", "")), {})
        r["employee_name"] = e.get("full_name", "Unknown Employee")
        r["employee_code"] = e.get("employee_id", "")
        r["designation"] = e.get("designation", "")

    return jsonify({"records": serialize_doc(records), "total": len(records)})

@availability_bp.route("", methods=["POST"])
def create_availability():
    db = get_db()
    data = request.get_json() or {}

    emp_id = to_object_id(data.get("employee_id"))
    emp = db[EMPLOYEES_COL].find_one({"_id": emp_id})
    if not emp:
        return jsonify({"error": "Employee does not exist"}), 404

    start_date = data.get("start_date")
    end_date = data.get("end_date") or start_date
    if not start_date:
        return jsonify({"error": "Start date is required"}), 400

    if start_date > end_date:
        return jsonify({"error": "Start date cannot be after end date"}), 400

    # Prevent invalid overlapping leave entries for the same employee
    overlap = db[AVAILABILITY_COL].find_one({
        "employee_id": emp_id,
        "status": {"$in": ["APPROVED", "PENDING"]},
        "start_date": {"$lte": end_date},
        "end_date": {"$gte": start_date}
    })
    if overlap:
        return jsonify({
            "error": f"An existing {overlap.get('status')} leave entry already overlaps with these dates ({overlap.get('start_date')} to {overlap.get('end_date')})."
        }), 409

    record = {
        "_id": ObjectId(),
        "employee_id": emp_id,
        "start_date": start_date,
        "end_date": end_date,
        "type": data.get("type", "CASUAL_LEAVE").upper(),
        "status": data.get("status", "PENDING").upper(),
        "reason": data.get("reason", "").strip(),
        "approved_by": to_object_id(data.get("approved_by")),
        "approval_date": data.get("approval_date") if data.get("status") == "APPROVED" else None,
        "created_at": datetime.now()
    }

    db[AVAILABILITY_COL].insert_one(record)
    return jsonify({"success": True, "record": serialize_doc(record)}), 201

@availability_bp.route("/<rec_id>/approve", methods=["POST"])
def approve_leave(rec_id):
    db = get_db()
    target_id = to_object_id(rec_id)
    rec = db[AVAILABILITY_COL].find_one({"_id": target_id})
    if not rec:
        return jsonify({"error": "Leave record not found"}), 404

    data = request.get_json() or {}
    approved_by = to_object_id(data.get("approved_by"))

    db[AVAILABILITY_COL].update_one({"_id": target_id}, {
        "$set": {
            "status": "APPROVED",
            "approved_by": approved_by,
            "approval_date": datetime.now().strftime("%Y-%m-%d"),
            "updated_at": datetime.now()
        }
    })

    updated = db[AVAILABILITY_COL].find_one({"_id": target_id})
    return jsonify({"success": True, "message": "Leave request approved.", "record": serialize_doc(updated)})

@availability_bp.route("/<rec_id>/reject", methods=["POST"])
def reject_leave(rec_id):
    db = get_db()
    target_id = to_object_id(rec_id)
    rec = db[AVAILABILITY_COL].find_one({"_id": target_id})
    if not rec:
        return jsonify({"error": "Leave record not found"}), 404

    db[AVAILABILITY_COL].update_one({"_id": target_id}, {
        "$set": {
            "status": "REJECTED",
            "updated_at": datetime.now()
        }
    })

    updated = db[AVAILABILITY_COL].find_one({"_id": target_id})
    return jsonify({"success": True, "message": "Leave request rejected.", "record": serialize_doc(updated)})

@availability_bp.route("/<rec_id>", methods=["DELETE"])
def delete_availability(rec_id):
    db = get_db()
    target_id = to_object_id(rec_id)
    rec = db[AVAILABILITY_COL].find_one({"_id": target_id})
    if not rec:
        return jsonify({"error": "Record not found"}), 404

    db[AVAILABILITY_COL].delete_one({"_id": target_id})
    return jsonify({"success": True, "message": "Leave record deleted."})
