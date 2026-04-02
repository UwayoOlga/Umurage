import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const governanceController = {
    // Initiate an election (usually by a resigning leader or in a leaderless group)
    startElection: async (req: AuthRequest, res: Response) => {
        try {
            const { groupId, roleToFill } = req.body;
            const userId = req.user!.id;

            // 1. Check if user is an active member
            const membership = db.prepare('SELECT id, role FROM members WHERE group_id = ? AND user_id = ? AND status = "active"')
                .get(groupId, userId) as any;

            if (!membership) throw new AppError('Only active group members can initiate elections.', 403);

            // 2. Check if an election is already open for this group
            const existing = db.prepare('SELECT id FROM elections WHERE group_id = ? AND status = "OPEN"').get(groupId);
            if (existing) throw new AppError('An election is already in progress for this group.', 400);

            // 3. Create the election
            const stmt = db.prepare(`
                INSERT INTO elections (group_id, role_type, initiator_member_id, ends_at)
                VALUES (?, ?, ?, date('now', '+7 days'))
                RETURNING id
            `);
            const { id: electionId } = stmt.get(groupId, roleToFill || 'admin', membership.id) as any;

            res.status(201).json({ success: true, message: 'Leadership election initiated. Valid for 7 days.', data: { electionId } });
        } catch (error) {
            if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
            console.error('startElection error:', error);
            res.status(500).json({ success: false, message: 'Server error initiating election' });
        }
    },

    // Nominate a candidate
    nominateCandidate: async (req: AuthRequest, res: Response) => {
        try {
            const { electionId, candidateMemberId } = req.body;
            const userId = req.user!.id;

            const election = db.prepare('SELECT id, group_id, status FROM elections WHERE id = ?').get(electionId) as any;
            if (!election || election.status !== 'OPEN') throw new AppError('Election not found or closed.', 404);

            const membership = db.prepare('SELECT id FROM members WHERE group_id = ? AND user_id = ? AND status = "active"')
                .get(election.group_id, userId) as any;
            if (!membership) throw new AppError('Auth required.', 403);

            // Add candidate
            db.prepare('INSERT OR IGNORE INTO election_candidates (election_id, member_id) VALUES (?, ?)').run(electionId, candidateMemberId);

            res.status(200).json({ success: true, message: 'Candidate nominated successfully.' });
        } catch (error) {
            if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: 'Server error nominating candidate' });
        }
    },

    // Cast a vote
    castVote: async (req: AuthRequest, res: Response) => {
        try {
            const { electionId, candidateMemberId } = req.body;
            const userId = req.user!.id;

            const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(electionId) as any;
            if (!election || election.status !== 'OPEN') throw new AppError('Election is closed.', 400);

            const membership = db.prepare('SELECT id FROM members WHERE group_id = ? AND user_id = ? AND status = "active"')
                .get(election.group_id, userId) as any;

            if (!membership) throw new AppError('Voting is reserved for active group members.', 403);

            // Cast vote
            db.prepare('INSERT OR REPLACE INTO votes (election_id, voter_id, candidate_id) VALUES (?, ?, ?)')
                .run(electionId, membership.id, candidateMemberId);

            // Check if majority reached to finalize automatically
            governanceController.checkAndFinalize(electionId);

            res.status(200).json({ success: true, message: 'Vote recorded.' });
        } catch (error) {
            if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: 'Server error casting vote' });
        }
    },

    getOpenElection: async (req: AuthRequest, res: Response) => {
        try {
            const { groupId } = req.params;
            const election = db.prepare('SELECT * FROM elections WHERE group_id = ? AND status = "OPEN"').get(groupId) as any;
            if (!election) return res.json({ success: true, data: null });

            const candidates = db.prepare(`
                SELECT ec.member_id, u.name, u.phone
                FROM election_candidates ec
                JOIN members m ON ec.member_id = m.id
                JOIN users u ON m.user_id = u.id
                WHERE ec.election_id = ?
            `).all(election.id);

            res.json({ success: true, data: { ...election, candidates } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error fetching election' });
        }
    },

    getElectionDetails: async (req: AuthRequest, res: Response) => {
        try {
            const { electionId } = req.params;
            const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(electionId);
            const candidates = db.prepare(`
                SELECT ec.member_id, u.name, (SELECT COUNT(*) FROM votes WHERE election_id = ? AND candidate_id = ec.member_id) as vote_count
                FROM election_candidates ec
                JOIN members m ON ec.member_id = m.id
                JOIN users u ON m.user_id = u.id
                WHERE ec.election_id = ?
            `).all(electionId, electionId);

            res.json({ success: true, data: { ...election as any, candidates } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    checkAndFinalize: (electionId: string) => {
        try {
            const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(electionId) as any;
            const totalMembers = db.prepare('SELECT COUNT(*) as count FROM members WHERE group_id = ? AND status = "active"').get(election.group_id) as any;
            const votesCast = db.prepare('SELECT COUNT(*) as count FROM votes WHERE election_id = ?').get(electionId) as any;

            // Simple majority logic (50% + 1)
            if (votesCast.count > totalMembers.count / 2) {
                // Determine winner
                const winner = db.prepare(`
                    SELECT candidate_id, COUNT(*) as vote_count 
                    FROM votes WHERE election_id = ? 
                    GROUP BY candidate_id 
                    ORDER BY vote_count DESC LIMIT 1
                `).get(electionId) as any;

                if (winner) {
                    db.transaction(() => {
                        // 1. Demote old leader if it was an admin election
                        if (election.role_type === 'admin') {
                            db.prepare("UPDATE members SET role = 'member' WHERE group_id = ? AND role = 'admin'").run(election.group_id);
                        }

                        // 2. Promote winner
                        db.prepare('UPDATE members SET role = ? WHERE id = ?').run(election.role_type, winner.candidate_id);

                        // 3. Close election
                        db.prepare('UPDATE elections SET status = "CLOSED", winning_member_id = ? WHERE id = ?').run(winner.candidate_id, electionId);
                    })();
                    console.log(`✅ Election ${electionId} closed. New ${election.role_type} appointed.`);
                }
            }
        } catch (e) {
            console.error('Finalization error:', e);
        }
    }
};
