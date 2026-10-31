import React, { useState } from 'react';
import { campusApi } from '@/services/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AICopilotDrawerProps {
  open: boolean;
  onClose: () => void;
  onBookingSubmitted?: () => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ open, onClose, onBookingSubmitted }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const samplePrompts = [
    'Need a room for 45 people on Tuesday 6 to 8 pm, projector please.',
    'seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye',
    'I want SH-2 on Friday at 10 am for a wheelchair-accessible poster session, 60 people.',
    'Need somewhere for the quiz finals after lunch on Thursday, maybe 150 people.',
  ];

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || prompt;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await campusApi.parseBookingPrompt(text);
      if (res.success && res.extracted) {
        setExtracted(res.extracted);
        toast.success('Extracted booking parameters');
      }
    } catch {
      toast.error('Could not parse prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!extracted) return;
    setSubmitting(true);
    try {
      await campusApi.submitBookingRequest({
        title: extracted.title,
        attendance: extracted.attendance,
        duration_periods: extracted.duration_periods,
        windows: extracted.windows,
        room_types: extracted.room_types,
        needs: extracted.needs,
        requested_room: extracted.requested_room,
        mandatory_for_groups: extracted.mandatory_for_groups || [],
        raw_text: prompt,
      });

      toast.success('Request added to Spectra Week queue');
      setExtracted(null);
      setPrompt('');
      onBookingSubmitted?.();
      onClose();
    } catch {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6 space-y-6 bg-white">
        <SheetHeader className="space-y-1">
          <SheetTitle className="font-poppins text-base font-semibold text-[#18181B]">
            CIT Copilot
          </SheetTitle>
          <p className="text-xs text-[#71717A]">
            Natural language venue booking across periods P1–P13.
          </p>
        </SheetHeader>

        {/* Input area */}
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your booking request in English or Hinglish..."
            rows={3}
            className="text-xs bg-[#FAF9F6] border-[#E4E4E7] resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleParse()}
              disabled={loading || !prompt.trim()}
              className="h-8 px-3 text-xs bg-[#18181B] text-white hover:bg-[#27272A]"
            >
              {loading ? 'Parsing...' : 'Parse Request'}
            </Button>
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
            Sample Prompts
          </div>
          <div className="space-y-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(p);
                  handleParse(p);
                }}
                className="w-full text-left p-2 rounded border border-[#E4E4E7] bg-[#FAF9F6] hover:border-[#18181B] transition text-xs text-[#18181B] line-clamp-1"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Extracted Form */}
        {extracted && (
          <div className="p-4 rounded-lg border border-[#E4E4E7] bg-[#FAF9F6] space-y-3">
            <div className="font-poppins font-semibold text-xs text-[#18181B]">
              Extracted Parameters
            </div>

            {extracted.follow_up && (
              <div className="p-2.5 rounded border border-amber-200 bg-amber-50 text-[11px] text-amber-900 leading-relaxed">
                {extracted.follow_up}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#71717A]">Attendance</span>
                <Input
                  type="number"
                  value={extracted.attendance}
                  onChange={(e) => setExtracted({ ...extracted, attendance: Number(e.target.value) })}
                  className="h-7 text-xs bg-white border-[#E4E4E7] mt-0.5"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#71717A]">Duration (hrs)</span>
                <Input
                  type="number"
                  value={extracted.duration_periods}
                  onChange={(e) => setExtracted({ ...extracted, duration_periods: Number(e.target.value) })}
                  className="h-7 text-xs bg-white border-[#E4E4E7] mt-0.5"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#71717A]">Day</span>
                <Input
                  value={extracted.windows?.[0]?.day || 'FRI'}
                  onChange={(e) =>
                    setExtracted({
                      ...extracted,
                      windows: [{ ...extracted.windows[0], day: e.target.value }],
                    })
                  }
                  className="h-7 text-xs bg-white border-[#E4E4E7] mt-0.5 font-mono"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#71717A]">Period Span</span>
                <div className="flex gap-1 mt-0.5">
                  <Input
                    type="number"
                    value={extracted.windows?.[0]?.from_period || 10}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        windows: [{ ...extracted.windows[0], from_period: Number(e.target.value) }],
                      })
                    }
                    className="h-7 text-xs bg-white border-[#E4E4E7] font-mono"
                  />
                  <Input
                    type="number"
                    value={extracted.windows?.[0]?.to_period || 11}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        windows: [{ ...extracted.windows[0], to_period: Number(e.target.value) }],
                      })
                    }
                    className="h-7 text-xs bg-white border-[#E4E4E7] font-mono"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="w-full h-8 text-xs font-medium bg-[#18181B] text-white hover:bg-[#27272A] mt-2"
            >
              {submitting ? 'Submitting...' : 'Confirm & Submit'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
