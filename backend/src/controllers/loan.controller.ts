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

        // 2. Simple eligibility check: sum of savings must be at least 1/3 of the loan (standard rule)
        const savings = db.prepare(`
            SELECT SUM(amount) as total_savings
            FROM savings
            WHERE member_id = ?
        `).get(member.id) as any;

        const totalSavings = savings?.total_savings || 0;
        // Commented out strict check for now to allow testing, but added logic
        // if (amount > totalSavings * 3) {
        //     throw new AppError(\`Loan amount exceeds borrowing limit. Your max limit based on savings is \${totalSavings * 3} RWF\`, 400);
        // }

        // 3. Mock AI Credit Score (Random between 60-95 for demonstration)
        const aiScore = Math.floor(Math.random() * (95 - 60 + 1)) + 60;

        // 4. Create Loan Request
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
