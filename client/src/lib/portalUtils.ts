/**
 * Portal Utilities
 * 
 * Helper functions for portal navigation and external links
 */

import { getPortalUrl } from '@/config/portal';

/**
 * Safely opens an external URL in a new tab with proper security attributes
 * @param url - The URL to open
 * @param features - Optional window features (default: 'noopener,noreferrer')
 */
export const openExternalLink = (
  url: string,
  features: string = 'noopener,noreferrer'
): void => {
  window.open(url, '_blank', features);
};

/**
 * Opens a portal URL in a new tab
 * @param path - Optional path to append to portal URL
 * @param params - Optional query parameters
 */
export const openPortalLink = (
  path?: string,
  params?: Record<string, string>
): void => {
  const url = getPortalUrl(path, params);
  openExternalLink(url);
};

/**
 * Creates props for external links with proper security attributes
 * @param url - The URL for the link
 * @param openInNewTab - Whether to open in a new tab (default: true)
 * @returns Props object for anchor tags
 */
export const getExternalLinkProps = (
  url: string,
  openInNewTab: boolean = true
) => {
  const props: {
    href: string;
    target?: string;
    rel?: string;
  } = {
    href: url,
  };

  if (openInNewTab) {
    props.target = '_blank';
    props.rel = 'noopener noreferrer';
  }

  return props;
};

