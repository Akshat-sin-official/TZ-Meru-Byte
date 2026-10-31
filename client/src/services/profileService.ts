import { apiClient } from './apiClient';

export const profileService = {
    getProfile: async () => {
        const response = await apiClient.get<{ data: any }>('/v1/profile');
        return response.data.data;
    },

    updateProfile: async (data: any) => {
        const response = await apiClient.put('/v1/profile', data);
        return response.data;
    },
};
