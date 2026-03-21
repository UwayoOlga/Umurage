const sqlite3 = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const dbPath = path.join(__dirname, '..', 'database', 'umurage.db');
const db = new sqlite3(dbPath);

async function createRoot() {
    console.log('--- ROOT ADMIN GENERATOR ---');
    const phone = '0780000001';
    const password = 'admin_password_2026';
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = randomUUID();
    const now = new Date().toISOString();

    try {
        db.prepare(`
            INSERT INTO users (id, phone, password_hash, name, role, admin_level, is_activated, created_at, updated_at)
            VALUES (?, ?, ?, 'RCA National Owner', 'admin', 'national', 1, ?, ?)
        `).run(id, phone, hashedPassword, now, now);

        console.log('✅ Root Admin Created Successfully!');
        console.log('------------------------------');
        console.log('Phone:    ', phone);
        console.log('Password: ', password);
        console.log('Level:     National (Full System Access)');
        console.log('------------------------------');
    } catch (e) {
        if (e.message.includes('unique')) {
            console.log('⚠️ A user with this phone (0780000001) already exists.');
            console.log('Try logging in with it.');
        } else {
            console.log('❌ Error:', e.message);
        }
    } finally {
        db.close();
    }
}

createRoot();
