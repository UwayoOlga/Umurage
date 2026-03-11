import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { name, rcaNumber, description, contributionAmount, contributionFrequency, modelType, saccoAccountNumber, saccoId, penaltyAmount = 500 } = req.body;

        if (!name || !rcaNumber || !contributionAmount || !contributionFrequency || !modelType) {
            throw new AppError('Name, RCA Number, contribution amount, frequency, and model type are required', 400);
        }

        // Enforce global admin Check for creating official RCA communities
        const currentUser = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
        if (!currentUser || currentUser.role !== 'admin') {
            throw new AppError('Only system administrators can register an official RCA Community.', 403);
        }

        // 1. Create the group
        const executeTransaction = db.transaction(() => {
            const groupStmt = db.prepare(`
                INSERT INTO groups (name, rca_number, description, admin_id, contribution_amount, contribution_frequency, model_type, sacco_account_number, sacco_id, penalty_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
            `);
            const { id: groupId } = groupStmt.get(name, rcaNumber, description || '', userId, contributionAmount, contributionFrequency, modelType, saccoAccountNumber, saccoId, penaltyAmount) as any;

            // 2. Add creator as the first member (admin role)
            const memberStmt = db.prepare(`
                INSERT INTO members (group_id, user_id, role, status)
                VALUES (?, ?, 'admin', 'active')
            `);
            memberStmt.run(groupId, userId);

            return groupId;
        });

        const groupId = executeTransaction();

        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: { groupId }
        });

    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('createGroup error:', error);
        res.status(500).json({ success: false, message: 'Server error creating group' });
    }
};

export const getMyGroups = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const query = `
            SELECT g.*, m.role, m.joined_at, m.status as member_status
            FROM groups g
            JOIN members m ON g.id = m.group_id
            WHERE m.user_id = ?
            ORDER BY g.created_at DESC
        `;

        const groups = db.prepare(query).all(userId);

        res.status(200).json({
            success: true,
            data: groups
        });
    } catch (error) {
        console.error('getMyGroups error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching groups' });
    }
};

export const getGroupById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        // Verify membership
        const membership = db.prepare('SELECT id, role FROM members WHERE group_id = ? AND user_id = ?').get(id, userId);
        if (!membership) {
            throw new AppError('Access denied. You are not a member of this group.', 403);
        }

        const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);

        if (!group) {
            throw new AppError('Group not found', 404);
        }

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('getGroupById error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching group details' });
    }
};

export const joinGroup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { nationalId, rcaNumber, communityName } = req.body;

        if (!nationalId || !rcaNumber || !communityName) {
            throw new AppError('National ID, RCA Registration Number, and Community Name are required to join.', 400);
        }

        // Verify national ID matches the current user
        const user = db.prepare('SELECT national_id FROM users WHERE id = ?').get(userId) as any;
        if (!user || user.national_id !== nationalId) {
            throw new AppError('The provided National ID does not match your registered account.', 400);
        }

        // Find the community
        const group = db.prepare('SELECT id, name FROM groups WHERE rca_number = ?').get(rcaNumber) as any;
        if (!group) {
            throw new AppError('No community found with this official RCA Registration Number.', 404);
        }

        // Strict match on names
        if (group.name.toLowerCase().trim() !== communityName.toLowerCase().trim()) {
            throw new AppError('The Community Name does not match the RCA Number on record.', 400);
        }

        // Check if already a member
        const existingMember = db.prepare('SELECT id FROM members WHERE group_id = ? AND user_id = ?').get(group.id, userId);
        if (existingMember) {
            throw new AppError('You are already a member of this community.', 409);
        }

        // Add user as member with pending status
        db.prepare(`
            INSERT INTO members (group_id, user_id, role, status)
            VALUES (?, ?, 'member', 'pending')
        `).run(group.id, userId);

        res.status(200).json({
            success: true,
            message: 'Successfully joined the community!',
            data: { groupId: group.id }
        });

    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Server error joining community.' });
    }
};

export const getGroupFinancialSummary = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        // Verify membership
        const membership = db.prepare('SELECT id FROM members WHERE group_id = ? AND user_id = ?').get(id, userId);
        if (!membership) {
            throw new AppError('Access denied.', 403);
        }

        const summary: any = {};

        // 1. Total Contributions
        const contributions = db.prepare(`
            SELECT SUM(amount) as total FROM transactions 
            WHERE group_id = ? AND type = 'contribution' AND status = 'completed'
        `).get(id) as any;
        summary.totalContributions = contributions.total || 0;

        // 2. Total Loans Disbursed
        const loans = db.prepare(`
            SELECT SUM(amount) as total FROM transactions 
            WHERE group_id = ? AND type = 'loan_disbursement' AND status = 'completed'
        `).get(id) as any;
        summary.totalLoansDisbursed = loans.total || 0;

        // 3. Total Loan Repayments
        const repayments = db.prepare(`
            SELECT SUM(amount) as total FROM transactions 
            WHERE group_id = ? AND type = 'loan_repayment' AND status = 'completed'
        `).get(id) as any;
        summary.totalLoanRepayments = repayments.total || 0;

        // 4. Total Penalties
        const penalties = db.prepare(`
            SELECT SUM(amount) as total FROM transactions 
            WHERE group_id = ? AND type = 'penalty' AND status = 'completed'
        `).get(id) as any;
        summary.totalPenalties = penalties.total || 0;

        // 5. Active Members
        const members = db.prepare(`
            SELECT COUNT(*) as count FROM members 
            WHERE group_id = ? AND status = 'active'
        `).get(id) as any;
        summary.activeMemberCount = members.count || 0;

        // 6. Current Bank/Cash Balance (simplified)
        // Group Balance = Contributions + Repayments + Penalties - Disbursements
        summary.currentBalance = summary.totalContributions + summary.totalLoanRepayments + summary.totalPenalties - summary.totalLoansDisbursed;

        // 7. My Financials
        const myFinancials = db.prepare(`
            SELECT 
                (SELECT SUM(amount) FROM savings WHERE member_id = m.id AND type = 'regular') as my_savings,
                (SELECT SUM(amount) FROM transactions WHERE from_member_id = m.id AND type = 'penalty') as my_penalties,
                (SELECT COUNT(*) FROM loans WHERE member_id = m.id AND status NOT IN ('repaid', 'rejected')) as my_active_loans
            FROM members m
            WHERE m.id = ?
        `).get((membership as any).id) as any;

        summary.myStats = {
            savings: myFinancials.my_savings || 0,
            penalties: myFinancials.my_penalties || 0,
            activeLoans: myFinancials.my_active_loans || 0
        };

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
        console.error('getGroupFinancialSummary error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching group summary' });
    }
};
