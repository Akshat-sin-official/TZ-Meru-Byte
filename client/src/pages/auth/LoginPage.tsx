import React, { useState } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  GraduationCap,
  Users,
  Compass,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, loginDemo } = useCampusAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoleLoading, setActiveRoleLoading] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'admin' as const,
      title: 'Administrator',
      subtitle: 'Dean of Academics (Faculty F37)',
      email: 'admin@cit.edu',
      color: 'hover:border-purple-500/50 hover:bg-purple-500/5',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      icon: ShieldCheck,
      capabilities: 'Solvers, approvals, disruptions, demo reset',
    },
    {
      role: 'department_coordinator' as const,
      title: 'Dept. Coordinator',
      subtitle: 'CSE Department (Faculty F01)',
      email: 'coord.cse@cit.edu',
      color: 'hover:border-blue-500/50 hover:bg-blue-500/5',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      icon: Compass,
      capabilities: 'Department timetable, exam review',
    },
    {
      role: 'faculty' as const,
      title: 'Faculty Member',
      subtitle: 'Dr. S. Rath (Mathematics - F19)',
      email: 'faculty.f19@cit.edu',
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      icon: GraduationCap,
      capabilities: 'Personal schedule, preferences, guest lecture requests',
    },
    {
      role: 'club' as const,
      title: 'Club Representative',
      subtitle: 'Dramatics Society Lead',
      email: 'dramatics@cit.edu',
      color: 'hover:border-amber-500/50 hover:bg-amber-500/5',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      icon: Users,
      capabilities: 'Spectra Week venue booking & calendar',
    },
  ];

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error('Sign-in failed', {
        description: err.response?.data?.error || 'Invalid credentials. Please verify your details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'department_coordinator' | 'faculty' | 'club') => {
    setActiveRoleLoading(role);
    try {
      await loginDemo(role);
      toast.success(`Signed in as ${role.replace('_', ' ').toUpperCase()}!`);
      onSuccess();
    } catch (err: any) {
      toast.error('Demo login failed', { description: err.message });
    } finally {
      setActiveRoleLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-12 bg-[#FAF9F6] text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* ── Left Hero Panel (5 cols) ── */}
      <div className="hidden lg:flex lg:col-span-5 flex-col bg-gradient-to-br from-[#F5F3EF] via-[#FAF9F6] to-[#EAE6DF] text-ink p-8 xl:p-12 justify-between relative sticky top-0 h-screen overflow-hidden border-r border-border/40">
        {/* Soft Glowing Gradient Orbs */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/15 to-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 rounded-full blur-[90px] pointer-events-none" />

        {/* Subtle Geometric Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,11,46,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(26,11,46,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm border border-white/80 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-poppins font-extrabold text-xl tracking-tight text-ink">
                CIT CampusOS
              </span>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono py-0 h-4">
                v1.0
              </Badge>
            </div>
            <p className="text-xs text-ink-soft">
              Chilika Institute of Technology · Operational Suite
            </p>
          </div>
        </div>

        {/* Center Hero Copy */}
        <div className="relative z-10 space-y-6 my-auto max-w-lg">
          <div className="space-y-3">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs font-medium py-1 px-3 rounded-full">
              ✨ Zero Hard Violations Architecture
            </Badge>
            <h1 className="text-4xl xl:text-5xl font-extrabold font-poppins tracking-tight text-ink leading-[1.12]">
              Campus Operations,{' '}
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Optimized to Perfection.
              </span>
            </h1>
            <p className="text-sm xl:text-base text-ink-soft font-sans leading-relaxed">
              Autonomous constraint satisfaction for academic timetables, midsem exam seating, Spectra Week venue allocation, and disruption recovery.
            </p>
          </div>

          {/* Glassmorphic Feature Showcase Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_12px_40px_0_rgba(26,11,46,0.04)] space-y-3 font-sans">
            <div className="flex items-center gap-3 text-ink/90">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-xs xl:text-sm font-semibold">189 Sessions · 27 Rooms · 0 Hard Violations</span>
            </div>
            <div className="flex items-center gap-3 text-ink/90">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-xs xl:text-sm font-semibold">41 Midsem Exams at Half Capacity (Distance Rule)</span>
            </div>
            <div className="flex items-center gap-3 text-ink/90">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-xs xl:text-sm font-semibold">Spectra Week Fair Allocation (0 Priority Inversions)</span>
            </div>
            <div className="flex items-center gap-3 text-ink/90">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-xs xl:text-sm font-semibold">Hinglish AI Copilot with Resilient Offline Fallback</span>
            </div>
          </div>

          <div className="pt-2 text-ink-soft">
            <p className="text-xs font-serif italic text-ink-soft/80">
              "Every session in its rightful place. Every constraint respected."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-ink-soft/70 font-medium">
          <span>© 2027 Chilika Institute of Technology</span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            CP-SAT Solver Ready
          </span>
        </div>
      </div>

      {/* ── Right Authentication Panel (7 cols) ── */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 xl:p-16 relative overflow-y-auto">
        <div className="w-full max-w-lg space-y-8 animate-fade-in my-auto">
          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold font-poppins tracking-tight text-ink">
              Welcome to CIT CampusOS
            </h2>
            <p className="text-sm text-ink-soft font-sans">
              Choose one of the 4 pre-configured judge accounts or sign in with your email.
            </p>
          </div>

          {/* ── 4 One-Click Judge Role Cards ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-poppins uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span>Instant Hackathon Evaluation Roles</span>
              </span>
              <span className="text-[11px] text-muted-foreground">Click to enter directly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoAccounts.map((account) => {
                const IconComponent = account.icon;
                const isThisLoading = activeRoleLoading === account.role;

                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleDemoLogin(account.role)}
                    disabled={Boolean(activeRoleLoading) || isLoading}
                    className={`text-left p-3.5 rounded-2xl border border-border/70 bg-white shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer group flex flex-col justify-between ${account.color}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <span className="font-poppins font-bold text-xs text-ink group-hover:text-primary transition-colors">
                            {account.title}
                          </span>
                        </div>
                        <Badge className={`text-[9px] py-0 px-1.5 capitalize font-medium ${account.badgeColor}`}>
                          {account.role.replace('_', ' ')}
                        </Badge>
                      </div>

                      <p className="text-[11px] font-medium text-ink-soft truncate">
                        {account.subtitle}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {account.capabilities}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-primary font-semibold">
                      <span>{isThisLoading ? 'Entering...' : 'Enter Workspace'}</span>
                      <ArrowRight className={`h-3.5 w-3.5 group-hover:translate-x-1 transition-transform ${isThisLoading ? 'animate-pulse' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-border/80 w-full" />
            <span className="bg-[#FAF9F6] px-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">
              Or sign in with email
            </span>
            <div className="border-t border-border/80 w-full" />
          </div>

          {/* Manual Credentials Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-ink">
                Institutional Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@cit.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 rounded-xl bg-white border-border/80 text-xs focus:ring-primary shadow-2xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-ink">
                  Password
                </Label>
                <span className="text-[11px] text-muted-foreground">Demo: CitAdmin2027!</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-10 rounded-xl bg-white border-border/80 text-xs focus:ring-primary shadow-2xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || Boolean(activeRoleLoading)}
              className="w-full h-11 rounded-xl font-poppins font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm transition-all duration-200 mt-2"
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign In to CampusOS'}
            </Button>
          </form>

          {/* Bottom Security Note */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Server-side Argon2id encryption & 4-role deterministic RBAC active.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
