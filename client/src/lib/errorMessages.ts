/**
 * UX Error Message Mapping
 * 
 * Maps backend error codes to user-friendly messages with clear CTAs
 * 
 * Rules:
 * - No stack traces or internal codes exposed
 * - One primary CTA per error
 * - Non-technical language
 */

export interface ErrorMessageMapping {
  title: string;
  message: string;
  cta: string;
  ctaLink?: string;
}

/**
 * Error code mappings for production UX
 */
export const ERROR_MESSAGES: Record<string, ErrorMessageMapping> = {
  // Consent errors
  CONSENT_REQUIRED: {
    title: 'Terms Acceptance Required',
    message: 'Please review and accept deposit terms before proceeding.',
    cta: 'Review Terms',
    ctaLink: '/seeker/dashboard',
  },

  // Tax context errors
  TAX_CONTEXT_INCOMPLETE: {
    title: 'Complete Your Profile',
    message: 'Complete your billing and tax details to continue.',
    cta: 'Complete Profile',
    ctaLink: '/profile',
  },

  // KYC errors
  MOBILE_VERIFICATION_REQUIRED: {
    title: 'Verify Your Mobile Number',
    message: 'Verify your mobile number to proceed.',
    cta: 'Verify Mobile',
    ctaLink: '/profile',
  },

  // Auto-release blocked errors
  AUTO_RELEASE_BLOCKED_DISPUTE: {
    title: 'Auto-Release Paused',
    message: 'Deposit release paused due to an active dispute.',
    cta: 'View Engagement',
    ctaLink: '/seeker/dashboard',
  },

  AUTO_RELEASE_BLOCKED_NOT_ACTIVE: {
    title: 'Auto-Release Not Available',
    message: 'Deposit release is only available for active engagements.',
    cta: 'View Dashboard',
    ctaLink: '/seeker/dashboard',
  },

  // Authentication errors
  UNAUTHORIZED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    cta: 'Log In',
    ctaLink: '/login',
  },

  TOKEN_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    cta: 'Log In',
    ctaLink: '/login',
  },

  // Engagement state errors
  INVALID_ENGAGEMENT_STATUS: {
    title: 'Action Not Available',
    message: 'This action cannot be performed in the current engagement status.',
    cta: 'View Engagement',
    ctaLink: '/seeker/dashboard',
  },

  ENGAGEMENT_NOT_FOUND: {
    title: 'Engagement Not Found',
    message: 'The requested engagement could not be found.',
    cta: 'Go to Dashboard',
    ctaLink: '/seeker/dashboard',
  },

  // Payment errors
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    message: 'Payment processing failed. Please try again.',
    cta: 'Retry Payment',
  },

  PAYMENT_PENDING: {
    title: 'Payment Processing',
    message: 'Your payment is being processed. Please wait.',
    cta: 'View Status',
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    cta: 'Go Back',
  },
};

/**
 * Extract user-friendly error message from backend error
 * 
 * Parsing priority:
 * 1. Check if error message contains known error code
 * 2. Return mapped friendly message
 * 3. Return sanitized backend message (no stack traces)
 */
export const getUserFriendlyError = (error: unknown): ErrorMessageMapping => {
  let errorString = '';

  // Extract error message
  if (error instanceof Error) {
    errorString = error.message;
  } else if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      errorString = error.message;
    } else if ('error' in error && typeof error.error === 'string') {
      errorString = error.error;
    }
  } else if (typeof error === 'string') {
    errorString = error;
  }

  // Match error code from message (backend errors format: "ERROR_CODE: message")
  const errorCodeMatch = errorString.match(/^([A-Z_]+):/);
  if (errorCodeMatch) {
    const errorCode = errorCodeMatch[1];
    if (errorCode in ERROR_MESSAGES) {
      return ERROR_MESSAGES[errorCode];
    }
  }

  // Check for partial matches in error string
  for (const [code, mapping] of Object.entries(ERROR_MESSAGES)) {
    if (errorString.includes(code)) {
      return mapping;
    }
  }

  // Fallback: sanitize backend message
  const sanitizedMessage = errorString
    .replace(/^[A-Z_]+:\s*/, '') // Remove error code prefix
    .replace(/\sat\s.*$/g, '') // Remove stack trace references
    .trim();

  return {
    title: 'Error',
    message: sanitizedMessage || ERROR_MESSAGES.UNKNOWN_ERROR.message,
    cta: 'Dismiss',
  };
};

/**
 * Get specific error message by code
 */
export const getErrorByCode = (code: string): ErrorMessageMapping => {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
};
