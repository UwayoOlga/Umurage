import { Response } from 'express';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Get all users with optional search/role filter
export const getAllUsers = (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 50, search = '', role = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = 'SELECT id, phone, name, role, created_at, updated_at FROM users WHERE 1=1';
        const params: any[] = [];

        if (search) {
            query += ' AND (name LIKE ? OR phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        const countStmt = db.prepare(query.replace('SELECT id, phone, name, role, created_at, updated_at', 'SELECT COUNT(*) as count'));
        const total = (countStmt.get(...params) as any).count;

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);

        const users = db.prepare(query).all(...params);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
};

// Get user statistics
export const getUserStats = (_req: AuthRequest, res: Response) => {
    try {
        const stats = db.prepare(`
            SELECT
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins,
                SUM(CASE WHEN role = 'member' THEN 1 ELSE 0 END) as total_members,
                SUM(CASE WHEN role = 'treasurer' THEN 1 ELSE 0 END) as total_treasurers,
                SUM(CASE WHEN role = 'secretary' THEN 1 ELSE 0 END) as total_secretaries,
                SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as new_users_30d
            FROM users
        `).get();

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching user statistics' });
    }
};

// Update user role
export const updateUserRole = (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['member', 'admin', 'treasurer', 'secretary'];
        if (!role || !validRoles.includes(role)) {
            throw new AppError('Invalid role. Must be one of: member, admin, treasurer, secretary', 400);
        }

        const userCheck = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
        if (!userCheck) throw new AppError('User not found', 404);

        if (req.user?.id === id && role !== 'admin') {
            throw new AppError('You cannot change your own admin role', 403);
        }

        const now = new Date().toISOString();
        db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, now, id);

        const updated = db.prepare('SELECT id, phone, name, role, updated_at FROM users WHERE id = ?').get(id);
        res.status(200).json({ success: true, message: 'User role updated successfully', data: updated });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Update user role error:', error);
        res.status(500).json({ success: false, message: 'Server error updating user role' });
    }
};

// Get all groups with stats
export const getAllGroups = (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = `
            SELECT
                g.id, g.name, g.contribution_amount, g.contribution_frequency, g.model_type, g.created_at,
                u.name as admin_name,
                COUNT(DISTINCT m.id) as member_count,
                COALESCE(SUM(s.amount), 0) as total_savings,
                COUNT(DISTINCT CASE WHEN l.status = 'disbursed' THEN l.id END) as active_loans
            FROM groups g
            LEFT JOIN users u ON g.admin_id = u.id
            LEFT JOIN members m ON g.id = m.group_id AND m.status = 'active'
            LEFT JOIN savings s ON m.id = s.member_id
            LEFT JOIN loans l ON m.id = l.member_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            query += ' AND g.name LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' GROUP BY g.id, u.name ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);

        const groups = db.prepare(query).all(...params);

        let countQuery = 'SELECT COUNT(*) as count FROM groups WHERE 1=1';
        const countParams: any[] = [];
        if (search) { countQuery += ' AND name LIKE ?'; countParams.push(`%${search}%`); }
        const total = (db.prepare(countQuery).get(...countParams) as any).count;

        res.status(200).json({
            success: true,
            data: {
                groups,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get all groups error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching groups' });
    }
};

// Get group details
export const getGroupDetails = (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const group = db.prepare(`
            SELECT g.*, u.name as admin_name, u.phone as admin_phone
            FROM groups g LEFT JOIN users u ON g.admin_id = u.id
            WHERE g.id = ?
        `).get(id);

        if (!group) throw new AppError('Group not found', 404);

        const members = db.prepare(`
            SELECT m.id, m.role, m.joined_at, m.status, u.name, u.phone
            FROM members m JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ? ORDER BY m.joined_at DESC
        `).all(id);

        res.status(200).json({ success: true, data: { group, members } });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Get group details error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching group details' });
    }
};

// Get system analytics
export const getSystemAnalytics = (_req: AuthRequest, res: Response) => {
    try {
        const overall = db.prepare(`
            SELECT
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM groups) as total_groups,
                (SELECT COALESCE(SUM(amount), 0) FROM savings) as total_savings,
                (SELECT COALESCE(SUM(amount), 0) FROM loans WHERE status IN ('approved', 'disbursed')) as total_loans,
                (SELECT COUNT(*) FROM members WHERE status = 'active') as active_members,
                (SELECT COUNT(*) FROM loans WHERE status = 'disbursed') as active_loan_count
        `).get();

        const recentActivity = db.prepare(`
            SELECT
                SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as new_users_30d,
                SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as new_users_7d
            FROM users
        `).get();

        const savingsTrend = db.prepare(`
            SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
            FROM savings WHERE date >= date('now', '-6 months')
            GROUP BY strftime('%Y-%m', date) ORDER BY month DESC
        `).all();

        const loanStats = db.prepare(`
            SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
            FROM loans GROUP BY status
        `).all();

        res.status(200).json({
            success: true,
            data: { overall, recentActivity, savingsTrend, loanStats }
        });
    } catch (error) {
        console.error('Get system analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching analytics' });
    }
};
