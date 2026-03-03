const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class MeetingService {
    private getAuthHeaders(): HeadersInit {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async scheduleMeeting(groupId: string, scheduledFor: string, asyncCutoffTime: string, location: string) {
        const response = await fetch(`${API_URL}/meetings/schedule`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ group_id: groupId, scheduled_for: scheduledFor, async_cutoff_time: asyncCutoffTime, location }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to schedule meeting');
        }
        return response.json();
    }

    async getMyMeetings() {
        const response = await fetch(`${API_URL}/meetings`, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch meetings');
        }
        return response.json();
    }

    async startMeeting(meetingId: string) {
        const response = await fetch(`${API_URL}/meetings/${meetingId}/start`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to start meeting');
        }
        return response.json();
    }
}

export const meetingService = new MeetingService();
