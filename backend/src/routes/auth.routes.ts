import { Router } from 'express';
import { register, login, refreshToken, logout, getMe, claimStaffId, setupAccount, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/claim-staff-id', authenticate, claimStaffId); // Staff ID verification
router.post('/setup-account', setupAccount); // Finalize admin account
router.post('/change-password', authenticate, changePassword); // Update password

export default router;
