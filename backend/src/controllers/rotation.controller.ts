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

        // Fetch the queue (members sorted by rotation order) with payment status for the current turn
        const queue = db.prepare(`
            SELECT 
                m.id as member_id, 
                m.user_id, 
                u.name, 
                m.rotation_order, 
                m.status,
                EXISTS (
                    SELECT 1 FROM savings s 
                    WHERE s.member_id = m.id 
                    AND s.type = 'regular' 
                    AND s.created_at >= ?
                ) as has_paid
            FROM members m
            JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ? AND m.rotation_order IS NOT NULL
            ORDER BY m.rotation_order ASC
        `).all(rotation.updated_at, groupId);

        res.status(200).json({
            data: {
                ...rotation,
                queue,
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
            SELECT r.*, g.contribution_frequency, g.penalty_amount, m.rotation_order as current_order
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

                // 2. Automate Penalties: Find everyone who hasn't paid in this turn
                const unpaidMembers = db.prepare(`
                    SELECT m.id 
                    FROM members m
                    WHERE m.group_id = ? AND m.status = 'active'
                    AND NOT EXISTS (
                        SELECT 1 FROM savings s 
                        WHERE s.member_id = m.id 
                        AND s.type = 'regular' 
                        AND s.created_at >= ?
                    )
                `).all(groupId, rotation.updated_at) as any[];

                const penaltyAmount = rotation.penalty_amount || 500;
                const insertPenalty = db.prepare(`
                    INSERT INTO savings (member_id, amount, type, notes)
                    VALUES (?, ?, 'penalty', ?)
                `);

                unpaidMembers.forEach(m => {
                    insertPenalty.run(m.id, penaltyAmount, `Auto-penalty: Missed contribution for turn ending ${new Date().toLocaleDateString()}`);
                });

                db.prepare(`
                    UPDATE rotations 
                    SET current_turn_member_id = ?, payout_date = ?, updated_at = datetime('now') 
                    WHERE id = ?
                `).run(nextMember.id, nextPayoutDate.toISOString().split('T')[0], rotation.id);
            } else {
                // Complete cycle
                db.prepare("UPDATE rotations SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(rotation.id);
            }
        });

        transaction();

        res.status(200).json({ message: nextMember ? 'Payout disbursed and turn advanced!' : 'Final payout disbursed. Rotation completed!' });
    } catch (error) {
        console.error('Disburse payout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const requestEmergencySwap = async (req: any, res: any) => {
    try {
        const { groupId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const member = db.prepare('SELECT id FROM members WHERE group_id = ? AND user_id = ?').get(groupId, userId) as any;
        if (!member) return res.status(403).json({ error: 'You are not a member of this group' });

        // Check for active rotation
        const rotation = db.prepare('SELECT id FROM rotations WHERE group_id = ? AND status = ?').get(groupId, 'active');
        if (!rotation) return res.status(400).json({ error: 'No active rotation cycle found' });

        // Check if member is already a recipient (turn passed)
        const currentRot = db.prepare(`
            SELECT m.rotation_order as current_ord, (SELECT rotation_order FROM members WHERE id = ?) as my_ord
            FROM rotations r
            JOIN members m ON r.current_turn_member_id = m.id
            WHERE r.group_id = ? AND r.status = 'active'
        `).get(member.id, groupId) as any;

        if (currentRot.my_ord <= currentRot.current_ord) {
            return res.status(400).json({ error: 'You have already received your payout or are currently receiving it.' });
        }

        // Check if already has a pending request
        const existing = db.prepare('SELECT id FROM rotation_requests WHERE group_id = ? AND member_id = ? AND status = ?')
            .get(groupId, member.id, 'pending');
        if (existing) return res.status(400).json({ error: 'You already have a pending swap request' });

        db.prepare(`
            INSERT INTO rotation_requests (group_id, member_id, type, reason)
            VALUES (?, ?, 'emergency_swap', ?)
        `).run(groupId, member.id, reason);

        res.status(201).json({ message: 'Emergency swap request submitted successfully. Awaiting approval from group leaders.' });
    } catch (error) {
        console.error('Request swap error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPendingRequests = async (req: any, res: any) => {
    try {
        const { groupId } = req.params;
        const requests = db.prepare(`
            SELECT rr.*, u.name as member_name, m.rotation_order
            FROM rotation_requests rr
            JOIN members m ON rr.member_id = m.id
            JOIN users u ON m.user_id = u.id
            WHERE rr.group_id = ? AND rr.status = 'pending'
            ORDER BY rr.created_at ASC
        `).all(groupId);

        res.status(200).json({ data: requests });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const handleSwapRequest = async (req: any, res: any) => {
    try {
        const { groupId, requestId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        const userId = req.user.id;

        const leaderCheck = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(groupId, userId) as any;
        if (!leaderCheck || !['admin', 'secretary'].includes(leaderCheck.role)) {
            return res.status(403).json({ error: 'Only group admins or secretaries can approve swaps' });
        }

        const request = db.prepare('SELECT * FROM rotation_requests WHERE id = ?').get(requestId) as any;
        if (!request) return res.status(404).json({ error: 'Request not found' });

        if (action === 'reject') {
            db.prepare('UPDATE rotation_requests SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('rejected', requestId);
            return res.status(200).json({ message: 'Request rejected' });
        }

        // Logic for Approve: Swap Requester with Current Recipient
        const executeSwap = db.transaction(() => {
            const rotation = db.prepare('SELECT current_turn_member_id FROM rotations WHERE group_id = ? AND status = ?').get(groupId, 'active') as any;
            if (!rotation) throw new Error('No active rotation');

            const requester = db.prepare('SELECT id, rotation_order FROM members WHERE id = ?').get(request.member_id) as any;
            const current = db.prepare('SELECT id, rotation_order FROM members WHERE id = ?').get(rotation.current_turn_member_id) as any;

            // Swap orders
            db.prepare('UPDATE members SET rotation_order = ? WHERE id = ?').run(requester.rotation_order, current.id);
            db.prepare('UPDATE members SET rotation_order = ? WHERE id = ?').run(current.rotation_order, requester.id);

            // Set requester as current turn holder
            db.prepare('UPDATE rotations SET current_turn_member_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(requester.id, rotation.id);

            // Mark request as approved
            db.prepare('UPDATE rotation_requests SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('approved', requestId);
        });

        executeSwap();
        res.status(200).json({ message: 'Swap approved! The requester is now next in line for the payout.' });
    } catch (error: any) {
        console.error('Handle swap error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getRotationHistory = async (req: any, res: any) => {
    try {
        const { groupId } = req.params;

        const history = db.prepare(`
            SELECT 
                r.id,
                r.amount_per_member,
                r.created_at as start_date,
                r.updated_at as completion_date,
                (SELECT count(*) FROM members WHERE group_id = r.group_id) as member_count,
                (SELECT count(*) FROM transactions WHERE reference_type = 'rotation' AND reference_id = r.id AND type = 'share_out') as payouts_made,
                (SELECT SUM(amount) FROM transactions WHERE reference_type = 'rotation' AND reference_id = r.id AND type = 'share_out') as total_disbursed
            FROM rotations r
            WHERE r.group_id = ? AND r.status = 'completed'
            ORDER BY r.updated_at DESC
        `).all(groupId);

        res.status(200).json({ data: history });
    } catch (error) {
        console.error('Get rotation history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

