const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

export const rotationService = {
    startRotation: async (groupId: string, data: { amountPerMember: number; payoutDate: string }) => {
        const response = await fetch(`${API_URL}/rotations/groups/${groupId}/start`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to start rotation');
        return json;
    },

    getRotationInfo: async (groupId: string) => {
        const response = await fetch(`${API_URL}/rotations/groups/${groupId}`, {
            headers: getAuthHeaders(),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch rotation info');
        return json;
    },

    reorderQueue: async (groupId: string, memberId: string, direction: 'up' | 'down') => {
        const response = await fetch(`${API_URL}/rotations/groups/${groupId}/queue/reorder`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ memberId, direction }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || json.message || 'Failed to update queue');
        return json;
    },

    disbursePayout: async (groupId: string) => {
        const response = await fetch(`${API_URL}/rotations/groups/${groupId}/disburse`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to disburse payout');
        return json;
    },

    requestSwap: async (groupId: string, reason: string) => {
        const response = await fetch(`${API_URL}/rotations/groups/${groupId}/swaps/request`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || json.message || 'Failed to submit request');
        return json;
    },

    getPendingRequests: async (groupId: string) => {
        const response = await fetch(`${API_URL}/rotations/groups/${groupId}/swaps/pending`, {
            headers: getAuthHeaders(),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch requests');
        return json;
    },

    handleSwapRequest: async (groupId: string, requestId: string, action: 'approve' | 'reject') => {
        const response = await fetch(`${API_URL}/rotations/groups/${groupId}/swaps/${requestId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to process request');
        return json;
    },

    getRotationHistory: async (groupId: string) => {
        const response = await fetch(`${API_URL}/rotations/groups/${groupId}/history`, {
            headers: getAuthHeaders(),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch rotation history');
        return json;
    },
};
