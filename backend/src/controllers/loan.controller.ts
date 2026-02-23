import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getUserLoans = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const query = \`
            SELECT l.*, g.name as group_name
            FROM loans l
            JOIN members m ON l.member_id = m.id
            JOIN groups g ON m.group_id = g.id
            WHERE m.user_id = ?
            ORDER BY l.created_at DESC
        \`;

        const loans = db.prepare(query).all(userId);

        res.status(200).json({
            success: true,
            data: loans
        });
    } catch (error) {
        console.error('getUserLoans error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
