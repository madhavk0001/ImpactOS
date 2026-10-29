import os, sqlite3
from pathlib import Path

DB_PATH = os.getenv('IMPACTOS_DB_PATH', str(Path(__file__).resolve().parents[2] / 'data' / 'impactos.sqlite3'))

def connect():
    db_path = Path(os.getenv('IMPACTOS_DB_PATH', DB_PATH))
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

def initialize():
    with connect() as db:
        db.execute('CREATE TABLE IF NOT EXISTS projects (project_id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
        db.execute('CREATE TABLE IF NOT EXISTS scenarios (id TEXT PRIMARY KEY, name TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL)')
        db.execute('CREATE TABLE IF NOT EXISTS imports (id TEXT PRIMARY KEY, filename TEXT NOT NULL, count INTEGER NOT NULL, created_at TEXT NOT NULL)')
