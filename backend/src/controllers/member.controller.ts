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

export const approveMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const member = db.prepare('SELECT group_id, status FROM members WHERE id = ?').get(id) as any;
        if (!member) throw new AppError('Member request not found', 404);

        const leader = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(member.group_id, userId) as any;
        if (!leader || !['admin', 'secretary'].includes(leader.role)) {
            throw new AppError('Only Admins or Secretaries can approve members.', 403);
        }

        db.prepare('UPDATE members SET status = ? WHERE id = ?').run('active', id);

        res.status(200).json({ success: true, message: 'Member approved successfully' });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const rejectMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const member = db.prepare('SELECT group_id, status FROM members WHERE id = ?').get(id) as any;
        if (!member) throw new AppError('Member request not found', 404);

        const leader = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(member.group_id, userId) as any;
        if (!leader || !['admin', 'secretary'].includes(leader.role)) {
            throw new AppError('Only Admins or Secretaries can reject members.', 403);
        }

        db.prepare('DELETE FROM members WHERE id = ?').run(id);

        res.status(200).json({ success: true, message: 'Member request rejected' });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
