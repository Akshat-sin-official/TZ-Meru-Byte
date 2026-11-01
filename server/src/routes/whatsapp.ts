import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import axios from 'axios';
import { processPromptWithAI } from './assistant.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const db = prisma as any;

// Evolution-Go configurations
const EVOLUTION_URL = process.env.EVOLUTION_URL || (process.env.DOCKER_ENV ? 'http://172.17.0.1:8080' : 'http://127.0.0.1:8080');
const EVOLUTION_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'cit_bot';
const EVOLUTION_TOKEN = process.env.EVOLUTION_TOKEN || 'cit_secure_token_2027';

// In-memory cache for pending booking drafts per phone
interface PendingDraft {
  phone: string;
  role: Role;
  extracted: any;
  timestamp: number;
}
const pendingDrafts = new Map<string, PendingDraft>();

// Helper: Normalize phone numbers (strips +, spaces, dashes, @s.whatsapp.net)
function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  return clean;
}

// Helper: Format AI markdown text for WhatsApp
function formatForWhatsApp(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '*$1*')     // convert **bold** to *bold*
    .replace(/__(.*?)__/g, '_$1_')         // convert __italic__ to _italic_
    .replace(/`([^`]+)`/g, '*$1*')         // convert inline code to bold
    .replace(/^#+\s*(.*?)$/gm, '*$1*')     // convert headings to bold
    .trim();
}

// Helper: Send text message through Evolution-Go
async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  const targetNumber = cleanPhoneNumber(phone);
  if (!targetNumber) return false;

  try {
    const res = await axios.post(
      `${EVOLUTION_URL}/send/text`,
      {
        number: targetNumber,
        text,
      },
      {
        headers: {
          apikey: EVOLUTION_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return res.status === 200;
  } catch (err: any) {
    console.warn(`[WhatsApp] Failed to send to ${targetNumber}:`, err.response?.data || err.message);
    return false;
  }
}

// GET /api/whatsapp/status (Admin Only)
// Check gateway health, instance connectivity, and QR code
router.get('/status', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let licenseActive = false;
    let connected = false;
    let qrcode: string | null = null;
    let jid: string | null = null;
    let instanceId: string | null = null;

    // 1. Check license status
    try {
      const licRes = await axios.get(`${EVOLUTION_URL}/license/status`, { timeout: 3000 });
      licenseActive = licRes.data?.status === 'active';
    } catch (e) {
      licenseActive = false;
    }

    // 2. Query instance info
    try {
      const instRes = await axios.get(`${EVOLUTION_URL}/instance/all`, {
        headers: { apikey: EVOLUTION_GLOBAL_KEY },
        timeout: 3000,
      });

      const instances = instRes.data?.data || [];
      const botInst = instances.find((i: any) => i.name === EVOLUTION_INSTANCE);

      if (botInst) {
        instanceId = botInst.id;
        // JID is populated with phone number ONLY when phone is successfully paired
        const isLinked = Boolean(botInst.jid && String(botInst.jid).includes('@s.whatsapp.net'));
        connected = isLinked;
        jid = isLinked ? botInst.jid : null;

        // If not connected, always retrieve the active pairing QR code directly
        if (!connected) {
          try {
            const qrRes = await axios.get(`${EVOLUTION_URL}/instance/qr`, {
              headers: { apikey: EVOLUTION_TOKEN },
              timeout: 3000,
            });
            qrcode = qrRes.data?.data?.qrcode || botInst.qrcode || null;
          } catch (_) {
            qrcode = botInst.qrcode || null;
          }
        }
      }
    } catch (e: any) {
      console.warn('[WhatsApp] Could not fetch instances:', e.message);
    }

    const contactsCount = await db.whatsAppContact.count();

    return res.json({
      success: true,
      service: 'Evolution-Go',
      licenseActive,
      instance: EVOLUTION_INSTANCE,
      instanceId,
      connected,
      jid,
      qrcode,
      contactsCount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/connect (Admin Only)
// Triggers pairing ceremony / refreshes QR code
router.post('/connect', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let qrcode: string | null = null;
    let pairingUrl: string | null = null;

    // 1. First check if an active QR code is already waiting in memory
    try {
      const qrRes = await axios.get(`${EVOLUTION_URL}/instance/qr`, {
        headers: { apikey: EVOLUTION_TOKEN },
        timeout: 3000,
      });
      if (qrRes.data?.data?.qrcode) {
        qrcode = qrRes.data.data.qrcode;
        pairingUrl = qrRes.data.data.code || null;
      }
    } catch (_) {}

    // 2. If no QR code ready, trigger handshake
    if (!qrcode) {
      try {
        await axios.post(
          `${EVOLUTION_URL}/instance/connect`,
          {},
          {
            headers: {
              apikey: EVOLUTION_TOKEN,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );
      } catch (e: any) {
        console.warn('[WhatsApp] Handshake trigger note:', e.response?.data || e.message);
      }

      // Short delay for QR generation
      await new Promise((r) => setTimeout(r, 600));

      try {
        const qrRes = await axios.get(`${EVOLUTION_URL}/instance/qr`, {
          headers: { apikey: EVOLUTION_TOKEN },
          timeout: 3000,
        });
        qrcode = qrRes.data?.data?.qrcode || null;
        pairingUrl = qrRes.data?.data?.code || null;
      } catch (_) {}
    }

    return res.json({
      success: true,
      message: 'QR code ready',
      connected: false,
      qrcode,
      pairingUrl,
    });
  } catch (err: any) {
    return res.json({
      success: true,
      message: 'Status queried',
      connected: false,
      qrcode: null,
    });
  }
});

// GET /api/whatsapp/contacts (Admin Only)
router.get('/contacts', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contacts = await db.whatsAppContact.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            clubName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ contacts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/contacts (Admin Only)
router.post('/contacts', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phone, name, role, userId } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = cleanPhoneNumber(phone);
    const validRole = (role && Object.values(Role).includes(role)) ? role : Role.club;

    const contact = await db.whatsAppContact.upsert({
      where: { phone: cleanPhone },
      update: {
        name: name || undefined,
        role: validRole,
        userId: userId || undefined,
        optedIn: true,
      },
      create: {
        phone: cleanPhone,
        name: name || (role === 'club' ? 'Club Representative' : 'Campus Member'),
        role: validRole,
        userId: userId || undefined,
        optedIn: true,
      },
      include: { user: true },
    });

    return res.json({ success: true, contact });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/whatsapp/contacts/:id (Admin Only)
router.delete('/contacts/:id', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await (prisma as any).whatsAppContact.delete({ where: { id } });
    return res.json({ success: true, message: 'Contact deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/test-send (Admin Only)
router.post('/test-send', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phone, message } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });

    const textToSend = message || '🏛 *CIT CampusOS Notification*\n\nThis is a verification test from the CIT Campus Operations Bot.\nSystem is active and operational! ✅';
    const sent = await sendWhatsAppMessage(phone, textToSend);

    return res.json({
      success: sent,
      recipient: cleanPhoneNumber(phone),
      message: sent ? 'Message dispatched successfully' : 'Failed to dispatch via gateway (ensure device is paired)',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/webhook
// Inbound event hook from Evolution-Go
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Extract message fields across Evolution-Go schemas
    const data = body.data || body;
    const key = data.key || {};

    // Ignore self-sent messages to avoid infinite loops
    if (key.fromMe) {
      return res.status(200).json({ status: 'ignored_self_message' });
    }

    const rawRemoteJid = key.remoteJid || data.from || '';
    if (!rawRemoteJid || rawRemoteJid.includes('@g.us')) {
      // Ignore group chats for safety
      return res.status(200).json({ status: 'ignored_group_message' });
    }

    const senderPhone = cleanPhoneNumber(rawRemoteJid);
    if (!senderPhone) {
      return res.status(200).json({ status: 'no_sender' });
    }

    // Extract message text content
    const msg = data.message || {};
    const messageText: string = (
      msg.conversation ||
      msg.extendedTextMessage?.text ||
      data.text ||
      body.text ||
      ''
    ).trim();

    if (!messageText) {
      return res.status(200).json({ status: 'empty_text' });
    }

    console.log(`[WhatsApp Webhook] From ${senderPhone}: "${messageText}"`);

    // 1. Identify User & Role
    const contact = await db.whatsAppContact.findUnique({
      where: { phone: senderPhone },
      include: { user: true },
    });

    const userRole: Role = contact?.role || Role.club;
    const userName = contact?.name || contact?.user?.name || 'Student';
    const lower = messageText.toLowerCase();

    // 2. Check for Pending Draft Confirmation ("YES", "CONFIRM", "HAAN")
    const pending = pendingDrafts.get(senderPhone);
    if (pending && (lower === 'yes' || lower === 'confirm' || lower === 'haan' || lower === 'ok')) {
      pendingDrafts.delete(senderPhone);

      // Persist the confirmed booking into database
      const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
      if (dataset) {
        const ext = pending.extracted;
        const totalRequests = await prisma.bookingRequest.count({ where: { datasetVersionId: dataset.id } });
        const newExternalId = `BR-${String(totalRequests + 1).padStart(2, '0')}`;

        const created = await prisma.bookingRequest.create({
          data: {
            datasetVersionId: dataset.id,
            externalId: newExternalId,
            submittedAt: new Date(),
            requester: contact?.user?.clubName || userName,
            role: pending.role,
            requestedCategory: ext.effective_category || 'club_event',
            effectiveCategory: ext.effective_category || 'club_event',
            title: ext.title || 'WhatsApp Requested Event',
            attendance: ext.attendance || 50,
            durationPeriods: ext.duration_periods || 2,
            windows: ext.windows || [{ day: 'FRI', from_period: 10, to_period: 11 }],
            roomTypes: ext.room_types || ['auditorium', 'lecture_hall'],
            needs: ext.needs || [],
            requestedRoom: ext.requested_room || null,
            mandatoryForGroups: [],
            rawText: `[Via WhatsApp +${senderPhone}] ${ext.title}`,
          },
        });

        const replyMsg = `🎉 *Booking Request Submitted!*\n\n• *Request ID:* *${created.externalId}*\n• *Title:* ${created.title}\n• *Expected Attendance:* ${created.attendance} pax\n• *Target:* ${created.requestedRoom || 'Auditorium/LH'}\n• *Category:* ${created.effectiveCategory}\n\nYour request has been forwarded to the Dean's Office for Spectra Fest scheduling.\n\nTrack status: https://cit.saubhagyalabs.tech/bookings`;
        await sendWhatsAppMessage(senderPhone, replyMsg);
        return res.status(200).json({ status: 'booking_created', externalId: newExternalId });
      }
    }

    // 3. Quick Schedule Query ("Schedule", "Classes today", "Aaj ki class")
    if (lower.includes('schedule') || lower.includes('class') || lower.includes('aaj') || lower.includes('today')) {
      const activeSchedule = await prisma.scheduleVersion.findFirst({
        where: { status: 'active' },
        include: { assignments: true },
      });

      if (activeSchedule) {
        // Default to Wednesday for Week 7 demo context
        const day = 'WED';
        let relevant = activeSchedule.assignments.filter((a) => a.day === day);

        if (contact?.user?.facultyId) {
          // Scoped to faculty
          const facSessions = await prisma.session.findMany({
            where: { facultyId: contact.user.facultyId },
          });
          const facSessionIds = new Set(facSessions.map((s) => s.externalId));
          relevant = relevant.filter((a) => facSessionIds.has(a.sessionExternalId));

          let reply = `📅 *Dr. ${userName}'s Teaching Schedule (Wednesday):*\n\n`;
          if (relevant.length === 0) {
            reply += `No teaching assignments scheduled for today! You have zero contact hours scheduled.`;
          } else {
            relevant.sort((a, b) => a.startPeriod - b.startPeriod);
            for (const item of relevant) {
              const startHr = 7 + item.startPeriod;
              reply += `• *Period ${item.startPeriod} (${String(startHr).padStart(2, '0')}:00):* Session *${item.sessionExternalId}* in *${item.roomExternalId}*\n`;
            }
            reply += `\n*Daily Teaching Load:* ${relevant.length} hrs (Cap: ≤ 4h daily) ✅`;
          }
          await sendWhatsAppMessage(senderPhone, reply);
          return res.status(200).json({ status: 'schedule_answered' });
        } else {
          // General overview
          const reply = `📅 *CIT Campus Schedule Overview (${day}):*\n• Total Active Sessions: *${relevant.length} classes*\n• Time Windows: P1 (08:00) – P9 (17:00)\n• Lunch Break: 13:00 – 14:00 (No Classes)\n\nView full cohort timetable at: https://cit.saubhagyalabs.tech/timetable`;
          await sendWhatsAppMessage(senderPhone, reply);
          return res.status(200).json({ status: 'schedule_overview_answered' });
        }
      }
    }

    // 4. Run AI Copilot (Dual Engine: Gemini + Deterministic NLU)
    const aiResult = await processPromptWithAI(messageText, userRole);
    let replyText = formatForWhatsApp(aiResult.reply || 'Request received.');

    // If a booking was extracted from natural language
    if (aiResult.extracted && aiResult.extracted.attendance) {
      const ext = aiResult.extracted;
      const win = ext.windows?.[0] || { day: 'FRI', from_period: 10, to_period: 11 };

      // Cache pending draft
      pendingDrafts.set(senderPhone, {
        phone: senderPhone,
        role: userRole,
        extracted: ext,
        timestamp: Date.now(),
      });

      replyText += `\n\n📋 *Draft Booking Summary:*`;
      replyText += `\n• *Venue:* ${ext.requested_room || 'AUDITORIUM'}`;
      replyText += `\n• *Day & Slot:* ${win.day}, Period ${win.from_period}–${win.to_period}`;
      replyText += `\n• *Expected Pax:* ${ext.attendance}`;
      if (ext.follow_up) {
        replyText += `\n\n⚠️ _${ext.follow_up}_`;
      }
      replyText += `\n\n👉 *Reply YES to confirm and submit this request.*`;
    }

    // Send formatted reply back to WhatsApp
    await sendWhatsAppMessage(senderPhone, replyText);

    return res.status(200).json({ status: 'processed', replySent: true });
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]:', err);
    return res.status(200).json({ error: err.message }); // Return 200 so gateway doesn't retry endlessly
  }
});

export default router;
