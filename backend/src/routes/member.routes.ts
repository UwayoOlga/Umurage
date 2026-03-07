import { Router } from 'express';
import { authenticate } from '../middleware/auth';

import { getMyGroupMembers, approveMember, rejectMember, getGroupMemberList, promoteRole } from '../controllers/member.controller';

const router = Router();

router.get('/', authenticate, getMyGroupMembers);
router.get('/group/:groupId', authenticate, getGroupMemberList);      // All members of a specific group
router.patch('/:id/approve', authenticate, approveMember);
router.delete('/:id/reject', authenticate, rejectMember);
router.patch('/:memberId/role', authenticate, promoteRole);           // Promote / demote a member's role

export default router;
