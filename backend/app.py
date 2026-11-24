import os
import threading
import time
import urllib.request
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import get_db

from routes.auth import auth_bp
from routes.employees import employees_bp
from routes.brands import brands_bp
from routes.processes import processes_bp
from routes.pods import pods_bp
from routes.assignments import assignments_bp
from routes.availability import availability_bp
from routes.holidays import holidays_bp
from routes.roster import roster_bp
from routes.conflicts import conflicts_bp
from routes.dashboard import dashboard_bp
from routes.reports import reports_bp
from routes.chat import chat_bp
from models.schemas import EMPLOYEES_COL
from seeds.seed_data import seed_database

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Automatically ensure database is seeded with benchmark dataset
    with app.app_context():
        try:
            db = get_db()
            if db[EMPLOYEES_COL].count_documents({}) == 0:
                print("Database is empty on startup. Auto-seeding benchmark dataset...")
                seed_database()
                print("Auto-seeding complete.")
        except Exception as e:
            print(f"Auto-seed check note: {e}")

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(employees_bp)
    app.register_blueprint(brands_bp)
    app.register_blueprint(processes_bp)
    app.register_blueprint(pods_bp)
    app.register_blueprint(assignments_bp)
    app.register_blueprint(availability_bp)
    app.register_blueprint(holidays_bp)
    app.register_blueprint(roster_bp)
    app.register_blueprint(conflicts_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(chat_bp)

    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "service": "DataStraw Smart Roster Management API",
            "status": "online",
            "health_check": "/api/health",
            "version": "1.0.0",
            "message": "Backend REST API is running live. Connect with the React frontend or explore /api endpoints."
        })

    @app.route("/api/health", methods=["GET"])
    def health_check():
        db = get_db()
        return jsonify({
            "status": "healthy",
            "service": "DataStraw Smart Roster Management API",
            "version": "1.0.0"
        })

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app

def start_render_keep_alive():
    """Background thread that pings /api/health every 9 minutes so Render instance stays awake 24/7."""
    def pinger():
        time.sleep(25)  # Initial wait for server binding
        ext_url = os.environ.get("RENDER_EXTERNAL_URL") or "https://smart-roster-management-system-y3zb.onrender.com"
        target = f"{ext_url.rstrip('/')}/api/health"
        print(f"[KeepAlive 24/7] Active worker initialized for: {target}")
        while True:
            try:
                time.sleep(540)  # Every 9 minutes (Render sleeps after 15 mins idle)
                req = urllib.request.Request(
                    target,
                    headers={"User-Agent": "DataStraw-KeepAlive-24h/1.0"}
                )
                with urllib.request.urlopen(req, timeout=25) as res:
                    print(f"[KeepAlive 24/7] Heartbeat OK -> HTTP {res.status}")
            except Exception:
                pass

    if os.environ.get("RENDER") or os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("PORT"):
        t = threading.Thread(target=pinger, daemon=True)
        t.start()

app = create_app()
start_render_keep_alive()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
