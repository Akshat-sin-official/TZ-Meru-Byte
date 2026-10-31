/**
 * EmailChangeSection Component
 * 
 * Self-contained email change flow with state machine:
 * idle → input → verifying → success/error
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { emailChangeService } from '@/services/emailChangeService';

type EmailChangeState = 'idle' | 'input' | 'verifying' | 'success' | 'error';

interface EmailChangeSectionProps {
  currentEmail: string;
  onEmailChanged?: (newEmail: string) => void;
}

export const EmailChangeSection = ({ currentEmail, onEmailChanged }: EmailChangeSectionProps) => {
  const [state, setState] = useState<EmailChangeState>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successEmail, setSuccessEmail] = useState('');

  const handleInitiate = async () => {
    if (!newEmail.trim()) {
      setErrorMessage('Please enter a new email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setErrorMessage('New email must be different from your current email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const extractError = (err: any, fallback: string): string => {
      const raw = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      if (!raw) return fallback;
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'object' && raw.message && typeof raw.message === 'string') return raw.message;
      return typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
    };

    try {
      const response = await emailChangeService.initiateEmailChange(newEmail.trim());
      if (response.data.success) {
        setState('verifying');
        toast.success('Verification code sent to your new email address.');
      }
    } catch (error: any) {
      setErrorMessage(extractError(error, 'Failed to initiate email change.'));
      setState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const extractError = (err: any, fallback: string): string => {
      const raw = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      if (!raw) return fallback;
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'object' && raw.message && typeof raw.message === 'string') return raw.message;
      return typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
    };

    try {
      const response = await emailChangeService.verifyEmailChange(otp.trim());
      if (response.data.success) {
        setSuccessEmail(response.data.data?.newEmail || newEmail);
        setState('success');
        toast.success('Email changed successfully!');
        onEmailChanged?.(response.data.data?.newEmail || newEmail);
      }
    } catch (error: any) {
      setErrorMessage(extractError(error, 'Verification failed.'));
      setState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setState('idle');
    setNewEmail('');
    setOtp('');
    setErrorMessage('');
  };

  const handleRetry = () => {
    setErrorMessage('');
    setState('input');
  };

  // Idle state — show current email with Change button
  if (state === 'idle') {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/5">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Email Address</p>
            <p className="text-xs text-muted-foreground">{currentEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
          <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={() => setState('input')}>
            Change Email
          </Button>
        </div>
      </div>
    );
  }

  // Input state — enter new email
  if (state === 'input') {
    return (
      <div className="p-4 border rounded-lg bg-accent/5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Change Email Address</p>
        </div>
        <p className="text-xs text-muted-foreground">Current: {currentEmail}</p>
        <Input
          type="email"
          placeholder="Enter new email address"
          value={newEmail}
          onChange={(e) => { setNewEmail(e.target.value); setErrorMessage(''); }}
          className="h-9"
        />
        {errorMessage && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errorMessage}
          </p>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleInitiate} disabled={isLoading} className="h-8">
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
            Send Verification Code
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8">Cancel</Button>
        </div>
      </div>
    );
  }

  // Verifying state — enter OTP
  if (state === 'verifying') {
    return (
      <div className="p-4 border rounded-lg bg-accent/5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Verify New Email</p>
        </div>
        <p className="text-xs text-muted-foreground">
          A 6-digit code was sent to <strong>{newEmail}</strong>. Enter it below to confirm.
        </p>
        <Input
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrorMessage(''); }}
          maxLength={6}
          className="h-9 font-mono text-center tracking-widest"
        />
        {errorMessage && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errorMessage}
          </p>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleVerify} disabled={isLoading || otp.length !== 6} className="h-8">
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
            Verify & Change
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8">Cancel</Button>
        </div>
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="p-4 border rounded-lg bg-green-50 border-green-200 space-y-2">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Email changed successfully to <strong>{successEmail}</strong>. A security notification was sent to your previous email.
          </AlertDescription>
        </Alert>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 text-xs">Done</Button>
      </div>
    );
  }

  // Error state
  return (
    <div className="p-4 border rounded-lg bg-red-50 border-red-200 space-y-3">
      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{errorMessage || 'Something went wrong. Please try again.'}</AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleRetry} className="h-8">Try Again</Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8">Cancel</Button>
      </div>
    </div>
  );
};
