const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../data/umurage.db'));

// Get the user ID for 250788123456
const user = db.prepare('SELECT id FROM users WHERE phone = ?').get('250788123456');

if (!user) {
    console.error('User not found. Please register 250788123456 first.');
    process.exit(1);
}

const userId = user.id;

// 1. Create a Group
const groupResult = db.prepare(`
    INSERT INTO groups (name, contribution_amount, contribution_frequency, model_type)
    VALUES (?, ?, ?, ?)
`).run('Imberakuri Savings', 5000, 'monthly', 'ASCA');

const groupId = groupResult.lastInsertRowid;

// 2. Add as member
db.prepare(`
    INSERT INTO members (user_id, group_id, role, status)
    VALUES (?, ?, ?, ?)
`).run(userId, groupId, 'admin', 'active');

// 3. Add some savings records
db.prepare(`
    INSERT INTO savings (member_id, group_id, amount, date, payment_method)
    VALUES (?, ?, ?, ?, ?)
`).run(1, groupId, 5000, new Date().toISOString(), 'momo');

db.prepare(`
    INSERT INTO savings (member_id, group_id, amount, date, payment_method)
    VALUES (?, ?, ?, ?, ?)
`).run(1, groupId, 5000, new Date(Date.now() - 86400000 * 30).toISOString(), 'momo');

// 4. Add a loan
db.prepare(`
    INSERT INTO loans (member_id, group_id, amount, interest_rate, duration_months, status, purpose, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(1, groupId, 200000, 5, 6, 'approved', 'Farm equipment', new Date(Date.now() + 86400000 * 90).toISOString());

// 5. Add transactions for summary
db.prepare(`
    INSERT INTO transactions (from_member_id, group_id, amount, type, status, reference)
    VALUES (?, ?, ?, ?, ?, ?)
`).run(1, groupId, 5000, 'contribution', 'completed', 'TXN-1001');

db.prepare(`
    INSERT INTO transactions (to_member_id, group_id, amount, type, status, reference)
    VALUES (?, ?, ?, ?, ?, ?)
`).run(1, groupId, -200000, 'loan_disbursement', 'completed', 'TXN-1002');

console.log('Database seeded successfully!');
db.close();
