import { apiClient } from './apiClient';

export interface SupportTicket {
    _id: string;
    subject: string;
    message: string;
    category: string;
    status: string;
    createdAt: string;
}

export const supportService = {
    createTicket: async (data: { subject: string; message: string; category: string; priority?: string }) => {
        const response = await apiClient.post<{ data: SupportTicket }>('/support', data);
        return response.data;
    },

    getUserTickets: async () => {
        const response = await apiClient.get<{ data: SupportTicket[] }>('/support');
        return response.data.data;
    },
};
