import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { apiClient } from '@/services';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { executeSafeRedirect } from '@/utils/safeRedirect';

type Step = 'account' | 'verify' | 'confirm';

const Register = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('account');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isExpertRoute = location.pathname.includes('expert') || searchParams.get('role') === 'expert';
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'expert'>(isExpertRoute ? 'expert' : 'seeker');

  const { register, verifyOTP, confirmRole, isAuthenticated, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname.includes('expert') || searchParams.get('role') === 'expert') {
      setSelectedRole('expert');
    } else if (location.pathname.includes('seeker') || searchParams.get('role') === 'seeker') {
      setSelectedRole('seeker');
    }
  }, [location.pathname, searchParams]);

  const redirectParam = searchParams.get('redirect') || searchParams.get('returnTo');
  const rawFrom = (location.state as any)?.from;
  let from = redirectParam
    ? redirectParam
    : typeof rawFrom === 'string'
      ? rawFrom
      : rawFrom?.pathname
        ? `${rawFrom.pathname}${rawFrom.search || ''}`
        : null;

  if (from) {
    try {
      const parsed = from.startsWith('http') ? new URL(from) : new URL(from, window.location.origin);
      if (
        (parsed.pathname === '/' || parsed.pathname === '') &&
        !parsed.search &&
        !parsed.hash
      ) {
        from = null;
      }
    } catch {
      if (from === '/' || from === '') {
        from = null;
      }
    }
  }

  // Automatically redirect already-authenticated users to their dashboard/profile workspace
  useEffect(() => {
    if (isAuthenticated && user && step === 'account') {
      const destination = from || getDashboardPath();
      const token = localStorage.getItem('accessToken');
      executeSafeRedirect(destination, token, navigate, getDashboardPath());
    }
  }, [isAuthenticated, user, step, navigate, from, getDashboardPath]);

  // Check if user needs to complete confirmation
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'confirm' && user?.isVerified) {
      setStep('confirm');
    } else if (user?.isVerified && (user as any).isRoleConfirmed === false) {
      setStep('confirm');
    }
  }, [user, searchParams]);

  const [resendCooldown, setResendCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'verify' && resendCooldown > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (resendCooldown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendCooldown]);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error(selectedRole === 'expert' ? 'Full name is required' : 'Business name is required');
      return;
    }

    if (!email.trim()) {
      toast.error('Email address is required');
      return;
    }

    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!agreedTerms) {
      toast.error('Please agree to the Terms of Service & Privacy Policy');
      return;
    }

    try {
      const cleanMobile = mobile && mobile.trim() && mobile.trim().toUpperCase() !== 'N/A' ? mobile.trim() : '';
      await register({ name: fullName, email, mobile: cleanMobile, password, role: selectedRole });
      toast.success('OTP sent! Please check your email inbox.');
      setResendCooldown(30);
      setCanResend(false);
      setStep('verify');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && error.message !== '[object Object]'
        ? error.message
        : 'Registration failed. Please try again.';
      toast.error(errorMessage, { id: 'auth-error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsLoading(true);

    try {
      await confirmRole();

      toast.success('Welcome to MarTechAdda!');
      // Always navigate to onboarding first; carry the external redirect URL as state
      // so the seeker onboarding page can redirect back to martechadda.com after completion
      const redirectQuery = from ? `?redirect=${encodeURIComponent(from)}` : '';
      navigate(`/seeker/onboarding${redirectQuery}`, {
        state: {
          from: (location.state as any)?.from,
          externalRedirect: from || undefined,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Confirmation failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);

    try {
      const verified = await verifyOTP(otp, email);
      if (verified) {
        toast.success('Email verified successfully!');
        if (selectedRole === 'seeker') {
          setStep('confirm');
        } else {
          // Expert: redirect back to external URL if present, otherwise go to profile setup
          const token = localStorage.getItem('accessToken');
          executeSafeRedirect(from, token, navigate, '/expert/profile');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && error.message !== '[object Object]'
        ? error.message
        : 'OTP verification failed';
      toast.error(errorMessage, { id: 'auth-error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isLoading) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/v1/auth/resend-otp', {
        email,
        type: 'email_verification',
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to resend OTP');
      }

      toast.success('New OTP sent to your email!');
      setResendCooldown(30);
      setCanResend(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && error.message !== '[object Object]'
        ? error.message
        : 'Failed to resend OTP';
      toast.error(errorMessage, { id: 'auth-error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-[#FAF9F6] font-sans overflow-x-hidden">
      {/* Left Panel - Hero/Branding */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-[#F5F3EF] via-[#FAF9F6] to-[#EAE6DF] text-ink p-10 lg:p-12 justify-between relative sticky top-0 h-screen overflow-y-auto border-r border-border/40 scrollbar-thin">
        {/* Background Orbs */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/15 to-indigo-500/10 rounded-full blur-[80px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 rounded-full blur-[80px] animate-pulse duration-[10000ms]" />
        
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,11,46,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(26,11,46,0.01)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Header */}
        <div className="relative z-10">
          <a href="https://martechadda.com" className="inline-flex items-center gap-3 group transition-transform hover:translate-x-1 duration-300">
            <div className="p-1.5 bg-white/70 rounded-xl border border-white shadow-sm backdrop-blur-md group-hover:bg-white group-hover:shadow-md transition-all">
              <img src="/favicon.svg" alt="MarTechAdda" className="h-6 w-auto" />
            </div>
            <span className="text-lg font-bold font-poppins tracking-tight text-ink/95">MarTechAdda</span>
          </a>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-md space-y-6 font-poppins my-auto py-6">
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.2] text-ink">
              {selectedRole === 'expert' ? (
                <>
                  Join MarTechAdda as an <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Expert</span>
                </>
              ) : (
                <>
                  Join MarTechAdda as a <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Business</span>
                </>
              )}
            </h1>
            <p className="text-sm text-ink-soft leading-relaxed font-sans max-w-sm">
              {selectedRole === 'expert'
                ? 'Connect with relevant business requirements based on your expertise — no paid rankings or sponsored visibility.'
                : 'Find marketing experts matched to your requirements — no paid rankings or sponsored visibility.'}
            </p>
          </div>

          {/* Feature Bullet Points */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 border border-white/95 shadow-[0_12px_40px_0_rgba(26,11,46,0.04)] space-y-4 font-sans hover:border-white transition-all duration-500">
            {selectedRole === 'expert' ? (
              <>
                <div className="flex items-start gap-3 text-ink/90">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/95">Requirement-led opportunities</p>
                    <p className="text-xs text-ink-soft/70 mt-0.5 leading-normal">Get discovered for business requirements relevant to your expertise and service capabilities.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-ink/90">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/95">No paid rankings</p>
                    <p className="text-xs text-ink-soft/70 mt-0.5 leading-normal">Your visibility is based on requirement relevance — not advertising spend or paid placement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-ink/90">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/95">Structured engagements</p>
                    <p className="text-xs text-ink-soft/70 mt-0.5 leading-normal">Manage discussions, quotations, milestones and engagements through one dedicated workspace.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 text-ink/90">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/95">Verified expert profiles</p>
                    <p className="text-xs text-ink-soft/70 mt-0.5 leading-normal">Expert profiles undergo identity, business and applicable credential verification.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-ink/90">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/95">No paid rankings</p>
                    <p className="text-xs text-ink-soft/70 mt-0.5 leading-normal">Search visibility is based on requirement relevance — not advertising spend.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-ink/90">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink/95">Milestone-based engagements</p>
                    <p className="text-xs text-ink-soft/70 mt-0.5 leading-normal">Structure payments around agreed milestones for greater clarity and control.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-border/80 text-ink-soft">
            <p className="text-base font-serif italic text-ink-soft/70">"Requirements In. Relevant Expertise Out."</p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-end text-[11px] text-ink-soft/60 font-medium font-sans">
          <p>© {new Date().getFullYear()} Martechadda Private Limited</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-ink transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex flex-col h-screen overflow-hidden bg-[#FAF9F6] relative">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between p-6 shrink-0 bg-[#FAF9F6] z-20 w-full">
          <a
            href="https://martechadda.com"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink transition-colors px-3 py-1.5 rounded-full bg-white border border-border/40 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Website</span>
          </a>

          <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-border/40 shadow-sm text-[11px] font-bold text-ink-soft font-poppins">
            <span className="pl-3 pr-1 text-ink-soft/75">Already registered?</span>
            <Link
              to={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : `/login${location.search}`}
              className="px-3 py-1 bg-primary/5 hover:bg-primary/10 text-primary rounded-full transition-colors"
              state={{ from: location.state?.from }}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col items-center justify-center scrollbar-thin">
          <div className="w-full max-w-[400px] my-auto space-y-6 py-4 animate-fade-in">
          {/* Progress Step Indicator (for Expert or multi-step) */}
          {selectedRole === 'expert' && step === 'account' && (
            <div className="flex items-center justify-between text-xs font-bold font-poppins text-primary tracking-wide">
              <span>Step 1 of 3</span>
            </div>
          )}

          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold font-poppins tracking-tight text-ink">
              {step === 'account' && (selectedRole === 'expert' ? 'Create Your Expert Account' : 'Create Your Business Account')}
              {step === 'verify' && 'Verify Email'}
              {step === 'confirm' && 'Ready to Join'}
            </h2>
            <p className="text-sm text-ink-soft font-sans">
              {step === 'account' && (selectedRole === 'expert'
                ? 'Join as a marketing professional and build your presence on MarTechAdda.'
                : 'Find marketing expertise based on your requirements.')}
              {step === 'verify' && `Enter the 6-digit code sent to ${email}`}
              {step === 'confirm' && 'Activate your account and complete profile setup'}
            </p>
          </div>

          {/* Form Content */}
          {step === 'account' && (
            <div className="space-y-5">
              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={() => {
                  if (!agreedTerms) {
                    toast.error('Please agree to the Terms of Service & Privacy Policy before continuing with Google');
                    return;
                  }
                  toast.info('Redirecting to Google Authentication...');
                  window.location.href = `/api/v1/auth/google?role=${selectedRole}`;
                }}
                className={`w-full h-11 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer ${
                  agreedTerms
                    ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-border/60 flex-1" />
                <span className="text-[11px] font-bold text-ink-soft/60 uppercase tracking-widest font-poppins">— OR EMAIL —</span>
                <div className="h-px bg-border/60 flex-1" />
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-[11px] font-bold font-poppins text-ink-soft uppercase tracking-widest">
                      {selectedRole === 'expert' ? 'FULL NAME' : 'BUSINESS / LEGAL NAME'}
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={selectedRole === 'expert' ? 'Enter your full name' : 'Enter business or legal name'}
                      required
                      className="h-11 rounded-xl border-border/50 bg-white text-ink text-[13.5px] transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-border/80 shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[11px] font-bold font-poppins text-ink-soft uppercase tracking-widest">
                      {selectedRole === 'expert' ? 'EMAIL ADDRESS' : 'WORK EMAIL'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'expert' ? 'name@email.com' : 'name@company.com'}
                      required
                      className="h-11 rounded-xl border-border/50 bg-white text-ink text-[13.5px] transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-border/80 shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mobile" className="text-[11px] font-bold font-poppins text-ink-soft uppercase tracking-widest">
                      MOBILE NUMBER (OPTIONAL)
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-11 rounded-xl border-border/50 bg-white text-ink text-[13.5px] transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-border/80 shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[11px] font-bold font-poppins text-ink-soft uppercase tracking-widest">PASSWORD</Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-11 rounded-xl border-border/50 bg-white text-ink text-[13.5px] transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-border/80 shadow-sm"
                    />
                    <p className="text-[10px] text-ink-soft/75 leading-relaxed pt-0.5">
                      Must be 8+ characters with uppercase, lowercase and numeric characters.
                    </p>
                  </div>

                  <div className="flex items-start space-x-2.5 pt-1">
                    <Checkbox
                      id="terms"
                      checked={agreedTerms}
                      onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                      className="rounded-full h-5 w-5 border-2 border-gray-900 bg-white data-[state=checked]:bg-gray-900 data-[state=checked]:text-white shadow-sm mt-0.5 transition-all cursor-pointer"
                    />
                    <Label htmlFor="terms" className="text-xs text-ink-soft leading-snug cursor-pointer font-normal">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary font-bold hover:underline" target="_blank">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary font-bold hover:underline" target="_blank">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-[13.5px] font-bold rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                  disabled={isLoading || !agreedTerms}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 group">
                      <span>Continue</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 duration-300" />
                    </div>
                  )}
                </Button>
                <p className="text-center text-[10px] text-ink-soft/60 px-4">
                  We safeguard your details according to strict privacy guidelines.
                </p>
              </form>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 text-primary rounded-xl text-xs flex items-center justify-between border border-primary/10">
                  <div className="space-y-0.5">
                    <p className="text-ink-soft">Verification sent to:</p>
                    <p className="font-bold text-ink">{email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep('account');
                      setOtp('');
                    }}
                    className="text-xs text-primary hover:text-primary hover:bg-primary/5 underline p-2 h-auto font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Change Email
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-[11px] font-bold font-poppins text-ink-soft uppercase tracking-widest">Verification Code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="h-12 rounded-xl border-border/50 bg-white text-ink text-center text-xl tracking-[0.4em] font-mono transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-border/80 shadow-sm"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-[13.5px] font-bold rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <span>Verify & Create Account</span>
                )}
              </Button>
              <p className="text-center text-[10px] text-ink-soft/60 px-4">
                This helps us keep MarTechAdda secure and verified.
              </p>

              <div className="flex flex-col items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendOTP}
                  className="w-full h-10 text-xs font-bold rounded-xl border-border/50 bg-white hover:bg-slate-50 text-ink cursor-pointer"
                  disabled={isLoading || !canResend}
                >
                  {canResend ? 'Resend OTP' : `Resend OTP in ${resendCooldown}s`}
                </Button>
              </div>
            </form>
          )}

          {/* Confirm Step for Seekers */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/50 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold font-poppins text-ink mb-2">Registration Complete!</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Your business account has been created. Click below to proceed and set up your organizational details.
                </p>
              </div>

              <Button
                onClick={handleConfirmSubmit}
                className="w-full h-11 text-[13.5px] font-bold rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Redirecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 group">
                    <span>Complete Profile</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 duration-300" />
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default Register;
