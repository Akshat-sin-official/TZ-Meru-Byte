import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText, Loader2, MessageSquare, Eye } from 'lucide-react';
import { ExpertQuotation } from '@/services/expertService';

export type QuotationFilterKey =
  | 'all'
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'revision_requested'
  | 'revised'
  | 'approved'
  | 'rejected'
  | 'expired';

const FILTER_OPTIONS: { key: QuotationFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Saved Drafts' },
  { key: 'sent', label: 'Sent' },
  { key: 'viewed', label: 'Viewed by Business' },
  { key: 'revision_requested', label: 'Revision Requested' },
  { key: 'revised', label: 'Revised' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'expired', label: 'Expired / Closed' },
];

function classifyQuotation(quote: ExpertQuotation): QuotationFilterKey[] {
  const tags: QuotationFilterKey[] = [];
  const status = String(quote.status || '').toLowerCase();

  if (status === 'draft') tags.push('draft');
  if (status === 'sent' && !quote.viewedAt) tags.push('sent');
  if (status === 'sent' && quote.viewedAt) tags.push('viewed');
  if (status === 'revision_requested') tags.push('revision_requested');
  if ((quote.currentRevision ?? 0) > 0 || (quote.revisionHistoryCount ?? 0) > 0) {
    if (status === 'sent' || status === 'revision_requested') tags.push('revised');
  }
  if (status === 'accepted') tags.push('approved');
  if (status === 'rejected' || status === 'declined') tags.push('rejected');
  if (status === 'expired') tags.push('expired');

  return tags;
}

type Props = {
  quotations: ExpertQuotation[];
  isLoading: boolean;
  onCreateNew: () => void;
  formatCurrency: (amount: number) => string;
};

export function ExpertQuotationsPanel({ quotations, isLoading, onCreateNew, formatCurrency }: Props) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<QuotationFilterKey>('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: quotations.length };
    for (const q of quotations) {
      for (const tag of classifyQuotation(q)) {
        c[tag] = (c[tag] || 0) + 1;
      }
    }
    return c;
  }, [quotations]);

  const filtered = useMemo(() => {
    if (filter === 'all') return quotations;
    return quotations.filter((q) => classifyQuotation(q).includes(filter));
  }, [quotations, filter]);

  const statusLabel = (quote: ExpertQuotation) => {
    const tags = classifyQuotation(quote);
    if (tags.includes('draft')) return 'Saved Draft';
    if (tags.includes('revision_requested')) return 'Revision Requested';
    if (tags.includes('viewed')) return 'Viewed by Business';
    if (tags.includes('sent')) return 'Sent';
    if (tags.includes('approved')) return 'Approved';
    if (tags.includes('rejected')) return 'Rejected';
    if (tags.includes('expired')) return 'Expired';
    return String(quote.status || 'unknown');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111926]">Quotations</h2>
          <p className="text-sm text-[#6B7280]">
            Create, track, and manage proposals through each stage of the workflow
          </p>
        </div>
        <Button onClick={onCreateNew} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white shrink-0">
          <FileText className="mr-2 h-4 w-4" />
          Create Quotation
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            type="button"
            size="sm"
            variant={filter === opt.key ? 'default' : 'outline'}
            className={filter === opt.key ? 'bg-[#111926]' : ''}
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
            {counts[opt.key] != null && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-[10px]">
                {counts[opt.key] ?? 0}
              </span>
            )}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0EA5E9]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-10 w-10 text-gray-400" />
            <h3 className="text-lg font-bold text-[#111926]">No quotations in this view</h3>
            <p className="mt-2 max-w-sm text-sm text-[#6B7280]">
              {filter === 'draft'
                ? 'Saved drafts appear here when you use Save Draft on the create quotation form.'
                : 'Try another filter or create a new quotation from a discussion.'}
            </p>
            <Button variant="outline" className="mt-6" onClick={onCreateNew}>
              Create Quotation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((quote: ExpertQuotation) => (
            <Card
              key={quote.id}
              className="border border-[#E5E7EB] bg-white rounded-xl shadow-sm overflow-hidden hover:border-[#0EA5E9] transition-colors"
            >
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#0EA5E9] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                        {quote.referenceId}
                      </span>
                      <Badge variant="secondary" className="capitalize text-[10px] h-5">
                        {statusLabel(quote)}
                      </Badge>
                      {(quote.currentRevision ?? 0) > 0 && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          v{(quote.currentRevision ?? 0) + 1}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-[#111926] truncate">
                      {quote.projectTitle || quote.seekerName}
                    </h3>
                    <p className="text-sm text-[#4B5563] line-clamp-2">{quote.scope}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wider">Project Value</p>
                      <p className="text-2xl font-black text-[#111926]">{formatCurrency(quote.totalAmount)}</p>
                    </div>
                    <div className="flex gap-2">
                      {quote.status === 'draft' && quote.discussionId && (
                        <Button
                          size="sm"
                          className="h-9"
                          onClick={() =>
                            navigate(`/expert/quotation/create?discussion=${quote.discussionId}`)
                          }
                        >
                          Continue Draft
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 font-semibold"
                        onClick={() => navigate(`/expert/quotations/${quote.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-2 text-xs text-[#6B7280] border-t border-[#F3F4F6] pt-5 sm:grid-cols-2 lg:grid-cols-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Created:</span>{' '}
                    {quote.createdAt
                      ? new Date(quote.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Last updated:</span>{' '}
                    {quote.updatedAt
                      ? new Date(quote.updatedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                  {quote.sentAt && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Sent:</span>{' '}
                      {new Date(quote.sentAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Viewed:</span>{' '}
                    {quote.viewedAt
                      ? new Date(quote.viewedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Not yet'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Discussion:</span> {quote.discussionRef}
                  </span>
                  {(quote.revisionHistoryCount ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">Revisions:</span> {quote.revisionHistoryCount} in history
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
