import React, { useState } from 'react';
import { campusApi } from '@/services/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Bot,
  Sparkles,
  Send,
  RotateCw,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Mic,
  Video,
  Accessibility,
  ArrowRight,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AICopilotDrawerProps {
  open: boolean;
  onClose: () => void;
  onBookingSubmitted?: () => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  open,
  onClose,
  onBookingSubmitted,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const samplePrompts = [
    {
      title: 'Auditorium Gala',
      text: 'Need Auditorium on Friday 6 to 9 pm for 250 people, audio and mic required.',
      tag: 'Flagship Event',
    },
    {
      title: 'Hinglish Workshop',
      text: 'seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic aur projector chahiye',
      tag: 'Hinglish NLP',
    },
    {
      title: 'Accessible Poster Session',
      text: 'I want SH-2 on Friday at 10 am for a wheelchair-accessible poster session, 60 people.',
      tag: 'Accessibility (H4)',
    },
    {
      title: 'Quiz Finals',
      text: 'Need LH-1 for the inter-college quiz finals after lunch on Thursday, 120 people.',
      tag: 'Post-Lunch (H9)',
    },
  ];

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || prompt;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await campusApi.parseBookingPrompt(text);
      if (res.success && res.extracted) {
        setExtracted(res.extracted);
        toast.success('Extracted booking parameters with high confidence');
      } else {
        toast.error('Could not extract parameters from prompt');
      }
    } catch {
      toast.error('NLP Parsing failed. Please rephrase or specify parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!extracted) return;
    setSubmitting(true);
    try {
      await campusApi.submitBookingRequest({
        title: extracted.title || 'Campus Event',
        attendance: extracted.attendance || 60,
        duration_periods: extracted.duration_periods || 2,
        windows: extracted.windows || [{ day: 'FRI', from_period: 10, to_period: 12 }],
        room_types: extracted.room_types || ['auditorium', 'seminar_hall'],
        needs: extracted.needs || [],
        requested_room: extracted.requested_room || null,
        mandatory_for_groups: extracted.mandatory_for_groups || [],
        raw_text: prompt,
      });

      toast.success('Reservation queued in Spectra Week allocation pool');
      setExtracted(null);
      setPrompt('');
      onBookingSubmitted?.();
      onClose();
    } catch {
      toast.error('Booking submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6 bg-white font-sans">
        {/* Copilot Header matching docs/UI/website-ui */}
        <SheetHeader className="space-y-2 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="font-poppins text-base font-bold text-[#111926] flex items-center gap-2">
                  CIT Copilot
                  <span className="flex items-center gap-1 text-[10px] font-bold font-poppins px-2 py-0.5 rounded-full bg-purple-50 text-primary border border-purple-200">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    AI Agent
                  </span>
                </SheetTitle>
                <p className="text-xs text-muted-foreground font-poppins">
                  Autonomous natural language venue booking across P1–P13
                </p>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border-emerald-200 hidden sm:inline-flex">
              CP-SAT Synchronized
            </Badge>
          </div>
        </SheetHeader>

        {/* Input Textarea & Action */}
        <div className="space-y-3">
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your event in English or Hinglish (e.g. 'seminar hall kal shaam 6 baje for 80 people, projector chahiye')..."
              rows={3}
              className="text-xs bg-[#FAF9F6] border-[#E5E7EB] focus:border-primary focus:bg-white resize-none rounded-xl p-3 font-sans transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-poppins">
              Understands multi-hour blocks & equipment tags
            </span>
            <button
              onClick={() => handleParse()}
              disabled={loading || !prompt.trim()}
              className="rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins px-4 py-2 text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{loading ? 'Analyzing NLP...' : 'Ask Copilot'}</span>
            </button>
          </div>
        </div>

        {/* Sample Prompt Chips */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.08em] font-poppins flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Quick Prompt Templates</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(p.text);
                  handleParse(p.text);
                }}
                className="w-full text-left p-2.5 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-white hover:border-primary/40 hover:shadow-2xs transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-poppins text-[#111926] group-hover:text-primary transition-colors">
                    {p.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 text-muted-foreground">
                    {p.tag}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-1">
                  "{p.text}"
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Extracted Blueprint Card */}
        {extracted && (
          <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-4 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-1.5 font-bold font-poppins text-xs text-[#111926]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Extracted Booking Parameters</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Ready to Enqueue
              </span>
            </div>

            {extracted.follow_up && (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold font-poppins">Agent Follow-Up</div>
                  <div className="text-[11px] mt-0.5">{extracted.follow_up}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground block mb-1">
                  Event Title
                </label>
                <Input
                  value={extracted.title || ''}
                  onChange={(e) => setExtracted({ ...extracted, title: e.target.value })}
                  className="h-8 text-xs bg-white border-[#E5E7EB] font-poppins font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground block mb-1">
                  Expected Attendance
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={extracted.attendance || 60}
                    onChange={(e) => setExtracted({ ...extracted, attendance: Number(e.target.value) })}
                    className="h-8 text-xs bg-white border-[#E5E7EB] font-mono pr-12"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground">pax</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground block mb-1">
                  Duration
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={extracted.duration_periods || 2}
                    onChange={(e) => setExtracted({ ...extracted, duration_periods: Number(e.target.value) })}
                    className="h-8 text-xs bg-white border-[#E5E7EB] font-mono pr-12"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground">hours</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground block mb-1">
                  Day of Week
                </label>
                <Input
                  value={extracted.windows?.[0]?.day || 'FRI'}
                  onChange={(e) =>
                    setExtracted({
                      ...extracted,
                      windows: [{ ...extracted.windows?.[0], day: e.target.value }],
                    })
                  }
                  className="h-8 text-xs bg-white border-[#E5E7EB] font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground block mb-1">
                  Preferred Venue
                </label>
                <Input
                  value={extracted.requested_room || 'Auditorium'}
                  onChange={(e) => setExtracted({ ...extracted, requested_room: e.target.value })}
                  className="h-8 text-xs bg-white border-[#E5E7EB] font-mono font-bold"
                />
              </div>
            </div>

            {/* Special Needs Tags */}
            {extracted.needs && extracted.needs.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground block mb-1.5">
                  Identified Requirements
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {extracted.needs.map((need: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-[#111926] text-[10px] font-bold font-poppins flex items-center gap-1 border border-slate-200"
                    >
                      {need.toLowerCase().includes('projector') && <Video className="w-3 h-3 text-primary" />}
                      {need.toLowerCase().includes('mic') && <Mic className="w-3 h-3 text-purple-600" />}
                      {need.toLowerCase().includes('wheelchair') && <Accessibility className="w-3 h-3 text-emerald-600" />}
                      <span>{need}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="w-full h-9 text-xs font-bold font-poppins bg-primary hover:bg-primary/95 text-white shadow-xs mt-2 transition"
            >
              {submitting ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin mr-2" />
                  <span>Enqueuing in Spectra Engine...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span>Confirm & Add to Spectra Queue</span>
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
