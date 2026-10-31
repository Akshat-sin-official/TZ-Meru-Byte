/**
 * Quotation Service
 * 
 * API client for quotation operations
 */

import { apiClient } from './apiClient';
import {
  Quotation,
  CreateQuotationPayload,
  RequestRevisionPayload,
  DeclineQuotationPayload,
} from '../types/quotation';

/**
 * Create quotation (Expert)
 */
export async function createQuotation(payload: CreateQuotationPayload): Promise<Quotation> {
  const response = await apiClient.post('/quotations/create', payload);
  return (response.data as any).data;
}

/**
 * Update draft quotation (Expert)
 */
export async function updateQuotation(quotationId: string, payload: Partial<CreateQuotationPayload>): Promise<Quotation> {
  const response = await apiClient.put(`/quotations/${quotationId}`, payload);
  return (response.data as any).data;
}

/**
 * Send quotation to business (Expert)
 */
export async function sendQuotation(quotationId: string): Promise<Quotation> {
  const response = await apiClient.post(`/quotations/${quotationId}/send`);
  return (response.data as any).data;
}

/**
 * Accept quotation (Business)
 */
export async function acceptQuotation(quotationId: string): Promise<{ quotationId: string; status: string; nextStep: string }> {
  const response = await apiClient.post(`/quotations/${quotationId}/accept`);
  return (response.data as any).data;
}

/**
 * Decline quotation (Business)
 */
export async function declineQuotation(quotationId: string, payload: DeclineQuotationPayload): Promise<{ quotationId: string; status: string }> {
  const response = await apiClient.post(`/quotations/${quotationId}/decline`, payload);
  return (response.data as any).data;
}

/**
 * Request revision (Business)
 */
export async function requestRevision(quotationId: string, payload: RequestRevisionPayload): Promise<{ quotationId: string; status: string; currentRevision: number }> {
  const response = await apiClient.post(`/quotations/${quotationId}/request-revision`, payload);
  return (response.data as any).data;
}

/**
 * Get quotation by ID
 */
export async function getQuotation(quotationId: string): Promise<Quotation> {
  const response = await apiClient.get(`/quotations/${quotationId}`);
  return (response.data as any).data;
}

/**
 * Get my quotations
 */
export async function getMyQuotations(params?: { status?: string }): Promise<Quotation[]> {
  const response = await apiClient.get('/quotations/my', { params });
  return (response.data as any).data;
}
