import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { executeSafeRedirect } from '@/utils/safeRedirect';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isAuthenticated, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect') || searchParams.get('returnTo');
  
  const getInitialFrom = () => {
    let target = redirectParam;

    // If redirect is merely the public homepage/root, ignore it so users land on their dashboard
    if (target) {
      try {
        const parsed = target.startsWith('http') ? new URL(target) : new URL(target, window.location.origin);
        if (
          (parsed.pathname === '/' || parsed.pathname === '') &&
          !parsed.search &&
          !parsed.hash
        ) {
          target = null;
        }
      } catch {
        if (target === '/' || target === '') {
          target = null;
        }
      }
    }

    if (!target && typeof location.state?.from === 'string') target = location.state.from;
    if (!target && location.state?.from?.pathname) {
      target = `${location.state.from.pathname}${location.state.from.search || ''}`;
    }
    if (!target) {
      const bookingIntent = sessionStorage.getItem('bookingIntent') || localStorage.getItem('bookingIntent');
      if (bookingIntent) {
        try {
          const bi = JSON.parse(bookingIntent);
          if (bi?.expertId) {
            target = `/discussions/schedule/${bi.expertId}${bi.category ? `?category=${encodeURIComponent(bi.category)}` : ''}`;
          }
        } catch (e) {}
      }
    }

    if (target) {
      // Normalize legacy connect URL to actual discussion schedule route
      target = target.replace(/\/experts\/([^/?#]+)\/connect/i, '/discussions/schedule/$1');
      return target;
    }

    return getDashboardPath();
  };

  const from = getInitialFrom();

  // Check for OAuth error in URL query string or existing authentication
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      let decoded = decodeURIComponent(oauthError);
      if (decoded.includes('validation failed') || decoded.includes('Path `') || decoded.includes('enum value')) {
        decoded = 'Account creation could not be completed with Google. Please try signing up directly with email or try again.';
      }
      toast.error(decoded);
      // Clean query parameter from URL
      navigate(location.pathname, { replace: true });
    } else if (isAuthenticated && user) {
      const token = localStorage.getItem('accessToken');
      executeSafeRedirect(from, token, navigate, getDashboardPath());
    }
  }, [isAuthenticated, user, navigate, from, location, searchParams, getDashboardPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful');
      const token = localStorage.getItem('accessToken');
      executeSafeRedirect(from, token, navigate, getDashboardPath());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-[#FAF9F6] font-sans overflow-x-hidden">
      {/* Left Panel - Hero/Branding */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-[#F5F3EF] via-[#FAF9F6] to-[#EAE6DF] text-ink p-8 xl:p-12 2xl:p-16 justify-between relative sticky top-0 h-screen overflow-hidden border-r border-border/40">
        {/* Pastel Gradient Background Orbs */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/15 to-indigo-500/10 rounded-full blur-[80px] animate-pulse duration-[8000ms] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 rounded-full blur-[80px] animate-pulse duration-[10000ms] pointer-events-none" />
        
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,11,46,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(26,11,46,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10">
          <a href="https://martechadda.com" className="inline-flex items-center gap-3 group transition-transform hover:translate-x-1 duration-300">
            <div className="p-2 bg-white/70 rounded-xl border border-white shadow-sm backdrop-blur-md group-hover:bg-white group-hover:shadow-md transition-all">
              <img src="/favicon.svg" alt="MarTechAdda" className="h-7 w-auto" />
            </div>
            <span className="text-xl font-bold font-poppins tracking-tight text-ink/95">MarTechAdda</span>
          </a>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-md space-y-6 xl:space-y-8 font-poppins my-auto">
          <div className="space-y-3">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-ink">
              Welcome <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Back</span>
            </h1>
            <p className="text-sm xl:text-base text-ink-soft leading-relaxed font-sans max-w-sm">
              Access your MarTechAdda workspace and continue where you left off.
            </p>
          </div>

          {/* Premium Light Glassmorphic Card */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 xl:p-6 border border-white/95 shadow-[0_12px_40px_0_rgba(26,11,46,0.04)] space-y-3.5 xl:space-y-4 font-sans hover:border-white transition-all duration-500">
            <div className="flex items-center gap-3.5 text-ink/90 group">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 group-hover:bg-green-500/15 transition-colors">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[13.5px] xl:text-[14.5px] font-semibold tracking-wide">Find • Engage • Manage</span>
            </div>
            <div className="flex items-center gap-3.5 text-ink/90 group">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 group-hover:bg-green-500/15 transition-colors">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[13.5px] xl:text-[14.5px] font-semibold tracking-wide">Requirement-First Matching</span>
            </div>
            <div className="flex items-center gap-3.5 text-ink/90 group">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 group-hover:bg-green-500/15 transition-colors">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[13.5px] xl:text-[14.5px] font-semibold tracking-wide">Platform-Backed Security</span>
            </div>
            <div className="flex items-center gap-3.5 text-ink/90 group">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 group-hover:bg-green-500/15 transition-colors">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[13.5px] xl:text-[14.5px] font-semibold tracking-wide">Dedicated Workspace</span>
            </div>
          </div>

          <div className="pt-4 xl:pt-6 border-t border-border/80 text-ink-soft">
            <p className="text-base xl:text-lg font-serif italic text-ink-soft/70">"Requirements In. Relevant Expertise Out."</p>
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

      {/* Right Panel - Login Form */}
      <div className="flex flex-col h-screen overflow-hidden bg-[#FAF9F6] relative">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between p-6 lg:p-8 shrink-0 bg-[#FAF9F6] z-20 w-full">
          <a
            href="https://martechadda.com"
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink transition-colors px-3 py-1.5 rounded-full bg-white border border-border/40 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Website</span>
          </a>

          <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-border/40 shadow-sm text-[11px] font-bold text-ink-soft font-poppins">
            <span className="pl-3 pr-1 text-ink-soft/75">New to MarTechAdda?</span>
            <Link
              to="/register-seeker"
              className="px-3 py-1 bg-primary/5 hover:bg-primary/10 text-primary rounded-full transition-colors"
              state={{ from: location.state?.from }}
            >
              For Businesses
            </Link>
            <span className="text-border/60">|</span>
            <Link
              to="/register-expert"
              className="px-3 py-1 hover:bg-slate-100 text-ink rounded-full transition-colors"
            >
              For Experts
            </Link>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col items-center justify-center scrollbar-thin">
          <div className="w-full max-w-[380px] my-auto space-y-8 animate-fade-in">
          <div className="flex flex-col space-y-2.5 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold font-poppins tracking-tight text-ink">Sign In</h2>
            <p className="text-sm text-ink-soft font-sans">Enter your credentials to access your account</p>
          </div>

          {/* Google Sign-In Option */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                toast.info('Redirecting to Google Authentication...');
                const effectiveRedirect = (from && from !== getDashboardPath()) ? from : null;
                const googleTarget = effectiveRedirect 
                  ? `/api/v1/auth/google?redirect=${encodeURIComponent(effectiveRedirect)}` 
                  : '/api/v1/auth/google';
                window.location.href = googleTarget;
              }}
              className="w-full h-11 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs hover:border-gray-400 transition-all cursor-pointer"
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
              <span className="text-[11px] font-bold text-ink-soft/60 uppercase tracking-widest font-poppins">Or email</span>
              <div className="h-px bg-border/60 flex-1" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-bold font-poppins text-ink-soft uppercase tracking-widest">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-11 rounded-xl border-border/50 bg-white text-ink text-[13.5px] transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-border/80 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[11px] font-bold font-poppins text-ink-soft uppercase tracking-widest">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors font-poppins"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl border-border/50 bg-white text-ink text-[13.5px] transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-border/80 shadow-sm"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-[13.5px] font-bold rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 group">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 duration-300" />
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  </div>
);
};

export default Login;
