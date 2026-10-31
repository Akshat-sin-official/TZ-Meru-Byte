// Time Calculation Helpers
export const formatTimeTo12hr = (time24: string | null | undefined): string => {
  if (!time24) return ''
  const [hour, minute] = time24.split(':')
  const h = parseInt(hour)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12
  return `${displayHour}:${minute} ${ampm}`
}

export const parseTimeTo24hr = (timeStr: string, ampm: string): string => {
  let [hour, minute] = timeStr.split(':')
  let h = parseInt(hour)
  if (ampm === 'PM' && h < 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return `${h.toString().padStart(2, '0')}:${minute || '00'}`
}

export const calculateDayHours = (from: string | null | undefined, to: string | null | undefined): number => {
  if (!from || !to) return 0
  const [fH, fM] = from.split(':').map(Number)
  const [tH, tM] = to.split(':').map(Number)
  const totalMinutes = (tH * 60 + tM) - (fH * 60 + fM)
  return Math.max(0, totalMinutes / 60)
}

export interface TimeOption {
  label: string
  value: string
}

export const TIME_OPTIONS: TimeOption[] = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  const h = hour % 12 || 12
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return {
    label: `${h}:${minute} ${ampm}`,
    value: `${hour.toString().padStart(2, '0')}:${minute}`
  }
})

// Regex Patterns for validation
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
export const CIN_REGEX = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/
export const LLPIN_REGEX = /^[A-Z]{3}-[0-9]{4}$/
export const PINCODE_REGEX = /^[1-9]{1}[0-9]{5}$/
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/
export const MOBILE_REGEX = /^[0-9]{10}$/
