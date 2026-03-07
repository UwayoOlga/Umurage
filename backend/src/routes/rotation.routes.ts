import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { startRotation, getRotationInfo, disbursePayout } from '../controllers/rotation.controller';

const router = Router();

router.use(authenticate);

// Start a new rotation for a group
router.post('/groups/:groupId/start', startRotation);

// Get current active rotation info for a group
router.get('/groups/:groupId', getRotationInfo);

// Disburse payout and advance turn
router.post('/groups/:groupId/disburse', disbursePayout);

export default router;
