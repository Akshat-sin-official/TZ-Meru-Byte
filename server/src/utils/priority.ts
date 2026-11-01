/**
 * Canonical 6-level room conflict resolution hierarchy:
 * When two requests want the same room at the same time, this order decides who gets it:
 * 1. Exams
 * 2. Regular classes
 * 3. Institute events (Spectra main events, convocation)
 * 4. Guest lectures
 * 5. Department events
 * 6. Club events
 *
 * Ties are broken by earlier submitted_at timestamp.
 */

export const ROOM_PRIORITY_ORDER = [
  'exam', // 1. Exams
  'regular_session', // 2. Regular classes
  'institute_event', // 3. Institute events (Spectra main events, convocation)
  'guest_lecture', // 4. Guest lectures
  'department_event', // 5. Department events
  'club_event', // 6. Club events
] as const;

export type RoomCategory = (typeof ROOM_PRIORITY_ORDER)[number];

export const CATEGORY_META: Record<
  RoomCategory,
  { rank: number; label: string; description: string }
> = {
  exam: {
    rank: 1,
    label: 'Exams',
    description: 'Midsem, endsem, and university examinations',
  },
  regular_session: {
    rank: 2,
    label: 'Regular classes',
    description: 'Scheduled course lectures, labs, and tutorials',
  },
  institute_event: {
    rank: 3,
    label: 'Institute events',
    description: 'Spectra main events, convocation, and official institute functions',
  },
  guest_lecture: {
    rank: 4,
    label: 'Guest lectures',
    description: 'Invited distinguished speaker sessions and industrial workshops',
  },
  department_event: {
    rank: 5,
    label: 'Department events',
    description: 'Departmental symposiums, seminars, and project showcases',
  },
  club_event: {
    rank: 6,
    label: 'Club events',
    description: 'Student club meetings, rehearsals, hackathons, and competitions',
  },
};

export const CATEGORY_ALIASES: Record<string, RoomCategory> = {
  exam: 'exam',
  exams: 'exam',
  examination: 'exam',
  midsem: 'exam',
  endsem: 'exam',
  regular_session: 'regular_session',
  regular_class: 'regular_session',
  regular_classes: 'regular_session',
  class: 'regular_session',
  classes: 'regular_session',
  lecture: 'regular_session',
  session: 'regular_session',
  institute_event: 'institute_event',
  institute_events: 'institute_event',
  convocation: 'institute_event',
  spectra_main: 'institute_event',
  guest_lecture: 'guest_lecture',
  guest_lectures: 'guest_lecture',
  speaker: 'guest_lecture',
  department_event: 'department_event',
  department_events: 'department_event',
  dept_event: 'department_event',
  club_event: 'club_event',
  club_events: 'club_event',
  club: 'club_event',
};

export const ROLE_CATEGORY_CAP: Record<string, RoomCategory> = {
  system: 'exam',
  exam_cell: 'exam',
  academic_cell: 'regular_session',
  admin: 'institute_event',
  faculty: 'guest_lecture',
  coordinator: 'department_event',
  department_coordinator: 'department_event',
  club: 'club_event',
};

export function normalizeCategory(cat?: string | null): RoomCategory {
  if (!cat) return 'club_event';
  const clean = String(cat).trim().toLowerCase().replace(/[\s-]+/g, '_');
  return CATEGORY_ALIASES[clean] || 'club_event';
}

export function getEffectiveCategory(req: {
  role?: string | null;
  requestedCategory?: string | null;
  requested_category?: string | null;
  category?: string | null;
  exam_id?: string | null;
  examExternalId?: string | null;
  session_id?: string | null;
  sessionExternalId?: string | null;
}): RoomCategory {
  // If it is an explicit exam or course session
  if (req.exam_id || req.examExternalId) return 'exam';
  if (req.session_id || req.sessionExternalId) return 'regular_session';

  const rawRequested = req.requestedCategory || req.requested_category || req.category;
  const requested = normalizeCategory(rawRequested);

  // If directly designated as exam or regular class by academic / institute authorities
  const role = String(req.role || '').toLowerCase();
  if (requested === 'exam' && (role === 'admin' || role === 'system' || role === 'exam_cell' || !role)) {
    return 'exam';
  }
  if (
    requested === 'regular_session' &&
    (role === 'admin' ||
      role === 'faculty' ||
      role === 'academic_cell' ||
      role === 'coordinator' ||
      role === 'department_coordinator' ||
      !role)
  ) {
    return 'regular_session';
  }

  const cap = ROLE_CATEGORY_CAP[role] || 'club_event';
  const reqRank = ROOM_PRIORITY_ORDER.indexOf(requested);
  const capRank = ROOM_PRIORITY_ORDER.indexOf(cap);

  // Category is capped: can never exceed role's allowed rank (higher index = lower priority)
  const effectiveIndex = Math.max(
    reqRank >= 0 ? reqRank : ROOM_PRIORITY_ORDER.length - 1,
    capRank >= 0 ? capRank : ROOM_PRIORITY_ORDER.length - 1
  );

  return ROOM_PRIORITY_ORDER[effectiveIndex];
}

export interface RoomConflictResult {
  winnerId: string;
  loserId: string;
  winner: any;
  loser: any;
  winnerRank: number;
  loserRank: number;
  winnerCategory: RoomCategory;
  loserCategory: RoomCategory;
  reason: string;
  hierarchy: Array<{ rank: number; key: string; label: string; description: string }>;
}

/**
 * When two requests want the same room at the same time, this order decides who gets it:
 * 1. Exams
 * 2. Regular classes
 * 3. Institute events (Spectra main events, convocation)
 * 4. Guest lectures
 * 5. Department events
 * 6. Club events
 *
 * Ties are broken by earlier submission timestamp (submittedAt / submitted_at).
 */
export function resolveRoomConflict(reqA: any, reqB: any): RoomConflictResult {
  const catA = getEffectiveCategory(reqA);
  const catB = getEffectiveCategory(reqB);

  const rankA = ROOM_PRIORITY_ORDER.indexOf(catA) + 1;
  const rankB = ROOM_PRIORITY_ORDER.indexOf(catB) + 1;

  const idA = reqA.id || reqA.externalId || reqA.external_id || reqA.sessionId || reqA.session_id || 'Request A';
  const idB = reqB.id || reqB.externalId || reqB.external_id || reqB.sessionId || reqB.session_id || 'Request B';

  const timeA = reqA.submittedAt || reqA.submitted_at || '';
  const timeB = reqB.submittedAt || reqB.submitted_at || '';

  const labelA = CATEGORY_META[catA].label;
  const labelB = CATEGORY_META[catB].label;

  let winner: any;
  let loser: any;
  let winnerRank: number;
  let loserRank: number;
  let winnerCategory: RoomCategory;
  let loserCategory: RoomCategory;
  let reason: string;

  if (rankA < rankB) {
    winner = reqA;
    loser = reqB;
    winnerRank = rankA;
    loserRank = rankB;
    winnerCategory = catA;
    loserCategory = catB;
    reason = `${labelA} (Rank ${rankA}) takes precedence over ${labelB} (Rank ${rankB}).`;
  } else if (rankB < rankA) {
    winner = reqB;
    loser = reqA;
    winnerRank = rankB;
    loserRank = rankA;
    winnerCategory = catB;
    loserCategory = catA;
    reason = `${labelB} (Rank ${rankB}) takes precedence over ${labelA} (Rank ${rankA}).`;
  } else {
    // Both are at the same priority level -> earlier submitted_at wins
    if (timeA && timeB && timeA !== timeB) {
      if (timeA < timeB) {
        winner = reqA;
        loser = reqB;
        winnerRank = rankA;
        loserRank = rankB;
        winnerCategory = catA;
        loserCategory = catB;
        reason = `Both are ${labelA} (Rank ${rankA}). Winner resolved by earlier submission: ${idA} (${timeA}) beat ${idB} (${timeB}).`;
      } else {
        winner = reqB;
        loser = reqA;
        winnerRank = rankB;
        loserRank = rankA;
        winnerCategory = catB;
        loserCategory = catA;
        reason = `Both are ${labelB} (Rank ${rankB}). Winner resolved by earlier submission: ${idB} (${timeB}) beat ${idA} (${timeA}).`;
      }
    } else {
      winner = reqA;
      loser = reqB;
      winnerRank = rankA;
      loserRank = rankB;
      winnerCategory = catA;
      loserCategory = catB;
      reason = `Both are ${labelA} (Rank ${rankA}) with equal or unrecorded submission time. First listed request gets the room.`;
    }
  }

  const winnerId = winner.id || winner.externalId || winner.external_id || winner.sessionId || winner.session_id || 'winner';
  const loserId = loser.id || loser.externalId || loser.external_id || loser.sessionId || loser.session_id || 'loser';

  return {
    winnerId,
    loserId,
    winner,
    loser,
    winnerRank,
    loserRank,
    winnerCategory,
    loserCategory,
    reason,
    hierarchy: ROOM_PRIORITY_ORDER.map((k) => ({
      rank: CATEGORY_META[k].rank,
      key: k,
      label: CATEGORY_META[k].label,
      description: CATEGORY_META[k].description,
    })),
  };
}

