import { Router } from 'express';
import { authenticate } from '../middleware/auth';

import { getUserLoans, applyForLoan } from '../controllers/loan.controller';

const router = Router();

router.get('/', authenticate, getUserLoans);
router.post('/', authenticate, applyForLoan);

export default router;
