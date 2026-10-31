import React, { useState } from 'react';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, loginDemo } = useCampusAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const demoRoles = [
    { role: 'admin' as const, label: 'Admin', desc: 'Dean Office (F37)' },
    { role: 'department_coordinator' as const, label: 'Coordinator', desc: 'CSE Dept (F01)' },
    { role: 'faculty' as const, label: 'Faculty', desc: 'Dr. S. Rath (F19)' },
    { role: 'club' as const, label: 'Club', desc: 'Dramatics Society' },
  ];

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully');
      onSuccess();
    } catch (err: any) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'department_coordinator' | 'faculty' | 'club') => {
    setActiveRole(role);
    try {
      await loginDemo(role);
      toast.success(`Signed in as ${role.replace('_', ' ')}`);
      onSuccess();
    } catch {
      toast.error('Sign-in failed');
    } finally {
      setActiveRole(null);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-[#FAF9F6] text-[#18181B] font-sans">
      {/* Left Column: Brand & Editorial Statement */}
      <div className="hidden lg:flex flex-col justify-between p-16 border-r border-[#E4E4E7] bg-[#FAF9F6]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded bg-[#18181B] flex items-center justify-center text-white text-xs font-semibold">
              C
            </div>
            <span className="font-poppins font-semibold text-sm tracking-tight text-[#18181B]">
              CIT CampusOS
            </span>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <div className="space-y-3">
            <h1 className="font-poppins text-3xl font-semibold tracking-tight text-[#18181B] leading-snug">
              Campus operations, mathematically optimized.
            </h1>
            <p className="text-sm text-[#71717A] leading-relaxed">
              Autonomous scheduling for academic sessions, midsem examinations, and fest week venue allocation with zero hard violations.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E4E4E7] space-y-2.5 text-xs text-[#52525B]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#18181B]" />
              <span>189 sessions across 27 venues and 40 faculty members</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#18181B]" />
              <span>Midsem exams scheduled at 50% room capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#18181B]" />
              <span>Spectra Week venue matching with zero priority inversions</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#A1A1AA]">
          Chilika Institute of Technology · Academic Year 2026-27
        </div>
      </div>

      {/* Right Column: Clean Authentication Form */}
      <div className="flex flex-col justify-center items-center p-8 sm:p-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1.5">
            <h2 className="font-poppins text-xl font-semibold tracking-tight text-[#18181B]">
              Sign in
            </h2>
            <p className="text-xs text-[#71717A]">
              Select a demo role for evaluation or enter your credentials.
            </p>
          </div>

          {/* Quick Demo Access Pills */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-[#71717A] uppercase tracking-wider">
              Quick Role Switch (Demo)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {demoRoles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleDemoLogin(r.role)}
                  disabled={Boolean(activeRole) || loading}
                  className="text-left p-3 rounded-lg border border-[#E4E4E7] bg-white hover:border-[#18181B] transition-colors cursor-pointer"
                >
                  <div className="font-medium text-xs text-[#18181B]">{r.label}</div>
                  <div className="text-[10px] text-[#71717A] truncate mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E4E4E7] w-full" />
            <span className="bg-[#FAF9F6] px-3 text-[11px] text-[#A1A1AA] uppercase tracking-wider">
              or
            </span>
            <div className="border-t border-[#E4E4E7] w-full" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#18181B]">Email</Label>
              <Input
                type="email"
                placeholder="admin@cit.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs rounded-md bg-white border-[#E4E4E7]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#18181B]">Password</Label>
              <Input
                type="password"
                placeholder="CitAdmin2027!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs rounded-md bg-white border-[#E4E4E7]"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || Boolean(activeRole)}
              className="w-full h-9 rounded-md font-medium text-xs bg-[#18181B] text-white hover:bg-[#27272A] transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in to workspace'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
