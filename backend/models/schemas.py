from datetime import datetime
from bson import ObjectId

EMPLOYEES_COL = "employees"
BRANDS_COL = "brands"
PROCESSES_COL = "processes"
PODS_COL = "pods"
ASSIGNMENTS_COL = "assignments"
AVAILABILITY_COL = "availability"
HOLIDAYS_COL = "holidays"
ROSTERS_COL = "rosters"
CONFLICTS_COL = "conflicts"
AUDIT_LOGS_COL = "audit_logs"
USERS_COL = "users"

def to_object_id(val):
    if not val:
        return None
    if isinstance(val, ObjectId):
        return val
    try:
        return ObjectId(str(val))
    except Exception:
        return str(val)

def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                result[k] = str(v)
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            elif isinstance(v, dict):
                result[k] = serialize_doc(v)
            elif isinstance(v, list):
                result[k] = [serialize_doc(i) for i in v]
            else:
                result[k] = v
        return result
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc

def validate_employee_payload(data, is_update=False):
    errors = []
    if not is_update:
        if not data.get("employee_id"):
            errors.append("Employee ID is required.")
        if not data.get("full_name"):
            errors.append("Full name is required.")
        if not data.get("email"):
            errors.append("Email is required.")
    return errors

def validate_brand_payload(data, is_update=False):
    errors = []
    if not is_update:
        if not data.get("brand_id"):
            errors.append("Brand ID is required.")
        if not data.get("name"):
            errors.append("Brand name is required.")
        if not data.get("operating_calendar"):
            errors.append("Operating calendar is required.")
    return errors

def validate_process_payload(data, is_update=False):
    errors = []
    if not is_update:
        if not data.get("process_id"):
            errors.append("Process ID is required.")
        if not data.get("name"):
            errors.append("Process name is required.")
        if not data.get("brand_id"):
            errors.append("Brand reference is required.")
    return errors
