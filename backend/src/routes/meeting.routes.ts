import { Router } from 'express';
import { scheduleMeeting, getUserMeetings, startMeeting } from '../controllers/meeting.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // Ensure all routes are accessible by authenticated users only

router.post('/schedule', scheduleMeeting);
router.get('/', getUserMeetings);
router.put('/:id/start', startMeeting);
// router.put('/:id/complete', completeMeeting); // Can be added later
// router.put('/:id/attendance', updateAttendance); // Can be added later

export default router;
