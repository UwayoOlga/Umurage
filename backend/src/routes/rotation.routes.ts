import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { startRotation, getRotationInfo, disbursePayout, requestEmergencySwap, getPendingRequests, handleSwapRequest, getRotationHistory } from '../controllers/rotation.controller';

const router = Router();

router.use(authenticate);

// Start a new rotation for a group
router.post('/groups/:groupId/start', startRotation);

// Get current active rotation info for a group
router.get('/groups/:groupId', getRotationInfo);

// Disburse payout and advance turn
router.post('/groups/:groupId/disburse', disbursePayout);

// Emergency Swap Request
router.post('/groups/:groupId/swaps/request', requestEmergencySwap);
router.get('/groups/:groupId/swaps/pending', getPendingRequests);
router.patch('/groups/:groupId/swaps/:requestId', handleSwapRequest);

// Cycle History
router.get('/groups/:groupId/history', getRotationHistory);

export default router;
