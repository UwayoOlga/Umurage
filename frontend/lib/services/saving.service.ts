const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class SavingService {
    private getAuthHeaders(): HeadersInit {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getMySavings() {
        const response = await fetch(`${API_URL}/savings`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch savings');
        }

        return response.json();
    }

    async recordContribution(data: { groupId: string; amount: number; type?: string; paymentMethod: string; notes?: string; transactionRef?: string }) {
        const response = await fetch(`${API_URL}/savings`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to record contribution');
        }

        return response.json();
    }
}

export const savingService = new SavingService();
