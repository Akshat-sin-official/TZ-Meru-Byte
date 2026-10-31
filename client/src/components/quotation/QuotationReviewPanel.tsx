import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuotationStepId } from './QuotationFormStepper';

type ReviewSectionProps = {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
};

function ReviewSection({ title, onEdit, children }: ReviewSectionProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-primary" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
      {children}
    </div>
  );
}

export type QuotationReviewPanelProps = {
  onGoToStep: (step: QuotationStepId) => void;
  seekerName?: string;
  serviceCategory: string;
  discussionRefId: string;
  expertRefId?: string;
  engagementAlignment: Record<string, string | undefined>;
  projectTitle: string;
  scope: string;
  deliverables: string;
  milestones: Array<{
    name: string;
    scope: string;
    timeline: string;
    numberOfRevisions: string;
    percentage: number;
  }>;
  totalAmount: number;
  formatCurrency: (n: number) => string;
  getMilestoneAmount: (pct: number) => number;
  placeOfSupplyCity: string;
  placeOfSupplyState: string;
  placeOfSupplyCountry: string;
  clientGSTStatus: string;
  clientGSTIN: string;
  expertGSTStatus: string;
  expertGSTIN?: string;
  timeline: string;
  validity: string;
  engagementStartDate: string;
  estimatedEndDate: string;
  assumptions: string;
  paymentTerms: string;
  outOfScopeItems: string[];
  thirdPartyCosts: string;
  changeRequestHandling: string;
};

export function QuotationReviewPanel(props: QuotationReviewPanelProps) {
  const {
    onGoToStep,
    seekerName,
    serviceCategory,
    discussionRefId,
    expertRefId,
    engagementAlignment,
    projectTitle,
    scope,
    deliverables,
    milestones,
    totalAmount,
    formatCurrency,
    getMilestoneAmount,
    placeOfSupplyCity,
    placeOfSupplyState,
    placeOfSupplyCountry,
    clientGSTStatus,
    clientGSTIN,
    expertGSTStatus,
    expertGSTIN,
    timeline,
    validity,
    engagementStartDate,
    estimatedEndDate,
    assumptions,
    paymentTerms,
    outOfScopeItems,
    thirdPartyCosts,
    changeRequestHandling,
  } = props;

  const totalPercentage = milestones.reduce((s, m) => s + (m.percentage || 0), 0);

  return (
    <div className="space-y-4">
      <ReviewSection title="Client & Context" onEdit={() => onGoToStep('context')}>
        <div className="space-y-1 text-sm text-muted-foreground">
          {seekerName && <p><span className="font-medium text-foreground">Client:</span> {seekerName}</p>}
          <p><span className="font-medium text-foreground">Category:</span> {serviceCategory || '—'}</p>
          <p><span className="font-medium text-foreground">Discussion ref:</span> {discussionRefId || '—'}</p>
          {expertRefId && <p><span className="font-medium text-foreground">Expert ref:</span> {expertRefId}</p>}
        </div>
      </ReviewSection>

      <ReviewSection title="Engagement & Delivery Alignment" onEdit={() => onGoToStep('alignment')}>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Stage:</span> {engagementAlignment.businessStage || '—'}</p>
          <p><span className="text-muted-foreground">Type:</span> {engagementAlignment.businessType || '—'}</p>
          <p><span className="text-muted-foreground">Customer:</span> {engagementAlignment.customerType || '—'}</p>
          <p><span className="text-muted-foreground">Model:</span> {engagementAlignment.engagementModel || '—'}</p>
          <p><span className="text-muted-foreground">Pricing:</span> {engagementAlignment.pricingModel || '—'}</p>
          <p><span className="text-muted-foreground">Delivery:</span> {engagementAlignment.deliveryMode || '—'}</p>
          <p><span className="text-muted-foreground">Turnaround:</span> {engagementAlignment.turnaroundTime || '—'}</p>
        </div>
      </ReviewSection>

      <ReviewSection title="Scope of Work" onEdit={() => onGoToStep('scope')}>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">{projectTitle || '—'}</p>
          <p className="text-muted-foreground whitespace-pre-wrap">{scope || '—'}</p>
          <p className="text-muted-foreground whitespace-pre-line">{deliverables || '—'}</p>
        </div>
      </ReviewSection>

      <ReviewSection title="Scope of Work & Milestones" onEdit={() => onGoToStep('milestones')}>
        <p className="mb-3 text-sm">
          <span className="font-medium">Total value:</span> {formatCurrency(totalAmount)}
        </p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-2 text-left font-medium">Milestone</th>
                <th className="p-2 text-left font-medium">Scope</th>
                <th className="p-2 text-left font-medium">Timeline</th>
                <th className="p-2 text-left font-medium">Revisions</th>
                <th className="p-2 text-right font-medium">Deposit</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 font-medium">{m.name || `M${i + 1}`}</td>
                  <td className="p-2 text-muted-foreground">{m.scope || '—'}</td>
                  <td className="p-2">{m.timeline || '—'}</td>
                  <td className="p-2">{m.numberOfRevisions || '—'}</td>
                  <td className="p-2 text-right">{m.percentage}% · {formatCurrency(getMilestoneAmount(m.percentage))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 font-medium">
                <td colSpan={4} className="p-2 text-right">Total</td>
                <td className="p-2 text-right">{totalPercentage}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </ReviewSection>

      <ReviewSection title="Supply & Tax Details" onEdit={() => onGoToStep('tax')}>
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Place of supply:</span>{' '}
            {[placeOfSupplyCity, placeOfSupplyState, placeOfSupplyCountry].filter(Boolean).join(', ') || '—'}
          </p>
          <p>
            <span className="font-medium">Client GST:</span>{' '}
            {clientGSTStatus === 'registered' ? 'Registered' : 'Not registered'}
            {clientGSTIN ? ` (${clientGSTIN})` : ''}
          </p>
          <p>
            <span className="font-medium">Expert GST:</span>{' '}
            {expertGSTStatus === 'registered' ? 'Registered' : 'Not registered'}
            {expertGSTIN ? ` (${expertGSTIN})` : ''}
          </p>
        </div>
      </ReviewSection>

      <ReviewSection title="Timelines & Delivery Terms" onEdit={() => onGoToStep('terms')}>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Timeline:</span> {timeline || '—'}</p>
          <p><span className="font-medium">Validity:</span> {validity} days</p>
          <p><span className="font-medium">Start:</span> {engagementStartDate || '—'}</p>
          <p><span className="font-medium">End:</span> {estimatedEndDate || '—'}</p>
          {assumptions && <p className="text-muted-foreground whitespace-pre-wrap">{assumptions}</p>}
          <p className="text-muted-foreground whitespace-pre-wrap">{paymentTerms}</p>
          {(outOfScopeItems.filter(Boolean).length > 0 || thirdPartyCosts || changeRequestHandling) && (
            <div className="mt-2 border-t pt-2 text-muted-foreground">
              {outOfScopeItems.filter(Boolean).length > 0 && (
                <p>Exclusions: {outOfScopeItems.filter(Boolean).join('; ')}</p>
              )}
              {thirdPartyCosts && <p>Third-party: {thirdPartyCosts}</p>}
              {changeRequestHandling && <p>Changes: {changeRequestHandling}</p>}
            </div>
          )}
        </div>
      </ReviewSection>
    </div>
  );
}
