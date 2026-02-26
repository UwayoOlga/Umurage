import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // 1. Total Savings
        const savingsResult = db.prepare(`
            SELECT SUM(s.amount) as total
            FROM savings s
            JOIN members m ON s.member_id = m.id
            WHERE m.user_id = ?
        `).get(userId) as any;

        // 2. Active Loans
        const loansResult = db.prepare(`
            SELECT SUM(l.amount) as total
            FROM loans l
            JOIN members m ON l.member_id = m.id
            WHERE m.user_id = ? AND l.status IN ('approved', 'disbursed')
        `).get(userId) as any;

        // 3. Member counts (across all groups user belongs to)
        const groups = db.prepare('SELECT group_id FROM members WHERE user_id = ?').all(userId) as any[];
        let totalMembers = 0;
        if (groups.length > 0) {
            const groupIds = groups.map(g => g.group_id);
            const placeholders = groupIds.map(() => '?').join(',');
            const membersResult = db.prepare(`
                SELECT COUNT(DISTINCT user_id) as count
                FROM members
                WHERE group_id IN (${placeholders})
            `).get(...groupIds) as any;
            totalMembers = membersResult?.count || 0;
        }

        // 4. Recent Transactions (simplified for dashboard)
        const recentTransactions = db.prepare(`
            SELECT t.*, u.name as member_name
            FROM transactions t
            LEFT JOIN members m ON t.from_member_id = m.id
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.user_id = ? OR t.group_id IN (SELECT group_id FROM members WHERE user_id = ?)
            ORDER BY t.created_at DESC
            LIMIT 5
        `).all(userId, userId);

        res.status(200).json({
            success: true,
            data: {
                totalSavings: savingsResult?.total || 0,
                activeLoans: loansResult?.total || 0,
                activeMembers: totalMembers,
                pendingActions: 0, // To be implemented with tasks/reminders
                recentTransactions
            }
        });
    } catch (error) {
        console.error('getDashboardSummary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
