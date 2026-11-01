import React, { useState, useRef, useEffect } from 'react';
import { campusApi } from '@/services/api';
import { useCampusAuth } from '@/contexts/CampusAuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  MicOff,
  Volume2,
  VolumeX,
  Video,
  Accessibility,
  ArrowRight,
  HelpCircle,
  Zap,
  Trash2,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  type?: 'explanation' | 'booking_extraction' | 'reschedule_proposal' | 'information' | 'error';
  extracted?: any;
  disruptionProposal?: any;
  comparison?: any;
  ai_engine?: string;
  timestamp: string;
}

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
  const { user } = useCampusAuth();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'n8n_only' | 'gemini_only' | 'both_compare'>('both_compare');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = `cit_copilot_history_${user?.id || user?.role || 'default'}`;

  const defaultWelcomeMessage: ChatMessage = {
    id: 'msg-welcome',
    sender: 'assistant',
    text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am CIT Copilot.\n\nI can help you with:\n1. **Natural Language Venue Booking** in English or Hinglish (Spectra Week).\n2. **Decision Explainability** (e.g. why a booking was rejected or why classes are at 8 AM).\n3. **Faculty Schedule Adjustments** & constraint checking.`,
    type: 'information',
    timestamp: 'Just now',
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [defaultWelcomeMessage];
  });

  // Sync with user profile switch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cit_copilot_history_${user?.id || user?.role || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}
    setMessages([defaultWelcomeMessage]);
  }, [user?.id, user?.role]);

  // Save to localStorage whenever messages update
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch {}
  }, [messages, storageKey]);

  const quickPrompts = [
    {
      label: 'Why was BR-09 rejected?',
      category: 'Explainability',
      prompt: 'Why was booking BR-09 rejected?',
    },
    {
      label: 'SH-2 Accessible Session',
      category: 'Conflict Check',
      prompt: 'I want SH-2 on Friday at 10 am for a wheelchair-accessible poster session, 60 people.',
    },
    {
      label: 'Hinglish Seminar Hall',
      category: 'Hinglish NLP',
      prompt: 'seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic aur projector chahiye',
    },
    {
      label: 'Why 8:00 AM Classes?',
      category: 'Schedule Logic',
      prompt: 'Why are classes scheduled at 8 AM on Monday?',
    },
    {
      label: 'Faculty F07 Unavailable',
      category: 'Disruption Proposal',
      prompt: 'Faculty F07 is unavailable on Monday, fix my timetable with minimal changes.',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 100);
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      setIsListening(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
    }
  }, [open, messages]);

  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('🎙️ Listening... Speak your request');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone permissions in browser.');
        } else if (event.error !== 'no-speech') {
          toast.error(`Microphone error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start voice recognition:', err);
      setIsListening(false);
      toast.error('Could not activate microphone');
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  };

  const toggleReadAloud = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Text-to-speech audio is not supported in this browser.');
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await campusApi.chatWithAssistant(textToSend, user?.role || 'admin', aiMode);

      const botMsgId = `bot-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'assistant',
        text: response.reply || 'Request processed.',
        type: response.type || 'information',
        extracted: response.extracted || null,
        disruptionProposal: response.disruptionProposal || null,
        comparison: response.comparison || null,
        ai_engine: response.ai_engine || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Copilot request failed:', err);
      const isNetworkError = !err?.response || err.code === 'ERR_NETWORK';
      const errMsg = isNetworkError
        ? '⚠️ Cannot connect to backend server at http://localhost:5000. Please ensure run_server.bat is actively running in your terminal.'
        : (err.response?.data?.error || 'Copilot service encountered a temporary error. Please try again or switch engine mode above.');

      toast.error(isNetworkError ? 'Backend server unreachable (port 5000)' : 'Copilot request error');
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: errMsg,
          type: 'error',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (extracted: any) => {
    if (!extracted) return;
    setSubmittingBooking(true);
    try {
      await campusApi.submitBookingRequest({
        title: extracted.title || 'Campus Event',
        attendance: extracted.attendance || 60,
        duration_periods: extracted.duration_periods || 2,
        windows: extracted.windows || [{ day: 'FRI', from_period: 10, to_period: 12 }],
        room_types: extracted.room_types || ['seminar_hall', 'auditorium'],
        needs: extracted.needs || [],
        requested_room: extracted.requested_room || null,
        mandatory_for_groups: extracted.mandatory_for_groups || [],
        raw_text: extracted.title,
      });

      toast.success('Reservation queued into Spectra Week allocation pool');
      onBookingSubmitted?.();

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-confirmed-${Date.now()}`,
          sender: 'assistant',
          text: `Reservation for **"${extracted.title}"** (${extracted.attendance} pax) has been queued in the Spectra Week allocation pool. Under Section 4 priority matching, all constraints and priority categories will be strictly respected.`,
          type: 'information',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      toast.error('Failed to submit booking request');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleClearChat = () => {
    const clearedMsg: ChatMessage = {
      id: `msg-cleared-${Date.now()}`,
      sender: 'assistant',
      text: `Chat cleared. Ask me about venue bookings, schedule explanations, or faculty unavailability.`,
      type: 'information',
      timestamp: 'Just now',
    };
    setMessages([clearedMsg]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    toast.success('Chat history cleared');
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-white font-sans">
        {/* Fixed Header */}
        <SheetHeader className="p-4 sm:p-5 border-b border-[#E5E7EB] bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-center text-white shadow-2xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <SheetTitle className="font-poppins text-base font-bold text-[#09090B]">
                  CIT Copilot
                </SheetTitle>
                <p className="text-[11px] text-[#71717A] font-poppins">
                  English & Hinglish venue booking, schedule changes, and explainability
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pr-7">
              <button
                onClick={handleClearChat}
                title="Clear Conversation"
                className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-poppins"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px] font-medium">Clear</span>
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* AI Engine Evaluation Mode Toggle */}
        <div className="px-4 py-2 bg-slate-50 border-b border-[#E5E7EB] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            <span>Engine Mode:</span>
          </div>
          <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg text-xs">
            <button
              onClick={() => setAiMode('n8n_only')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                aiMode === 'n8n_only'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Route exclusively to n8n Cloud workflow"
            >
              ⚡ n8n Only
            </button>
            <button
              onClick={() => setAiMode('gemini_only')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                aiMode === 'gemini_only'
                  ? 'bg-white text-purple-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Route directly to Google Gemini"
            >
              🧠 Gemini Only
            </button>
            <button
              onClick={() => setAiMode('both_compare')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                aiMode === 'both_compare'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Run both in parallel and compare accuracy & response time"
            >
              ⚖️ Compare Both
            </button>
          </div>
        </div>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#F9F9FB]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-muted-foreground font-poppins">
                {msg.sender === 'user' ? (
                  <>
                    <span>You</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-primary">CIT Copilot</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => toggleReadAloud(msg.id, msg.text)}
                      className="ml-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-slate-100 border border-transparent hover:border-slate-200"
                      title={speakingMessageId === msg.id ? "Stop reading" : "Read aloud"}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-rose-500 animate-pulse" />
                          <span className="text-rose-600 font-bold">Stop Audio</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-slate-500" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white shadow-xs rounded-tr-xs'
                    : 'bg-white border border-[#E5E7EB] text-[#111926] shadow-xs rounded-tl-xs space-y-3'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Side-by-Side Model Comparison Benchmark Card */}
                {msg.comparison && (
                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 space-y-2 mt-2 text-xs">
                    <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                      <span className="font-bold font-poppins text-xs text-indigo-950 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Evaluation Benchmark</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        Faster: {msg.comparison.faster}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-indigo-200/60 text-slate-500 text-left">
                            <th className="py-1 px-1 font-semibold">Evaluation Metric</th>
                            <th className="py-1 px-1 font-semibold text-purple-700">Gemini Direct</th>
                            <th className="py-1 px-1 font-semibold text-blue-700">n8n Workflow</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-100/80 font-sans">
                          {msg.comparison.metrics?.map((m: any, idx: number) => (
                            <tr key={idx} className="hover:bg-white/40">
                              <td className="py-1.5 px-1 font-medium text-slate-700">{m.metric}</td>
                              <td className="py-1.5 px-1 font-mono text-purple-900 font-medium">{m.gemini}</td>
                              <td className="py-1.5 px-1 font-mono text-blue-900 font-medium">{m.n8n}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Extracted Booking Card Widget */}
                {msg.extracted && (
                  <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] space-y-3 mt-2 text-xs text-[#111926]">
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                      <span className="font-bold font-poppins text-xs text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Parsed Booking Parameters</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        {msg.extracted.effective_category || 'club_event'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Event Title</span>
                        <span className="font-bold truncate block">{msg.extracted.title}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Attendance</span>
                        <span className="font-bold font-mono">{msg.extracted.attendance} Attendees</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Requested Slot</span>
                        <span className="font-bold font-mono">
                          {msg.extracted.windows?.[0]?.day || 'FRI'} (Period {msg.extracted.windows?.[0]?.from_period} to {msg.extracted.windows?.[0]?.to_period})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Venue Selected</span>
                        <span className="font-bold font-mono text-primary">
                          {msg.extracted.requested_room || 'Auditorium / Seminar Hall'}
                        </span>
                      </div>
                    </div>

                    {msg.extracted.needs && msg.extracted.needs.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[10px] text-muted-foreground block mb-1">Requirements</span>
                        <div className="flex flex-wrap gap-1">
                          {msg.extracted.needs.map((need: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[10px] font-bold font-poppins text-[#111926]"
                            >
                              {need}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => handleConfirmBooking(msg.extracted)}
                      disabled={submittingBooking}
                      className="w-full h-8 text-xs font-bold font-poppins bg-primary hover:bg-primary/95 text-white shadow-xs mt-2"
                    >
                      {submittingBooking ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          <span>Queueing in Spectra Pool...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          <span>Confirm & Queue Booking</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Reschedule Proposal Widget */}
                {msg.disruptionProposal && (
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2 mt-2 text-xs text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold font-poppins text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Formal Schedule Disruption Specification</span>
                    </div>
                    <pre className="p-2 rounded bg-white border border-amber-200 text-[10px] font-mono overflow-x-auto text-slate-800">
                      {JSON.stringify(msg.disruptionProposal, null, 2)}
                    </pre>
                    <p className="text-[11px] text-amber-900 leading-normal">
                      Under Problem Statement Section 2 #7, this proposal is validated strictly by the underlying Python solver to guarantee zero hard constraint clashes before committing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins p-2">
              <RotateCw className="w-4 h-4 animate-spin text-primary" />
              <span>CIT Copilot is analyzing campus constraints...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Carousel */}
        <div className="p-2 sm:px-4 bg-[#F9F9FB] border-t border-[#E5E7EB] overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max pb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-poppins flex items-center gap-1 mr-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Try:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-purple-50 border border-[#E5E7EB] hover:border-primary/40 text-[11px] font-medium font-poppins text-[#111926] hover:text-primary transition shadow-2xs cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Speech Recognition Banner */}
        {isListening && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-800 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-semibold font-poppins">🎙️ Listening... Speak into your microphone</span>
            </div>
            <button
              type="button"
              onClick={stopSpeechRecognition}
              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
            >
              Done Speaking
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0">
          <div className="flex items-center gap-2">
            {/* Microphone Voice Assistant Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              disabled={loading}
              title={isListening ? "Stop voice recording" : "Speak via microphone"}
              className={`h-10 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-200'
                  : 'bg-[#FAF9F6] hover:bg-slate-100 text-slate-700 border-[#E5E7EB]'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <span className="text-[11px] font-bold hidden sm:inline text-white">Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-slate-700" />
                  <span className="text-[11px] font-semibold hidden sm:inline text-slate-600">Voice</span>
                </>
              )}
            </button>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? "Listening to your voice..." : "Ask Copilot or use mic (e.g. 'seminar hall kal shaam 6 baje')..."}
              className={`flex-1 h-10 text-xs bg-[#FAF9F6] border-[#E5E7EB] focus:bg-white rounded-xl font-sans ${
                isListening ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-300' : ''
              }`}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white shadow-xs font-bold font-poppins text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
