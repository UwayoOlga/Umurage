const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class GovernanceService {
    private getAuthHeaders(): HeadersInit {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getOpenElections(groupId: string) {
        const response = await fetch(`${API_URL}/governance/election/${groupId}/open`, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch elections');
        return response.json();
    }

    async startElection(groupId: string, roleToFill: string) {
        const response = await fetch(`${API_URL}/governance/election/start`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ groupId, roleToFill }),
        });
        if (!response.ok) throw new Error('Failed to start election');
        return response.json();
    }

    async nominate(electionId: string, candidateMemberId: string) {
        const response = await fetch(`${API_URL}/governance/election/nominate`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ electionId, candidateMemberId }),
        });
        if (!response.ok) throw new Error('Failed to nominate');
        return response.json();
    }

    async vote(electionId: string, candidateMemberId: string) {
        const response = await fetch(`${API_URL}/governance/election/vote`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ electionId, candidateMemberId }),
        });
        if (!response.ok) throw new Error('Failed to vote');
        return response.json();
    }

    async getElectionDetails(electionId: string) {
        const response = await fetch(`${API_URL}/governance/election/${electionId}`, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch election details');
        return response.json();
    }
}

export const governanceService = new GovernanceService();
