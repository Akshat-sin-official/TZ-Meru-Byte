/**
 * Payment Return Page
 * 
 * Handles return from Cashfree payment gateway
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPaymentStatus, getPaymentStatusByEngagement, confirmDepositAfterPayment } from '../../services/paymentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [message, setMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const MAX_RETRIES = 5; // Maximum number of retry attempts

  // Redirect countdown trigger
  useEffect(() => {
    if (status === 'success') {
      setCountdown(5);
    } else if (status === 'failed') {
      setCountdown(10);
    }
  }, [status]);

  // Countdown timer processing
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      handleContinue();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Verify payment status with backend
  const verifyPayment = useCallback(async (isRetry = false) => {
      // Get parameters from URL
      const orderId = searchParams.get('orderId') || 
                      searchParams.get('order_id') || 
                      searchParams.get('orderID');
      
      const engagementId = searchParams.get('engagementId') || 
                          searchParams.get('engagement_id');
      
      // Prevent infinite retries
      if (isRetry && retryCount >= MAX_RETRIES) {
        console.info('Max retries reached, stopping polling');
        setStatus('pending');
        setMessage('Payment status check timed out. Please check your dashboard or contact support if payment was successful.');
        return;
      }

      if (isRetry) {
        setRetryCount(prev => prev + 1);
      }

      try {
        let response;
        
        if (orderId) {
          // Use orderId if available
          console.info(`[Attempt ${retryCount + 1}] Fetching payment status for orderId:`, orderId);
          response = await getPaymentStatus(orderId);
          console.info('Payment status response:', response);
        } else if (engagementId) {
          // Fallback: Try to get payment status by engagementId
          console.info(`[Attempt ${retryCount + 1}] Fetching payment status for engagementId:`, engagementId);
          try {
            response = await getPaymentStatusByEngagement(engagementId);
            console.info('Payment status by engagement response:', response);
            // The response structure might be different, handle it
            if (response && response.success && response.data) {
              const paymentData = response.data as any;
              if (paymentData.paymentStatus === 'SUCCESS' || paymentData.engagementStatus === 'ACTIVE') {
                setStatus('success');
                setMessage('Payment successful! Your deposit has been confirmed.');
                return;
              } else {
                setStatus('pending');
                setMessage(paymentData.message || 'Payment is being processed. Please wait...');
                // Poll again after delay if under retry limit
                if (retryCount < MAX_RETRIES) {
                  setTimeout(() => verifyPayment(true), 3000);
                }
                return;
              }
            } else {
              setStatus('pending');
              setMessage('Payment completed. Please wait while we verify your payment status.');
              if (retryCount < MAX_RETRIES) {
                setTimeout(() => verifyPayment(true), 3000);
              }
              return;
            }
          } catch (engagementError: any) {
            console.error('Error getting payment status by engagement:', engagementError);
            setStatus('pending');
            setMessage('Payment completed. Please wait while we verify your payment status. You will be notified once confirmed.');
            if (retryCount < MAX_RETRIES) {
              setTimeout(() => verifyPayment(true), 3000);
            }
            return;
          }
        }
        
        if (response && response.success && response.data) {
          const paymentData = response.data;
          
          // Log the actual status values for debugging
          console.info('Payment data:', {
            payment_status: paymentData.payment_status,
            order_status: paymentData.order_status,
            payment_message: paymentData.payment_message,
            fullData: paymentData,
          });
          
          // Handle various success status combinations (Explicit PAID order status or SUCCESS transaction status)
          const isSuccess = 
            paymentData.payment_status === 'SUCCESS' || 
            paymentData.order_status === 'PAID';
          
          // Handle various failure status combinations
          const isFailed = 
            paymentData.payment_status === 'FAILED' ||
            paymentData.payment_status === 'CANCELLED' ||
            paymentData.payment_status === 'USER_DROPPED' ||
            paymentData.order_status === 'CANCELLED' ||
            paymentData.order_status === 'EXPIRED' ||
            (paymentData.payment_message && paymentData.payment_message.toLowerCase().includes('fail'));
          
          if (isSuccess) {
            // Payment successful - confirm deposit (fallback if webhook didn't fire)
            if (engagementId) {
              try {
                console.info('Payment successful, confirming deposit...', { engagementId, orderId });
                await confirmDepositAfterPayment(engagementId, orderId || undefined);
                console.info('Deposit confirmed successfully');
              } catch (confirmError: any) {
                console.error('Failed to confirm deposit:', confirmError);
                // Don't fail the whole flow - webhook might have already confirmed it
                // Or it might be a duplicate confirmation (idempotent)
                if (confirmError.response?.status !== 400 && confirmError.response?.status !== 409) {
                  // Only log non-idempotent errors
                  console.warn('Deposit confirmation failed, but payment was successful. Webhook may have already confirmed it.');
                }
              }
            }
            setStatus('success');
            setMessage('Payment successful! Your deposit has been confirmed.');
          } else if (isFailed) {
            setStatus('failed');
            setMessage(paymentData.payment_message || 'Payment failed or cancelled. Please try again.');
          } else {
            // Still pending - poll again
            setStatus('pending');
            const debugLog = `Payment status: ${paymentData.payment_status || 'Unknown'}, Order status: ${paymentData.order_status || 'Unknown'}`;
            console.info(`[Attempt ${retryCount + 1}] ${debugLog}`);
            setMessage('We are verifying your transaction. This might take a few moments...');
            
            // Poll again if under retry limit
            if (retryCount < MAX_RETRIES) {
              console.info(`Payment still pending, will retry in 3 seconds... (${retryCount + 1}/${MAX_RETRIES})`);
              setTimeout(() => verifyPayment(true), 3000);
            } else {
              setMessage('We could not confirm your payment status immediately. Please check your dashboard in a few minutes or contact support.');
            }
          }
        } else {
          console.error('Invalid response structure:', response);
          setStatus('failed');
          setMessage('Unable to verify payment status. Please contact support.');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        
        // If it's a 404, the order might not exist in Cashfree yet (sandbox issue)
        if (error.response?.status === 404) {
          setStatus('pending');
          setMessage('Payment order not found in payment gateway. This may be a sandbox simulation issue. Please wait or check your payment status in the dashboard.');
          // Try engagement status as fallback
          if (engagementId && retryCount < MAX_RETRIES) {
            setTimeout(() => {
              verifyPayment(true);
            }, 3000);
          }
        } else {
          const rawError = error.response?.data?.error || error.message || 'Failed to verify payment. Please contact support.';
          const errorString = typeof rawError === 'string'
            ? rawError
            : typeof rawError === 'object' && rawError !== null && 'message' in rawError
              ? String((rawError as any).message)
              : JSON.stringify(rawError);
          const friendlyError = (errorString.includes('reference ID is already registered') || errorString.includes('already registered'))
            ? 'Your previous payment attempt was not completed. You can safely retry the deposit below.'
            : errorString;
          setStatus('failed');
          setMessage(friendlyError);
        }
      }
  }, [searchParams, retryCount, MAX_RETRIES]);

  useEffect(() => {
    // Get parameters from URL
    const orderId = searchParams.get('orderId') || 
                    searchParams.get('order_id') || 
                    searchParams.get('orderID');
    
    const engagementId = searchParams.get('engagementId') || 
                        searchParams.get('engagement_id');

    // Log all URL parameters for debugging
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });
    console.info('Payment return URL parameters:', allParams);

    // If no orderId in URL, we can still try to verify using engagementId
    // The backend can look up the latest order for this engagement
    if (!orderId && !engagementId) {
      setStatus('failed');
      setMessage('Invalid payment return. Order ID or Engagement ID not found in return URL.');
      console.error('Missing both orderId and engagementId in return URL');
      return;
    }

    verifyPayment();
  }, [verifyPayment, searchParams]);

  const handleContinue = () => {
    const engagementId = searchParams.get('engagementId');
    if (engagementId) {
      navigate(`/seeker/dashboard?engagementId=${engagementId}`);
    } else {
      navigate('/seeker/dashboard');
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Your payment transaction details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Verifying payment status...</p>
            </div>
          )}

           {status === 'success' && (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              {countdown !== null && (
                <p className="text-sm text-muted-foreground text-center animate-pulse">
                  Redirecting to dashboard in {countdown}s...
                </p>
              )}
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              {countdown !== null && (
                <p className="text-sm text-muted-foreground text-center animate-pulse">
                  Returning to dashboard in {countdown}s...
                </p>
              )}
            </div>
          )}

          {status === 'pending' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-base font-medium text-slate-800 text-center">{message}</p>
              <p className="text-sm text-muted-foreground text-center mt-2">Please do not close or refresh this page.</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={handleContinue} className="flex-1">
              {status === 'success' ? 'Continue to Dashboard' : 'Go to Dashboard'}
            </Button>
            {status === 'pending' && (
              <Button
                onClick={() => {
                  setRetryCount(0);
                  verifyPayment(false);
                }}
                variant="outline"
              >
                Refresh Status
              </Button>
            )}
            {status === 'failed' && (
              <Button
                onClick={() => {
                  const engagementId = searchParams.get('engagementId');
                  if (engagementId) {
                    navigate(`/payment/deposit?engagementId=${engagementId}`);
                  } else {
                    navigate('/seeker/dashboard');
                  }
                }}
                variant="outline"
              >
                Retry Deposit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

