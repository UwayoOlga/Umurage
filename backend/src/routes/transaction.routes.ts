import { Router } from 'express';
import { authenticate } from '../middleware/auth';

import { getUserTransactions } from '../controllers/transaction.controller';

const router = Router();

router.get('/', authenticate, getUserTransactions);

export default router;
