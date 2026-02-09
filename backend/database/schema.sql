-- Umurage Database Schema
-- PostgreSQL Database Initialization Script

-- Create database (run this separately as postgres user)
-- CREATE DATABASE umurage_db;

-- Connect to database
-- \c umurage_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'treasurer', 'secretary')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contribution_amount DECIMAL(10,2),
  contribution_frequency VARCHAR(20) CHECK (contribution_frequency IN ('weekly', 'biweekly', 'monthly')),
  model_type VARCHAR(10) CHECK (model_type IN ('ROSCA', 'ASCA')),
  sacco_account_number VARCHAR(50),
  sacco_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'treasurer', 'secretary', 'member')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  UNIQUE(group_id, user_id)
);

-- Savings table
CREATE TABLE IF NOT EXISTS savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(20) DEFAULT 'regular' CHECK (type IN ('regular', 'penalty', 'bonus', 'share_out')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'momo', 'sacco')),
  transaction_ref VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  interest_rate DECIMAL(5,2) DEFAULT 5.00,
  purpose TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'repaid', 'defaulted')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  disbursed_at TIMESTAMP,
  due_date DATE,
  ai_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan Repayments table
CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'momo', 'sacco')),
  transaction_ref VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table (audit log)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('contribution', 'loan_disbursement', 'loan_repayment', 'share_out', 'penalty', 'fee')),
  amount DECIMAL(10,2) NOT NULL,
  from_member_id UUID REFERENCES members(id),
  to_member_id UUID REFERENCES members(id),
  reference_id UUID,
  reference_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync Queue table (for offline operations)
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  synced BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_groups_admin ON groups(admin_id);
CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_member ON savings(member_id);
CREATE INDEX IF NOT EXISTS idx_savings_date ON savings(date);
CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan ON loan_repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_group ON transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id, synced);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
-- INSERT INTO users (phone, password_hash, name, role) VALUES
-- ('250788123456', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEgEjqK', 'Test User', 'member');
-- Password is 'password123' hashed with bcrypt

COMMENT ON TABLE users IS 'User accounts for the platform';
COMMENT ON TABLE groups IS 'Ibimina/savings groups';
COMMENT ON TABLE members IS 'Group membership records';
COMMENT ON TABLE savings IS 'Member savings/contributions';
COMMENT ON TABLE loans IS 'Loan requests and records';
COMMENT ON TABLE loan_repayments IS 'Loan repayment history';
COMMENT ON TABLE transactions IS 'All financial transactions audit log';
COMMENT ON TABLE sync_queue IS 'Offline operation sync queue';
