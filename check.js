const db = require('better-sqlite3')('backend/database/umurage.db');
const users = db.prepare("SELECT id, phone, name, role, password_hash, is_activated, setup_token, created_at FROM users WHERE name LIKE '%Olga%'").all();
console.table(users);
