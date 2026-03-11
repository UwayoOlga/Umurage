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

        // Calculate real-time collection progress
        // Total expected = amount_per_member * number of active members
        const activeMembersCount = db.prepare("SELECT count(*) as count FROM members WHERE group_id = ? AND status = 'active'").get(groupId) as any;
        const expectedTotal = rotation.amount_per_member * activeMembersCount.count;

        // Total collected = sum of savings for this group since the last rotation update (period start)
        const collectedData = db.prepare(`
            SELECT SUM(s.amount) as total
            FROM savings s
            JOIN members m ON s.member_id = m.id
            WHERE m.group_id = ? AND s.created_at >= ? AND s.type = 'regular'
        `).get(groupId, rotation.updated_at) as any;

        const totalCollected = collectedData?.total || 0;

        res.status(200).json({
            data: {
                ...rotation,
                queue: members,
                collection: {
                    totalCollected,
                    expectedTotal,
                    progressPercentage: expectedTotal > 0 ? Math.min(100, Math.round((totalCollected / expectedTotal) * 100)) : 0
                }
            }
        });
    } catch (error) {
        console.error('Get rotation info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const disbursePayout = async (req: any, res: any) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;

        const rotation = db.prepare(`
            SELECT r.*, g.contribution_frequency, m.rotation_order as current_order
            FROM rotations r
            JOIN groups g ON r.group_id = g.id
            JOIN members m ON r.current_turn_member_id = m.id
            WHERE r.group_id = ? AND r.status = 'active'
        `).get(groupId) as any;

        if (!rotation) return res.status(404).json({ error: 'No active rotation found' });

        // Check permission
        const memberCheck = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(groupId, userId) as any;
        if (!memberCheck || !['admin', 'treasurer'].includes(memberCheck.role)) {
            return res.status(403).json({ error: 'Only group admins or treasurers can disburse payouts' });
        }

        const nextOrder = rotation.current_order + 1;
        const nextMember = db.prepare('SELECT id FROM members WHERE group_id = ? AND rotation_order = ?').get(groupId, nextOrder) as any;

        const transaction = db.transaction(() => {
            // 1. Record share_out transaction
            db.prepare(`
                INSERT INTO transactions (group_id, type, amount, to_member_id, reference_id, reference_type, status, notes)
                VALUES (?, 'share_out', ?, ?, ?, 'rotation', 'completed', ?)
            `).run(groupId, rotation.amount_per_member * (db.prepare("SELECT count(*) as count FROM members WHERE group_id = ? AND status = 'active'").get(groupId) as any).count, rotation.current_turn_member_id, rotation.id, 'Monthly Ikimina payout disbursed');

            if (nextMember) {
                // Advance turn
                const currentPayoutDate = new Date(rotation.payout_date);
                let nextPayoutDate = new Date(currentPayoutDate);

                if (rotation.contribution_frequency === 'weekly') nextPayoutDate.setDate(currentPayoutDate.getDate() + 7);
                else if (rotation.contribution_frequency === 'biweekly') nextPayoutDate.setDate(currentPayoutDate.getDate() + 14);
                else if (rotation.contribution_frequency === 'monthly') nextPayoutDate.setMonth(currentPayoutDate.getMonth() + 1);

                db.prepare(`
                    UPDATE rotations 
                    SET current_turn_member_id = ?, payout_date = ?, updated_at = ? 
                    WHERE id = ?
                `).run(nextMember.id, nextPayoutDate.toISOString().split('T')[0], new Date().toISOString(), rotation.id);
            } else {
                // Complete cycle
                db.prepare("UPDATE rotations SET status = 'completed', updated_at = ? WHERE id = ?").run(new Date().toISOString(), rotation.id);
            }
        });

        transaction();

        res.status(200).json({ message: nextMember ? 'Payout disbursed and turn advanced!' : 'Final payout disbursed. Rotation completed!' });
    } catch (error) {
        console.error('Disburse payout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
