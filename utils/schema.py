from sqlalchemy import inspect, text


def ensure_user_schema_columns(db):
    """Add missing user columns for older databases without crashing startup."""
    try:
        inspector = inspect(db.engine)
        if 'users' not in inspector.get_table_names():
            return

        user_columns = {column['name'] for column in inspector.get_columns('users')}
        column_sql = {
            'teacher_id': 'INTEGER',
            'listening_band': 'FLOAT',
            'reading_band': 'FLOAT',
            'writing_band': 'FLOAT',
            'speaking_band': 'FLOAT',
            'last_active_date': 'DATE',
            'weak_areas': "VARCHAR(500) DEFAULT ''",
            'zoom_link': 'VARCHAR(500)',
            'created_at': 'TIMESTAMP',
        }

        for column_name, column_type in column_sql.items():
            if column_name not in user_columns:
                db.session.execute(text(f'ALTER TABLE users ADD COLUMN {column_name} {column_type}'))

        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
