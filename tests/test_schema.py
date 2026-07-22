import unittest
from unittest.mock import Mock, patch

from utils.schema import ensure_user_schema_columns


class SchemaMigrationTests(unittest.TestCase):
    def test_ensure_user_schema_columns_adds_missing_columns(self):
        db = Mock()
        inspector = Mock()
        inspector.get_table_names.return_value = ['users']
        inspector.get_columns.return_value = [{'name': 'name'}]

        with patch('utils.schema.inspect', return_value=inspector):
            ensure_user_schema_columns(db)

        executed_sql = [str(call.args[0]) for call in db.session.execute.call_args_list]
        self.assertTrue(any('ALTER TABLE users ADD COLUMN teacher_id INTEGER' in sql for sql in executed_sql))
        db.session.commit.assert_called_once()


if __name__ == '__main__':
    unittest.main()
