import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'umurage.db');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

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
        role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'treasurer', 'secretary')),
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
        admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        contribution_amount REAL,
        contribution_frequency TEXT CHECK (contribution_frequency IN ('weekly', 'biweekly', 'monthly')),
        model_type TEXT CHECK (model_type IN ('ROSCA', 'ASCA')),
        sacco_account_number TEXT,
        sacco_id TEXT,
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

    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);
    CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
    CREATE INDEX IF NOT EXISTS idx_savings_member ON savings(member_id);
    CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);
    CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_group ON transactions(group_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
`);

console.log('✅ Connected to SQLite database at', DB_PATH);

export default db;
