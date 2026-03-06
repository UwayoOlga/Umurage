import { authApi } from './auth.service';

export const rotationService = {
    startRotation: async (groupId: string, data: { amountPerMember: number, payoutDate: string }) => {
        const response = await authApi.post(`/rotations/groups/${groupId}/start`, data);
        return response.data;
    },

    getRotationInfo: async (groupId: string) => {
        const response = await authApi.get(`/rotations/groups/${groupId}`);
        return response.data;
    }
};
