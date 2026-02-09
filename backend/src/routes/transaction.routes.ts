import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res) => {
    res.json({ message: 'Transactions routes - to be implemented' });
});

export default router;
