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

    async updateUserSettings(userId: string, data: { role?: string, admin_level?: string, managed_location?: string }) {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update user settings');
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

    async getActivityFeed(limit: number = 20) {
        const response = await fetch(`${API_URL}/admin/activity?limit=${limit}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch activity feed');
        }

        return response.json();
    }

    async getRiskAnalysis() {
        const response = await fetch(`${API_URL}/admin/risk-analysis`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch risk analysis');
        }

        return response.json();
    }

    async createAdminAccount(data: {
        name: string,
        phone: string,
        email?: string,
        nationalId?: string,
        adminLevel: string,
        managedLocation?: string
    }) {
        const response = await fetch(`${API_URL}/admin/create-user`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create admin account');
        }

        return response.json();
    }

    async getReports(type: string, groupId?: string) {
        const params = new URLSearchParams({
            type,
            ...(groupId && { groupId }),
        });

        const response = await fetch(`${API_URL}/admin/reports?${params}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch reports');
        }

        return response.json();
    }
}

export const adminService = new AdminService();
