import db from './config/database';

try {
    db.exec(`ALTER TABLE users ADD COLUMN national_id TEXT;`);
    console.log('Added national_id to users');
} catch (e) {
    console.error('users alter error:', e);
}

try {
    db.exec(`ALTER TABLE groups ADD COLUMN rca_number TEXT;`);
    console.log('Added rca_number to groups');
} catch (e) {
    console.error('groups rca_number alter error:', e);
}

try {
    db.exec(`ALTER TABLE groups ADD COLUMN description TEXT;`);
    console.log('Added description to groups');
} catch (e) {
    console.error('groups description alter error:', e);
}

console.log(db.prepare("PRAGMA table_info('users')").all());
console.log(db.prepare("PRAGMA table_info('groups')").all());
