import { Router } from 'express';
import { scheduleMeeting, getUserMeetings, startMeeting, getMeetingAttendance, updateAttendance, completeMeeting } from '../controllers/meeting.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // Ensure all routes are accessible by authenticated users only

router.post('/schedule', scheduleMeeting);
router.get('/', getUserMeetings);
router.put('/:id/start', startMeeting);
router.get('/:id/attendance', getMeetingAttendance);
router.put('/:id/attendance', updateAttendance);
router.put('/:id/complete', completeMeeting);

export default router;
