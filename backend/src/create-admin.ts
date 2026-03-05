import bcrypt from 'bcryptjs';
import db from './config/database';

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function createAdmin() {
    try {
        const phone = '0788888888';
        const password = '123';

        // check if exists
        const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
        if (existing) {
            console.log('Admin user already exists. Updating role to admin...');
            db.prepare('UPDATE users SET role = ? WHERE phone = ?').run('admin', phone);
            console.log('Done.');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(
            `INSERT INTO users (id, phone, password_hash, name, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'admin', ?, ?)`
        ).run(id, phone, hashedPassword, 'System Admin', now, now);

        console.log('Admin user created successfully with phone: 0788888888');
    } catch (e) {
        console.error('Error creating admin:', e);
    }
}

createAdmin();
