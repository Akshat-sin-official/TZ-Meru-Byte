import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogOut, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpertWelcomeModal() {
  const { user, acknowledgeWelcome, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current route is an onboarding/profile setup route where welcome modal must never appear
  const isOnboardingRoute =
    location.pathname.startsWith('/expert/profile') ||
    location.pathname.startsWith('/service-expert-register') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/login');

  const shouldShow =
    !isOnboardingRoute &&
    Boolean(
      user &&
      (user.role === 'expert' || user.role === 'expert_candidate') &&
      !user.welcomeAcknowledged &&
      user.profileStatus !== 'submitted_for_verification' &&
      user.profileStatus !== 'under_verification' &&
      user.profileStatus !== 'verified'
    );

  // Freeze background scrolling only when welcome modal is actually active
  useEffect(() => {
    if (!shouldShow) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shouldShow]);

  // Only render if conditions met
  if (!shouldShow) {
    return null;
  }

  const handleCompleteProfile = async () => {
    setIsSubmitting(true);
    try {
      await acknowledgeWelcome();
      toast.success('Welcome! Let\'s complete your profile.');
      navigate('/expert/profile', { replace: true });
    } catch (error) {
      console.error('Failed to acknowledge welcome:', error);
      // Fallback navigate to profile
      navigate('/expert/profile', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md select-none"
      style={{ touchAction: 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Locked Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Header Bar with Logout Button */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider font-poppins text-slate-500">Welcome Screen</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-8 px-3 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            <span>Sign Out</span>
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800">
          
          {/* Welcome Badge & Icon */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-purple-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Account Created Successfully</span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-poppins text-slate-900 tracking-tight leading-tight">
              Welcome to MarTechAdda!
            </h2>
            <p className="text-base text-slate-700 font-medium">
              Your account has been created successfully.
            </p>
            <p className="text-sm text-slate-500 leading-relaxed pt-1">
              Complete your expert profile to become discoverable to relevant businesses.
            </p>
          </div>

          {/* Key Value Points */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Get matched with active business requirements</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero commission on direct client engagements</span>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="pt-4 space-y-2">
            <Button
              onClick={handleCompleteProfile}
              disabled={isSubmitting}
              className="w-full h-12 text-sm sm:text-base font-bold font-poppins rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 transition-all duration-300 cursor-pointer"
            >
              <span>{isSubmitting ? 'Opening Profile...' : 'Complete My Profile'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <p className="text-[11px] text-center text-slate-400 font-normal">
              Screen locked until profile completion setup is initiated.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
