import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import db from '../config/database';

export const startRotation = async (req: any, res: any) => {
    try {
        const { groupId } = req.params;
        const { amountPerMember, payoutDate } = req.body;
        const userId = req.user?.id;

        if (!amountPerMember || !payoutDate) {
            return res.status(400).json({ error: 'amountPerMember and payoutDate are required' });
        }

        // Verify group exists and user is admin
        const group = db.prepare('SELECT id, admin_id FROM groups WHERE id = ?').get(groupId) as any;

        if (!group) return res.status(404).json({ error: 'Group not found' });

        const memberCheck = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(groupId, userId) as any;
        if (!memberCheck || (memberCheck.role !== 'admin' && memberCheck.role !== 'secretary')) {
            return res.status(403).json({ error: 'Only group admins or secretaries can start a rotation' });
        }

        // Check if a rotation is already active
        const existingRotation = db.prepare('SELECT id FROM rotations WHERE group_id = ? AND status = ?').get(groupId, 'active') as any;
        if (existingRotation) {
            return res.status(400).json({ error: 'There is already an active rotation for this group' });
        }

        // Get all active members
        const members = db.prepare('SELECT id FROM members WHERE group_id = ? AND status = ?').all(groupId, 'active') as any[];

        if (members.length === 0) {
            return res.status(400).json({ error: 'Cannot start rotation in an empty group' });
        }

        // Shuffle members
        for (let i = members.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [members[i], members[j]] = [members[j], members[i]];
        }

        // Use transaction to update rotation_order and create rotation
        const transaction = db.transaction(() => {
            const updateMember = db.prepare('UPDATE members SET rotation_order = ? WHERE id = ?');
            members.forEach((member, index) => {
                const order = index + 1;
                updateMember.run(order, member.id);
                // Attach the order manually for our next step
                member.rotation_order = order;
            });

            // The first person in the queue gets the first turn
            const firstMember = members.find(m => m.rotation_order === 1);

            const insertRotation = db.prepare(`
                INSERT INTO rotations (group_id, current_turn_member_id, amount_per_member, payout_date, status)
                VALUES (?, ?, ?, ?, 'active')
            `);

            const result = insertRotation.run(groupId, firstMember.id, amountPerMember, payoutDate);
            return result.lastInsertRowid; // Or just return success
        });

        transaction();

        res.status(200).json({ message: 'Rotation started successfully!' });
    } catch (error) {
        console.error('Start rotation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRotationInfo = async (req: any, res: any) => {
    try {
        const { groupId } = req.params;

        const rotation = db.prepare(`
            SELECT r.*, m.user_id as current_member_user_id, u.name as current_member_name
            FROM rotations r
            LEFT JOIN members m ON r.current_turn_member_id = m.id
            LEFT JOIN users u ON m.user_id = u.id
            WHERE r.group_id = ? AND r.status = 'active'
        `).get(groupId) as any;

        if (!rotation) {
            return res.status(200).json({ data: null });
        }

        // Get the queue
        const members = db.prepare(`
            SELECT m.id as member_id, m.rotation_order, u.name, u.id as user_id 
            FROM members m
            JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ? AND m.rotation_order IS NOT NULL AND m.status = 'active'
            ORDER BY m.rotation_order ASC
        `).all(groupId) as any[];

        res.status(200).json({
            data: {
                ...rotation,
                queue: members
            }
        });
    } catch (error) {
        console.error('Get rotation info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
