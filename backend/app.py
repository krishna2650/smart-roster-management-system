import os
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

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

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

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
