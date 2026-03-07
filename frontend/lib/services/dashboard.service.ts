const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class DashboardService {
    private getAuthHeaders(): HeadersInit {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getTransactions() {
        const response = await fetch(`${API_URL}/transactions`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch transactions');
        }

        return response.json();
    }

    async getSavings() {
        const response = await fetch(`${API_URL}/savings`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch savings');
        }

        return response.json();
    }

    async getLoans() {
        const response = await fetch(`${API_URL}/loans`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch loans');
        }

        return response.json();
    }

    async getGroupMembers() {
        const response = await fetch(`${API_URL}/members`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch members');
        }

        return response.json();
    }

    async approveMember(memberId: string) {
        const response = await fetch(`${API_URL}/members/${memberId}/approve`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to approve request');
        }
        return response.json();
    }

    async rejectMember(memberId: string) {
        const response = await fetch(`${API_URL}/members/${memberId}/reject`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reject request');
        }
        return response.json();
    }

    async getGroupMemberList(groupId: string) {
        const response = await fetch(`${API_URL}/members/group/${groupId}`, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch group members');
        }
        return response.json();
    }

    async promoteRole(memberId: string, newRole: string) {
        const response = await fetch(`${API_URL}/members/${memberId}/role`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ newRole }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update role');
        }
        return response.json();
    }
}

export const dashboardService = new DashboardService();
