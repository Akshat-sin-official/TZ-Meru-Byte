/**
 * Admin-facing helpers: map Indian entity types to the PAN / incorporation uploads
 * experts actually submit (wizard uses LLP PAN vs Company PAN labels, etc.).
 */

export function docLabel(d: { documentType?: string; type?: string }): string {
  return String(d.documentType || d.type || '').trim();
}

/** PAN card that represents the taxpayer / constitution for verification. */
export function getExpertBusinessPanUrl(
  entityType: string | undefined,
  documents: Array<{ documentType?: string; type?: string; fileUrl?: string }> | undefined
): string | undefined {
  const docs = documents || [];
  const t = (entityType || '').toLowerCase().replace(/-/g, '_');

  const find = (...labels: string[]) => {
    for (const label of labels) {
      const hit = docs.find((x) => docLabel(x) === label && x.fileUrl);
      if (hit?.fileUrl) return hit.fileUrl;
    }
    return undefined;
  };

  // Sole proprietorship: proprietor’s PAN doubles as firm PAN under Indian norms; uploads may label either way.
  if (t === 'proprietorship' || t === 'individual') {
    return find('Firm PAN', 'Proprietor PAN', 'Company PAN', 'LLP PAN');
  }
  if (t === 'partnership') {
    return find('Firm PAN', 'Company PAN');
  }
  if (t === 'llp') {
    return find('LLP PAN', 'Company PAN');
  }
  if (['opc', 'private_limited', 'pvt_ltd', 'public_limited', 'public_ltd'].includes(t)) {
    return find('Company PAN', 'LLP PAN');
  }

  return find('Company PAN', 'LLP PAN', 'Firm PAN', 'Proprietor PAN');
}

export function businessPanPillLabel(entityType: string | undefined): string {
  const t = (entityType || '').toLowerCase().replace(/-/g, '_');
  if (t === 'proprietorship' || t === 'individual') return 'Firm / proprietor PAN';
  if (t === 'partnership') return 'Firm PAN';
  if (t === 'llp') return 'LLP PAN';
  return 'Company PAN';
}

export function getExpertIncorporationDocUrl(
  entityType: string | undefined,
  documents: Array<{ documentType?: string; type?: string; fileUrl?: string }> | undefined
): string | undefined {
  const docs = documents || [];
  const t = (entityType || '').toLowerCase().replace(/-/g, '_');

  const find = (...labels: string[]) => {
    for (const label of labels) {
      const hit = docs.find((x) => docLabel(x) === label && x.fileUrl);
      if (hit?.fileUrl) return hit.fileUrl;
    }
    return undefined;
  };

  if (t === 'llp') {
    return find('LLPIN', 'Certificate of Incorporation', 'CIN');
  }
  if (t === 'partnership') {
    return find('Partnership Deed', 'Certificate of Incorporation', 'CIN');
  }
  if (['opc', 'private_limited', 'pvt_ltd', 'public_limited', 'public_ltd'].includes(t)) {
    return find('CIN', 'Certificate of Incorporation', 'LLPIN');
  }

  return find('Certificate of Incorporation', 'CIN', 'LLPIN', 'Partnership Deed');
}

export function incorporationDocOptionalForEntity(entityType: string | undefined): boolean {
  const t = (entityType || '').toLowerCase().replace(/-/g, '_');
  return t === 'proprietorship' || t === 'individual';
}

export function incorporationPillShortLabel(entityType: string | undefined): string {
  const t = (entityType || '').toLowerCase().replace(/-/g, '_');
  if (t === 'llp') return 'LLPIN / COI';
  if (t === 'partnership') return 'Deed / COI';
  if (['opc', 'private_limited', 'pvt_ltd', 'public_limited', 'public_ltd'].includes(t)) return 'CIN / COI';
  return 'COI / reg.';
}

const HIDDEN_IN_OTHER_DOCS = new Set([
  'Certificate of Incorporation',
  'CIN',
  'LLPIN',
  'Partnership Deed',
  'Company PAN',
  'LLP PAN',
  'Firm PAN',
  'Proprietor PAN',
  'Authorized Signatory PAN',
  'GST Certificate',
  'gst_certificate',
]);

export function isListedComplianceDoc(d: { documentType?: string; type?: string }): boolean {
  return HIDDEN_IN_OTHER_DOCS.has(docLabel(d));
}
