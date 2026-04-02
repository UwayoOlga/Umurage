import { Router } from 'express';
import { governanceController } from '../controllers/governance.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Governance (Leadership Transitions)
router.post('/election/start', authenticate, governanceController.startElection);
router.post('/election/nominate', authenticate, governanceController.nominateCandidate);
router.post('/election/vote', authenticate, governanceController.castVote);
router.get('/election/:groupId/open', authenticate, governanceController.getOpenElection);
router.get('/election/:electionId', authenticate, governanceController.getElectionDetails);

export default router;
