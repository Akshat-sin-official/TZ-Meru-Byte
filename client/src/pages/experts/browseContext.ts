/**
 * Aligns expert profile/compare views with the seeker's active discovery filters (URL).
 */
export type BrowseServiceContext = {
  svc?: string;
  focus?: string;
  needs: string[];
};

export function parseBrowseContext(searchParams: URLSearchParams): BrowseServiceContext {
  const svc = searchParams.get('svc')?.trim() || undefined;
  const focus = searchParams.get('focus')?.trim() || undefined;
  const needs = (searchParams.get('need') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return { svc, focus, needs };
}

export function hasBrowseContext(ctx: BrowseServiceContext): boolean {
  return !!(ctx.svc || ctx.focus || ctx.needs.length);
}

/** Returns `?svc=…&focus=…&need=…` or empty string */
export function serializeBrowseQuery(ctx: BrowseServiceContext): string {
  const p = new URLSearchParams();
  if (ctx.svc) p.set('svc', ctx.svc);
  if (ctx.focus) p.set('focus', ctx.focus);
  if (ctx.needs.length) p.set('need', ctx.needs.join(','));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function browseContextFromDiscoveryFilters(filters: {
  coreServiceCategories: string[];
  primaryFilter?: string;
  subServices: string[];
}): BrowseServiceContext {
  return {
    svc: filters.coreServiceCategories?.[0]?.trim() || undefined,
    focus: filters.primaryFilter?.trim() || undefined,
    needs: [...(filters.subServices || [])].map((s) => String(s).trim()).filter(Boolean),
  };
}

export function normContains(haystack: string, needle: string): boolean {
  const h = haystack.trim().toLowerCase();
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  return h === n || h.includes(n);
}

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
};
