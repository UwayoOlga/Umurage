import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllUsers,
    getUserStats,
    updateUserRole,
    getAllGroups,
    getGroupDetails,
    getSystemAnalytics,
    getActivityFeed,
    getRiskAnalysis,
    createAdminAccount,
    getReports,
    downloadReport
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/stats', getUserStats);
router.patch('/users/:id/role', updateUserRole);
router.post('/create-user', createAdminAccount);

// Group management routes
router.get('/groups', getAllGroups);
router.get('/groups/:id', getGroupDetails);

// Analytics & Activity routes
router.get('/analytics', getSystemAnalytics);
router.get('/activity', getActivityFeed);
router.get('/risk-analysis', getRiskAnalysis);
router.get('/reports', getReports);
router.get('/reports/download', downloadReport);

export default router;
