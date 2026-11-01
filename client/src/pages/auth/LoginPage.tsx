import React, { useState } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Users2,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, loginDemo } = useCampusAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const demoRoles = [
    {
      role: 'admin' as const,
      label: 'Admin',
      sub: 'Dean Office (F37)',
      icon: ShieldCheck,
    },
    {
      role: 'department_coordinator' as const,
      label: 'Coordinator',
      sub: 'CSE Dept (F01)',
      icon: Users2,
    },
    {
      role: 'faculty' as const,
      label: 'Faculty',
      sub: 'Dr. S. Rath (F19)',
      icon: GraduationCap,
    },
    {
      role: 'club' as const,
      label: 'Club',
      sub: 'Dramatics Society',
      icon: Sparkles,
    },
  ];

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully');
      onSuccess();
    } catch (err: any) {
      if (!err?.response) {
        toast.error('Cannot connect to API server at http://localhost:5000. Please ensure run_server.bat is running.');
      } else if (err.response?.status === 401) {
        toast.error('Invalid credentials. Please verify your email and password.');
      } else {
        toast.error(err.response?.data?.error || 'Sign-in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'department_coordinator' | 'faculty' | 'club') => {
    setActiveRole(role);
    try {
      await loginDemo(role);
      toast.success(`Signed in as ${role.replace('_', ' ')}`);
      onSuccess();
    } catch (err: any) {
      if (!err?.response) {
        toast.error('Cannot connect to API server at http://localhost:5000. Please ensure run_server.bat is running.');
      } else {
        toast.error('Demo sign-in failed. Please verify database connection.');
      }
    } finally {
      setActiveRole(null);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-[#FAF9F6] font-sans overflow-x-hidden">
      {/* Left Panel - Hero / Branding matching docs/UI implementation */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-[#F5F3EF] via-[#FAF9F6] to-[#EAE6DF] text-ink p-8 xl:p-12 2xl:p-16 justify-between relative sticky top-0 h-screen overflow-hidden border-r border-border/40">
        {/* Pastel Gradient Background Orbs */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/15 to-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,11,46,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(26,11,46,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 group">
            <div className="p-1.5 bg-white/90 rounded-2xl border border-white/90 shadow-sm backdrop-blur-md flex items-center justify-center">
              <img src="/logo.jpeg" alt="CIT CampusOS" className="w-12 h-12 object-cover rounded-xl shadow-2xs" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-poppins tracking-tight text-ink/95 leading-none">
                CampusOS
              </span>
              <span className="text-[10px] text-ink-soft/70 uppercase tracking-widest font-mono mt-0.5">
                Chilika Institute of Technology
              </span>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-md space-y-6 xl:space-y-8 font-poppins my-auto">
          <div className="space-y-3">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-ink">
              Welcome <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Back</span>
            </h1>
            <p className="text-sm xl:text-base text-ink-soft leading-relaxed font-sans max-w-sm">
              Autonomous campus operations engine for timetables, exams, and venue bookings.
            </p>
          </div>

          {/* Premium Light Glassmorphic Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 xl:p-6 border border-white/95 shadow-[0_12px_40px_0_rgba(26,11,46,0.04)] space-y-3.5 xl:space-y-4 font-sans hover:border-white transition-all duration-500">
            <div className="flex items-center gap-3.5 text-ink/90 group">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 group-hover:bg-green-500/15 transition-colors">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[13.5px] xl:text-[14.5px] font-semibold tracking-wide">
                0 Hard Constraint Violations Guaranteed
              </span>
            </div>
            <div className="flex items-center gap-3.5 text-ink/90 group">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 group-hover:bg-green-500/15 transition-colors">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[13.5px] xl:text-[14.5px] font-semibold tracking-wide">
                Conflict-Free Midsem Seating (Half-Capacity)
              </span>
            </div>
            <div className="flex items-center gap-3.5 text-ink/90 group">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 group-hover:bg-green-500/15 transition-colors">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[13.5px] xl:text-[14.5px] font-semibold tracking-wide">
                Spectra Week Allocations (0 Inversions)
              </span>
            </div>
            <div className="flex items-center gap-3.5 text-ink/90 group">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 group-hover:bg-green-500/15 transition-colors">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[13.5px] xl:text-[14.5px] font-semibold tracking-wide">
                2-Stage Disruption Stability Recovery
              </span>
            </div>
          </div>

          <div className="pt-4 xl:pt-6 border-t border-border/80 text-ink-soft">
            <p className="text-base xl:text-lg font-serif italic text-ink-soft/70">
              "Zero Violations. Absolute Academic Predictability."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-end text-[11px] text-ink-soft/60 font-medium font-sans">
          <p>© 2027 Chilika Institute of Technology</p>
          <span className="font-mono text-[10px] text-ink-soft/50">cit-public-v1</span>
        </div>
      </div>

      {/* Right Panel - Login Form matching docs/UI */}
      <div className="flex flex-col h-screen overflow-hidden bg-[#FAF9F6] relative">
        {/* Top Bar with Role Pills */}
        <div className="flex items-center justify-between p-6 lg:p-8 shrink-0 bg-[#FAF9F6] z-20 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-soft font-poppins">Quick Profiles:</span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-border/40 shadow-xs text-[11px] font-bold text-ink-soft font-poppins">
            {demoRoles.map((dr) => (
              <button
                key={dr.role}
                type="button"
                onClick={() => handleDemoLogin(dr.role)}
                disabled={activeRole !== null}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  activeRole === dr.role
                    ? 'bg-primary text-white shadow-xs'
                    : 'hover:bg-slate-50 text-ink'
                }`}
              >
                {dr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col items-center justify-center scrollbar-thin">
          <div className="w-full max-w-[380px] my-auto space-y-6 animate-fade-in">
            <div className="flex flex-col space-y-2 text-center lg:text-left">
              <div className="lg:hidden flex items-center justify-center gap-2.5 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white border border-border/50 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                  <img src="/logo.jpeg" alt="CIT CampusOS" className="w-full h-full object-cover rounded-xl" />
                </div>
                <span className="text-xl font-bold font-poppins text-ink">CIT CampusOS</span>
              </div>
              <h2 className="text-3xl font-extrabold font-poppins tracking-tight text-ink">Sign In</h2>
              <p className="text-sm text-ink-soft font-sans">
                Select a profile above or sign in with your CIT account
              </p>
            </div>

            {/* 1-Click Profile Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {demoRoles.map((dr) => {
                const Icon = dr.icon;
                const isSelected = activeRole === dr.role;
                return (
                  <button
                    key={dr.role}
                    type="button"
                    onClick={() => handleDemoLogin(dr.role)}
                    disabled={activeRole !== null}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border/60 bg-white hover:border-primary/40 hover:bg-slate-50/50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-1 rounded-lg bg-primary/10 text-primary">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono text-ink-soft/60">1-click</span>
                    </div>
                    <div className="mt-2">
                      <div className="font-poppins font-bold text-xs text-ink">{dr.label}</div>
                      <div className="text-[10px] text-ink-soft truncate mt-0.5">{dr.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px bg-border/60 flex-1" />
              <span className="text-[11px] font-bold text-ink-soft/60 uppercase tracking-widest font-poppins">
                Or credentials
              </span>
              <div className="h-px bg-border/60 flex-1" />
            </div>

            {/* Manual Credential Form */}
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-[11px] font-bold font-poppins text-ink-soft uppercase tracking-widest"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cit.edu"
                  className="h-11 rounded-xl border-border/50 bg-white text-ink text-[13.5px] transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-border/80 shadow-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-bold font-poppins text-ink-soft uppercase tracking-widest"
                >
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl border-border/50 bg-white text-ink text-[13.5px] transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/5 hover:border-border/80 shadow-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-[13.5px] font-bold rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Signing in...</span>
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
