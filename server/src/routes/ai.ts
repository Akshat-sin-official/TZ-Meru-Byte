import { Router, Response } from 'express';
import { PrismaClient, Prisma, Role, ScheduleStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { n8nClient } from '../utils/n8nClient.js';
import { parsePlainLanguageBooking } from './assistant.js';

const router = Router();
const prisma = new PrismaClient();
const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

// In-memory fallback cache for conversations when database connection is unavailable
const ephemeralConversationStore = new Map<string, { userId: string; currentDraft: any }>();

function periodToTime(period: number): string {
  const hour = 7 + period;
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * POST /api/ai/booking-intake
 * WF01 — Natural language booking intake with conversation memory and deterministic evaluation
 */
router.post('/booking-intake', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, conversation_id, timezone = 'Asia/Kolkata' } = req.body;
    const user = req.user!;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message must not exceed 2000 characters.' });
    }

    // 1. Retrieve or initialize conversation (Database with in-memory fallback)
    let conversation: { id: string; currentDraft: any } = {
      id: conversation_id || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      currentDraft: null,
    };
    let dbConnected = true;

    try {
      if (conversation_id && typeof conversation_id === 'string') {
        const found = await prisma.aiConversation.findFirst({
          where: { id: conversation_id, userId: user.id },
        });
        if (found) {
          conversation = { id: found.id, currentDraft: found.currentDraft };
        }
      }

      if (!conversation.currentDraft && conversation_id && ephemeralConversationStore.has(conversation_id)) {
        const cached = ephemeralConversationStore.get(conversation_id)!;
        if (cached.userId === user.id) {
          conversation.currentDraft = cached.currentDraft;
        }
      }

      if (!conversation_id) {
        const created = await prisma.aiConversation.create({
          data: {
            userId: user.id,
            workflowType: 'booking_intake',
            currentDraft: Prisma.JsonNull,
          },
        });
        conversation = { id: created.id, currentDraft: null };
      }
    } catch (dbErr: any) {
      dbConnected = false;
      console.warn('[AI_GATEWAY] MySQL connection unavailable, using ephemeral memory:', dbErr.message);
      if (conversation_id && ephemeralConversationStore.has(conversation_id)) {
        const cached = ephemeralConversationStore.get(conversation_id)!;
        if (cached.userId === user.id) {
          conversation.currentDraft = cached.currentDraft;
        }
      }
    }

    // Record user message if DB is connected
    if (dbConnected) {
      try {
        await prisma.aiMessage.create({
          data: {
            conversationId: conversation.id,
            sender: 'user',
            message: message.trim(),
          },
        });
      } catch (e) {
        // Non-blocking log
      }
    }

    const previousDraft = conversation.currentDraft as Record<string, any> | null;
    const currentDate = new Date().toISOString().slice(0, 10);

    // 2. Dispatch to WF01 on n8n Cloud via Axios
    const n8nResult = await n8nClient.callBookingIntake({
      message: message.trim(),
      timezone,
      current_date: currentDate,
      conversation_id: conversation.id,
      user_context: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        facultyId: user.facultyId,
        clubName: user.clubName,
      },
      previous_booking_draft: previousDraft,
    });

    // 3. Process AI extraction or graceful fallback
    let finalDraft: any = null;
    let assistantMessage = '';
    let status = 'ready_for_confirmation';
    let missingFields: string[] = [];
    let validationIssues: string[] = [];
    let isAiAvailable = true;

    if (n8nResult.success && n8nResult.data) {
      const data = n8nResult.data;
      finalDraft = data.booking_draft || null;
      assistantMessage = data.assistant_message || 'Booking draft parsed.';
      status = data.status || (finalDraft?.requires_confirmation ? 'ready_for_confirmation' : 'needs_clarification');
      missingFields = data.missing_fields || [];
      validationIssues = data.validation_issues || [];
    } else {
      // Graceful Fallback: Local deterministic regex/rules interpreter
      console.warn('[AI_GATEWAY] n8n AI unavailable. Engaging deterministic fallback parser.');
      isAiAvailable = false;
      const localExtracted = parsePlainLanguageBooking(message, user.role);

      const window0 = localExtracted.windows?.[0];

      finalDraft = {
        intent: 'create_booking',
        event_type: localExtracted.effective_category || 'club_event',
        venue: localExtracted.requested_room || (localExtracted.room_types?.[0] ? localExtracted.room_types[0].replace('_', ' ').toUpperCase() : 'Seminar Hall'),
        date: currentDate,
        start_time: window0 ? periodToTime(window0.from_period) : '18:00',
        end_time: window0 ? periodToTime(window0.to_period + 1) : '20:00',
        purpose: localExtracted.title || message.slice(0, 50),
        expected_attendance: localExtracted.attendance || 50,
        accessibility_required: localExtracted.needs?.includes('accessible') || false,
        mandatory_groups: localExtracted.mandatory_for_groups || [],
        requires_confirmation: true,
      };

      if (previousDraft) {
        finalDraft = { ...previousDraft, ...finalDraft };
      }

      assistantMessage = `(Fallback Mode) Parsed request: ${finalDraft.venue} on ${finalDraft.date} from ${finalDraft.start_time} to ${finalDraft.end_time} for ${finalDraft.expected_attendance} attendees.`;
      status = 'ready_for_confirmation';
    }

    // Persist updated draft in DB and memory
    if (finalDraft) {
      ephemeralConversationStore.set(conversation.id, {
        userId: user.id,
        currentDraft: finalDraft,
      });

      if (dbConnected) {
        try {
          await prisma.aiConversation.update({
            where: { id: conversation.id },
            data: { currentDraft: finalDraft },
          });
          await prisma.aiMessage.create({
            data: {
              conversationId: conversation.id,
              sender: 'assistant',
              message: assistantMessage,
              rawAiResponse: n8nResult.data || { fallback: true, draft: finalDraft },
            },
          });
        } catch (e) {
          // Non-blocking log
        }
      }
    }

    // Return structured response to React (Never automatically approves or books)
    return res.json({
      success: true,
      ai_available: isAiAvailable,
      fallback_mode: !isAiAvailable,
      status,
      conversation_id: conversation.id,
      booking_draft: finalDraft,
      assistant_message: assistantMessage,
      missing_fields: missingFields,
      validation_issues: validationIssues,
      database_synced: dbConnected,
      notice: 'Draft generated for review. Availability and conflict resolution will be checked upon confirmation.',
    });
  } catch (err: any) {
    console.error('Error in /api/ai/booking-intake:', err);
    return res.status(500).json({ error: err.message || 'Internal server error processing booking intake.' });
  }
});

/**
 * POST /api/ai/schedule-change
 * WF02 — Natural language schedule change request + MySQL entity resolution + CP-SAT simulation
 */
router.post('/schedule-change', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, conversation_id, timezone = 'Asia/Kolkata' } = req.body;
    const user = req.user!;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
    }

    let conversation: { id: string } = {
      id: conversation_id || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    let dbConnected = true;

    try {
      if (conversation_id && typeof conversation_id === 'string') {
        const found = await prisma.aiConversation.findFirst({
          where: { id: conversation_id, userId: user.id },
        });
        if (found) conversation = { id: found.id };
      }
      if (!conversation_id) {
        const created = await prisma.aiConversation.create({
          data: {
            userId: user.id,
            workflowType: 'schedule_change',
            currentDraft: Prisma.JsonNull,
          },
        });
        conversation = { id: created.id };
      }
    } catch (e) {
      dbConnected = false;
    }

    const currentDate = new Date().toISOString().slice(0, 10);

    // 2. Dispatch to WF02 on n8n Cloud via Axios
    const n8nResult = await n8nClient.callScheduleChange({
      message: message.trim(),
      timezone,
      current_date: currentDate,
      conversation_id: conversation.id,
      user_context: {
        id: user.id,
        role: user.role,
        department: user.department,
        facultyId: user.facultyId,
      },
    });

    let scheduleChangeRequest: any = null;
    let assistantMessage = '';
    let status = 'ready_for_backend_review';
    let missingFields: string[] = [];
    let isAiAvailable = true;

    if (n8nResult.success && n8nResult.data) {
      const data = n8nResult.data;
      scheduleChangeRequest = data.schedule_change_request || null;
      assistantMessage = data.assistant_message || 'Schedule change request processed.';
      status = data.status || 'ready_for_backend_review';
      missingFields = data.missing_fields || [];
    } else {
      isAiAvailable = false;
      const facultyMatch = message.match(/\bF\d{1,2}\b/i);
      const facultyId = facultyMatch ? facultyMatch[0].toUpperCase() : (user.facultyId || 'F07');
      const lower = message.toLowerCase();
      const day = lower.includes('mon') ? 'Monday' : lower.includes('tue') ? 'Tuesday' : lower.includes('wed') ? 'Wednesday' : 'Monday';

      scheduleChangeRequest = {
        intent: 'schedule_change',
        change_type: 'faculty_unavailability',
        faculty_name: facultyId,
        room_name: null,
        session_reference: null,
        affected_date: currentDate,
        requested_day: day,
        requested_start_time: null,
        reason: message.slice(0, 200),
        requires_backend_optimization: true,
        clarification_question: null,
      };
      assistantMessage = `(Fallback Mode) Registered unavailability for ${facultyId} on ${day}.`;
      status = 'ready_for_backend_review';
    }

    // 3. Entity resolution from MySQL and CP-SAT simulation
    let simulationResult: any = null;
    if (scheduleChangeRequest?.requires_backend_optimization && dbConnected) {
      try {
        const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
        const activeSchedule = dataset
          ? await prisma.scheduleVersion.findFirst({
              where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
              include: { assignments: true },
            })
          : null;

        if (dataset && activeSchedule) {
          const dayShort = (scheduleChangeRequest.requested_day || 'MON').slice(0, 3).toUpperCase();
          const facultyIdent = scheduleChangeRequest.faculty_name || user.facultyId || 'F07';

          const disruptionPayload = {
            changes: [
              {
                type: scheduleChangeRequest.change_type === 'room_closure' ? 'room_closure' : 'faculty_unavailable',
                faculty_id: facultyIdent,
                room_id: scheduleChangeRequest.room_name || undefined,
                days: [dayShort],
                periods: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                reason: scheduleChangeRequest.reason || message,
              },
            ],
          };

          const baselineSchedule = {
            sessions: activeSchedule.assignments.map((a) => ({
              session_id: a.sessionExternalId,
              day: a.day,
              start_period: a.startPeriod,
              room_id: a.roomExternalId,
            })),
          };

          const optRes = await axios.post(
            `${OPTIMIZER_URL}/internal/solve/disruption`,
            {
              dataset: dataset.rawJson,
              disruption: disruptionPayload,
              baseline_schedule: baselineSchedule,
              timeout_seconds: 30,
            },
            { timeout: 35000 }
          );

          simulationResult = {
            feasible: optRes.data?.feasible ?? true,
            sessions_moved: optRes.data?.sessions_moved || 0,
            time_changed: optRes.data?.time_changed || 0,
            room_only_changed: optRes.data?.room_only_changed || 0,
            repaired_schedule_summary: optRes.data?.summary || 'CP-SAT stability repair computed.',
          };
        }
      } catch (optErr: any) {
        console.warn('[AI_GATEWAY] Optimizer simulation offline or skipped:', optErr.message);
        simulationResult = {
          feasible: true,
          simulated_offline: true,
          message: 'CP-SAT solver offline. Change recorded as pending draft.',
        };
      }
    }

    return res.json({
      success: true,
      ai_available: isAiAvailable,
      status,
      conversation_id: conversation.id,
      schedule_change_request: scheduleChangeRequest,
      simulation: simulationResult,
      assistant_message: assistantMessage,
      missing_fields: missingFields,
      notice: 'Timetable records are never directly altered by AI. Review disruption proposal before executing approval.',
    });
  } catch (err: any) {
    console.error('Error in /api/ai/schedule-change:', err);
    return res.status(500).json({ error: err.message || 'Internal server error processing schedule change.' });
  }
});

/**
 * POST /api/ai/decision-explainer
 * WF03 — Connect authoritative scheduling-engine decision to Gemini explanation
 */
router.post('/decision-explainer', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { request_id, status: inputStatus, reason_codes: inputReasonCodes, language = 'English', backend_result: directBackendResult } = req.body;

    let backendResult = directBackendResult;

    // 1. Fetch ground-truth database records from MySQL if request_id provided
    if (request_id && !backendResult) {
      try {
        const bookingReq = await prisma.bookingRequest.findFirst({
          where: { externalId: request_id },
          include: { decisions: true },
        });

        if (bookingReq) {
          const decision = bookingReq.decisions[0];
          const status = decision?.status || 'rejected';
          const reason = decision?.reason || 'Capacity exceeded or higher priority booking allocated venue.';

          backendResult = {
            status,
            reason_codes: [reason],
            request_id: bookingReq.externalId,
            title: bookingReq.title,
            requester: bookingReq.requester,
            attendance: bookingReq.attendance,
            requested_room: bookingReq.requestedRoom,
            allocated_room: decision?.roomExternalId || null,
            slot: decision?.day ? `${decision.day} P${decision.startPeriod}-P${decision.endPeriod}` : null,
          };
        }
      } catch (dbErr) {
        // Continue with supplied status/reasons
      }
    }

    if (!backendResult) {
      if (!inputStatus) {
        return res.status(400).json({ error: 'Either request_id or a backend_result object with a status is required.' });
      }

      backendResult = {
        status: inputStatus,
        reason_codes: Array.isArray(inputReasonCodes) ? inputReasonCodes : (inputReasonCodes ? [inputReasonCodes] : []),
        request_id: request_id || 'REQ',
      };
    }

    // 2. Dispatch to WF03 via Axios with payload structured for n8n Validate Input node
    const n8nResult = await n8nClient.callDecisionExplainer({
      backend_result: backendResult,
      language,
    });

    if (n8nResult.success && n8nResult.data) {
      return res.json({
        success: true,
        ai_available: true,
        assistant_message: n8nResult.data.assistant_message,
        decision_status: n8nResult.data.decision_status || backendResult.status,
        reason_codes: n8nResult.data.reason_codes || backendResult.reason_codes,
      });
    }

    // 3. Graceful Fallback if n8n is offline: Deterministic grounded explanation
    console.warn('[AI_GATEWAY] n8n WF03 offline. Returning deterministic grounded explanation.');
    const codeList = (backendResult.reason_codes || []).join(', ');
    let fallbackText = `Decision status: ${backendResult.status.toUpperCase()}.`;

    if (backendResult.status === 'approved') {
      fallbackText += ` Booking ${backendResult.request_id} was successfully confirmed in ${backendResult.allocated_room || backendResult.requested_room || 'requested venue'}. All requirements and capacity limits were fully satisfied.`;
    } else if (backendResult.status === 'alternative_offered') {
      fallbackText += ` An alternative venue (${backendResult.allocated_room}) was allocated because the preferred venue was reserved by an earlier or higher-priority booking.`;
    } else {
      fallbackText += ` Booking ${backendResult.request_id} could not be allocated. Reason: ${codeList || 'Venue capacity or priority quota limits were not met'}.`;
    }

    return res.json({
      success: true,
      ai_available: false,
      fallback_mode: true,
      assistant_message: fallbackText,
      decision_status: backendResult.status,
      reason_codes: backendResult.reason_codes || [],
    });
  } catch (err: any) {
    console.error('Error in /api/ai/decision-explainer:', err);
    return res.status(500).json({ error: err.message || 'Internal server error explaining decision.' });
  }
});

/**
 * GET /api/ai/conversations/:id
 * Retrieve prior conversation messages and accumulated draft
 */
router.get('/conversations/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const conversationId = Array.isArray(id) ? id[0] : id;

    try {
      const conversation = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (conversation) {
        return res.json({ success: true, conversation });
      }
    } catch (dbErr) {
      // Fall through to memory store
    }

    if (ephemeralConversationStore.has(conversationId)) {
      const cached = ephemeralConversationStore.get(conversationId)!;
      if (cached.userId === user.id) {
        return res.json({
          success: true,
          conversation: {
            id: conversationId,
            userId: user.id,
            currentDraft: cached.currentDraft,
            messages: [],
          },
        });
      }
    }

    return res.status(404).json({ error: 'Conversation not found.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
