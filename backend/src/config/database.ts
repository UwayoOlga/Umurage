import DatabaseConstructor from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'umurage.db');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Explicitly type to avoid TS4094
const db: DatabaseConstructor.Database = new DatabaseConstructor(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        phone TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        national_id TEXT UNIQUE,
        role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'treasurer', 'secretary')),
        admin_level TEXT DEFAULT 'none' CHECK (admin_level IN ('none', 'national', 'province', 'district', 'sector')),
        managed_location TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        name TEXT NOT NULL,
        rca_number TEXT UNIQUE,
        description TEXT,
        admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        province TEXT,
        district TEXT,
        sector TEXT,
        contribution_amount REAL,
        contribution_frequency TEXT CHECK (contribution_frequency IN ('weekly', 'biweekly', 'monthly')),
        model_type TEXT CHECK (model_type IN ('ROSCA', 'ASCA')),
        sacco_account_number TEXT,
        sacco_id TEXT,
        penalty_amount REAL DEFAULT 500,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'treasurer', 'secretary', 'member')),
        joined_at TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        rotation_order INTEGER,
        UNIQUE(group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS savings (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
        amount REAL NOT NULL CHECK (amount > 0),
        date TEXT NOT NULL DEFAULT (date('now')),
        type TEXT DEFAULT 'regular' CHECK (type IN ('regular', 'penalty', 'bonus', 'share_out')),
        payment_method TEXT CHECK (payment_method IN ('cash', 'momo', 'sacco')),
        transaction_ref TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
        amount REAL NOT NULL CHECK (amount > 0),
        interest_rate REAL DEFAULT 5.00,
        purpose TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'repaid', 'defaulted')),
        approved_by TEXT REFERENCES users(id),
        approved_at TEXT,
        disbursed_at TEXT,
        due_date TEXT,
        ai_score REAL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('contribution', 'loan_disbursement', 'loan_repayment', 'share_out', 'penalty', 'fee')),
        amount REAL NOT NULL,
        from_member_id TEXT REFERENCES members(id),
        to_member_id TEXT REFERENCES members(id),
        reference_id TEXT,
        reference_type TEXT,
        status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
        scheduled_for TEXT NOT NULL,
        async_cutoff_time TEXT NOT NULL,
        location TEXT,
        status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance (
        meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
        member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED')),
        UNIQUE(meeting_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS agenda_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('CONTRIBUTION_SUMMARY', 'LOAN_APPROVAL', 'DISCUSSION_POINT')),
        description TEXT,
        resolved BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);
    CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
    CREATE INDEX IF NOT EXISTS idx_savings_member ON savings(member_id);
    CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);
    CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_group ON transactions(group_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_meetings_group ON meetings(group_id);

    CREATE TABLE IF NOT EXISTS rotations (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
        current_turn_member_id TEXT REFERENCES members(id),
        amount_per_member REAL,
        payout_date TEXT,
        status TEXT DEFAULT 'active' CHECK(status in ('active', 'completed')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rotation_requests (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('emergency_swap')),
        reason TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sacco_staff (
        staff_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        admin_level TEXT NOT NULL CHECK (admin_level IN ('national', 'province', 'district', 'sector')),
        managed_location TEXT,
        claimed_by TEXT REFERENCES users(id),
        claimed_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );
`);

// Run migrations gracefully for existing DBs
try { db.exec(`ALTER TABLE users ADD COLUMN national_id TEXT UNIQUE;`); } catch (e) { }
try { db.exec(`ALTER TABLE groups ADD COLUMN rca_number TEXT UNIQUE;`); } catch (e) { }
try { db.exec(`ALTER TABLE groups ADD COLUMN description TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE members ADD COLUMN rotation_order INTEGER;`); } catch (e) { }
try { db.exec(`ALTER TABLE groups ADD COLUMN penalty_amount REAL DEFAULT 500;`); } catch (e) { }
try { db.exec(`ALTER TABLE users ADD COLUMN admin_level TEXT DEFAULT 'none';`); } catch (e) { }
try { db.exec(`ALTER TABLE users ADD COLUMN managed_location TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE groups ADD COLUMN province TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE groups ADD COLUMN district TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE groups ADD COLUMN sector TEXT;`); } catch (e) { }
// Admin provisioning flow columns
try { db.exec(`ALTER TABLE users ADD COLUMN email TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE users ADD COLUMN setup_token TEXT;`); } catch (e) { }
try { db.exec(`ALTER TABLE users ADD COLUMN is_activated INTEGER DEFAULT 1;`); } catch (e) { }
try { db.exec(`ALTER TABLE users ADD COLUMN created_by TEXT;`); } catch (e) { }

console.log('✅ Connected to SQLite database at', DB_PATH);

export default db;
