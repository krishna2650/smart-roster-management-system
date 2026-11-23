from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from models.schemas import (
    EMPLOYEES_COL, ASSIGNMENTS_COL, BRANDS_COL, PROCESSES_COL,
    AVAILABILITY_COL, PODS_COL, serialize_doc, to_object_id,
    validate_employee_payload
)

employees_bp = Blueprint("employees", __name__, url_prefix="/api/employees")

@employees_bp.route("", methods=["GET"])
def get_employees():
    db = get_db()
    pod_id = request.args.get("pod_id")
    status = request.args.get("status")
    search = request.args.get("search", "").strip()

    query = {}
    if pod_id:
        query["pod_id"] = to_object_id(pod_id)
    if status:
        if status.lower() == "active":
            query["is_active"] = True
        elif status.lower() == "inactive":
            query["is_active"] = False

    employees = list(db[EMPLOYEES_COL].find(query))

    if search:
        search_lower = search.lower()
        employees = [
            e for e in employees
            if search_lower in e.get("full_name", "").lower()
            or search_lower in e.get("employee_id", "").lower()
            or search_lower in e.get("email", "").lower()
            or search_lower in e.get("designation", "").lower()
        ]

    # Populate pod info
    pods = {str(p["_id"]): p["name"] for p in db[PODS_COL].find({})}
    for e in employees:
        p_id = str(e.get("pod_id", ""))
        e["pod_name"] = pods.get(p_id, "Unassigned Pod")

    return jsonify({"employees": serialize_doc(employees), "total": len(employees)})

@employees_bp.route("/<emp_id>", methods=["GET"])
def get_employee_details(emp_id):
    db = get_db()
    target_id = to_object_id(emp_id)
    emp = db[EMPLOYEES_COL].find_one({"$or": [{"_id": target_id}, {"employee_id": emp_id}]})
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    # Fetch assigned pod
    pod = None
    if emp.get("pod_id"):
        pod = db[PODS_COL].find_one({"_id": to_object_id(emp["pod_id"])})

    # Fetch active assignments with populated brand and process names
    assignments = list(db[ASSIGNMENTS_COL].find({"employee_id": emp["_id"]}))
    brands = {str(b["_id"]): b for b in db[BRANDS_COL].find({})}
    procs = {str(p["_id"]): p for p in db[PROCESSES_COL].find({})}

    for a in assignments:
        b_id = str(a.get("brand_id", ""))
        p_id = str(a.get("process_id", ""))
        a["brand_name"] = brands.get(b_id, {}).get("name", "Unknown Brand")
        a["process_name"] = procs.get(p_id, {}).get("name", "Unknown Process")

    # Fetch leaves & availability
    availability = list(db[AVAILABILITY_COL].find({"employee_id": emp["_id"]}))

    emp_data = serialize_doc(emp)
    emp_data["pod_name"] = pod.get("name", "Unassigned") if pod else "Unassigned"
    emp_data["assignments"] = serialize_doc(assignments)
    emp_data["availability"] = serialize_doc(availability)

    return jsonify({"employee": emp_data})

@employees_bp.route("", methods=["POST"])
def create_employee():
    db = get_db()
    data = request.get_json() or {}
    errors = validate_employee_payload(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    emp_id = data.get("employee_id").strip()
    email = data.get("email").strip().lower()

    # Prevent duplicate employee ID and email
    if db[EMPLOYEES_COL].find_one({"employee_id": emp_id}):
        return jsonify({"error": f"Employee ID '{emp_id}' is already registered."}), 409
    if db[EMPLOYEES_COL].find_one({"email": email}):
        return jsonify({"error": f"Email '{email}' is already registered."}), 409

    new_emp = {
        "_id": ObjectId(),
        "employee_id": emp_id,
        "full_name": data.get("full_name").strip(),
        "email": email,
        "phone": data.get("phone", "").strip(),
        "designation": data.get("designation", "Operations Associate").strip(),
        "pod_id": to_object_id(data.get("pod_id")),
        "role": data.get("role", "OPERATIONS_ASSOCIATE"),
        "employment_status": data.get("employment_status", "Full-time"),
        "date_of_joining": data.get("date_of_joining", datetime.now().strftime("%Y-%m-%d")),
        "skills": data.get("skills", ["Customer Support"]),
        "preferred_weekly_off": data.get("preferred_weekly_off", ["Sunday"]),
        "is_active": data.get("is_active", True),
        "created_at": datetime.now()
    }

    db[EMPLOYEES_COL].insert_one(new_emp)
    return jsonify({"success": True, "employee": serialize_doc(new_emp)}), 201

@employees_bp.route("/<emp_id>", methods=["PUT"])
def update_employee(emp_id):
    db = get_db()
    target_id = to_object_id(emp_id)
    emp = db[EMPLOYEES_COL].find_one({"$or": [{"_id": target_id}, {"employee_id": emp_id}]})
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    data = request.get_json() or {}
    update_fields = {}

    for field in ["full_name", "phone", "designation", "role", "employment_status",
                  "date_of_joining", "skills", "preferred_weekly_off", "is_active"]:
        if field in data:
            update_fields[field] = data[field]

    if "pod_id" in data:
        update_fields["pod_id"] = to_object_id(data["pod_id"])

    if "email" in data:
        email = data["email"].strip().lower()
        conflict = db[EMPLOYEES_COL].find_one({"email": email, "_id": {"$ne": emp["_id"]}})
        if conflict:
            return jsonify({"error": "Another employee already has this email address"}), 409
        update_fields["email"] = email

    update_fields["updated_at"] = datetime.now()
    db[EMPLOYEES_COL].update_one({"_id": emp["_id"]}, {"$set": update_fields})

    updated = db[EMPLOYEES_COL].find_one({"_id": emp["_id"]})
    return jsonify({"success": True, "employee": serialize_doc(updated)})

@employees_bp.route("/<emp_id>", methods=["DELETE"])
def delete_employee(emp_id):
    db = get_db()
    target_id = to_object_id(emp_id)
    emp = db[EMPLOYEES_COL].find_one({"$or": [{"_id": target_id}, {"employee_id": emp_id}]})
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    # Section 5 requirement: Delete employee with assignment checks
    active_assignments = list(db[ASSIGNMENTS_COL].find({
        "employee_id": emp["_id"],
        "status": "Active"
    }))
    if active_assignments:
        return jsonify({
            "error": "Cannot delete employee with active assignments. Please reassign or deactivate their assignments first.",
            "active_assignments_count": len(active_assignments)
        }), 400

    db[EMPLOYEES_COL].delete_one({"_id": emp["_id"]})
    return jsonify({"success": True, "message": f"Employee {emp['full_name']} deleted successfully."})
