import { Router } from 'express';
import { authenticate } from '../middleware/auth';

import { getUserSavings } from '../controllers/saving.controller';

const router = Router();

router.get('/', authenticate, getUserSavings);

export default router;
