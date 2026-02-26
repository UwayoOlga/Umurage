import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createGroup, getMyGroups, getGroupById } from '../controllers/group.controller';

const router = Router();

router.get('/', authenticate, getMyGroups);
router.get('/:id', authenticate, getGroupById);
router.post('/', authenticate, createGroup);

export default router;
