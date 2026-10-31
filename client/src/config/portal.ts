/**
 * Portal Configuration
 * 
 * Centralized portal URL configuration for external links
 * This allows easy updates across all components that link to the portal
 * 
 * Environment variable support:
 * - VITE_PORTAL_URL: Override portal URL for different environments
 * - Defaults to production URL if not set
 */

export const PORTAL_URL = 
  (import.meta.env.VITE_PORTAL_URL as string | undefined) || 'https://app.martechadda.com';

/**
 * Helper function to construct portal URLs with optional path and query parameters
 * @param path - Optional path to append to portal URL (e.g., '/experts', '/login')
 * @param params - Optional query parameters object
 * @returns Complete portal URL with path and query string
 * 
 * @example
 * getPortalUrl('/experts', { category: 'seo' }) 
 * // Returns: 'https://app.martechadda.com/experts?category=seo'
 */
export const getPortalUrl = (path?: string, params?: Record<string, string>): string => {
  let url = PORTAL_URL;
  
  if (path) {
    // Ensure path starts with /
    url += path.startsWith('/') ? path : `/${path}`;
  }
  
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }
  
  return url;
};

