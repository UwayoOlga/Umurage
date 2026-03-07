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

    disbursePayout: async (groupId: string) => {
        const response = await fetch(`${API_URL}/rotations/groups/${groupId}/disburse`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to disburse payout');
        return json;
    },
};
