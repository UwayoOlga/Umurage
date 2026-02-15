import { Request, Response } from 'express';
import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Get all users with pagination and search
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 10, search = '', role = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = `
            SELECT id, phone, name, role, created_at, updated_at
            FROM users
            WHERE 1=1
        `;
        const queryParams: any[] = [];
        let paramCount = 1;

        // Add search filter
        if (search) {
            query += ` AND (name ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        // Add role filter
        if (role) {
            query += ` AND role = $${paramCount}`;
            queryParams.push(role);
            paramCount++;
        }

        // Add pagination
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(Number(limit), offset);

        const result = await pool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
        const countParams: any[] = [];
        let countParamNum = 1;

        if (search) {
            countQuery += ` AND (name ILIKE $${countParamNum} OR phone ILIKE $${countParamNum})`;
            countParams.push(`%${search}%`);
            countParamNum++;
        }

        if (role) {
            countQuery += ` AND role = $${countParamNum}`;
            countParams.push(role);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.status(200).json({
            success: true,
            data: {
                users: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
};

// Get user statistics
export const getUserStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
                COUNT(CASE WHEN role = 'member' THEN 1 END) as total_members,
                COUNT(CASE WHEN role = 'treasurer' THEN 1 END) as total_treasurers,
                COUNT(CASE WHEN role = 'secretary' THEN 1 END) as total_secretaries,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
            FROM users
        `);

        res.status(200).json({
            success: true,
            data: stats.rows[0]
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user statistics'
        });
    }
};

// Update user role
export const updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['member', 'admin', 'treasurer', 'secretary'];
        if (!role || !validRoles.includes(role)) {
            throw new AppError('Invalid role. Must be one of: member, admin, treasurer, secretary', 400);
        }

        // Check if user exists
        const userCheck = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            throw new AppError('User not found', 404);
        }

        // Prevent admin from demoting themselves
        if (req.user?.id === id && role !== 'admin') {
            throw new AppError('You cannot change your own admin role', 403);
        }

        // Update user role
        const result = await pool.query(
            'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, phone, name, role, updated_at',
            [role, id]
        );

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating user role'
        });
    }
};

// Get all groups with stats
export const getAllGroups = async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = `
            SELECT 
                g.id,
                g.name,
                g.contribution_amount,
                g.contribution_frequency,
                g.model_type,
                g.created_at,
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
        const queryParams: any[] = [];
        let paramCount = 1;

        if (search) {
            query += ` AND g.name ILIKE $${paramCount}`;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        query += ` GROUP BY g.id, u.name ORDER BY g.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        queryParams.push(Number(limit), offset);

        const result = await pool.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM groups WHERE 1=1';
        const countParams: any[] = [];

        if (search) {
            countQuery += ' AND name ILIKE $1';
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.status(200).json({
            success: true,
            data: {
                groups: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get all groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching groups'
        });
    }
};

// Get group details
export const getGroupDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const groupQuery = await pool.query(`
            SELECT 
                g.*,
                u.name as admin_name,
                u.phone as admin_phone
            FROM groups g
            LEFT JOIN users u ON g.admin_id = u.id
            WHERE g.id = $1
        `, [id]);

        if (groupQuery.rows.length === 0) {
            throw new AppError('Group not found', 404);
        }

        // Get members
        const membersQuery = await pool.query(`
            SELECT 
                m.id,
                m.role,
                m.joined_at,
                m.status,
                u.name,
                u.phone
            FROM members m
            JOIN users u ON m.user_id = u.id
            WHERE m.group_id = $1
            ORDER BY m.joined_at DESC
        `, [id]);

        res.status(200).json({
            success: true,
            data: {
                group: groupQuery.rows[0],
                members: membersQuery.rows
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get group details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching group details'
        });
    }
};

// Get system analytics
export const getSystemAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        // Overall statistics
        const overallStats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM groups) as total_groups,
                (SELECT COALESCE(SUM(amount), 0) FROM savings) as total_savings,
                (SELECT COALESCE(SUM(amount), 0) FROM loans WHERE status IN ('approved', 'disbursed')) as total_loans,
                (SELECT COUNT(*) FROM members WHERE status = 'active') as active_members,
                (SELECT COUNT(*) FROM loans WHERE status = 'disbursed') as active_loan_count
        `);

        // Recent activity (last 30 days)
        const recentActivity = await pool.query(`
            SELECT 
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d
            FROM users
        `);

        // Savings by month (last 6 months)
        const savingsTrend = await pool.query(`
            SELECT 
                TO_CHAR(date, 'YYYY-MM') as month,
                SUM(amount) as total
            FROM savings
            WHERE date >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(date, 'YYYY-MM')
            ORDER BY month DESC
        `);

        // Loan statistics
        const loanStats = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as total_amount
            FROM loans
            GROUP BY status
        `);

        res.status(200).json({
            success: true,
            data: {
                overall: overallStats.rows[0],
                recentActivity: recentActivity.rows[0],
                savingsTrend: savingsTrend.rows,
                loanStats: loanStats.rows
            }
        });
    } catch (error) {
        console.error('Get system analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching analytics'
        });
    }
};
