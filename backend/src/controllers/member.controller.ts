import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getMyGroupMembers = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // Get all groups the user is a member of
        const groupIds = db.prepare('SELECT group_id FROM members WHERE user_id = ?').all(userId).map((m: any) => m.group_id);

        if (groupIds.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const placeholders = groupIds.map(() => '?').join(',');
        const query = `
            SELECT m.*, u.name, u.phone, g.name as group_name
            FROM members m
            JOIN users u ON m.user_id = u.id
            JOIN groups g ON m.group_id = g.id
            WHERE m.group_id IN (${placeholders})
            ORDER BY g.name ASC, u.name ASC
        `;

        const members = db.prepare(query).all(...groupIds);

        res.status(200).json({
            success: true,
            data: members
        });
    } catch (error) {
        console.error('getMyGroupMembers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
