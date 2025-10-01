import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, Users, AlertTriangle, MapPin, Loader2, DollarSign, TrendingUp, Activity, FileText, RotateCcw } from "lucide-react";
import { useUsers, useInitiativeLeadsBySite } from "@/hooks/useUsers";
import { useFinalizedPendingFAEntries, useBatchFAApproval, MonthlyMonitoringEntry } from "@/hooks/useMonthlyMonitoring";
import { useTimelineEntriesProgressMonitoring } from "@/hooks/useTimelineEntriesProgressMonitoring";
import { timelineTrackerAPI, monthlyMonitoringAPI } from "@/lib/api";

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
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [mocRequired, setMocRequired] = useState<string>("");
  const [mocNumber, setMocNumber] = useState("");
  const [capexRequired, setCapexRequired] = useState<string>("");
  const [capexNumber, setCapexNumber] = useState("");
  
  // Stage 9 F&A Approval states
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [faComments, setFaComments] = useState("");
  
  // Stage 6 Timeline Validation states
  const [timelineValidationLoading, setTimelineValidationLoading] = useState(false);
  const [allTimelineEntriesCompleted, setAllTimelineEntriesCompleted] = useState<boolean>(true);
  
  // Stage 9 Monthly Monitoring Validation states
  const [monthlyValidationLoading, setMonthlyValidationLoading] = useState(false);
  const [allMonthlyEntriesFinalized, setAllMonthlyEntriesFinalized] = useState<boolean>(true);
  
  // Hooks for F&A functionality
  const { data: monthlyEntries = [], isLoading: entriesLoading, refetch: refetchEntries } = useFinalizedPendingFAEntries(
    transaction?.stageNumber === 10 ? transaction?.initiativeId : 0
  );
  const batchFAApprovalMutation = useBatchFAApproval();

  // Hook for Stage 7 Timeline Entries Progress Monitoring
  const { data: timelineEntries = [], isLoading: timelineEntriesLoading } = useTimelineEntriesProgressMonitoring(
    transaction?.stageNumber === 7 ? transaction?.initiativeId : 0
  );

  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  
  // Get Initiative Leads specifically for this site using the dedicated hook
  const { data: initiativeLeads = [], isLoading: ilLoading, error: ilError } = useInitiativeLeadsBySite(transaction?.site || '');
  
  console.log('Initiative Leads for site', transaction?.site, ':', initiativeLeads);
  console.log('IL loading:', ilLoading, 'IL Error:', ilError);

  // Reset selection when modal opens or entries change
  useEffect(() => {
    if (isOpen && transaction?.stageNumber === 10) {
      setSelectedEntries(new Set());
      setFaComments("");
    }
  }, [isOpen, transaction?.stageNumber]);

  useEffect(() => {
    if (Array.isArray(monthlyEntries) && monthlyEntries.length > 0) {
      setSelectedEntries(new Set());
    }
  }, [monthlyEntries]);

  // Check if all timeline entries are completed for Stage 6 validation
  useEffect(() => {
    if (isOpen && transaction?.stageNumber === 6 && transaction?.initiativeId) {
      setTimelineValidationLoading(true);
      timelineTrackerAPI.areAllTimelineEntriesCompleted(transaction.initiativeId)
        .then((response) => {
          setAllTimelineEntriesCompleted(response.data);
        })
        .catch((error) => {
          console.error("Error checking timeline entries completion:", error);
          setAllTimelineEntriesCompleted(false);
        })
        .finally(() => {
          setTimelineValidationLoading(false);
        });
    }
  }, [isOpen, transaction?.stageNumber, transaction?.initiativeId]);

  // Check if all monthly monitoring entries are finalized for Stage 9 validation
  useEffect(() => {
    if (isOpen && transaction?.stageNumber === 9 && transaction?.initiativeId) {
      setMonthlyValidationLoading(true);
      monthlyMonitoringAPI.areAllEntriesFinalized(transaction.initiativeId)
        .then((response) => {
          setAllMonthlyEntriesFinalized(response.data);
        })
        .catch((error) => {
          console.error("Error checking monthly monitoring entries finalization:", error);
          setAllMonthlyEntriesFinalized(false);
        })
        .finally(() => {
          setMonthlyValidationLoading(false);
        });
    }
  }, [isOpen, transaction?.stageNumber, transaction?.initiativeId]);

  // Early return if transaction is null
  if (!transaction) {
    return null;
  }

  const handleApprove = async () => {
    setProcessingAction('approved');
    
    // Handle F&A approval for stage 10
    if (transaction.stageNumber === 10) {
      await handleFAApproval();
      return;
    }

    const data: any = {
      transactionId: transaction.id,
      action: 'approved',
      remarks: comment.trim()
    };

    // Add stage-specific data
    if (transaction.stageNumber === 4 && assignedUserId) {
      data.assignedUserId = parseInt(assignedUserId);
    }
    
    if (transaction.stageNumber === 5) {
      // Combined MOC-CAPEX stage (was stage 4)
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
    setProcessingAction('rejected');
    onProcess({
      transactionId: transaction.id,
      action: 'rejected',
      remarks: comment.trim()
    });
  };

  const handleDrop = () => {
    setProcessingAction('dropped');
    onProcess({
      transactionId: transaction.id,
      action: 'dropped',
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
    
    if (transaction.stageNumber === 4 && !assignedUserId) return false;
    if (transaction.stageNumber === 5) {
      // Combined MOC-CAPEX validation (was stage 4)
      if (!mocRequired || !capexRequired) return false;
      if (mocRequired === "yes" && !mocNumber.trim()) return false;
      if (capexRequired === "yes" && !capexNumber.trim()) return false;
    }
    if (transaction.stageNumber === 6) {
      // Stage 6 Timeline Tracker validation - all timeline entries must be completed
      return allTimelineEntriesCompleted;
    }
    if (transaction.stageNumber === 9) {
      // Stage 9 Monthly Monitoring validation - all monthly monitoring entries must be finalized
      return allMonthlyEntriesFinalized;
    }
    if (transaction.stageNumber === 10) {
      // F&A approval - at least one entry should be selected or no entries to approve
      return !Array.isArray(monthlyEntries) || monthlyEntries.length === 0 || selectedEntries.size > 0;
    }
    
    return true;
  };

  const getStageSpecificContent = () => {
    if (!transaction?.stageNumber) return null;
    
    switch (transaction.stageNumber) {
      case 4: // Define Responsibilities - CTSD assigns Initiative Lead (changed from EH to CTSD)
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
                    <SelectItem key={user.id} value={user.id.toString()} className="text-sm focus:bg-accent hover:bg-accent">
                      {user.fullName} - {user.discipline}
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

      case 5: // MOC-CAPEX Evaluation - Initiative Lead decides both MOC and CAPEX in single stage (was stage 4 previously)
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

      case 6: // Initiative Timeline Tracker (was stage 5)
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <p className="text-blue-800 font-semibold text-sm">
                  Timeline Tracker Validation
                </p>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                All timeline entries must be marked as "COMPLETED" before this stage can be approved.
              </p>
            </div>

            {/* Timeline Completion Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Timeline Entries Status</Label>
                {timelineValidationLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
              </div>

              {timelineValidationLoading ? (
                <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm">Checking timeline entries...</span>
                </div>
              ) : (
                <div className={`p-4 rounded-lg border ${
                  allTimelineEntriesCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {allTimelineEntriesCompleted ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          All timeline entries are completed
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          Some timeline entries are not yet completed
                        </span>
                      </>
                    )}
                  </div>
                  {!allTimelineEntriesCompleted && (
                    <p className="text-xs text-red-600 mt-2">
                      Please ensure all timeline activities are marked as "COMPLETED" before approving this stage.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 8: // Periodic Status Review with CMO (was stage 7)
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

      case 7: // Progress monitoring (was stage 6 - "Trial Implementation")
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2.5 mb-3">
                <Activity className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Progress Monitoring - Timeline Review
                </h4>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Review timeline entries and monitor progress of initiative implementation.
              </p>
            </div>

            {/* Timeline Entries Display - ONLY FOR STAGE 7 PROGRESS MONITORING */}
            {transaction?.stageNumber === 7 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Timeline Entries Overview</Label>
                </div>

                {timelineEntriesLoading ? (
                  <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm">Loading timeline entries...</span>
                  </div>
                ) : !Array.isArray(timelineEntries) || timelineEntries.length === 0 ? (
                  <div className="p-6 bg-muted rounded-lg text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No timeline entries found for this initiative</p>
                  </div>
                ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b">
                    <div className="grid grid-cols-10 gap-3 text-xs font-semibold">
                      <div className="col-span-3">Activity Name</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-3">Planned Duration</div>
                      <div className="col-span-2">Responsible Person</div>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {Array.isArray(timelineEntries) && timelineEntries.map((entry: any) => (
                      <div key={entry.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-muted/50">
                        <div className="grid grid-cols-10 gap-3 items-center text-xs">
                          <div className="col-span-3 font-medium">
                            <div 
                              className="truncate cursor-help" 
                              title={entry.stageName}
                              style={{ maxWidth: '100%' }}
                            >
                              {entry.stageName}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Badge 
                              variant="outline"
                              className={`text-xs px-2 py-1 text-center font-medium whitespace-nowrap ${
                                entry.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-300' :
                                entry.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                entry.status === 'DELAYED' ? 'bg-red-100 text-red-800 border-red-300' :
                                'bg-yellow-100 text-yellow-800 border-yellow-300'
                              }`}
                            >
                              {entry.status === 'COMPLETED' ? 'Completed' :
                               entry.status === 'IN_PROGRESS' ? 'In Progress' :
                               entry.status === 'DELAYED' ? 'Delayed' :
                               'Pending'}
                            </Badge>
                          </div>
                          <div className="col-span-3 text-muted-foreground">
                            <div className="text-xs whitespace-nowrap">{new Date(entry.plannedStartDate).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground/80 whitespace-nowrap">to {new Date(entry.plannedEndDate).toLocaleDateString()}</div>
                          </div>
                          <div className="col-span-2">
                            <div 
                              className="text-xs text-muted-foreground truncate cursor-help" 
                              title={entry.responsiblePerson}
                              style={{ maxWidth: '100%' }}
                            >
                              {entry.responsiblePerson}
                            </div>
                          </div>
                        </div>
                        {entry.remarks && (
                          <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                            <strong>Remarks:</strong> 
                            <span className="ml-1 break-words">{entry.remarks}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(timelineEntries) && timelineEntries.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Total {timelineEntries.length} timeline entries found for progress monitoring review
                </div>
              )}
            </div>
            )}
          </div>
        );

      case 9: // Savings Monitoring (1 Month) - NOW IL instead of STLD
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <p className="text-blue-800 font-semibold text-sm">
                  Monthly Monitoring Validation
                </p>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                All monthly monitoring entries must be marked as "FINALIZED" before this stage can be approved.
              </p>
            </div>

            {/* Monthly Monitoring Completion Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Monthly Monitoring Entries Status</Label>
                {monthlyValidationLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
              </div>

              {monthlyValidationLoading ? (
                <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm">Checking monthly monitoring entries...</span>
                </div>
              ) : (
                <div className={`p-4 rounded-lg border ${
                  allMonthlyEntriesFinalized 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {allMonthlyEntriesFinalized ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          All monthly monitoring entries are finalized
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          Some monthly monitoring entries are not yet finalized
                        </span>
                      </>
                    )}
                  </div>
                  {!allMonthlyEntriesFinalized && (
                    <p className="text-xs text-red-600 mt-2">
                      Please ensure all monthly monitoring entries are marked as "FINALIZED" before approving this stage.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 10: // Saving Validation with F&A (was stage 9)
        return (
          <div className="space-y-6">
            {/* <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2.5 mb-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Finance & Accounts Validation
                </h4>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Review and approve finalized monthly monitoring entries below. Select entries to approve and provide validation comments.
              </p>
            </div> */}

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

      case 11: // Initiative Closure - NOW IL instead of STLD (was stage 10)
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
      1: "Initiative has been registered by any user and is ready for HOD approval.",
      2: "Head of Department (HOD) evaluation and approval of the initiative.",
      3: "Site TSD Lead assessment and approval of the initiative.",
      4: "Site Head assigns an Initiative Lead who will be responsible for driving this initiative forward.",
      5: "Initiative Lead evaluates both Management of Change (MOC) and Capital Expenditure (CAPEX) requirements.",
      6: "Initiative Lead prepares detailed timeline for initiative implementation.",
      7: "Site TSD Lead monitors progress of initiative implementation.",
      8: "You can approve to continue or drop to move initiative to next FY.",
      9: "Initiative Lead monitors savings achieved after implementation (monthly monitoring period).",
      10: "Site F&A validates savings and financial accuracy.",
      11: "Initiative Lead performs final closure of the initiative."
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
          {transaction.stageNumber === 11 ? (
            <div className="flex gap-3 pt-3">
              <Button 
                onClick={handleApprove}
                disabled={!comment.trim() || (isLoading && processingAction === 'approved')}
                className="bg-red-600 hover:bg-red-700 flex-1 h-9 text-xs font-medium"
              >
                {(isLoading && processingAction === 'approved') ? (
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
            </div>
          ) : (
            <div className="flex gap-3 pt-3">
              <Button 
                onClick={handleApprove}
                disabled={!isFormValid() || (isLoading && processingAction === 'approved') || batchFAApprovalMutation.isPending}
                className="bg-green-600 hover:bg-green-700 flex-1 h-9 text-xs font-medium"
              >
                {((isLoading && processingAction === 'approved') || batchFAApprovalMutation.isPending) ? (
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
              
              {/* Show reject button for stages 2 and 3 */}
              {(transaction.stageNumber === 2 || transaction.stageNumber === 3) && (
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!comment.trim() || (isLoading && processingAction === 'rejected')}
                  className="flex-1 h-9 text-xs font-medium"
                >
                  {(isLoading && processingAction === 'rejected') ? (
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
              
              {/* Show drop button for stage 8 */}
              {transaction.stageNumber === 8 && (
                <Button 
                  variant="outline"
                  onClick={handleDrop}
                  disabled={!comment.trim() || (isLoading && processingAction === 'dropped')}
                  className="flex-1 h-9 text-xs font-medium border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  {(isLoading && processingAction === 'dropped') ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      Drop (Next FY)
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