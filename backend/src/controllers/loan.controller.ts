import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getUserLoans = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const query = `
            SELECT l.*, g.name as group_name
            FROM loans l
            JOIN members m ON l.member_id = m.id
            JOIN groups g ON m.group_id = g.id
            WHERE m.user_id = ?
            ORDER BY l.created_at DESC
        `;

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

// Get all pending loans across all groups where the user is a Treasurer or Admin
export const getPendingLoansForLeader = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // Get all groups where this user is a treasurer or admin
        const leaderGroups = db.prepare(`
            SELECT group_id FROM members 
            WHERE user_id = ? AND role IN ('admin', 'treasurer') AND status = 'active'
        `).all(userId).map((m: any) => m.group_id);

        if (leaderGroups.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const placeholders = leaderGroups.map(() => '?').join(',');
        const loans = db.prepare(`
            SELECT l.*, u.name as applicant_name, u.phone as applicant_phone, g.name as group_name
            FROM loans l
            JOIN members m ON l.member_id = m.id
            JOIN users u ON m.user_id = u.id
            JOIN groups g ON m.group_id = g.id
            WHERE l.status = 'pending' AND m.group_id IN (${placeholders})
            ORDER BY l.created_at ASC
        `).all(...leaderGroups);

        res.status(200).json({ success: true, data: loans });
    } catch (error) {
        console.error('getPendingLoansForLeader error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const approveLoan = async (req: AuthRequest, res: Response) => {
    try {
        const { loanId } = req.params;
        const userId = req.user!.id;

        const loan = db.prepare(`
            SELECT l.*, m.group_id, m.id as member_id
            FROM loans l JOIN members m ON l.member_id = m.id
            WHERE l.id = ?
        `).get(loanId) as any;

        if (!loan) throw new AppError('Loan not found', 404);
        if (loan.status !== 'pending') throw new AppError(`Loan is already ${loan.status}`, 400);

        // Only treasurer or admin of that group can approve
        const leaderCheck = db.prepare(
            'SELECT role FROM members WHERE group_id = ? AND user_id = ? AND status = "active"'
        ).get(loan.group_id, userId) as any;

        if (!leaderCheck || !['admin', 'treasurer'].includes(leaderCheck.role)) {
            throw new AppError('Only the Treasurer or Chairperson can approve loans.', 403);
        }

        const now = new Date().toISOString();

        // Use a transaction: approve loan + create disbursement transaction record
        db.transaction(() => {
            db.prepare(`
                UPDATE loans SET status = 'approved', approved_by = ?, approved_at = ?, 
                disbursed_at = ?, updated_at = ? WHERE id = ?
            `).run(userId, now, now, now, loanId);

            // Create a disbursement transaction for the audit ledger
            db.prepare(`
                INSERT INTO transactions (group_id, type, amount, to_member_id, reference_id, reference_type, status, notes)
                VALUES (?, 'loan_disbursement', ?, ?, ?, 'loan', 'completed', ?)
            `).run(loan.group_id, loan.amount, loan.member_id, loanId, `Loan disbursed to member. Approved by leader.`);
        })();

        res.status(200).json({ success: true, message: 'Loan approved and disbursed successfully.' });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
        console.error('approveLoan error:', error);
        res.status(500).json({ success: false, message: 'Server error approving loan' });
    }
};

export const rejectLoan = async (req: AuthRequest, res: Response) => {
    try {
        const { loanId } = req.params;
        const { reason } = req.body;
        const userId = req.user!.id;

        const loan = db.prepare(`
            SELECT l.*, m.group_id FROM loans l JOIN members m ON l.member_id = m.id WHERE l.id = ?
        `).get(loanId) as any;

        if (!loan) throw new AppError('Loan not found', 404);
        if (loan.status !== 'pending') throw new AppError(`Loan is already ${loan.status}`, 400);

        const leaderCheck = db.prepare(
            'SELECT role FROM members WHERE group_id = ? AND user_id = ? AND status = "active"'
        ).get(loan.group_id, userId) as any;

        if (!leaderCheck || !['admin', 'treasurer'].includes(leaderCheck.role)) {
            throw new AppError('Only the Treasurer or Chairperson can reject loans.', 403);
        }

        const now = new Date().toISOString();
        db.prepare(`UPDATE loans SET status = 'rejected', approved_by = ?, updated_at = ? WHERE id = ?`)
            .run(userId, now, loanId);

        res.status(200).json({ success: true, message: 'Loan application rejected.' });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
        console.error('rejectLoan error:', error);
        res.status(500).json({ success: false, message: 'Server error rejecting loan' });
    }
};

export const applyForLoan = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { groupId, amount, purpose, durationMonths = 1 } = req.body;

        if (!groupId || !amount || amount <= 0) {
            throw new AppError('Group ID and a positive amount are required', 400);
        }

        // 1. Verify membership
        const member = db.prepare('SELECT id FROM members WHERE user_id = ? AND group_id = ? AND status = "active"')
            .get(userId, groupId) as any;

        if (!member) {
            throw new AppError('Active membership not found in this group', 403);
        }

        // 2. Mock AI Credit Score (Random between 60-95 for demonstration)
        const aiScore = Math.floor(Math.random() * (95 - 60 + 1)) + 60;

        // 3. Create Loan Request
        const stmt = db.prepare(`
            INSERT INTO loans (member_id, amount, purpose, status, ai_score, due_date)
            VALUES (?, ?, ?, 'pending', ?, date('now', '+' || ? || ' months'))
            RETURNING id
        `);

        const { id: loanId } = stmt.get(member.id, amount, purpose, aiScore, durationMonths) as any;

        res.status(201).json({
            success: true,
            message: 'Loan application submitted successfully',
            data: { loanId, aiScore }
        });

    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('applyForLoan error:', error);
        res.status(500).json({ success: false, message: 'Server error processing loan application' });
    }
};
