/**
 * Cashfree Checkout Component
 * 
 * Integrates Cashfree payment gateway for deposit payments
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPaymentOrder, CreatePaymentOrderResponse } from '../../services/paymentService';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';

interface CashfreeCheckoutProps {
  engagementId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

export const CashfreeCheckout = ({
  engagementId,
  onSuccess,
  onError,
}: CashfreeCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<CreatePaymentOrderResponse['data'] | null>(null);
  const scriptLoadedRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load Cashfree SDK
  useEffect(() => {
    if (scriptLoadedRef.current) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      initializePayment();
    };
    script.onerror = () => {
      setError('Failed to load Cashfree payment SDK. Please refresh the page and try again.');
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src*="cashfree.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Initialize payment when SDK is loaded
  const initializePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create payment order
      const response = await createPaymentOrder({
        engagementId,
        returnUrl: `${window.location.origin}/payment/return?engagementId=${engagementId}`,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create payment order');
      }

      setPaymentData(response.data);
      setIsLoading(false);
    } catch (err: any) {
      // Extract error message from different error formats
      let errorMessage = 'Failed to initialize payment';
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = errorData.message || 'Failed to initialize payment';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (errorMessage.includes('reference ID is already registered') || errorMessage.includes('already registered')) {
        errorMessage = 'Your previous payment attempt was not completed. You can safely retry the deposit below.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Open Cashfree checkout
  const handlePayment = async () => {
    if (!paymentData || !window.Cashfree) {
      setError('Payment not initialized. Please refresh the page.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Initialize Cashfree (use sandbox for development, production for live)
      // Dynamic fallback using mode returned by the server, which is the ultimate source of truth
      const serverMode = paymentData.paymentMode;
      const isProduction = serverMode 
        ? serverMode === 'production' 
        : import.meta.env.VITE_CASHFREE_MODE === 'production';
      
      const cashfree = window.Cashfree({
        mode: isProduction ? 'production' : 'sandbox',
      });

      // Open checkout
      cashfree.checkout({
        paymentSessionId: paymentData.paymentSessionId,
        returnUrl: paymentData.returnUrl,
      });
    } catch (err: any) {
      // Extract error message from different error formats
      let errorMessage = 'Failed to open payment gateway';
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = errorData.message || 'Failed to open payment gateway';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (errorMessage.includes('reference ID is already registered') || errorMessage.includes('already registered')) {
        errorMessage = 'Your previous payment attempt was not completed. You can safely retry the deposit below.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Check if returning from payment
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const paymentStatus = searchParams.get('paymentStatus');

    if (orderId && paymentStatus) {
      if (paymentStatus === 'SUCCESS') {
        if (onSuccess) {
          onSuccess();
        } else {
          // Default success handling - navigate to engagement
          navigate(`/seeker/dashboard?payment=success&engagementId=${engagementId}`);
        }
      } else {
        const errorMsg = 'Payment failed. Please try again.';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    }
  }, [searchParams, engagementId, navigate, onSuccess, onError]);

  if (isLoading && !paymentData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Initializing payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !paymentData) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={initializePayment}
            className="mt-4"
            variant="outline"
          >
            Retry Deposit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>
          Pay securely using Cashfree payment gateway
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {paymentData && (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-medium">Amount to Pay:</span>
              <span className="text-lg font-bold">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: paymentData.orderCurrency,
                }).format(paymentData.orderAmount)}
              </span>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You will be redirected to Cashfree's secure payment page
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

