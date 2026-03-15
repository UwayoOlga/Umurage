const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class LoanService {
    private getAuthHeaders(): HeadersInit {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getMyLoans() {
        const response = await fetch(`${API_URL}/loans`, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch loans');
        }
        return response.json();
    }

    async getPendingLoans() {
        const response = await fetch(`${API_URL}/loans/pending`, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch pending loans');
        }
        return response.json();
    }

    async approveLoan(loanId: string, data?: { amount?: number; interestRate?: number; dueDate?: string }) {
        const response = await fetch(`${API_URL}/loans/${loanId}/approve`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to approve loan');
        }
        return response.json();
    }

    async rejectLoan(loanId: string, reason?: string) {
        const response = await fetch(`${API_URL}/loans/${loanId}/reject`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ reason }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reject loan');
        }
        return response.json();
    }

    async applyForLoan(data: { groupId: string; amount: number; purpose: string; durationMonths?: number }) {
        const response = await fetch(`${API_URL}/loans`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit loan application');
        }
        return response.json();
    }

    async repayLoan(loanId: string, data: { amount: number; paymentMethod: string; notes?: string }) {
        const response = await fetch(`${API_URL}/loans/${loanId}/repay`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to record repayment');
        }
        return response.json();
    }
}

export const loanService = new LoanService();
