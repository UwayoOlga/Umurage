const sqlite3 = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'umurage.db');
const db = new sqlite3(dbPath);

const admins = db.prepare("SELECT phone, name, admin_level, role FROM users WHERE role = 'admin'").all();
console.log('Admins found:', admins);
db.close();
