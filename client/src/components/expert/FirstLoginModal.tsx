import React from 'react';
import { Check, ShieldAlert, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FirstLoginModalProps {
  expertId: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleteTrust: () => void;
}

export const FirstLoginModal: React.FC<FirstLoginModalProps> = ({
  expertId,
  isOpen,
  onClose,
  onCompleteTrust,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[540px] rounded-3xl border border-border/80 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to MarTechAdda!
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-gray-900 leading-tight">
            Congratulations! Your expert profile has been approved.
          </h2>
          <p className="text-sm text-gray-600">
            Your Expert ID has been generated and your Expert Workspace is now active.
          </p>
        </div>

        {/* Expert ID Badge */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-emerald-50 border border-primary/20 p-4 text-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Official Expert ID
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-primary">
            {expertId}
          </span>
        </div>

        {/* Capabilities checklist */}
        <div className="space-y-2.5 bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">You can now:</p>
          {[
            'Receive project opportunities',
            'Participate in requirement discussions',
            'Submit quotations',
            'Manage your engagements from your workspace',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-gray-800">
              <span className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Payout note */}
        <div className="flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl p-3.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            To receive future payouts, complete your <strong>Trust &amp; Compliance</strong> before your first payment.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={onClose}
            className="flex-1 rounded-full py-6 font-bold text-sm bg-primary hover:bg-primary/95 shadow-md"
          >
            Explore Workspace
          </Button>
          <Button
            onClick={() => {
              onClose();
              onCompleteTrust();
            }}
            variant="outline"
            className="flex-1 rounded-full py-6 font-bold text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Complete Trust &amp; Compliance
          </Button>
        </div>
      </div>
    </div>
  );
};
