import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getUserSavings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const query = \`
            SELECT s.*, g.name as group_name
            FROM savings s
            JOIN members m ON s.member_id = m.id
            JOIN groups g ON m.group_id = g.id
            WHERE m.user_id = ?
            ORDER BY s.date DESC
        \`;

        const savings = db.prepare(query).all(userId);

        // Calculate summary
        const summary = db.prepare(\`
            SELECT SUM(amount) as total_savings
            FROM savings s
            JOIN members m ON s.member_id = m.id
            WHERE m.user_id = ?
        \`).get(userId) as any;

        res.status(200).json({
            success: true,
            data: {
                savings,
                total: summary?.total_savings || 0
            }
        });
    } catch (error) {
        console.error('getUserSavings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
