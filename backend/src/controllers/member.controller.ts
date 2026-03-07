import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// Get all members of a specific group (for the community detail page)
export const getGroupMemberList = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = req.user!.id;

        // Verify requester is a member of this group
        const membership = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(groupId, userId) as any;
        if (!membership) throw new AppError('You are not a member of this group.', 403);

        const members = db.prepare(`
            SELECT m.id, m.user_id, m.role, m.status, m.rotation_order, m.joined_at,
                   u.name, u.phone
            FROM members m
            JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ?
            ORDER BY 
                CASE m.role WHEN 'admin' THEN 1 WHEN 'secretary' THEN 2 WHEN 'treasurer' THEN 3 ELSE 4 END,
                u.name ASC
        `).all(groupId);

        res.status(200).json({ success: true, data: members, myRole: membership.role });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Promote or demote a member's role within a group
export const promoteRole = async (req: AuthRequest, res: Response) => {
    try {
        const { memberId } = req.params;
        const { newRole } = req.body;
        const userId = req.user!.id;

        const validRoles = ['admin', 'secretary', 'treasurer', 'member'];
        if (!validRoles.includes(newRole)) {
            throw new AppError('Invalid role. Must be one of: admin, secretary, treasurer, member', 400);
        }

        // Get the target member
        const targetMember = db.prepare('SELECT id, group_id, user_id, role FROM members WHERE id = ?').get(memberId) as any;
        if (!targetMember) throw new AppError('Member not found', 404);

        // Only the group admin (Chairperson) can change roles
        const requester = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(targetMember.group_id, userId) as any;
        if (!requester || requester.role !== 'admin') {
            throw new AppError('Only the Chairperson (admin) can promote or demote members.', 403);
        }

        // Can't change your own role
        if (targetMember.user_id === userId) {
            throw new AppError('You cannot change your own role.', 400);
        }

        db.prepare('UPDATE members SET role = ? WHERE id = ?').run(newRole, memberId);

        res.status(200).json({ success: true, message: `Member role updated to ${newRole}` });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
        console.error('promoteRole error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

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
