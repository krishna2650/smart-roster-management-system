import hmac
import hashlib
import json
import base64
import time
from functools import wraps
from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from config import Config
from models.schemas import USERS_COL, serialize_doc, to_object_id

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

SALT = "datastraw_roster_salt_2026"

def hash_pw(pw: str) -> str:
    return hashlib.sha256((SALT + pw).encode('utf-8')).hexdigest()

def generate_token(user_id: str, role: str) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({
        "user_id": str(user_id),
        "role": role,
        "exp": int(time.time()) + 86400 * 7 # 7 days
    }).encode()).decode().rstrip("=")
    signature = hmac.new(
        Config.SECRET_KEY.encode(),
        f"{header}.{payload}".encode(),
        hashlib.sha256
    ).digest()
    sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{header}.{payload}.{sig}"

def decode_token(token: str):
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, payload, sig = parts
        padding = 4 - (len(payload) % 4)
        if padding and padding != 4:
            payload += "=" * padding
        data = json.loads(base64.urlsafe_b64decode(payload).decode())
        if data.get("exp") and data["exp"] < time.time():
            return None
        return data
    except Exception:
        return None

def jwt_required(optional=False):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            token = None
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
            if not token:
                if optional:
                    request.current_user = None
                    return f(*args, **kwargs)
                return jsonify({"error": "Authorization token required"}), 401
            
            payload = decode_token(token)
            if not payload:
                if optional:
                    request.current_user = None
                    return f(*args, **kwargs)
                return jsonify({"error": "Invalid or expired authorization token"}), 401
            
            db = get_db()
            user = db[USERS_COL].find_one({"_id": to_object_id(payload["user_id"])})
            if not user:
                return jsonify({"error": "User no longer exists"}), 401
            
            request.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_db()
    user = db[USERS_COL].find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if user.get("password_hash") != hash_pw(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(str(user["_id"]), user.get("role", "OPERATIONS_MANAGER"))
    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name"),
            "role": user.get("role", "OPERATIONS_MANAGER"),
            "employee_id": str(user.get("employee_id")) if user.get("employee_id") else None,
            "pod_id": str(user.get("pod_id")) if user.get("pod_id") else None
        }
    })

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "OPERATIONS_MANAGER")

    if not email or not password or not full_name:
        return jsonify({"error": "All fields are required"}), 400

    db = get_db()
    if db[USERS_COL].find_one({"email": email}):
        return jsonify({"error": "A user with this email already exists"}), 409

    new_user = {
        "email": email,
        "password_hash": hash_pw(password),
        "full_name": full_name,
        "role": role,
        "employee_id": None,
        "created_at": datetime.now()
    }
    res = db[USERS_COL].insert_one(new_user)
    token = generate_token(str(res.inserted_id), role)

    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": str(res.inserted_id),
            "email": email,
            "full_name": full_name,
            "role": role
        }
    }), 201

@auth_bp.route("/me", methods=["GET"])
@jwt_required(optional=False)
def me():
    user = request.current_user
    return jsonify({
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name"),
            "role": user.get("role", "OPERATIONS_MANAGER"),
            "employee_id": str(user.get("employee_id")) if user.get("employee_id") else None,
            "pod_id": str(user.get("pod_id")) if user.get("pod_id") else None
        }
    })
