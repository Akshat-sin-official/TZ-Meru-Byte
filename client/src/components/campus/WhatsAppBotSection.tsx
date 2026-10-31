import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Send,
  Plus,
  Trash2,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import campusApi from '@/services/api';

interface Contact {
  id: string;
  phone: string;
  name?: string;
  role: string;
  createdAt: string;
  user?: {
    name: string;
    role: string;
    department?: string;
    clubName?: string;
  };
}

export const WhatsAppBotSection: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // New contact form
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('club');
  const [addingContact, setAddingContact] = useState(false);

  // Test dispatch
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const fetchGatewayStatus = async () => {
    try {
      const res = await campusApi.getWhatsAppStatus();
      setStatus(res);
    } catch (err: any) {
      console.warn('Failed to fetch WhatsApp status:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await campusApi.getWhatsAppContacts();
      setContacts(res.contacts || []);
    } catch (err: any) {
      console.warn('Failed to fetch contacts:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchGatewayStatus(), fetchContacts()]);
      setLoading(false);
    };
    load();
  }, []);

  // Auto-poll status when awaiting device pairing
  useEffect(() => {
    const interval = setInterval(() => {
      if (!status?.connected) {
        fetchGatewayStatus();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [status?.connected]);

  const handleRefreshConnection = async () => {
    setRefreshing(true);
    try {
      await campusApi.connectWhatsApp();
      await fetchGatewayStatus();
      toast.success('Generated fresh WhatsApp QR pairing code');
    } catch (err: any) {
      toast.error('Failed to refresh pairing handshake');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPhone.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 5) {
      toast.error('Enter a valid mobile number with country code (e.g. 919876543210)');
      return;
    }
    setAddingContact(true);
    try {
      await campusApi.addWhatsAppContact({
        phone: clean,
        name: newName.trim() || undefined,
        role: newRole,
      });
      toast.success(`Registered +${clean} as ${newRole.toUpperCase()}`);
      setNewPhone('');
      setNewName('');
      await fetchContacts();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to register contact';
      toast.error(msg);
    } finally {
      setAddingContact(false);
    }
  };

  const handleDeleteContact = async (id: string, phone: string) => {
    try {
      await campusApi.deleteWhatsAppContact(id);
      toast.success(`Removed +${phone}`);
      setContacts(contacts.filter((c) => c.id !== id));
    } catch {
      toast.error('Failed to remove contact');
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error('Enter recipient phone number');
      return;
    }
    setSendingTest(true);
    try {
      const res = await campusApi.testSendWhatsApp({
        phone: testPhone.trim(),
        message: testMsg.trim() || undefined,
      });
      if (res.success) {
        toast.success('Message dispatched to WhatsApp gateway!');
      } else {
        toast.warning(res.message || 'Gateway queued the message');
      }
    } catch (err: any) {
      toast.error('Test dispatch failed. Ensure gateway is paired.');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs p-8 text-center">
        <RotateCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
        <p className="text-xs text-muted-foreground font-poppins">Querying Evolution-Go gateway...</p>
      </Card>
    );
  }

  const isConnected = status?.connected || false;

  return (
    <div className="space-y-6">
      {/* Overview Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Engine Status */}
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground font-poppins">Gateway Engine</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                Active
              </Badge>
            </div>
            <CardTitle className="text-base font-bold font-poppins text-[#111926] mt-1">
              Evolution-Go v2
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5 pt-0">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>License Status</span>
              <span className="font-mono text-emerald-600 font-bold">Licensed & Active</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Instance Name</span>
              <span className="font-mono text-[#111926] font-semibold">{status?.instance || 'cit_bot'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Outbound Port</span>
              <span className="font-mono text-[#111926]">8080 (REST / Webhook)</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: WhatsApp Device Status */}
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground font-poppins">Device Pairing</span>
              {isConnected ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  Pairing Required
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-bold font-poppins text-[#111926] mt-1 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              {isConnected ? 'WhatsApp Linked' : 'Awaiting QR Scan'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5 pt-0">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Paired Number</span>
              <span className="font-mono text-[#111926]">{status?.jid ? status.jid.split('@')[0] : 'None yet'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Webhook Target</span>
              <span className="font-mono text-xs text-emerald-700">/api/whatsapp/webhook</span>
            </div>
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshConnection}
                disabled={refreshing}
                className="w-full text-xs h-7 gap-1 font-poppins cursor-pointer"
              >
                <RotateCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Pairing State'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Bot Brain & RBAC */}
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground font-poppins">Autonomous Intelligence</span>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                Dual-Engine
              </Badge>
            </div>
            <CardTitle className="text-base font-bold font-poppins text-[#111926] mt-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              CIT Copilot Core
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5 pt-0">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Primary LLM</span>
              <span className="font-mono text-[#111926]">Gemini 3.5 Flash-Lite</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Fallback Engine</span>
              <span className="font-mono text-[#111926]">Deterministic NLU Regex</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Supported Idioms</span>
              <span className="text-emerald-700 font-medium">English, Hindi & Hinglish</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prominent QR Code Device Pairing Scanner (Always visible when not connected) */}
      {!isConnected && (
        <Card className="border-2 border-amber-300 bg-amber-50/50 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm shrink-0 flex flex-col items-center justify-center min-w-[190px] min-h-[190px]">
              {status?.qrcode ? (
                <img
                  src={status.qrcode}
                  alt="WhatsApp Pairing QR Code"
                  className="w-44 h-44 object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <RotateCw className="w-8 h-8 text-amber-600 animate-spin mb-2" />
                  <p className="text-[11px] text-muted-foreground font-poppins">Awaiting fresh QR code...</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshConnection}
                    disabled={refreshing}
                    className="mt-2 text-xs h-7 font-poppins cursor-pointer"
                  >
                    Generate QR
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-3 text-xs text-[#111926] font-poppins flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-700" />
                  <h3 className="text-sm font-bold text-amber-900">Pair Official WhatsApp Phone with CIT Bot</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshConnection}
                  disabled={refreshing}
                  className="text-xs h-7 gap-1 font-poppins bg-white hover:bg-slate-50 border-amber-200 cursor-pointer"
                >
                  <RotateCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Regenerate QR'}
                </Button>
              </div>

              <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-xs">
                <li>Open <strong>WhatsApp</strong> on the campus official mobile phone.</li>
                <li>Tap <strong>Settings</strong> (or 3 dots on Android) → <strong>Linked Devices</strong>.</li>
                <li>Tap <strong>Link a Device</strong> and point your camera at this QR code.</li>
              </ol>

              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span>
                  QR codes cycle every ~20 seconds. Once scanned, the system will instantly link and switch to <strong>Connected</strong>.
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Registered Contacts & Role RBAC */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold font-poppins text-[#111926] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Authorized Phone Directory & Role Matrix
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Controls what each mobile phone can query or draft through the WhatsApp bot
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {contacts.length} Registered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-[#E5E7EB] text-muted-foreground font-poppins font-semibold">
                      <th className="py-2.5 px-4">Mobile Number</th>
                      <th className="py-2.5 px-4">Designation / Name</th>
                      <th className="py-2.5 px-4">Role Gate</th>
                      <th className="py-2.5 px-4">Chatbot Capabilities</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {contacts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                          No mobile numbers registered yet. Add one below to grant role-specific access!
                        </td>
                      </tr>
                    ) : (
                      contacts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#111926]">
                            +{c.phone}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#111926]">
                            {c.name || c.user?.name || 'Authorized Member'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              c.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : c.role === 'department_coordinator'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : c.role === 'faculty'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {c.role.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {c.role === 'club' && 'Natural Language Booking Drafts + Status'}
                            {c.role === 'faculty' && 'Daily Teaching Hours & Room Inspection'}
                            {c.role === 'department_coordinator' && 'Cohort Timetable & Basket Sync'}
                            {c.role === 'admin' && 'System Health & Disruption Alerts'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContact(c.id, c.phone)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Inline Add Contact Form */}
              <form onSubmit={handleAddContact} className="p-4 bg-slate-50/80 border-t border-[#E5E7EB] flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[160px]">
                  <Input
                    type="text"
                    placeholder="Mobile with country code (e.g. 919876543210)"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-8 text-xs font-mono bg-white"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <Input
                    type="text"
                    placeholder="Name / Society (e.g. Dramatics Lead)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="h-8 text-xs border border-[#E5E7EB] rounded-md px-2.5 bg-white font-poppins text-[#111926]"
                >
                  <option value="club">Club Representative</option>
                  <option value="faculty">Faculty Member</option>
                  <option value="department_coordinator">Department Coordinator</option>
                  <option value="admin">Administrator</option>
                </select>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingContact}
                  className="h-8 text-xs gap-1 font-poppins cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Number
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Test Dispatcher & Flow Explanation */}
        <div className="space-y-4">
          <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-xs">
            <CardHeader className="border-b border-[#E5E7EB] pb-3">
              <CardTitle className="text-sm font-bold font-poppins text-[#111926] flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                Live WhatsApp Dispatcher
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Send an outbound test alert to any mobile number
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <form onSubmit={handleSendTest} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Recipient Phone Number
                  </label>
                  <Input
                    type="text"
                    placeholder="919876543210"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Custom Message (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Leave empty for standard CIT CampusOS verification ping..."
                    value={testMsg}
                    onChange={(e) => setTestMsg(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-md border border-[#E5E7EB] font-poppins focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sendingTest}
                  className="w-full text-xs h-8 gap-1.5 font-poppins cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingTest ? 'animate-pulse' : ''}`} />
                  {sendingTest ? 'Sending...' : 'Send WhatsApp Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Bot Instruction Guide */}
          <Card className="border border-[#E5E7EB] bg-slate-50/60 rounded-xl shadow-xs p-4">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-1.5 text-slate-700 font-poppins leading-relaxed">
                <div className="font-bold text-[#111926]">How the Bot Works</div>
                <p>
                  • <strong>Clubs:</strong> Text natural language: <em>"Auditorium for 300 students Friday 6 to 8 pm"</em>. The bot drafts the booking, then reply <strong>YES</strong> to submit.
                </p>
                <p>
                  • <strong>Faculty:</strong> Text <em>"What do I teach today?"</em> to receive personal teaching periods and room assignments.
                </p>
                <p>
                  • <strong>Safety Boundary:</strong> All bookings remain in draft state until confirmed by user, respecting the core constraint architecture.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
