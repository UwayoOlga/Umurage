import db from './config/database';
console.log(db.prepare("PRAGMA table_info('users')").all());
