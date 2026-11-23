from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from models.schemas import (
    PODS_COL, EMPLOYEES_COL, BRANDS_COL, serialize_doc, to_object_id
)

pods_bp = Blueprint("pods", __name__, url_prefix="/api/pods")

@pods_bp.route("", methods=["GET"])
def get_pods():
    db = get_db()
    pods = list(db[PODS_COL].find({}))
    employees = {str(e["_id"]): e for e in db[EMPLOYEES_COL].find({})}
    brands = {str(b["_id"]): b for b in db[BRANDS_COL].find({})}

    for p in pods:
        lead_id = str(p.get("pod_lead_id", ""))
        p["pod_lead_name"] = employees.get(lead_id, {}).get("full_name", "Unassigned")
        p["assigned_employees_count"] = len([
            e for e in employees.values() if str(e.get("pod_id", "")) == str(p["_id"])
        ])
        p["assigned_brands_count"] = len([
            b for b in brands.values() if str(b.get("pod_id", "")) == str(p["_id"])
        ])

    return jsonify({"pods": serialize_doc(pods), "total": len(pods)})

@pods_bp.route("/<p_id>", methods=["GET"])
def get_pod(p_id):
    db = get_db()
    target_id = to_object_id(p_id)
    pod = db[PODS_COL].find_one({"$or": [{"_id": target_id}, {"pod_id": p_id}]})
    if not pod:
        return jsonify({"error": "Pod not found"}), 404

    lead = db[EMPLOYEES_COL].find_one({"_id": to_object_id(pod.get("pod_lead_id"))})
    members = list(db[EMPLOYEES_COL].find({"pod_id": pod["_id"]}))
    assigned_brands = list(db[BRANDS_COL].find({"pod_id": pod["_id"]}))

    pod_data = serialize_doc(pod)
    pod_data["pod_lead"] = serialize_doc(lead)
    pod_data["members"] = serialize_doc(members)
    pod_data["brands"] = serialize_doc(assigned_brands)
    return jsonify({"pod": pod_data})

@pods_bp.route("", methods=["POST"])
def create_pod():
    db = get_db()
    data = request.get_json(silent=True) or {}
    pod_id = data.get("pod_id", "").strip()
    name = data.get("name", "").strip()

    if not pod_id or not name:
        return jsonify({"error": "Pod ID and Name are required"}), 400

    if db[PODS_COL].find_one({"pod_id": pod_id}):
        return jsonify({"error": f"Pod ID '{pod_id}' already exists"}), 409

    new_pod = {
        "_id": ObjectId(),
        "pod_id": pod_id,
        "name": name,
        "pod_lead_id": to_object_id(data.get("pod_lead_id")),
        "assigned_employees": [to_object_id(e) for e in data.get("assigned_employees", [])],
        "assigned_brands": [to_object_id(b) for b in data.get("assigned_brands", [])],
        "is_active": data.get("is_active", True),
        "created_at": datetime.now()
    }
    db[PODS_COL].insert_one(new_pod)
    return jsonify({"success": True, "pod": serialize_doc(new_pod)}), 201

@pods_bp.route("/<p_id>", methods=["PUT"])
def update_pod(p_id):
    db = get_db()
    target_id = to_object_id(p_id)
    pod = db[PODS_COL].find_one({"$or": [{"_id": target_id}, {"pod_id": p_id}]})
    if not pod:
        return jsonify({"error": "Pod not found"}), 404

    data = request.get_json(silent=True) or {}
    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "pod_lead_id" in data:
        update_fields["pod_lead_id"] = to_object_id(data["pod_lead_id"])
    if "is_active" in data:
        update_fields["is_active"] = data["is_active"]

    update_fields["updated_at"] = datetime.now()
    db[PODS_COL].update_one({"_id": pod["_id"]}, {"$set": update_fields})
    updated = db[PODS_COL].find_one({"_id": pod["_id"]})
    return jsonify({"success": True, "pod": serialize_doc(updated)})

@pods_bp.route("/<p_id>", methods=["DELETE"])
def delete_pod(p_id):
    db = get_db()
    target_id = to_object_id(p_id)
    pod = db[PODS_COL].find_one({"$or": [{"_id": target_id}, {"pod_id": p_id}]})
    if not pod:
        return jsonify({"error": "Pod not found"}), 404

    db[PODS_COL].delete_one({"_id": pod["_id"]})
    return jsonify({"success": True, "message": f"Pod {pod['name']} deleted successfully."})
