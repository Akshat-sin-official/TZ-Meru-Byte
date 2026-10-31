import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type QuotationStepId =
  | 'context'
  | 'alignment'
  | 'scope'
  | 'milestones'
  | 'tax'
  | 'terms'
  | 'review';

export const QUOTATION_STEPS: { id: QuotationStepId; label: string }[] = [
  { id: 'context', label: 'Client & Context' },
  { id: 'alignment', label: 'Alignment' },
  { id: 'scope', label: 'Scope' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'tax', label: 'Tax & Supply' },
  { id: 'terms', label: 'Terms' },
  { id: 'review', label: 'Review' },
];

type Props = {
  currentStep: QuotationStepId;
  onStepClick: (step: QuotationStepId) => void;
};

export function QuotationFormStepper({ currentStep, onStepClick }: Props) {
  const currentIndex = QUOTATION_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav className="mb-8" aria-label="Quotation form progress">
      <div className="flex flex-wrap items-center gap-1 sm:gap-0">
        {QUOTATION_STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          return (
            <div key={step.id} className="flex items-center min-w-0">
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                className={cn(
                  'group flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-center transition-colors sm:px-3',
                  'hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'bg-secondary'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold',
                    isCompleted && 'border-foreground bg-foreground text-background',
                    isActive && !isCompleted && 'border-foreground bg-background text-foreground',
                    !isActive && !isCompleted && 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'max-w-[4.5rem] text-[10px] font-medium leading-tight sm:max-w-none sm:text-xs',
                    isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < QUOTATION_STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-0.5 hidden h-0.5 w-4 sm:block sm:w-6 md:w-10',
                    index < currentIndex ? 'bg-foreground' : 'bg-border'
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
