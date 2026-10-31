import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/services/analyticsService';

/**
 * Fires one page_view per SPA navigation for admin analytics.
 */
export function AnalyticsRouteTracker(): null {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    trackPageView(path || '/');
  }, [location.pathname, location.search]);

  return null;
}
