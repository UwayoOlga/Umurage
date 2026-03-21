const sqlite3 = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database', 'umurage.db');
const db = new sqlite3(dbPath);

async function resetAdmin() {
    const phone = '0780000000';
    const password = 'admin_password_2026';
    const hashedPassword = await bcrypt.hash(password, 12);

    try {
        db.prepare(`
            UPDATE users SET password_hash = ?, admin_level = 'national', is_activated = 1, role = 'admin'
            WHERE phone = ?
        `).run(hashedPassword, phone);

        console.log('✅ Admin Reset Successfully!');
        console.log('Phone:', phone);
        console.log('New Password:', password);
    } catch (e) {
        console.log('❌ Error:', e.message);
    } finally {
        db.close();
    }
}

resetAdmin();
