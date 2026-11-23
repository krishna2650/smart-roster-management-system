from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from models.schemas import HOLIDAYS_COL, serialize_doc, to_object_id

holidays_bp = Blueprint("holidays", __name__, url_prefix="/api/holidays")

@holidays_bp.route("", methods=["GET"])
def get_holidays():
    db = get_db()
    year = request.args.get("year")
    query = {}
    if year:
        query["date"] = {"$regex": f"^{year}"}

    holidays = list(db[HOLIDAYS_COL].find(query).sort("date", 1))
    return jsonify({"holidays": serialize_doc(holidays), "total": len(holidays)})

@holidays_bp.route("", methods=["POST"])
def create_holiday():
    db = get_db()
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    h_date = data.get("date", "").strip()

    if not name or not h_date:
        return jsonify({"error": "Holiday name and date are required"}), 400

    existing = db[HOLIDAYS_COL].find_one({"date": h_date, "name": name})
    if existing:
        return jsonify({"error": "A holiday with this name and date already exists"}), 409

    new_h = {
        "_id": ObjectId(),
        "name": name,
        "date": h_date,
        "description": data.get("description", "").strip(),
        "location": data.get("location", "National").strip(),
        "is_active": data.get("is_active", True),
        "created_at": datetime.now()
    }
    db[HOLIDAYS_COL].insert_one(new_h)
    return jsonify({"success": True, "holiday": serialize_doc(new_h)}), 201

@holidays_bp.route("/<h_id>", methods=["PUT"])
def update_holiday(h_id):
    db = get_db()
    target_id = to_object_id(h_id)
    h = db[HOLIDAYS_COL].find_one({"_id": target_id})
    if not h:
        return jsonify({"error": "Holiday not found"}), 404

    data = request.get_json() or {}
    update_fields = {}
    for f in ["name", "date", "description", "location", "is_active"]:
        if f in data:
            update_fields[f] = data[f]

    update_fields["updated_at"] = datetime.now()
    db[HOLIDAYS_COL].update_one({"_id": target_id}, {"$set": update_fields})
    updated = db[HOLIDAYS_COL].find_one({"_id": target_id})
    return jsonify({"success": True, "holiday": serialize_doc(updated)})

@holidays_bp.route("/<h_id>", methods=["DELETE"])
def delete_holiday(h_id):
    db = get_db()
    target_id = to_object_id(h_id)
    h = db[HOLIDAYS_COL].find_one({"_id": target_id})
    if not h:
        return jsonify({"error": "Holiday not found"}), 404

    db[HOLIDAYS_COL].delete_one({"_id": target_id})
    return jsonify({"success": True, "message": "Holiday deleted successfully."})
