import { Router } from 'express';
import { authenticate } from '../middleware/auth';

import { getUserSavings, createSaving } from '../controllers/saving.controller';

const router = Router();

router.get('/', authenticate, getUserSavings);
router.post('/', authenticate, createSaving);

export default router;
