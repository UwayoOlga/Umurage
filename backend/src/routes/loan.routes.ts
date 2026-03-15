import { Router } from 'express';
import { authenticate } from '../middleware/auth';

import { getUserLoans, applyForLoan, getPendingLoansForLeader, approveLoan, rejectLoan, repayLoan } from '../controllers/loan.controller';

const router = Router();

router.get('/', authenticate, getUserLoans);
router.post('/', authenticate, applyForLoan);
router.get('/pending', authenticate, getPendingLoansForLeader);  // Leaders: view all pending loans
router.patch('/:loanId/approve', authenticate, approveLoan);     // Leaders: approve a loan
router.patch('/:loanId/reject', authenticate, rejectLoan);       // Leaders: reject a loan
router.post('/:loanId/repay', authenticate, repayLoan);          // Members: repay a loan

export default router;
