import os
import subprocess
import json
from pathlib import Path
import importlib.util
from typing import Dict, List, Any

class ProjectAssessor:
    def __init__(self, project_dir: str):
        self.project_dir = Path(project_dir)
        self.report: Dict[str, Any] = {}

    def check_file_content(self, filepath: Path) -> Dict[str, bool]:
        """Analyze specific file contents for required components."""
        if not filepath.exists():
            return {"exists": False}
        
        content = filepath.read_text()
        return {
            "exists": True,
            "has_create_app": "create_app" in content,
            "has_db_init": "db.init_app" in content,
            "has_migrate_init": "migrate.init_app" in content,
            "has_blueprint_register": "register_blueprint" in content
        }

    def check_database_config(self) -> Dict[str, bool]:
        """Verify database configuration and connection."""
        try:
            from flask import Flask
            from flask_sqlalchemy import SQLAlchemy
            app = Flask(__name__)
            
            # Try loading config from .env
            from dotenv import load_dotenv
            load_dotenv()
            
            db_url = os.getenv('DATABASE_URL')
            if db_url:
                app.config['SQLALCHEMY_DATABASE_URI'] = db_url
                db = SQLAlchemy()
                db.init_app(app)
                with app.app_context():
                    db.engine.connect()
                return {"connection": True, "config_exists": True}
        except Exception as e:
            return {"connection": False, "config_exists": bool(os.getenv('DATABASE_URL')), "error": str(e)}

    def check_migrations(self) -> Dict[str, bool]:
        """Check Alembic migrations status."""
        migrations_path = self.project_dir / "migrations"
        return {
            "directory_exists": migrations_path.exists(),
            "has_versions": (migrations_path / "versions").exists() if migrations_path.exists() else False,
            "has_env_py": (migrations_path / "env.py").exists() if migrations_path.exists() else False
        }

    def check_app_structure(self) -> Dict[str, Any]:
        """Verify Flask application structure."""
        return {
            "app_init": self.check_file_content(self.project_dir / "app" / "__init__.py"),
            "config_py": (self.project_dir / "config.py").exists(),
            "env_file": (self.project_dir / ".env").exists(),
            "requirements": (self.project_dir / "requirements.txt").exists(),
            "blueprints": [bp.parent.name for bp in self.project_dir.rglob("**/routes.py")]
        }

    def assess(self) -> Dict[str, Any]:
        """Run comprehensive project assessment."""
        self.report.update({
            "app_structure": self.check_app_structure(),
            "database": self.check_database_config(),
            "migrations": self.check_migrations(),
            "environment": {
                "venv_active": "VIRTUAL_ENV" in os.environ,
                "flask_env": os.getenv("FLASK_ENV"),
                "required_vars_present": all(var in os.environ for var in [
                    "FLASK_CONFIG", "DATABASE_URL", "SECRET_KEY"
                ])
            }
        })
        return self.report

    def print_recommendations(self):
        """Print actionable recommendations based on assessment."""
        if not self.report:
            self.assess()
        
        recommendations = []
        
        # App structure recommendations
        if not self.report["app_structure"]["app_init"]["exists"]:
            recommendations.append("Create app/__init__.py with create_app factory")
        elif not self.report["app_structure"]["app_init"]["has_create_app"]:
            recommendations.append("Implement create_app factory pattern in app/__init__.py")
            
        # Database recommendations
        if not self.report["database"]["connection"]:
            recommendations.append("Fix database connection configuration")
        
        # Migrations recommendations
        if not self.report["migrations"]["directory_exists"]:
            recommendations.append("Initialize Alembic migrations with 'flask db init'")
        elif not self.report["migrations"]["has_versions"]:
            recommendations.append("Create initial migration with 'flask db migrate'")
            
        # Environment recommendations
        if not self.report["environment"]["required_vars_present"]:
            recommendations.append("Add missing environment variables to .env file")
            
        return recommendations

if __name__ == "__main__":
    assessor = ProjectAssessor(".")
    assessment = assessor.assess()
    print("\nAssessment Results:")
    print(json.dumps(assessment, indent=2))
    print("\nRecommendations:")
    for i, rec in enumerate(assessor.print_recommendations(), 1):
        print(f"{i}. {rec}")