/**
 * Analytics Service
 * 
 * Client-side analytics event tracking for admin analytics dashboard
 * All events are append-only and non-influential
 */

import { apiClient } from './apiClient';

export type AnalyticsEventType =
    | 'page_view'
    | 'registration'
    | 'role_selection'
    | 'discussion_created'
    | 'quotation_created'
    | 'quotation_accepted'
    | 'deposit_paid'
    | 'milestone_submitted'
    | 'milestone_approved'
    | 'milestone_rejected'
    | 'auto_release_triggered'
    | 'payment_released'
    | 'engagement_successful';

export type TrafficSource = 'direct' | 'organic' | 'referral' | 'campaign';

interface AnalyticsEventPayload {
    eventType: AnalyticsEventType;
    page: string;
    metadata?: Record<string, any>;
}

/**
 * Get session ID from localStorage or create new one
 */
function getSessionId(): string {
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
}

/**
 * Detect traffic source from URL parameters and referrer
 */
function detectTrafficSource(): {
    source: TrafficSource;
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
} {
    const urlParams = new URLSearchParams(window.location.search);
    const utmCampaign = urlParams.get('utm_campaign') || undefined;
    const utmSource = urlParams.get('utm_source') || undefined;
    const utmMedium = urlParams.get('utm_medium') || undefined;

    // Determine traffic source
    let source: TrafficSource = 'direct';

    if (utmCampaign || utmSource) {
        source = 'campaign';
    } else if (document.referrer) {
        const referrerDomain = new URL(document.referrer).hostname;
        const currentDomain = window.location.hostname;

        if (referrerDomain !== currentDomain) {
            // Check if organic search
            const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu'];
            const isOrganic = searchEngines.some(engine => referrerDomain.includes(engine));
            source = isOrganic ? 'organic' : 'referral';
        }
    }

    return {
        source,
        utmCampaign,
        utmSource,
        utmMedium,
    };
}

/**
 * Track analytics event
 * Sends event to backend for storage in analytics_events collection
 */
export async function trackEvent(payload: AnalyticsEventPayload): Promise<void> {
    try {
        const sessionId = getSessionId();
        const trafficData = detectTrafficSource();

        await apiClient.post('/v1/analytics/events', {
            eventType: payload.eventType,
            sessionId,
            trafficSource: trafficData.source,
            utmCampaign: trafficData.utmCampaign,
            utmSource: trafficData.utmSource,
            utmMedium: trafficData.utmMedium,
            page: payload.page,
            metadata: payload.metadata || {},
        }, {
            headers: { 'X-Silent-Error': 'true' },
        });
    } catch (error) {
        // Silently fail - analytics should never break user experience
        // Error is intentionally not logged to avoid console noise
    }
}

/**
 * Track page view
 * Should be called on every route change
 */
export function trackPageView(page: string): void {
    trackEvent({
        eventType: 'page_view',
        page,
    });
}

/**
 * Track registration
 */
export function trackRegistration(role: 'seeker' | 'expert'): void {
    trackEvent({
        eventType: 'registration',
        page: window.location.pathname,
        metadata: { role },
    });
}

/**
 * Track role selection
 */
export function trackRoleSelection(role: 'seeker' | 'expert'): void {
    trackEvent({
        eventType: 'role_selection',
        page: window.location.pathname,
        metadata: { role },
    });
}

/**
 * Track discussion created
 */
export function trackDiscussionCreated(discussionId: string, expertId: string): void {
    trackEvent({
        eventType: 'discussion_created',
        page: window.location.pathname,
        metadata: { discussionId, expertId },
    });
}

/**
 * Track quotation created
 */
export function trackQuotationCreated(quotationId: string, totalAmount: number): void {
    trackEvent({
        eventType: 'quotation_created',
        page: window.location.pathname,
        metadata: { quotationId, totalAmount },
    });
}

/**
 * Track quotation accepted
 */
export function trackQuotationAccepted(quotationId: string, engagementId: string): void {
    trackEvent({
        eventType: 'quotation_accepted',
        page: window.location.pathname,
        metadata: { quotationId, engagementId },
    });
}

/**
 * Track deposit paid
 */
export function trackDepositPaid(engagementId: string, amount: number): void {
    trackEvent({
        eventType: 'deposit_paid',
        page: window.location.pathname,
        metadata: { engagementId, amount },
    });
}

/**
 * Track milestone submitted
 */
export function trackMilestoneSubmitted(
    engagementId: string,
    milestoneNumber: number
): void {
    trackEvent({
        eventType: 'milestone_submitted',
        page: window.location.pathname,
        metadata: { engagementId, milestoneNumber },
    });
}

/**
 * Track milestone approved
 */
export function trackMilestoneApproved(
    engagementId: string,
    milestoneNumber: number
): void {
    trackEvent({
        eventType: 'milestone_approved',
        page: window.location.pathname,
        metadata: { engagementId, milestoneNumber },
    });
}

/**
 * Track milestone rejected
 */
export function trackMilestoneRejected(
    engagementId: string,
    milestoneNumber: number
): void {
    trackEvent({
        eventType: 'milestone_rejected',
        page: window.location.pathname,
        metadata: { engagementId, milestoneNumber },
    });
}

/**
 * Track auto-release triggered
 */
export function trackAutoReleaseTriggered(
    engagementId: string,
    milestoneNumber: number
): void {
    trackEvent({
        eventType: 'auto_release_triggered',
        page: window.location.pathname,
        metadata: { engagementId, milestoneNumber },
    });
}

/**
 * Track payment released
 */
export function trackPaymentReleased(
    engagementId: string,
    amount: number
): void {
    trackEvent({
        eventType: 'payment_released',
        page: window.location.pathname,
        metadata: { engagementId, amount },
    });
}

/**
 * Track engagement successful
 * Called when first milestone is approved/auto-released
 */
export function trackEngagementSuccessful(
    engagementId: string,
    category: string,
    totalValue: number
): void {
    trackEvent({
        eventType: 'engagement_successful',
        page: window.location.pathname,
        metadata: { engagementId, category, totalValue },
    });
}
