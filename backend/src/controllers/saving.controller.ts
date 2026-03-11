import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getUserSavings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const query = `
            SELECT s.*, g.name as group_name
            FROM savings s
            JOIN members m ON s.member_id = m.id
            JOIN groups g ON m.group_id = g.id
            WHERE m.user_id = ?
            ORDER BY s.date DESC
        `;

        const savings = db.prepare(query).all(userId);

        // Calculate summary
        const summary = db.prepare(`
            SELECT SUM(amount) as total_savings
            FROM savings s
            JOIN members m ON s.member_id = m.id
            WHERE m.user_id = ?
        `).get(userId) as any;

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

export const createSaving = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { groupId, amount, type = 'regular', paymentMethod, notes, transactionRef } = req.body;

        if (!groupId || !amount || amount <= 0) {
            throw new AppError('Group ID and a positive amount are required', 400);
        }

        // 1. Verify membership
        const member = db.prepare("SELECT id, group_id FROM members WHERE user_id = ? AND group_id = ? AND status = 'active'")
            .get(userId, groupId) as any;

        if (!member) {
            throw new AppError('Active membership not found in this group', 403);
        }

        // 2. Wrap in transaction
        const executeTransaction = db.transaction(() => {
            // Create saving record
            const savingStmt = db.prepare(`
                INSERT INTO savings (member_id, amount, type, payment_method, notes, transaction_ref)
                VALUES (?, ?, ?, ?, ?, ?)
                RETURNING id
            `);
            const { id: savingId } = savingStmt.get(member.id, amount, type, paymentMethod, notes, transactionRef) as any;

            // Create transaction record for audit
            const transStmt = db.prepare(`
                INSERT INTO transactions (group_id, type, amount, from_member_id, reference_id, reference_type, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            transStmt.run(groupId, 'contribution', amount, member.id, savingId, 'saving', 'completed', notes);

            return savingId;
        });

        const savingId = executeTransaction();

        res.status(201).json({
            success: true,
            message: 'Contribution recorded successfully',
            data: { savingId }
        });

    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('createSaving error:', error);
        res.status(500).json({ success: false, message: 'Server error recording contribution' });
    }
};
