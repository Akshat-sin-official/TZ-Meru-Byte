import React, { useState } from 'react';
import { campusApi } from '@/services/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';
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
  const [aiOffline, setAiOffline] = useState(false);

  // Sample requests from problem statement / starter pack
  const samplePrompts = [
    'Need a room for 45 people on Tuesday 6 to 8 pm, projector please.',
    'seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye',
    'I want SH-2 on Friday at 10 am for a wheelchair-accessible poster session, 60 people.',
    'Need somewhere for the quiz finals after lunch on Thursday, maybe 150 people.',
    'Can I get a lab with computers for a 3-hour coding contest on Thursday afternoon? About 60 participants.',
  ];

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || prompt;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await campusApi.parseBookingPrompt(text);
      if (res.success && res.extracted) {
        setExtracted(res.extracted);
        setAiOffline(false);
        toast.success('Plain-language request parsed into structured booking!');
      } else {
        setAiOffline(true);
        toast.warning('Switched to manual entry form.');
      }
    } catch {
      setAiOffline(true);
      toast.warning('AI Copilot offline. Manual booking entry enabled.');
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

      toast.success('Booking request submitted into Spectra Week queue!');
      setExtracted(null);
      setPrompt('');
      onBookingSubmitted?.();
      onClose();
    } catch (err: any) {
      toast.error('Submission failed', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6 space-y-6">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <SheetTitle className="font-poppins font-bold text-lg">
              CIT Copilot (NL Booking Assistant)
            </SheetTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Type your venue request in plain English or Hinglish. The AI extracts structured parameters across periods P1–P13.
          </p>
        </SheetHeader>

        {/* Fallback Banner if offline */}
        {aiOffline && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>AI Copilot offline — manual editable form loaded below.</span>
          </div>
        )}

        {/* Text Input */}
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Need a seminar hall tomorrow 6 to 8 pm for 90 people with mic and projector..."
            rows={3}
            className="text-xs resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Press Parse or choose a test prompt</span>
            <Button
              size="sm"
              onClick={() => handleParse()}
              disabled={loading || !prompt.trim()}
              className="gap-1.5 h-8 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{loading ? 'Interpreting...' : 'Parse Request'}</span>
            </Button>
          </div>
        </div>

        {/* Sample Prompt Chips */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Sample Practice Prompts (from Starter Pack):
          </p>
          <div className="flex flex-col gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(p);
                  handleParse(p);
                }}
                className="text-left p-2 rounded-xl border border-muted hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition text-xs text-foreground truncate"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Structured Review Form */}
        {extracted && (
          <div className="p-4 rounded-2xl border bg-muted/20 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-poppins font-bold text-xs text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Extracted Booking Details (Editable Review)</span>
              </span>
              <Badge variant="outline" className="text-[10px]">P1–P13 Resolved</Badge>
            </div>

            {/* Follow-up Warning if conflict */}
            {extracted.follow_up && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{extracted.follow_up}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-muted-foreground">Attendance (Headcount)</label>
                <Input
                  type="number"
                  value={extracted.attendance}
                  onChange={(e) => setExtracted({ ...extracted, attendance: Number(e.target.value) })}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground">Duration (Hours / Periods)</label>
                <Input
                  type="number"
                  value={extracted.duration_periods}
                  onChange={(e) => setExtracted({ ...extracted, duration_periods: Number(e.target.value) })}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground">Day</label>
                <Input
                  value={extracted.windows?.[0]?.day || 'FRI'}
                  onChange={(e) =>
                    setExtracted({
                      ...extracted,
                      windows: [{ ...extracted.windows[0], day: e.target.value }],
                    })
                  }
                  className="h-8 text-xs mt-1 font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground">Time Window (Periods)</label>
                <div className="flex gap-1 mt-1">
                  <Input
                    type="number"
                    value={extracted.windows?.[0]?.from_period || 10}
                    onChange={(e) =>
                      setExtracted({
                        ...extracted,
                        windows: [{ ...extracted.windows[0], from_period: Number(e.target.value) }],
                      })
                    }
                    className="h-8 text-xs font-mono"
                    placeholder="From P"
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
                    className="h-8 text-xs font-mono"
                    placeholder="To P"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground">Equipment Needs</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {extracted.needs?.map((need: string) => (
                    <Badge key={need} variant="outline" className="text-[10px] capitalize">
                      {need}
                    </Badge>
                  ))}
                  {extracted.needs?.length === 0 && <span className="text-[11px] text-muted-foreground italic">None specified</span>}
                </div>
              </div>

              {extracted.requested_room && (
                <div className="col-span-2">
                  <label className="text-[10px] text-muted-foreground">Preferred Venue</label>
                  <Input
                    value={extracted.requested_room}
                    onChange={(e) => setExtracted({ ...extracted, requested_room: e.target.value })}
                    className="h-8 text-xs mt-1 font-mono font-bold"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="w-full gap-2 text-xs font-medium"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{submitting ? 'Submitting to Venue Queue...' : 'Confirm & Submit to Spectra Queue'}</span>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

