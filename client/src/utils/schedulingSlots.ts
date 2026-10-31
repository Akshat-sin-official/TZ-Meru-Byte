export type DayAvailability = {
  available: boolean;
  from?: string;
  to?: string;
};

export type ExpertSchedulingProfile = {
  bookingsAvailability?: {
    availableDays?: string[];
    availableTimeSlots?: string[];
  };
  availability?: Record<string, DayAvailability>;
  daysOff?: string[];
};

const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/** Normalize date strings (supports YYYY-MM-DD, DD-MM-YYYY, and ISO strings) */
export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim().split('T')[0];
  const parts = trimmed.split('-');
  if (parts.length === 3) {
    // DD-MM-YYYY format
    if (parts[0].length <= 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    // YYYY-MM-DD format
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  return trimmed;
}

/** Normalize Mongoose Map / mixed keys to lowercase day keys (monday, tuesday, …). */
export function normalizeAvailabilityMap(
  raw?: Record<string, DayAvailability> | Map<string, DayAvailability> | null
): Record<string, DayAvailability> {
  if (!raw) return {};
  const entries =
    raw instanceof Map ? Array.from(raw.entries()) : Object.entries(raw);
  const out: Record<string, DayAvailability> = {};
  for (const [key, value] of entries) {
    if (!value || typeof value !== 'object') continue;
    out[key.toLowerCase()] = value;
  }
  return out;
}

/** Timezone-safe day key lookup (UTC-based calculation so client timezone offset cannot shift the weekday). */
export function dayKeyFromDate(dateStr: string): string {
  const normalized = normalizeDateString(dateStr);
  const [year, month, day] = normalized.split('-').map(Number);
  if (!year || !month || !day) return '';
  const d = new Date(Date.UTC(year, month - 1, day));
  return DAY_KEYS[d.getUTCDay()];
}

export function generateSlotsBetween(
  from: string,
  to: string,
  intervalMinutes = 15,
  durationMinutes = 30
): string[] {
  const [fromH, fromM] = from.split(':').map(Number);
  const [toH, toM] = to.split(':').map(Number);
  const endLimitMinutes = toH * 60 + toM;
  const duration = Number(durationMinutes) > 0 ? Number(durationMinutes) : 15;
  const slots: string[] = [];
  let currentH = fromH;
  let currentM = fromM;

  while (true) {
    const slotStartMinutes = currentH * 60 + currentM;
    const slotEndMinutes = slotStartMinutes + duration;

    // The entire session duration must fit within the available window
    if (slotEndMinutes > endLimitMinutes) {
      break;
    }

    // Restrict strictly to 9 AM (09:00) - 9 PM (21:00) platform window
    if (currentH >= 9 && slotEndMinutes <= 21 * 60) {
      slots.push(`${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);
    }

    currentM += intervalMinutes;
    if (currentM >= 60) {
      currentH += 1;
      currentM = 0;
    }
  }
  return slots;
}

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in Asia/Kolkata (IST).
 */
export function getCurrentISTDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Returns the current minutes elapsed since midnight in Asia/Kolkata (IST).
 */
export function getCurrentISTMinutes(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());

  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  return hour * 60 + minute;
}

/**
 * Check if a date is normally an active working day for the expert (matches day schedule and is not a day off).
 */
export function isDateWorkingDay(
  expert: ExpertSchedulingProfile | null | undefined,
  date: string
): boolean {
  if (!date) return true;
  const normalized = normalizeDateString(date);
  const istDate = getCurrentISTDate();
  if (normalized < istDate) return false;
  if (!expert) return true;

  const dayKey = dayKeyFromDate(normalized);
  if (!dayKey) return true;

  // Check days off first
  const daysOff = (expert.daysOff || []).map((d) => d.toLowerCase().trim());
  if (daysOff.includes(dayKey) || daysOff.includes(dayKey.slice(0, 3))) {
    return false;
  }

  // Check explicit booking days if configured
  const bookingDays = (expert.bookingsAvailability?.availableDays || []).map((d) => d.toLowerCase().trim());
  if (bookingDays.length > 0) {
    return bookingDays.some((d) => d === dayKey || d === dayKey.slice(0, 3));
  }

  // Check weekly availability map
  const availability = normalizeAvailabilityMap(expert.availability);
  const dayCfg = availability[dayKey];
  if (dayCfg !== undefined) {
    return !!dayCfg.available;
  }

  return true;
}

/** Build bookable time slots from expert profile + selected date (maps to weekly availability). */
export function getAvailableTimeSlots(
  expert: ExpertSchedulingProfile | null | undefined,
  selectedDate: string,
  durationMinutes = 30
): string[] {
  if (!expert) return [];

  const normalizedDate = normalizeDateString(selectedDate);
  const istDate = getCurrentISTDate();
  const currentMinutes = getCurrentISTMinutes();
  const isToday = normalizedDate === istDate;
  const isPastDate = !!normalizedDate && normalizedDate < istDate;

  if (isPastDate) {
    return [];
  }

  const duration = Number(durationMinutes) > 0 ? Number(durationMinutes) : 15;

  const filterWindowAndPast = (slots: string[], maxEndMinutes?: number) =>
    slots.filter((s) => {
      const [h, m] = s.split(':').map(Number);
      const slotStartMinutes = h * 60 + m;
      const slotEndMinutes = slotStartMinutes + duration;

      // Restrict strictly to 9 AM (09:00) - 9 PM (21:00) platform window
      if (h < 9 || slotEndMinutes > 21 * 60) return false;

      // Check max end limit if specified
      if (maxEndMinutes !== undefined && slotEndMinutes > maxEndMinutes) {
        return false;
      }

      // If selected date is today in IST, filter out past slots (earliest available time = current time + 15 minutes)
      if (isToday) {
        const minStartMinutes = currentMinutes + 15;
        if (slotStartMinutes < minStartMinutes) {
          return false;
        }
      }

      return true;
    });

  const explicit = expert.bookingsAvailability?.availableTimeSlots;
  if (explicit && explicit.length > 0) {
    return filterWindowAndPast([...explicit]).sort();
  }

  const availability = normalizeAvailabilityMap(expert.availability);
  const daysOff = (expert.daysOff || []).map((d) => d.toLowerCase().trim());
  const bookingDays = (expert.bookingsAvailability?.availableDays || []).map((d) => d.toLowerCase().trim());

  if (normalizedDate) {
    const dayKey = dayKeyFromDate(normalizedDate);
    if (!dayKey) return [];

    // Verify it is not a configured day off
    if (daysOff.includes(dayKey) || daysOff.includes(dayKey.slice(0, 3))) {
      return [];
    }

    // Verify day is in booking days if booking days are explicitly restricted
    if (bookingDays.length > 0 && !bookingDays.includes(dayKey) && !bookingDays.includes(dayKey.slice(0, 3))) {
      return [];
    }

    const dayAvailability = availability[dayKey];
    if (dayAvailability && dayAvailability.available === false) {
      return [];
    }

    // Use configured hours or fallback to standard platform 09:00 - 21:00
    const from = (dayAvailability && dayAvailability.from) || '09:00';
    const to = (dayAvailability && dayAvailability.to) || '21:00';

    const [toH, toM] = to.split(':').map(Number);
    const maxEnd = toH * 60 + toM;
    const slots = generateSlotsBetween(from, to, 15, duration);
    if (slots.length > 0) {
      return filterWindowAndPast(slots, maxEnd);
    }
    return [];
  }

  // No date yet: union of slots across all available days (preview)
  const union = new Set<string>();
  for (const cfg of Object.values(availability)) {
    if (cfg?.available !== false) {
      const from = cfg?.from || '09:00';
      const to = cfg?.to || '21:00';
      generateSlotsBetween(from, to, 15, duration).forEach((s) => union.add(s));
    }
  }
  return filterWindowAndPast(Array.from(union)).sort();
}

export function getAvailableDayLabels(expert: ExpertSchedulingProfile | null | undefined): string[] {
  const bookingDays = expert?.bookingsAvailability?.availableDays;
  if (bookingDays && bookingDays.length > 0) {
    return bookingDays;
  }

  const availability = normalizeAvailabilityMap(expert?.availability);
  const daysOff = (expert?.daysOff || []).map((d) => d.toLowerCase().trim());

  const activeDays = Object.entries(availability)
    .filter(([day, cfg]) => cfg?.available && !daysOff.includes(day))
    .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1));

  if (activeDays.length > 0) return activeDays;

  // Fallback to all standard weekdays excluding daysOff
  return DAY_KEYS.filter((d) => !daysOff.includes(d) && d !== 'sunday').map(
    (day) => day.charAt(0).toUpperCase() + day.slice(1)
  );
}

/**
 * Searches up to `maxDaysAhead` days from today for the first date that actually has open bookable slots.
 */
export function findFirstAvailableDate(
  expert: ExpertSchedulingProfile | null | undefined,
  durationMinutes = 30,
  maxDaysAhead = 30
): string {
  const istDate = getCurrentISTDate();
  const [year, month, day] = istDate.split('-').map(Number);

  for (let i = 0; i <= maxDaysAhead; i++) {
    const targetDate = new Date(Date.UTC(year, month - 1, day + i));
    const dateStr = targetDate.toISOString().split('T')[0];
    const slots = getAvailableTimeSlots(expert, dateStr, durationMinutes);
    if (slots.length > 0) {
      return dateStr;
    }
  }
  return istDate;
}

export type DateAvailabilityDetail = {
  isPast: boolean;
  isToday: boolean;
  isWorkingDay: boolean;
  dayName: string;
  hasSlots: boolean;
  slotCount: number;
  nextAvailableDate?: string;
};

/**
 * Detailed availability breakdown for a selected date to provide clear, actionable feedback.
 */
export function getDateAvailabilityDetail(
  expert: ExpertSchedulingProfile | null | undefined,
  date: string,
  durationMinutes = 30
): DateAvailabilityDetail {
  const normalized = normalizeDateString(date);
  const istDate = getCurrentISTDate();
  const isPast = normalized < istDate;
  const isToday = normalized === istDate;
  const dayKey = dayKeyFromDate(normalized);
  const dayName = dayKey ? dayKey.charAt(0).toUpperCase() + dayKey.slice(1) : '';

  const isWorking = isDateWorkingDay(expert, normalized);
  const slots = getAvailableTimeSlots(expert, normalized, durationMinutes);
  const hasSlots = slots.length > 0;

  const detail: DateAvailabilityDetail = {
    isPast,
    isToday,
    isWorkingDay: isWorking,
    dayName,
    hasSlots,
    slotCount: slots.length,
  };

  if (!hasSlots && !isPast) {
    detail.nextAvailableDate = findFirstAvailableDate(expert, durationMinutes);
  }

  return detail;
}

export function isDateAvailableForExpert(
  expert: ExpertSchedulingProfile | null | undefined,
  date: string,
  durationMinutes = 30
): boolean {
  if (!date) return true;
  const normalized = normalizeDateString(date);
  const istDate = getCurrentISTDate();
  if (normalized < istDate) return false;
  if (!expert) return true;

  if (!isDateWorkingDay(expert, normalized)) {
    return false;
  }

  // If date is today, check if there are remaining bookable slots
  if (normalized === istDate) {
    return getAvailableTimeSlots(expert, normalized, durationMinutes).length > 0;
  }

  return true;
}


export type BookedSession = {
  id?: string;
  start: string;
  duration: number;
  end?: string;
};

/**
 * Filter candidate time slots for a given date and session duration so that slots too close
 * to an existing booking (less than 15 min gap or overlapping) are automatically hidden.
 */
export function filterConflictingTimeSlots(
  candidateSlots: string[],
  selectedDate: string,
  bookedSessions?: BookedSession[] | null,
  proposedDurationMin = 30,
  excludeDiscussionId?: string
): string[] {
  if (!selectedDate || !candidateSlots || candidateSlots.length === 0) {
    return candidateSlots;
  }

  if (!bookedSessions || bookedSessions.length === 0) {
    return candidateSlots;
  }

  const [year, month, day] = selectedDate.split('-').map(Number);
  const SESSION_GAP_MS = 15 * 60 * 1000;

  const relevantSessions = bookedSessions.filter(
    (s) => !excludeDiscussionId || s.id !== excludeDiscussionId
  );

  if (relevantSessions.length === 0) return candidateSlots;

  return candidateSlots.filter((slotTime) => {
    const [h, m] = slotTime.split(':').map(Number);
    const candidateStartMs = new Date(year, month - 1, day, h, m, 0).getTime();
    const candidateEndMs = candidateStartMs + proposedDurationMin * 60 * 1000;

    for (const session of relevantSessions) {
      const bStartMs = new Date(session.start).getTime();
      const bDur = session.duration || 15;
      const bEndMs = bStartMs + bDur * 60 * 1000;

      const sufficientlySeparated =
        candidateEndMs + SESSION_GAP_MS <= bStartMs ||
        bEndMs + SESSION_GAP_MS <= candidateStartMs;

      if (!sufficientlySeparated) {
        return false;
      }
    }

    return true;
  });
}

export function format12Hour(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${mStr || '00'} ${ampm}`;
}

export const TIME_SLOTS = [
  { value: '09:00', label: '09:00 AM' },
  { value: '09:30', label: '09:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '13:30', label: '01:30 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '14:30', label: '02:30 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '15:30', label: '03:30 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '16:30', label: '04:30 PM' },
  { value: '17:00', label: '05:00 PM' },
  { value: '17:30', label: '05:30 PM' },
  { value: '18:00', label: '06:00 PM' },
  { value: '18:30', label: '06:30 PM' },
  { value: '19:00', label: '07:00 PM' },
  { value: '19:30', label: '07:30 PM' },
  { value: '20:00', label: '08:00 PM' },
];
