import { Router } from 'express';
import { authenticate } from '../middleware/auth';

import { getMyGroupMembers, approveMember, rejectMember } from '../controllers/member.controller';

const router = Router();

router.get('/', authenticate, getMyGroupMembers);
router.patch('/:id/approve', authenticate, approveMember);
router.delete('/:id/reject', authenticate, rejectMember);

export default router;
