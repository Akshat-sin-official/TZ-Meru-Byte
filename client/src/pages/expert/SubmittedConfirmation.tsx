import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubmittedConfirmation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-8 sm:p-10 text-center space-y-6">
        
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-gray-900">
            Profile Submitted Successfully
          </h1>
          <p className="text-sm text-gray-600">
            Your profile is currently under review by the platform team. It will be live once approved.
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50/80 border border-blue-100 p-5 text-left space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Under Review
            </span>
          </div>
          <p className="text-xs text-gray-700 font-semibold">
            Estimated review time: <span className="font-bold text-gray-900">1–2 business days</span>
          </p>
          <p className="text-xs text-gray-600 leading-relaxed pt-1">
            You'll receive an email and dashboard notification once the review is complete.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-8 py-6 rounded-full font-bold text-sm bg-primary hover:bg-primary/95 text-white shadow-md inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Go to Welcome Center
          </Button>
        </div>

      </div>
    </div>
  );
}
