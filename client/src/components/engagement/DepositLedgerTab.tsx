import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Engagement, DepositLedger } from "@/types/deposit";
import depositService from "@/services/depositService";
import { Info, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DepositLedgerTabProps {
  engagement: Engagement;
  quotation: any;
  ledger: DepositLedger | null;
}

export default function DepositLedgerTab({
  engagement,
  quotation,
  ledger,
}: DepositLedgerTabProps) {
  const heldAmount = ledger ? depositService.calculateRemainingDeposit(ledger) : 0;
  const releasedAmount = ledger ? depositService.calculateTotalReleased(ledger) : 0;
  const totalDeposit = ledger?.totalDeposit || 0;

  return (
    <div className="space-y-6">
      {/* Platform Disclaimer */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <CardTitle className="text-blue-900">Deposit Release Policy</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-800">
            <p>
              <strong>Deposits are released only upon milestone approval.</strong>
            </p>
            <p>
              MarTechAdda does not judge work quality or scope. All release decisions are
              controlled by the business party.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <p className="text-sm">Total Engagement Value</p>
              </div>
              <p className="text-2xl font-bold">
                {depositService.formatDeposit(quotation?.totalAmount || 0)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <p className="text-sm">Total Deposit</p>
              </div>
              <p className="text-2xl font-bold">
                {depositService.formatDeposit(totalDeposit)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-orange-600">
                <TrendingDown className="h-4 w-4" />
                <p className="text-sm">Held Amount</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {depositService.formatDeposit(heldAmount)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm">Released Amount</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {depositService.formatDeposit(releasedAmount)}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Ledger Status</p>
            <Badge variant={ledger?.status === "fully_released" ? "default" : "secondary"}>
              {ledger ? depositService.getDepositStatusLabel(ledger.status) : "Not Available"}
            </Badge>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Deposit Holder</p>
            <p className="font-medium">MarTechAdda</p>
          </div>
        </CardContent>
      </Card>

      {/* Milestone Breakdown */}
      {quotation?.milestones && (
        <Card>
          <CardHeader>
            <CardTitle>Milestone-wise Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Milestone</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Released</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.milestones.map((milestone: any, index: number) => {
                  const isReleased = engagement.releasedMilestonesCount > index;
                  return (
                    <TableRow key={milestone._id || index}>
                      <TableCell className="font-medium">
                        {index + 1}. {milestone.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {milestone.depositPercentage}%
                      </TableCell>
                      <TableCell className="text-right">
                        {depositService.formatDeposit(milestone.depositAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isReleased ? "default" : "secondary"}>
                          {isReleased ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {isReleased ? (
                          <span className="text-green-600 font-medium">✓ Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Ledger Entries */}
      {ledger && ledger.auditLog && ledger.auditLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ledger Entries (Audit Trail)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ledger.auditLog.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${entry.amount > 0 ? "text-green-600" : "text-orange-600"
                        }`}
                    >
                      {entry.amount > 0 ? "+" : ""}
                      {depositService.formatDeposit(Math.abs(entry.amount))}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {entry.entryType}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!ledger && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Deposit ledger information is not yet available for this engagement.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
