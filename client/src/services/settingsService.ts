import { apiClient } from './apiClient';

export interface UserSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    discussionReminders: boolean;
    engagementUpdates: boolean;
    quotationAlerts: boolean;
    profileVisibility: 'public' | 'private' | 'expert-only';
    showEmail: boolean;
    showMobile: boolean;
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    currency: string;
}

export const settingsService = {
    getSettings: async () => {
        const response = await apiClient.get<{ data: UserSettings }>('/v1/settings');
        return response.data.data;
    },

    updateSettings: async (settings: Partial<UserSettings>) => {
        const response = await apiClient.put<{ data: UserSettings }>('/v1/settings', settings);
        return response.data.data;
    },
};
