"""
migrate_db.py — Safe schema migration script.

Run ONCE after deploying the updated code to add new columns to existing tables.
The script is idempotent: re-running it is safe (it checks before adding).

Usage:
    python migrate_db.py
"""
import sys
from sqlalchemy import text, inspect

try:
    from app import create_app, db
    app = create_app()
except ImportError:
    from app import app
    from models.db import db


def column_exists(conn, table, column):
    insp = inspect(conn)
    cols = [c['name'] for c in insp.get_columns(table)]
    return column in cols


def run_migration():
    with app.app_context():
        conn = db.engine.connect()
        try:
            migrations = []
            is_pg = 'postgresql' in str(db.engine.url)

            # ── users table ──────────────────────────────────────────
            if not column_exists(conn, 'users', 'teacher_id'):
                conn.execute(text("ALTER TABLE users ADD COLUMN teacher_id INTEGER REFERENCES users(id)"))
                migrations.append("users.teacher_id")

            for col in ('listening_band', 'reading_band', 'writing_band', 'speaking_band'):
                if not column_exists(conn, 'users', col):
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} FLOAT"))
                    migrations.append(f"users.{col}")

            # ── submissions table ─────────────────────────────────────
            if not column_exists(conn, 'submissions', 'band_score'):
                conn.execute(text("ALTER TABLE submissions ADD COLUMN band_score FLOAT"))
                migrations.append("submissions.band_score")

            # Make task_id nullable (PostgreSQL only – SQLite doesn't support ALTER COLUMN)
            if is_pg:
                conn.execute(text("ALTER TABLE submissions ALTER COLUMN task_id DROP NOT NULL"))
                migrations.append("submissions.task_id -> nullable")

            conn.commit()

            if migrations:
                print("✅ Migration complete. Added:", ", ".join(migrations))
            else:
                print("✅ Schema already up to date – nothing to do.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Migration failed: {e}")
            sys.exit(1)
        finally:
            conn.close()


if __name__ == '__main__':
    run_migration()
