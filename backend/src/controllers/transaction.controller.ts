import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getUserTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // Get all groups the user is a member of
        const membershipIds = db.prepare('SELECT id FROM members WHERE user_id = ?').all(userId).map((m: any) => m.id);

        if (membershipIds.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Get transactions for these group memberships (either as sender or receiver)
        const placeholders = membershipIds.map(() => '?').join(',');
        const query = \`
            SELECT t.*, 
                   m1.name as from_member_name, 
                   m2.name as to_member_name
            FROM transactions t
            LEFT JOIN (SELECT m.id, u.name FROM members m JOIN users u ON m.user_id = u.id) m1 ON t.from_member_id = m1.id
            LEFT JOIN (SELECT m.id, u.name FROM members m JOIN users u ON m.user_id = u.id) m2 ON t.to_member_id = m2.id
            WHERE t.from_member_id IN (\${placeholders}) OR t.to_member_id IN (\${placeholders})
            ORDER BY t.created_at DESC
        \`;

        const transactions = db.prepare(query).all(...membershipIds, ...membershipIds);

        res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('getUserTransactions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
