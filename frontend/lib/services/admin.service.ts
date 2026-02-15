const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class AdminService {
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getUsers(page: number = 1, limit: number = 10, search: string = '', role: string = '') {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && { search }),
            ...(role && { role }),
        });

        const response = await fetch(`${API_URL}/admin/users?${params}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch users');
        }

        return response.json();
    }

    async getUserStats() {
        const response = await fetch(`${API_URL}/admin/users/stats`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch user stats');
        }

        return response.json();
    }

    async updateUserRole(userId: string, role: string) {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ role }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update user role');
        }

        return response.json();
    }

    async getGroups(page: number = 1, limit: number = 10, search: string = '') {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && { search }),
        });

        const response = await fetch(`${API_URL}/admin/groups?${params}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch groups');
        }

        return response.json();
    }

    async getGroupDetails(groupId: string) {
        const response = await fetch(`${API_URL}/admin/groups/${groupId}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch group details');
        }

        return response.json();
    }

    async getAnalytics() {
        const response = await fetch(`${API_URL}/admin/analytics`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch analytics');
        }

        return response.json();
    }
}

export const adminService = new AdminService();
