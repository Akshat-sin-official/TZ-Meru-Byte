import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/common';
import { seekerService } from '@/services/seekerService';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Send, Loader2 } from 'lucide-react';

const RequestQuotation = () => {
  const navigate = useNavigate();
  const { discussionId } = useParams<{ discussionId: string }>();

  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Fetch discussion
  const { data: discussion, isLoading: discussionLoading } = useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: () => seekerService.getDiscussion(discussionId!),
    enabled: !!discussionId,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!requirements.trim()) {
      toast.error('Please describe your requirements');
      return;
    }
    if (!discussionId) {
      toast.error('Discussion ID is missing');
      return;
    }

    try {
      setIsSubmitting(true);
      await seekerService.requestQuotation(discussionId);
      toast.success('Quotation request sent to expert successfully!');
      navigate('/seeker/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to request quotation';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (discussionLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!discussion) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">Discussion Not Found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Request Quotation"
        description={`Request a detailed quotation from ${discussion.expertName}`}
      >
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Discussion Reference */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Discussion Reference</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expert:</span>
                  <span className="font-medium">{discussion.expertName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discussion Purpose:</span>
                  <span className="font-medium">{discussion.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discussion Date:</span>
                  <span className="font-medium">
                    {discussion.scheduledDate ? new Date(discussion.scheduledDate).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Requirements Form */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Project Requirements</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Describe your requirements *
                  </label>
                  <textarea
                    rows={6}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Describe what you need in detail..."
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Estimated Budget (₹)
                    </label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="e.g., 50,000 - 1,00,000"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Expected Timeline
                    </label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="e.g., 4-6 weeks"
                      value={timeline}
                      onChange={e => setTimeline(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Any additional information..."
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">What happens next?</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-xs font-bold">
                    1
                  </div>
                  <p className="text-muted-foreground">
                    Expert receives your quotation request
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-xs font-bold">
                    2
                  </div>
                  <p className="text-muted-foreground">
                    Expert prepares a detailed quotation with milestones
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-xs font-bold">
                    3
                  </div>
                  <p className="text-muted-foreground">
                    You review and accept/negotiate the quotation
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-xs font-bold">
                    4
                  </div>
                  <p className="text-muted-foreground">
                    Upon acceptance, deposit funds and begin engagement
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary p-6">
              <h3 className="mb-2 font-semibold">Need more discussion?</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Schedule another discussion if you need to clarify requirements
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href={`/discussions/schedule/${discussion.expertId || discussionId}`}>
                  Schedule Discussion
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RequestQuotation;
