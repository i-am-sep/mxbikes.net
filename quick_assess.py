import os
from pathlib import Path
import json

def quick_assess(project_dir: str):
    root = Path(project_dir)
    report = {
        "files": {},
        "content_samples": {},
        "env_vars": {}
    }
    
    # Check critical files
    key_files = [
        "app.py",
        "app/__init__.py",
        "config.py",
        ".env",
        "requirements.txt",
        "migrations/env.py"
    ]
    
    for file in key_files:
        path = root / file
        if path.exists():
            report["files"][file] = True
            # Get first 200 chars of content for key files
            if file in ["app/__init__.py", "app.py", "config.py"]:
                try:
                    report["content_samples"][file] = path.read_text()[:200]
                except:
                    report["content_samples"][file] = "Error reading file"
        else:
            report["files"][file] = False
    
    # Check env vars
    key_vars = ["FLASK_CONFIG", "DATABASE_URL", "SECRET_KEY"]
    for var in key_vars:
        report["env_vars"][var] = var in os.environ
    
    return report

if __name__ == "__main__":
    assessment = quick_assess(".")
    print(json.dumps(assessment, indent=2))