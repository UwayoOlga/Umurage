import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const scheduleMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const { group_id, scheduled_for, async_cutoff_time, location } = req.body;

        // Ensure user is a leader of the group
        const leaderCheck = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(group_id, req.user!.id);
        if (!leaderCheck || !['admin', 'secretary', 'treasurer'].includes((leaderCheck as any).role)) {
            return res.status(403).json({ success: false, message: 'Only group leaders can schedule meetings.' });
        }

        const stmt = db.prepare(`
            INSERT INTO meetings (group_id, scheduled_for, async_cutoff_time, location, status) 
            VALUES (?, ?, ?, ?, 'SCHEDULED')
        `);
        const result = stmt.run(group_id, scheduled_for, async_cutoff_time, location);

        // Pre-populate attendance list with all current group members as 'PRESENT'
        const members = db.prepare("SELECT id FROM members WHERE group_id = ? AND status = 'active'").all(group_id);
        const meetingId = db.prepare('SELECT id FROM meetings WHERE rowid = ?').get(result.lastInsertRowid);

        const attendanceStmt = db.prepare('INSERT INTO attendance (meeting_id, member_id, status) VALUES (?, ?, "PRESENT")');
        const insertAttendance = db.transaction((membersList) => {
            for (const member of membersList) {
                attendanceStmt.run((meetingId as any).id, (member as any).id);
            }
        });
        insertAttendance(members);

        res.status(201).json({ success: true, message: 'Meeting scheduled successfully.', data: { id: (meetingId as any).id } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserMeetings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // Find all groups the user is a member of
        const membershipIds = db.prepare('SELECT group_id FROM members WHERE user_id = ?').all(userId).map((m: any) => m.group_id);

        if (membershipIds.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const placeholders = membershipIds.map(() => '?').join(',');

        const stmt = db.prepare(`
            SELECT * FROM meetings 
            WHERE group_id IN (${placeholders}) 
            ORDER BY scheduled_for DESC
        `);
        const meetings = stmt.all(...membershipIds);

        res.status(200).json({ success: true, data: meetings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const startMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const meeting: any = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });

        const leaderCheck = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(meeting.group_id, req.user!.id);
        if (!leaderCheck || !['admin', 'secretary', 'treasurer'].includes((leaderCheck as any).role)) {
            return res.status(403).json({ success: false, message: 'Only group leaders can start the meeting.' });
        }

        db.prepare('UPDATE meetings SET status = "ACTIVE" WHERE id = ?').run(id);

        // Auto-generate agenda items based on pending loans and new contributions
        // E.g., add summary of total savings made before async_cutoff_time
        const agendaStmt = db.prepare('INSERT INTO agenda_items (meeting_id, type, description) VALUES (?, ?, ?)');
        agendaStmt.run(id, 'CONTRIBUTION_SUMMARY', 'Review digital contributions made before deadline');

        // Count pending loans
        const pendingLoans = db.prepare('SELECT count(*) as count FROM loans WHERE status = "pending"').get();
        if ((pendingLoans as any).count > 0) {
            agendaStmt.run(id, 'LOAN_APPROVAL', `Review ${(pendingLoans as any).count} pending loan request(s)`);
        }

        res.status(200).json({ success: true, message: 'Meeting started. Agenda generated.' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMeetingAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Verify meeting exists
        const meeting: any = db.prepare('SELECT group_id FROM meetings WHERE id = ?').get(id);
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });

        // Verify requester is member of group
        const membership = db.prepare('SELECT id FROM members WHERE group_id = ? AND user_id = ?').get(meeting.group_id, req.user!.id);
        if (!membership) return res.status(403).json({ success: false, message: 'Access denied.' });

        const attendance = db.prepare(`
            SELECT a.status, m.id as member_id, u.name, u.phone, m.role
            FROM attendance a
            JOIN members m ON a.member_id = m.id
            JOIN users u ON m.user_id = u.id
            WHERE a.meeting_id = ?
            ORDER BY u.name ASC
        `).all(id);

        res.status(200).json({ success: true, data: attendance });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // meeting_id
        const { member_id, status } = req.body;

        if (!['PRESENT', 'ABSENT', 'EXCUSED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        // Verify meeting exists and get group_id
        const meeting: any = db.prepare('SELECT group_id FROM meetings WHERE id = ?').get(id);
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });

        // Ensure user is a leader of the group
        const leaderCheck = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(meeting.group_id, req.user!.id);
        if (!leaderCheck || !['admin', 'secretary', 'treasurer'].includes((leaderCheck as any).role)) {
            return res.status(403).json({ success: false, message: 'Only group leaders can update attendance.' });
        }

        const result = db.prepare('UPDATE attendance SET status = ? WHERE meeting_id = ? AND member_id = ?').run(status, id, member_id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Attendance record not found for this member.' });
        }

        res.status(200).json({ success: true, message: 'Attendance updated.' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const completeMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const meeting: any = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
        if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });

        const group: any = db.prepare('SELECT penalty_amount FROM groups WHERE id = ?').get(meeting.group_id);

        const leaderCheck = db.prepare('SELECT role FROM members WHERE group_id = ? AND user_id = ?').get(meeting.group_id, req.user!.id);
        if (!leaderCheck || !['admin', 'secretary', 'treasurer'].includes((leaderCheck as any).role)) {
            return res.status(403).json({ success: false, message: 'Only group leaders can complete the meeting.' });
        }

        const transaction = db.transaction(() => {
            // 1. Mark meeting as completed
            db.prepare('UPDATE meetings SET status = "COMPLETED", updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);

            // 2. Identify absent members and apply penalties
            const absents = db.prepare('SELECT member_id FROM attendance WHERE meeting_id = ? AND status = "ABSENT"').all(id);

            if (absents.length > 0 && group.penalty_amount > 0) {
                const penaltyStmt = db.prepare(`
                    INSERT INTO transactions (group_id, type, amount, from_member_id, reference_id, reference_type, status, notes)
                    VALUES (?, 'penalty', ?, ?, ?, 'meeting', 'completed', ?)
                `);

                for (const absent of absents as any[]) {
                    penaltyStmt.run(
                        meeting.group_id,
                        group.penalty_amount,
                        absent.member_id,
                        id,
                        'Automatic penalty for meeting absence'
                    );
                }
            }
        });

        transaction();

        res.status(200).json({
            success: true,
            message: 'Meeting completed successfully. Penalties applied to absent members.'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

