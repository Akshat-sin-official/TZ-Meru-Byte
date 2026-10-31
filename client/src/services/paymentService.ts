/**
 * Payment Service
 * 
 * Handles Cashfree payment integration
 */

import { apiClient } from './apiClient';

export interface CreatePaymentOrderRequest {
  engagementId: string;
  returnUrl?: string;
}

export interface CreatePaymentOrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    paymentSessionId: string;
    orderToken: string;
    orderAmount: number;
    orderCurrency: string;
    returnUrl: string;
    paymentMode?: string;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    order_id: string;
    order_amount: number;
    order_status: string;
    payment_session_id: string;
    payment_status: string;
    payment_message: string;
    payment_amount: number;
    payment_currency: string;
  };
}

/**
 * Create payment order
 * Requires idempotency key and timestamp headers for financial safety
 */
export const createPaymentOrder = async (
  data: CreatePaymentOrderRequest
): Promise<CreatePaymentOrderResponse> => {
  const idempotencyKey = `payment-order-${data.engagementId}-${Date.now()}`;
  const timestamp = Date.now().toString();
  
  const response = await apiClient.post<CreatePaymentOrderResponse>(
    '/v1/payment/create-order',
    data,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
        'X-Request-Timestamp': timestamp,
      },
    }
  );
  return response.data;
};

/**
 * Get payment status by orderId
 */
export const getPaymentStatus = async (
  orderId: string
): Promise<PaymentStatusResponse> => {
  const response = await apiClient.get<PaymentStatusResponse>(
    `/v1/payment/status/${orderId}`
  );
  return response.data;
};

/**
 * Get payment status by engagementId (fallback when orderId is not available)
 */
export const getPaymentStatusByEngagement = async (
  engagementId: string
): Promise<PaymentStatusResponse> => {
  const response = await apiClient.get<PaymentStatusResponse>(
    `/v1/payment/status-by-engagement/${engagementId}`
  );
  return response.data;
};

/**
 * Confirm deposit after payment success
 * Fallback when webhook doesn't fire (e.g., sandbox mode)
 */
export const confirmDepositAfterPayment = async (
  engagementId: string,
  orderId?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/v1/payment/confirm-deposit',
    { engagementId, orderId }
  );
  return response.data;
};

