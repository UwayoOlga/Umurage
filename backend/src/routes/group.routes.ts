import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createGroup, getMyGroups, getGroupById, joinGroup } from '../controllers/group.controller';

const router = Router();

router.get('/', authenticate, getMyGroups);
router.get('/:id', authenticate, getGroupById);
router.post('/', authenticate, createGroup);
router.post('/join', authenticate, joinGroup);

export default router;
