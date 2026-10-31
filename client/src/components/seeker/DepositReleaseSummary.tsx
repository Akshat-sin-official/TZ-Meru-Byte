import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SeekerEngagement } from "@/services/seekerService";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface DepositReleaseSummaryProps {
  engagements: SeekerEngagement[];
}

/**
 * Deposit & Release Summary Component
 * Shows: Total deposit received, Amount released, Amount pending, Remaining balance
 */
export function DepositReleaseSummary({ engagements = [] }: DepositReleaseSummaryProps) {
  // Calculate totals across all engagements
  const totalDeposit = engagements.reduce((sum, e) => sum + (e.totalDeposit || 0), 0);
  const totalReleased = engagements.reduce((sum, e) => sum + (e.releasedAmount || 0), 0);
  const totalHeld = engagements.reduce((sum, e) => sum + (e.heldAmount || 0), 0);
  const totalRemaining = engagements.reduce((sum, e) => sum + (e.remainingBalance || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-2 border-foreground/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Deposit & Release Summary
        </CardTitle>
        <CardDescription>
          Funds are released only after your milestone approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Deposit Received */}
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <DollarSign className="h-4 w-4" />
              <p className="text-sm font-medium">Total Deposit Received</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(totalDeposit)}
            </p>
          </div>

          {/* Amount Released */}
          <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <TrendingUp className="h-4 w-4" />
              <p className="text-sm font-medium">Amount Released</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(totalReleased)}
            </p>
          </div>

          {/* Amount Pending */}
          <div className="space-y-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 text-orange-700">
              <TrendingDown className="h-4 w-4" />
              <p className="text-sm font-medium">Amount Pending</p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {formatCurrency(totalHeld)}
            </p>
          </div>

          {/* Remaining Balance */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-700">
              <Wallet className="h-4 w-4" />
              <p className="text-sm font-medium">Remaining Balance</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalRemaining)}
            </p>
          </div>
        </div>

        {/* Microcopy */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground italic text-center">
            Funds will be released only after your approval.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

