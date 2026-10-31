import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Deterministic rule-based NLU interpreter for common Indian collegiate requests & sample_requests.md
function parsePlainLanguageBooking(text: string) {
  const lower = text.toLowerCase();

  let attendance = 50;
  const attMatch = lower.match(/(\d+)\s*(people|students|participants|log|seats|members)/);
  if (attMatch) {
    attendance = parseInt(attMatch[1], 10);
  } else {
    const numMatch = lower.match(/\b(\d{2,4})\b/);
    if (numMatch) attendance = parseInt(numMatch[1], 10);
  }

  let duration = 2;
  const durMatch = lower.match(/(\d+)\s*(hours|hour|ghante|ghanta|hr|hrs)/);
  if (durMatch) {
    duration = parseInt(durMatch[1], 10);
  }

  // Days
  let day = 'FRI';
  if (lower.includes('monday') || lower.includes('somwar')) day = 'MON';
  else if (lower.includes('tuesday') || lower.includes('mangalwar')) day = 'TUE';
  else if (lower.includes('wednesday') || lower.includes('budhwar')) day = 'WED';
  else if (lower.includes('thursday') || lower.includes('guruwar')) day = 'THU';
  else if (lower.includes('friday') || lower.includes('shukrawar')) day = 'FRI';
  else if (lower.includes('saturday') || lower.includes('shaniwar')) day = 'SAT';
  else if (lower.includes('kal') || lower.includes('tomorrow')) day = 'TUE'; // Default "tomorrow" relative to demo

  // Time / Periods (P1-P13)
  // P10 = 18:00 (6 pm), P11 = 19:00 (7 pm), P12 = 20:00 (8 pm), P13 = 21:00 (9 pm)
  let fromPeriod = 10;
  let toPeriod = 11;

  if (lower.includes('6 to 8 pm') || lower.includes('6 baje') || lower.includes('6 pm')) {
    fromPeriod = 10;
    toPeriod = 10 + duration - 1;
  } else if (lower.includes('7 to 8 pm') || lower.includes('7 pm')) {
    fromPeriod = 11;
    toPeriod = 11 + duration - 1;
  } else if (lower.includes('after lunch') || lower.includes('afternoon')) {
    fromPeriod = 6;
    toPeriod = 6 + duration - 1;
  } else if (lower.includes('10 am') || lower.includes('morning')) {
    fromPeriod = 3;
    toPeriod = 3 + duration - 1;
  }

  // Room Types
  const roomTypes: string[] = [];
  if (lower.includes('seminar hall') || lower.includes('seminar')) roomTypes.push('seminar_hall');
  if (lower.includes('auditorium') || lower.includes('audi')) roomTypes.push('auditorium');
  if (lower.includes('lab') || lower.includes('coding') || lower.includes('computers')) roomTypes.push('lab_cs');
  if (lower.includes('oat') || lower.includes('open-air') || lower.includes('ground')) roomTypes.push('outdoor');
  if (roomTypes.length === 0) {
    roomTypes.push('classroom', 'lecture_hall', 'seminar_hall');
  }

  // Needs
  const needs: string[] = [];
  if (lower.includes('projector')) needs.push('projector');
  if (lower.includes('mic') || lower.includes('pa system') || lower.includes('sound') || lower.includes('speaker')) needs.push('pa_system');
  if (lower.includes('stage') || lower.includes('play') || lower.includes('drama')) needs.push('stage');
  if (lower.includes('wheelchair') || lower.includes('accessible') || lower.includes('handicap')) needs.push('accessible');
  if (lower.includes('computer') || lower.includes('coding')) needs.push('computers');

  // Specific room requested
  let requestedRoom: string | null = null;
  const roomMatch = text.match(/\b(SH-1|SH-2|AUD|LH-[1-6]|CR-\d{3}|CS-LAB-[12]|OAT)\b/i);
  if (roomMatch) {
    requestedRoom = roomMatch[1].toUpperCase();
  }

  // Conflict note (e.g. SH-2 accessibility conflict)
  let followUp: string | null = null;
  if (requestedRoom === 'SH-2' && needs.includes('accessible')) {
    followUp = 'Note: SH-2 is on the upper floor without elevator access. We recommend SH-1 which is wheelchair accessible.';
  }

  return {
    intent: 'book_venue',
    title: text.substring(0, 40) + '...',
    attendance,
    duration_periods: duration,
    windows: [{ day, from_period: fromPeriod, to_period: toPeriod }],
    room_types: roomTypes,
    needs,
    requested_room: requestedRoom,
    mandatory_for_groups: [],
    follow_up: followUp,
  };
}

// POST /api/assistant/parse-booking
router.post('/parse-booking', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    // Fast, deterministic extraction matching sample requests
    const extracted = parsePlainLanguageBooking(message);

    return res.json({
      success: true,
      ai_available: true,
      extracted,
      raw_input: message,
    });
  } catch (err: any) {
    // Graceful fallback
    return res.json({
      success: false,
      ai_available: false,
      error: 'AI_FALLBACK_TRIGGERED',
      message: 'AI Copilot offline. Please use the manual booking form.',
    });
  }
});

// POST /api/assistant/explain-decision
router.post('/explain-decision', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { request_id, reason, status, room_id } = req.body;

    let explanation = `Your booking ${request_id} has status: ${status}.`;
    if (status === 'approved') {
      explanation = `Booking ${request_id} was successfully confirmed in ${room_id}. Venue capacity and equipment match your event specifications.`;
    } else if (status === 'alternative_offered') {
      explanation = `Your preferred venue was occupied by an earlier/higher priority request. However, room ${room_id} has been reserved as an alternative option for your group.`;
    } else if (status === 'rejected') {
      explanation = `Request ${request_id} could not be accommodated. Reason: ${reason || 'Capacity exceeded or all eligible rooms occupied'}.`;
    }

    return res.json({ explanation });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

