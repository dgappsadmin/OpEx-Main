import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, Users, AlertTriangle, MapPin, Loader2, DollarSign, TrendingUp } from "lucide-react";
import { useUsers, useInitiativeLeadsBySite } from "@/hooks/useUsers";
import { useFinalizedPendingFAEntries, useBatchFAApproval, MonthlyMonitoringEntry } from "@/hooks/useMonthlyMonitoring";

interface WorkflowStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  userRole: string;
  onProcess: (data: any) => void;
  isLoading?: boolean;
}

export default function WorkflowStageModal({ 
  isOpen, 
  onClose, 
  transaction, 
  userRole, 
  onProcess,
  isLoading = false 
}: WorkflowStageModalProps) {
  const [comment, setComment] = useState("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [mocRequired, setMocRequired] = useState<string>("");
  const [mocNumber, setMocNumber] = useState("");
  const [capexRequired, setCapexRequired] = useState<string>("");
  const [capexNumber, setCapexNumber] = useState("");
  
  // Stage 9 F&A Approval states
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [faComments, setFaComments] = useState("");
  
  // Hooks for F&A functionality
  const { data: monthlyEntries = [], isLoading: entriesLoading, refetch: refetchEntries } = useFinalizedPendingFAEntries(
    transaction?.stageNumber === 9 ? transaction?.initiativeId : 0
  );
  const batchFAApprovalMutation = useBatchFAApproval();

  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  
  // Get Initiative Leads specifically for this site using the dedicated hook
  const { data: initiativeLeads = [], isLoading: ilLoading, error: ilError } = useInitiativeLeadsBySite(transaction?.site || '');
  
  console.log('Initiative Leads for site', transaction?.site, ':', initiativeLeads);
  console.log('IL loading:', ilLoading, 'IL Error:', ilError);

  // Reset selection when modal opens or entries change
  useEffect(() => {
    if (isOpen && transaction?.stageNumber === 9) {
      setSelectedEntries(new Set());
      setFaComments("");
    }
  }, [isOpen, transaction?.stageNumber]);

  useEffect(() => {
    if (Array.isArray(monthlyEntries) && monthlyEntries.length > 0) {
      setSelectedEntries(new Set());
    }
  }, [monthlyEntries]);

  // Early return if transaction is null
  if (!transaction) {
    return null;
  }

  const handleApprove = async () => {
    // Handle F&A approval for stage 9
    if (transaction.stageNumber === 9) {
      await handleFAApproval();
      return;
    }

    const data: any = {
      transactionId: transaction.id,
      action: 'approved',
      remarks: comment.trim()
    };

    // Add stage-specific data
    if (transaction.stageNumber === 3 && assignedUserId) {
      data.assignedUserId = parseInt(assignedUserId);
    }
    
    if (transaction.stageNumber === 4) {
      // Combined MOC-CAPEX stage
      data.requiresMoc = mocRequired === "yes" ? "Y" : "N";
      if (mocRequired === "yes" && mocNumber) {
        data.mocNumber = mocNumber;
      }
      data.requiresCapex = capexRequired === "yes" ? "Y" : "N";
      if (capexRequired === "yes" && capexNumber) {
        data.capexNumber = capexNumber;
      }
    }

    onProcess(data);
  };

  const handleFAApproval = async () => {
    try {
      // First, approve selected monthly monitoring entries
      if (selectedEntries.size > 0) {
        const entryIds = Array.from(selectedEntries);
        await batchFAApprovalMutation.mutateAsync({
          entryIds,
          faComments: faComments || comment.trim()
        });
      }

      // Then proceed with workflow approval
      const data = {
        transactionId: transaction.id,
        action: 'approved',
        remarks: comment.trim()
      };

      onProcess(data);
    } catch (error) {
      console.error('Error in F&A approval:', error);
      // Handle error appropriately - could show toast or error message
    }
  };

  const handleReject = () => {
    onProcess({
      transactionId: transaction.id,
      action: 'rejected',
      remarks: comment.trim()
    });
  };

  const handleEntrySelection = (entryId: number, checked: boolean) => {
    const newSelected = new Set(selectedEntries);
    if (checked) {
      newSelected.add(entryId);
    } else {
      newSelected.delete(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && Array.isArray(monthlyEntries)) {
      const allIds = new Set<number>();
      monthlyEntries.forEach((entry: MonthlyMonitoringEntry) => {
        if (entry.id) {
          allIds.add(entry.id);
        }
      });
      setSelectedEntries(allIds);
    } else {
      setSelectedEntries(new Set<number>());
    }
  };

  const isFormValid = () => {
    if (!comment.trim()) return false;
    
    if (transaction.stageNumber === 3 && !assignedUserId) return false;
    if (transaction.stageNumber === 4) {
      // Combined MOC-CAPEX validation
      if (!mocRequired || !capexRequired) return false;
      if (mocRequired === "yes" && !mocNumber.trim()) return false;
      if (capexRequired === "yes" && !capexNumber.trim()) return false;
    }
    if (transaction.stageNumber === 9) {
      // F&A approval - at least one entry should be selected or no entries to approve
      return !Array.isArray(monthlyEntries) || monthlyEntries.length === 0 || selectedEntries.size > 0;
    }
    
    return true;
  };

  const getStageSpecificContent = () => {
    if (!transaction?.stageNumber) return null;
    
    switch (transaction.stageNumber) {
      case 3: // Engineering Head assigns Initiative Lead
        return (
          <div className="space-y-4">
            {/* <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2.5 text-sm text-blue-800 mb-1.5">
                <MapPin className="h-4 w-4" />
                <span className="font-semibold">Site: {transaction.site}</span>
              </div>
              <p className="text-xs text-blue-700">
                Select an Initiative Lead from users with IL role for this site
              </p>
            </div>
             */}
            <div>
              <Label htmlFor="assignedUser" className="text-xs font-semibold">Select Initiative Lead *</Label>
              <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                <SelectTrigger className="h-9 text-xs mt-1.5">
                  <SelectValue placeholder={
                    ilLoading ? "Loading Initiative Leads..." : 
                    initiativeLeads.length === 0 ? "No Initiative Leads available for this site" :
                    "Select an Initiative Lead"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {initiativeLeads.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.fullName} - {user.email} ({user.site})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {initiativeLeads.length === 0 && !ilLoading && (
                <p className="text-xs text-red-600 mt-1.5">
                  No Initiative Leads found for site {transaction.site}
                </p>
              )}
            </div>
          </div>
        );

      case 4: // MOC-CAPEX Evaluation - Initiative Lead decides both MOC and CAPEX in single stage
        return (
          <div className="space-y-6">
            {/* MOC Section */}
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Management of Change (MOC) Evaluation</h4>
              <div>
                <Label className="text-xs font-semibold">Is MOC Required? *</Label>
                <RadioGroup value={mocRequired} onValueChange={setMocRequired} className="mt-2">
                  <div className="flex items-center space-x-2.5 p-2.5 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="yes" id="moc-yes" />
                    <Label htmlFor="moc-yes" className="text-xs font-medium">Yes, MOC is required</Label>
                  </div>
                  <div className="flex items-center space-x-2.5 p-2.5 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="no" id="moc-no" />
                    <Label htmlFor="moc-no" className="text-xs font-medium">No, MOC is not required</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {mocRequired === "yes" && (
                <div>
                  <Label htmlFor="mocNumber" className="text-xs font-semibold">MOC Number *</Label>
                  <Input
                    id="mocNumber"
                    value={mocNumber}
                    onChange={(e) => setMocNumber(e.target.value)}
                    placeholder="Enter MOC Number"
                    className="h-9 text-xs mt-1.5"
                  />
                </div>
              )}
            </div>

            {/* CAPEX Section */}
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">Capital Expenditure (CAPEX) Evaluation</h4>
              <div>
                <Label className="text-xs font-semibold">Is CAPEX Required? *</Label>
                <RadioGroup value={capexRequired} onValueChange={setCapexRequired} className="mt-2">
                  <div className="flex items-center space-x-2.5 p-2.5 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="yes" id="capex-yes" />
                    <Label htmlFor="capex-yes" className="text-xs font-medium">Yes, CAPEX is required</Label>
                  </div>
                  <div className="flex items-center space-x-2.5 p-2.5 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="no" id="capex-no" />
                    <Label htmlFor="capex-no" className="text-xs font-medium">No, CAPEX is not required</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {capexRequired === "yes" && (
                <div>
                  <Label htmlFor="capexNumber" className="text-xs font-semibold">CAPEX Number *</Label>
                  <Input
                    id="capexNumber"
                    value={capexNumber}
                    onChange={(e) => setCapexNumber(e.target.value)}
                    placeholder="Enter CAPEX Number"
                    className="h-9 text-xs mt-1.5"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 5: // Initiative Timeline Tracker
      case 6: // Trial Implementation & Performance Check
      case 7: // Periodic Status Review with CMO
      case 8: // Savings Monitoring (1 Month)
        return (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <p className="text-blue-800 font-semibold text-sm">
                Review and provide your decision with comments.
              </p>
            </div>
          </div>
        );

      case 9: // Saving Validation with F&A
        return (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2.5 mb-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Finance & Accounts Validation
                </h4>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Review and approve finalized monthly monitoring entries below. Select entries to approve and provide validation comments.
              </p>
            </div>

            {/* Monthly Monitoring Entries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Finalized Monitoring Entries</Label>
                {Array.isArray(monthlyEntries) && monthlyEntries.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedEntries.size === monthlyEntries.length && monthlyEntries.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                    <Label className="text-xs">Select All</Label>
                  </div>
                )}
              </div>

              {entriesLoading ? (
                <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-sm">Loading monitoring entries...</span>
                </div>
              ) : !Array.isArray(monthlyEntries) || monthlyEntries.length === 0 ? (
                <div className="p-6 bg-muted rounded-lg text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No finalized entries pending F&A approval</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b">
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold">
                      <div className="col-span-1">Select</div>
                      <div className="col-span-3">Monitoring Month</div>
                      <div className="col-span-4">KPI Description</div>
                      <div className="col-span-2">Target Value</div>
                      <div className="col-span-2">Achieved Value</div>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {Array.isArray(monthlyEntries) && monthlyEntries.map((entry: MonthlyMonitoringEntry) => (
                      <div key={entry.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-muted/50">
                        <div className="grid grid-cols-12 gap-2 items-center text-xs">
                          <div className="col-span-1">
                            <Checkbox
                              checked={entry.id ? selectedEntries.has(entry.id) : false}
                              onCheckedChange={(checked) => entry.id && handleEntrySelection(entry.id, !!checked)}
                            />
                          </div>
                          <div className="col-span-3 font-medium">{entry.monitoringMonth}</div>
                          <div className="col-span-4 text-muted-foreground">{entry.kpiDescription}</div>
                          <div className="col-span-2 font-mono">{entry.targetValue?.toLocaleString()}</div>
                          <div className="col-span-2 font-mono">{entry.achievedValue?.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(monthlyEntries) && monthlyEntries.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {selectedEntries.size} of {monthlyEntries.length} entries selected for approval
                </div>
              )}
            </div>

            {/* F&A Comments */}
            {Array.isArray(monthlyEntries) && monthlyEntries.length > 0 && (
              <div>
                <Label htmlFor="faComments" className="text-xs font-semibold">
                  F&A Validation Comments (Optional)
                </Label>
                <Textarea
                  id="faComments"
                  value={faComments}
                  onChange={(e) => setFaComments(e.target.value)}
                  placeholder="Provide specific validation comments for selected entries..."
                  className="min-h-[60px] mt-2 text-xs"
                />
              </div>
            )}
          </div>
        );

      case 10: // Initiative Closure
        return (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-semibold text-sm">
                Final closure of initiative - This will move the initiative to the Closure Module.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStageDescription = () => {
    const descriptions: { [key: number]: string } = {
      1: "Initiative has been registered and is ready for approval.",
      2: "Review the initiative details and provide your approval decision.",
      3: "Assign an Initiative Lead who will be responsible for driving this initiative forward.",
      4: "Evaluate both Management of Change (MOC) and Capital Expenditure (CAPEX) requirements.",
      5: "Prepare detailed timeline for initiative implementation.",
      6: "Conduct trial implementation and performance checks.",
      7: "Periodic status review with Chief Marketing Officer.",
      8: "Monitor savings achieved after implementation (1 month monitoring period).",
      9: "Validate savings with Finance & Accounts department.",
      10: "Final closure of the initiative and documentation completion."
    };
    return descriptions[transaction.stageNumber] || "Process this workflow stage.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md">
              {transaction.stageNumber}
            </div>
            {transaction.stageName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stage Information - Compact */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-3">{getStageDescription()}</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* <div>
                <span className="font-semibold">Required Role:</span>
                <span className="ml-2">{transaction.requiredRole}</span>
              </div> */}
              <div>
                <span className="font-semibold">Site:</span>
                <span className="ml-2">{transaction.site}</span>
              </div>
            </div>
          </div>

          {/* Stage-specific content */}
          {getStageSpecificContent()}

          {/* Comment section - Compact */}
          <div>
            <Label htmlFor="comment" className="text-red-600 text-xs font-semibold">
              Comments (Required) *
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Please provide your comments for this stage..."
              className="min-h-[80px] mt-2 text-xs"
              required
            />
          </div>

          {/* Action buttons - Compact */}
          {transaction.stageNumber === 10 ? (
            <div className="flex gap-3 pt-3">
              <Button 
                onClick={handleApprove}
                disabled={!comment.trim() || isLoading}
                className="bg-red-600 hover:bg-red-700 flex-1 h-9 text-xs font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Close Initiative
                  </>
                )}
              </Button>
              {/* Only show reject button for stages 2 and 3 */}
              {(transaction.stageNumber === 2 || transaction.stageNumber === 3) && (
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!comment.trim() || isLoading}
                  className="flex-1 h-9 text-xs font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reject
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-3 pt-3">
              <Button 
                onClick={handleApprove}
                disabled={!isFormValid() || isLoading || batchFAApprovalMutation.isPending}
                className="bg-green-600 hover:bg-green-700 flex-1 h-9 text-xs font-medium"
              >
                {(isLoading || batchFAApprovalMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Approve & Continue
                  </>
                )}
              </Button>
              {/* Only show reject button for stages 2 and 3 */}
              {(transaction.stageNumber === 2 || transaction.stageNumber === 3) && (
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!comment.trim() || isLoading}
                  className="flex-1 h-9 text-xs font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reject
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}