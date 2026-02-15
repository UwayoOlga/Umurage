import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllUsers,
    getUserStats,
    updateUserRole,
    getAllGroups,
    getGroupDetails,
    getSystemAnalytics
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/stats', getUserStats);
router.patch('/users/:id/role', updateUserRole);

// Group management routes
router.get('/groups', getAllGroups);
router.get('/groups/:id', getGroupDetails);

// Analytics routes
router.get('/analytics', getSystemAnalytics);

export default router;
