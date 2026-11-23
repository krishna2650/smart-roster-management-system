from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from models.schemas import (
    BRANDS_COL, PROCESSES_COL, ASSIGNMENTS_COL, PODS_COL,
    serialize_doc, to_object_id, validate_brand_payload
)

brands_bp = Blueprint("brands", __name__, url_prefix="/api/brands")

@brands_bp.route("", methods=["GET"])
def get_brands():
    db = get_db()
    brands = list(db[BRANDS_COL].find({}))
    pods = {str(p["_id"]): p["name"] for p in db[PODS_COL].find({})}
    procs = list(db[PROCESSES_COL].find({"is_active": True}))

    # Count active processes and assigned pod name per brand
    for b in brands:
        b_id_str = str(b["_id"])
        b["pod_name"] = pods.get(str(b.get("pod_id", "")), "Unassigned Pod")
        b["processes_count"] = len([p for p in procs if str(p.get("brand_id")) == b_id_str])

    return jsonify({"brands": serialize_doc(brands), "total": len(brands)})

@brands_bp.route("/<b_id>", methods=["GET"])
def get_brand(b_id):
    db = get_db()
    target_id = to_object_id(b_id)
    brand = db[BRANDS_COL].find_one({"$or": [{"_id": target_id}, {"brand_id": b_id}]})
    if not brand:
        return jsonify({"error": "Brand not found"}), 404

    # Fetch processes for this brand
    processes = list(db[PROCESSES_COL].find({"brand_id": brand["_id"]}))
    
    # Fetch assigned employees for this brand
    assignments = list(db[ASSIGNMENTS_COL].find({"brand_id": brand["_id"], "status": "Active"}))
    
    brand_data = serialize_doc(brand)
    brand_data["processes"] = serialize_doc(processes)
    brand_data["assignments"] = serialize_doc(assignments)
    return jsonify({"brand": brand_data})

@brands_bp.route("", methods=["POST"])
def create_brand():
    db = get_db()
    data = request.get_json() or {}
    errors = validate_brand_payload(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    brand_id = data.get("brand_id").strip()
    if db[BRANDS_COL].find_one({"brand_id": brand_id}):
        return jsonify({"error": f"Brand ID '{brand_id}' already exists"}), 409

    new_brand = {
        "_id": ObjectId(),
        "brand_id": brand_id,
        "name": data.get("name").strip(),
        "description": data.get("description", "").strip(),
        "client_status": data.get("client_status", "Active"),
        "pod_id": to_object_id(data.get("pod_id")),
        "operating_calendar": data.get("operating_calendar", "365_DAYS"),
        "public_holiday_policy": data.get("public_holiday_policy", "WORK_ON_HOLIDAYS"),
        "minimum_coverage_requirements": int(data.get("minimum_coverage_requirements", 1)),
        "is_active": data.get("is_active", True),
        "created_at": datetime.now()
    }
    db[BRANDS_COL].insert_one(new_brand)
    return jsonify({"success": True, "brand": serialize_doc(new_brand)}), 201

@brands_bp.route("/<b_id>", methods=["PUT"])
def update_brand(b_id):
    db = get_db()
    target_id = to_object_id(b_id)
    brand = db[BRANDS_COL].find_one({"$or": [{"_id": target_id}, {"brand_id": b_id}]})
    if not brand:
        return jsonify({"error": "Brand not found"}), 404

    data = request.get_json() or {}
    update_fields = {}
    for f in ["name", "description", "client_status", "operating_calendar",
              "public_holiday_policy", "minimum_coverage_requirements", "is_active"]:
        if f in data:
            update_fields[f] = data[f]
    if "pod_id" in data:
        update_fields["pod_id"] = to_object_id(data["pod_id"])

    update_fields["updated_at"] = datetime.now()
    db[BRANDS_COL].update_one({"_id": brand["_id"]}, {"$set": update_fields})
    updated = db[BRANDS_COL].find_one({"_id": brand["_id"]})
    return jsonify({"success": True, "brand": serialize_doc(updated)})

@brands_bp.route("/<b_id>", methods=["DELETE"])
def delete_brand(b_id):
    db = get_db()
    target_id = to_object_id(b_id)
    brand = db[BRANDS_COL].find_one({"$or": [{"_id": target_id}, {"brand_id": b_id}]})
    if not brand:
        return jsonify({"error": "Brand not found"}), 404

    # Check active assignments
    active_assignments = db[ASSIGNMENTS_COL].count_documents({"brand_id": brand["_id"], "status": "Active"})
    if active_assignments > 0:
        return jsonify({"error": "Cannot delete brand with active employee assignments"}), 400

    db[BRANDS_COL].delete_one({"_id": brand["_id"]})
    return jsonify({"success": True, "message": f"Brand {brand['name']} deleted successfully."})
