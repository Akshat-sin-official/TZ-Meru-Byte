/**
 * Commission Transparency Banner
 * 
 * MANDATORY: Always visible at top of workspace
 * NON-DISMISSIBLE: Expert must see commission disclosure
 * 
 * Platform Commission: 10% on each approved milestone
 */

import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CommissionBanner() {
  return (
    <Alert className="border-2 border-primary bg-primary/5 mb-6">
      <Info className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-semibold text-primary">
        Platform Commission Transparency
      </AlertTitle>
      <AlertDescription className="space-y-2 mt-2">
        <p className="text-base text-foreground">
          <strong>MarTechAdda charges a 10% platform commission on each approved milestone.</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          The commission is deducted automatically at the time of deposit release.
          You receive the net amount after applicable platform and payment charges.
        </p>
        <div className="flex items-start gap-2 mt-3 p-3 bg-background/50 rounded-md border">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            This ensures a sustainable platform while keeping your earnings transparent.
            No hidden fees. No surprises.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
