import { Router } from 'express';
import { authenticate } from '../middleware/auth';

import { getUserLoans } from '../controllers/loan.controller';

const router = Router();

router.get('/', authenticate, getUserLoans);

export default router;
