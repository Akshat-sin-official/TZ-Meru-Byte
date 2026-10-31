import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Loader2,
    Mail,
    CheckCircle2
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await apiClient.post('/v1/auth/forgot-password', { email });
            setIsSubmitted(true);
            toast.success('Reset link sent successfully');
        } catch (error: any) {
            console.error('Forgot password error:', error);
            toast.error(error.response?.data?.error || 'Failed to send reset link');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-8 bg-[#FAF9F6] overflow-hidden relative font-sans">
                {/* Abstract Background Effects */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />

                <div className="w-full max-w-[400px] space-y-6 bg-white p-8 rounded-2xl border border-border/55 relative z-10 text-center shadow-sm animate-fade-in">
                    <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-ink font-poppins">Check your email</h2>
                    <p className="text-xs text-ink-soft leading-relaxed">
                        We've sent a password reset link to <strong className="text-ink">{email}</strong>.
                    </p>
                    <div className="pt-2">
                        <Button asChild variant="outline" className="w-full h-11 rounded-xl text-xs font-bold border-border/50 bg-white hover:bg-slate-50 text-ink cursor-pointer transition-all hover:shadow-sm">
                            <Link to="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2 bg-[#FAF9F6] font-sans overflow-x-hidden">
      {/* Left Panel - Hero/Branding */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-[#F5F3EF] via-[#FAF9F6] to-[#EAE6DF] text-ink p-16 justify-between relative overflow-hidden border-r border-border/40">
        {/* Pastel Gradient Background Orbs */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/15 to-indigo-500/10 rounded-full blur-[80px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 rounded-full blur-[80px] animate-pulse duration-[10000ms]" />
        
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,11,46,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(26,11,46,0.01)_1px,transparent_1px)] bg-[size:40px_40px]" />

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
        <div className="relative z-10 max-w-md space-y-10 font-poppins my-auto">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.2] text-ink">
              Forgot your <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">password?</span>
            </h1>
            <p className="text-base text-ink-soft leading-relaxed font-sans max-w-sm">
              No worries! It happens. Just enter your email and we'll help you get back into your account.
            </p>
          </div>

          {/* Premium Light Glassmorphic Card */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/95 shadow-[0_12px_40px_0_rgba(26,11,46,0.04)] font-sans hover:border-white transition-all duration-500">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-ink/95">Secure Reset Link</p>
                <p className="text-xs text-ink-soft/70 mt-0.5 leading-relaxed">Your security is our priority. We use encrypted validation tokens for all password reset requests.</p>
              </div>
            </div>
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

            {/* Right Panel - Form */}
            <div className="flex items-center justify-center p-8 lg:p-16 bg-[#FAF9F6] relative min-h-screen">
                {/* Back to Website (Top Left) */}
                <div className="absolute top-8 left-8 z-20">
                  <a
                    href="https://martechadda.com"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink transition-colors px-3 py-1.5 rounded-full bg-white border border-border/40 hover:bg-slate-50 shadow-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Website</span>
                  </a>
                </div>
                <div className="w-full max-w-[360px] space-y-8 animate-fade-in">
                    <div className="flex flex-col space-y-2.5 text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold font-poppins tracking-tight text-ink">Forgot Password</h2>
                        <p className="text-sm text-ink-soft font-sans font-normal leading-relaxed">
                            Enter your work email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        <div className="space-y-3.5">
                            <Button 
                                type="submit" 
                                className="w-full h-11 text-[13.5px] font-bold rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                        <span>Sending Link...</span>
                                    </div>
                                ) : (
                                    <span>Send Reset Link</span>
                                )}
                            </Button>

                            <Button asChild variant="outline" className="w-full h-11 text-[13px] font-semibold rounded-xl border-border/50 bg-white hover:bg-slate-50 text-ink flex items-center justify-center gap-2 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer">
                                <Link to="/login">
                                    <ArrowLeft className="h-4 w-4" /> <span>Back to Sign In</span>
                                </Link>
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
