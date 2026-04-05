"""
Minimal OAuth trigger script.
Called by the Next.js POST /api/auth/login route as a subprocess.
Runs the full OAuth browser flow and writes token.json, then exits.
Must be run from the project root: python3 src/auth_cli.py
"""
import sys
import os

# Ensure the project root is on sys.path so 'src' is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.auth import get_gmail_service

if __name__ == "__main__":
    try:
        get_gmail_service()
        print("Auth successful")
        sys.exit(0)
    except Exception as e:
        print(f"Auth failed: {e}", file=sys.stderr)
        sys.exit(1)
