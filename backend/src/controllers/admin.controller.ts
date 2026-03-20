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
        const userId = req.user!.id;
        const { page = 1, limit = 50, search = '', role = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const adminUser = db.prepare('SELECT admin_level, managed_location FROM users WHERE id = ?').get(userId) as any;

        let query = 'SELECT id, phone, name, role, admin_level, managed_location, created_at FROM users WHERE 1=1';
        const params: any[] = [];

        // Scoping for non-national admins
        if (adminUser.admin_level !== 'national' && adminUser.admin_level !== 'none') {
            query = `
                SELECT DISTINCT u.id, u.phone, u.name, u.role, u.admin_level, u.managed_location, u.created_at FROM users u
                JOIN members m ON u.id = m.user_id
                JOIN groups g ON m.group_id = g.id
                WHERE 1=1
            `;
            if (adminUser.admin_level === 'sector') {
                query += ' AND g.sector = ?';
                params.push(adminUser.managed_location);
            } else if (adminUser.admin_level === 'district') {
                query += ' AND g.district = ?';
                params.push(adminUser.managed_location);
            } else if (adminUser.admin_level === 'province') {
                query += ' AND g.province = ?';
                params.push(adminUser.managed_location);
            }
        }

        if (search) {
            query += ' AND (u.name LIKE ? OR u.phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }

        const countQuery = `SELECT COUNT(*) as count FROM (${query}) AS sub`;
        const total = (db.prepare(countQuery).get(...params) as any).count;

        query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
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
        const { role, admin_level, managed_location } = req.body;

        const validRoles = ['member', 'admin', 'treasurer', 'secretary'];
        if (role && !validRoles.includes(role)) {
            throw new AppError('Invalid role', 400);
        }

        const userCheck = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
        if (!userCheck) throw new AppError('User not found', 404);

        if (req.user?.id === id && role && role !== 'admin') {
            throw new AppError('You cannot change your own admin role', 403);
        }

        const now = new Date().toISOString();
        db.prepare(`
            UPDATE users 
            SET role = COALESCE(?, role), 
                admin_level = COALESCE(?, admin_level), 
                managed_location = COALESCE(?, managed_location),
                updated_at = ? 
            WHERE id = ?
        `).run(role, admin_level, managed_location, now, id);

        const updated = db.prepare('SELECT id, phone, name, role, admin_level, managed_location, updated_at FROM users WHERE id = ?').get(id);
        res.status(200).json({ success: true, message: 'User updated successfully', data: updated });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Update user role error:', error);
        res.status(500).json({ success: false, message: 'Server error updating user role' });
    }
};

// Generate a readable setup token like SETUP-A7K2-XP9Q
function generateSetupToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/1/I for readability
    const block = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SETUP-${block()}-${block()}`;
}

// Create a new admin account (System Owner only)
export const createAdminAccount = (req: AuthRequest, res: Response) => {
    try {
        const creatorId = req.user!.id;

        // Only national-level admins can create other admins
        const creator = db.prepare('SELECT admin_level FROM users WHERE id = ?').get(creatorId) as any;
        if (!creator || creator.admin_level !== 'national') {
            throw new AppError('Only the national system owner can create admin accounts.', 403);
        }

        const { name, phone, email, nationalId, adminLevel, managedLocation } = req.body;

        if (!name || !phone || !adminLevel) {
            throw new AppError('Name, phone, and admin level are required.', 400);
        }

        const validLevels = ['national', 'province', 'district', 'sector'];
        if (!validLevels.includes(adminLevel)) {
            throw new AppError('Invalid admin level.', 400);
        }

        if (adminLevel !== 'national' && !managedLocation) {
            throw new AppError('A managed location is required for non-national admin levels.', 400);
        }

        // Check if phone or national ID already exists
        const existing = db.prepare('SELECT id FROM users WHERE phone = ? OR (national_id IS NOT NULL AND national_id = ?)').get(phone, nationalId || '');
        if (existing) {
            throw new AppError('A user with this phone or National ID already exists.', 409);
        }

        const id = uuidv4();
        const setupToken = generateSetupToken();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO users (id, phone, password_hash, name, national_id, email, role, admin_level, managed_location, setup_token, is_activated, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'admin', ?, ?, ?, 0, ?, ?, ?)
        `).run(id, phone, 'PENDING', name, nationalId || null, email || null, adminLevel, managedLocation || null, setupToken, creatorId, now, now);

        res.status(201).json({
            success: true,
            message: `Admin account created. Share this setup token with ${name} to let them set their password.`,
            data: {
                id,
                name,
                phone,
                adminLevel,
                managedLocation,
                setupToken
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('createAdminAccount error:', error);
        res.status(500).json({ success: false, message: 'Server error creating admin account' });
    }
};

// Get all groups with stats
export const getAllGroups = (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const adminUser = db.prepare('SELECT admin_level, managed_location FROM users WHERE id = ?').get(userId) as any;

        let query = `
            SELECT
                g.id, g.name, g.province, g.district, g.sector, g.contribution_amount, 
                g.contribution_frequency, g.model_type, g.created_at,
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

        // Scoping for non-national admins
        if (adminUser.admin_level === 'sector') {
            query += ' AND g.sector = ?';
            params.push(adminUser.managed_location);
        } else if (adminUser.admin_level === 'district') {
            query += ' AND g.district = ?';
            params.push(adminUser.managed_location);
        } else if (adminUser.admin_level === 'province') {
            query += ' AND g.province = ?';
            params.push(adminUser.managed_location);
        }

        if (search) {
            query += ' AND g.name LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' GROUP BY g.id, u.name ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, Number(limit), offset];

        const groups = db.prepare(query).all(...queryParams);

        let countQuery = 'SELECT COUNT(*) as count FROM groups WHERE 1=1';
        if (adminUser.admin_level === 'sector') countQuery += ' AND sector = ?';
        else if (adminUser.admin_level === 'district') countQuery += ' AND district = ?';
        else if (adminUser.admin_level === 'province') countQuery += ' AND province = ?';

        if (search) countQuery += ' AND name LIKE ?';

        const countParams = [...params];
        if (search) countParams.push(`%${search}%`);

        const totalResult = db.prepare(countQuery).get(...countParams) as any;
        const total = totalResult ? totalResult.count : 0;

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
export const getSystemAnalytics = (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const adminUser = db.prepare('SELECT admin_level, managed_location FROM users WHERE id = ?').get(userId) as any;

        let scopeClause = '';
        const params: any[] = [];

        if (adminUser.admin_level === 'sector') {
            scopeClause = 'WHERE sector = ?';
            params.push(adminUser.managed_location);
        } else if (adminUser.admin_level === 'district') {
            scopeClause = 'WHERE district = ?';
            params.push(adminUser.managed_location);
        } else if (adminUser.admin_level === 'province') {
            scopeClause = 'WHERE province = ?';
            params.push(adminUser.managed_location);
        }

        // Overall stats with dynamic scoping
        const overall = db.prepare(`
            SELECT
                (SELECT COUNT(DISTINCT m.user_id) FROM members m JOIN groups g ON m.group_id = g.id ${scopeClause}) as total_users,
                (SELECT COUNT(*) FROM groups ${scopeClause}) as total_groups,
                (SELECT COALESCE(SUM(s.amount), 0) FROM savings s JOIN members m ON s.member_id = m.id JOIN groups g ON m.group_id = g.id ${scopeClause}) as total_savings,
                (SELECT COALESCE(SUM(l.amount), 0) FROM loans l JOIN members m ON l.member_id = m.id JOIN groups g ON m.group_id = g.id WHERE l.status IN ('approved', 'disbursed') ${scopeClause ? 'AND ' + scopeClause.replace('WHERE', '') : ''}) as total_loans,
                (SELECT COUNT(*) FROM members m JOIN groups g ON m.group_id = g.id WHERE m.status = 'active' ${scopeClause ? 'AND ' + scopeClause.replace('WHERE', '') : ''}) as active_members,
                (SELECT COUNT(*) FROM loans l JOIN members m ON l.member_id = m.id JOIN groups g ON m.group_id = g.id WHERE l.status = 'disbursed' ${scopeClause ? 'AND ' + scopeClause.replace('WHERE', '') : ''}) as active_loan_count
        `).get(...Array(6).fill(params).flat());

        const recentActivity = db.prepare(`
            SELECT
                SUM(CASE WHEN u.created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as new_users_30d,
                SUM(CASE WHEN u.created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as new_users_7d
            FROM users u
            ${adminUser.admin_level !== 'national' && adminUser.admin_level !== 'none' ? 'JOIN members m ON u.id = m.user_id JOIN groups g ON m.group_id = g.id ' + scopeClause : ''}
        `).get(...params);

        const savingsTrend = db.prepare(`
            SELECT strftime('%Y-%m', s.date) as month, SUM(s.amount) as total
            FROM savings s
            JOIN members m ON s.member_id = m.id
            JOIN groups g ON m.group_id = g.id
            ${scopeClause}
            AND s.date >= date('now', '-6 months')
            GROUP BY strftime('%Y-%m', s.date) ORDER BY month DESC
        `).all(...params);

        const loanStats = db.prepare(`
            SELECT l.status, COUNT(*) as count, COALESCE(SUM(l.amount), 0) as total_amount
            FROM loans l
            JOIN members m ON l.member_id = m.id
            JOIN groups g ON m.group_id = g.id
            ${scopeClause}
            GROUP BY l.status
        `).all(...params);

        res.status(200).json({
            success: true,
            data: { overall, recentActivity, savingsTrend, loanStats }
        });
    } catch (error) {
        console.error('Get system analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching analytics' });
    }
};

// Get activity feed (recent transactions) scoped to admin level
export const getActivityFeed = (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { limit = 20 } = req.query;

        const adminUser = db.prepare('SELECT admin_level, managed_location FROM users WHERE id = ?').get(userId) as any;

        let scopeClause = 'WHERE 1=1';
        const params: any[] = [];

        if (adminUser.admin_level === 'sector') {
            scopeClause = 'WHERE g.sector = ?';
            params.push(adminUser.managed_location);
        } else if (adminUser.admin_level === 'district') {
            scopeClause = 'WHERE g.district = ?';
            params.push(adminUser.managed_location);
        } else if (adminUser.admin_level === 'province') {
            scopeClause = 'WHERE g.province = ?';
            params.push(adminUser.managed_location);
        }

        const query = `
            SELECT 
                t.id, t.type, t.amount, t.created_at, t.status, t.notes,
                g.name as group_name, g.sector,
                u_from.name as from_member_name,
                u_to.name as to_member_name
            FROM transactions t
            JOIN groups g ON t.group_id = g.id
            LEFT JOIN members m_from ON t.from_member_id = m_from.id
            LEFT JOIN users u_from ON m_from.user_id = u_from.id
            LEFT JOIN members m_to ON t.to_member_id = m_to.id
            LEFT JOIN users u_to ON m_to.user_id = u_to.id
            ${scopeClause}
            ORDER BY t.created_at DESC
            LIMIT ?
        `;

        const activities = db.prepare(query).all(...params, Number(limit));

        res.status(200).json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Get activity feed error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching activity feed' });
    }
};

// Get risk analysis for groups scoped to admin level
export const getRiskAnalysis = (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const adminUser = db.prepare('SELECT admin_level, managed_location FROM users WHERE id = ?').get(userId) as any;

        let scopeClause = 'WHERE 1=1';
        const params: any[] = [];

        if (adminUser.admin_level === 'sector') {
            scopeClause = 'WHERE g.sector = ?';
            params.push(adminUser.managed_location);
        } else if (adminUser.admin_level === 'district') {
            scopeClause = 'WHERE g.district = ?';
            params.push(adminUser.managed_location);
        } else if (adminUser.admin_level === 'province') {
            scopeClause = 'WHERE g.province = ?';
            params.push(adminUser.managed_location);
        }

        const query = `
            SELECT 
                g.id, g.name, g.sector,
                COUNT(DISTINCT m.id) as member_count,
                COUNT(l.id) as total_loans,
                SUM(CASE WHEN l.status = 'disbursed' AND l.due_date < date('now') THEN 1 ELSE 0 END) as overdue_loans,
                SUM(CASE WHEN l.status = 'defaulted' THEN 1 ELSE 0 END) as defaulted_loans,
                (SELECT COUNT(*) FROM savings s2 JOIN members m2 ON s2.member_id = m2.id WHERE m2.group_id = g.id AND s2.type = 'penalty') as penalty_count,
                COALESCE(SUM(l.amount), 0) as total_loan_volume
            FROM groups g
            LEFT JOIN members m ON g.id = m.group_id
            LEFT JOIN loans l ON m.id = l.member_id
            ${scopeClause}
            GROUP BY g.id
            HAVING overdue_loans > 0 OR defaulted_loans > 0 OR penalty_count > 5
            ORDER BY overdue_loans DESC, penalty_count DESC
            LIMIT 10
        `;

        const highRiskGroups = db.prepare(query).all(...params) as any[];

        // Map risk scores
        const analysis = highRiskGroups.map(group => {
            let score = 0;
            if (group.overdue_loans > 0) score += 40 + (group.overdue_loans * 10);
            if (group.defaulted_loans > 0) score += 30 + (group.defaulted_loans * 15);
            if (group.penalty_count > 10) score += 20;

            return {
                ...group,
                risk_score: Math.min(100, score),
                risk_level: score > 70 ? 'CRITICAL' : score > 40 ? 'HIGH' : 'MEDIUM'
            };
        });

        res.status(200).json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Get risk analysis error:', error);
        res.status(500).json({ success: false, message: 'Server error performing risk analysis' });
    }
};
