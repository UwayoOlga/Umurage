const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class GroupService {
    private getAuthHeaders(): HeadersInit {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getMyGroups() {
        const response = await fetch(`${API_URL}/groups`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch groups');
        }

        return response.json();
    }

    async getGroupById(id: string) {
        const response = await fetch(`${API_URL}/groups/${id}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch group details');
        }

        return response.json();
    }

    async createGroup(data: any) {
        const response = await fetch(`${API_URL}/groups`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create group');
        }

        return response.json();
    }

    async getMembers() {
        const response = await fetch(`${API_URL}/members`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch members');
        }

        return response.json();
    }
}

export const groupService = new GroupService();
