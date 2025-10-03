import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  Edit, 
  Save, 
  X, 
  Calendar, 
  MapPin, 
  Target, 
  DollarSign, 
  FileText, 
  Clock,
  User,
  CheckCircle2,
  Files,
  FolderOpen,
  CheckCircle,
  XCircle,
  Workflow,
  AlertTriangle,
  Loader2,
  Users,
  Activity,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { useProgressPercentage, useCurrentPendingStage, useProcessStageAction, useWorkflowTransactions } from '@/hooks/useWorkflowTransactions';
import { useUser, useInitiativeLeadsBySite, useUsers } from '@/hooks/useUsers';
import { useFinalizedPendingFAEntries, useBatchFAApproval, MonthlyMonitoringEntry } from '@/hooks/useMonthlyMonitoring';
import { useTimelineEntriesProgressMonitoring } from '@/hooks/useTimelineEntriesProgressMonitoring';
import UploadedDocuments from '@/components/UploadedDocuments';
import { initiativeAPI, timelineTrackerAPI, monthlyMonitoringAPI } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Initiative {
  id: string | number;
  title: string;
  initiativeNumber?: string;
  site: string;
  status: string;
  priority: string;
  expectedSavings: string | number;
  actualSavings?: string | number;
  progressPercentage?: number;
  progress: number;
  lastUpdated: string;
  updatedAt?: string;
  discipline: string;
  submittedDate: string;
  createdAt?: string;
  description?: string;
  budgetType?: string; // BUDGETED or NON-BUDGETED
  startDate?: string;
  endDate?: string;
  currentStage?: number;
  requiresMoc?: boolean | string; // Legacy field (boolean) for backward compatibility
  requiresCapex?: boolean | string; // Legacy field (boolean) for backward compatibility
  mocNumber?: string; // New field - MOC Number from OPEX_INITIATIVES table
  capexNumber?: string; // New field - CAPEX Number from OPEX_INITIATIVES table
  // Missing fields from database schema
  assumption1?: string; // CLOB - ASSUMPTION_1
  assumption2?: string; // CLOB - ASSUMPTION_2  
  assumption3?: string; // CLOB - ASSUMPTION_3
  baselineData?: string; // CLOB - BASELINE_DATA
  targetOutcome?: string; // VARCHAR2(255) - TARGET_OUTCOME
  targetValue?: number; // NUMBER(15,2) - TARGET_VALUE
  confidenceLevel?: number; // NUMBER(3) - CONFIDENCE_LEVEL (percentage)
  estimatedCapex?: number; // NUMBER(15,2) - ESTIMATED_CAPEX
  createdByName?: string;
  createdByEmail?: string;
  createdBy?: number | string; // User ID who created the initiative
  initiatorName?: string; // Name of the person who initiated the initiative
  initiator?: string; // Fallback initiator name from mock data
}

interface InitiativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiative: Initiative | null;
  mode: 'view' | 'edit';
  onSave?: (data: any) => void;
  user?: { role?: string; site?: string; [key: string]: any }; // Add site prop
}

// Correct workflow stage names matching backend (11 stages total)
const WORKFLOW_STAGE_NAMES: { [key: number]: string } = {
  1: 'Register Initiative',
  2: 'Evaluation and Approval',
  3: 'Initiative assessment and approval',
  4: 'Define Responsibilities',
  5: 'MOC-CAPEX Evaluation',
  6: 'Initiative Timeline Tracker',
  7: 'Progress monitoring',
  8: 'Periodic Status Review with CMO',
  9: 'Savings Monitoring (Monthly)',
  10: 'F&A validation',
  11: 'Initiative Closure'
};

export default function InitiativeModal({ isOpen, onClose, initiative, mode, onSave, user }: InitiativeModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<any>(initiative || {});
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  
  // Workflow approval states
  const [workflowComment, setWorkflowComment] = useState("");
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  
  // Additional workflow states for stage-specific functionality
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

  // Check if user can edit this initiative (role + site restrictions + status check)
  const isCompleted = initiative?.status?.toLowerCase() === 'completed';
  const canEdit = user?.role !== 'VIEWER' && user?.site === initiative?.site && !isCompleted;
  
  // Check if user can approve workflows (non-viewers and workflow roles)
  const canApproveWorkflow = user?.role !== 'VIEWER' && user?.role !== undefined;
  
  // Helper function to check if user can act on the pending transaction (matching WorkflowStageModal logic)
  const canUserActOnPendingTransaction = (transaction: any) => {
    if (!user || !transaction || transaction.approveStatus !== 'pending') return false;
    
    // Primary check: user email matches pendingWith field
    if (transaction.pendingWith && user.email) {
      return transaction.pendingWith === user.email;
    }
    
    // Fallback check: role-based validation for backward compatibility
    if (user.role === 'HOD' && transaction.stageNumber === 2) return true;
    if (user.role === 'STLD' && (transaction.stageNumber === 3 || transaction.stageNumber === 7)) return true;
    if (user.role === 'SH' && transaction.stageNumber === 4) return true;
    if (user.role === 'CTSD' && transaction.stageNumber === 8) return true;
    if (user.role === 'IL' && [5, 6, 9, 11].includes(transaction.stageNumber)) return true;
    if (user.role === 'F&A' && transaction.stageNumber === 10) return true;
    
    return false;
  };

  // Update isEditing state when mode prop changes
  useEffect(() => {
    // Only allow editing if user has proper role and site access
    if (!canEdit) {
      setIsEditing(false);
    } else {
      setIsEditing(mode === 'edit');
    }
  }, [mode, user, canEdit]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Only allow editing if user has proper role and site access
      if (!canEdit) {
        setIsEditing(false);
      } else {
        setIsEditing(mode === 'edit');
      }
      setActiveTab('overview');
      setWorkflowComment("");
      setAssignedUserId("");
      // Reset additional workflow states
      setMocRequired("");
      setMocNumber("");
      setCapexRequired("");
      setCapexNumber("");
      setSelectedEntries(new Set());
      setFaComments("");
    }
  }, [isOpen, mode, user, canEdit]);

  // Update formData when initiative changes
  useEffect(() => {
    if (initiative) {
      setFormData(initiative);
    }
  }, [initiative]);

  // Get real progress and current stage data
  const { data: progressData } = useProgressPercentage(Number(initiative?.id));
  const { data: currentStageData } = useCurrentPendingStage(Number(initiative?.id));
  
  // Get workflow transactions for current initiative
  const { data: workflowTransactions = [], refetch: refetchTransactions } = useWorkflowTransactions(Number(initiative?.id) || 0);
  
  // Workflow processing action
  const processStageAction = useProcessStageAction();

  // Fetch user data for "Created By" information
  // Basic implementation: only check for createdBy user ID
  const { data: createdByUser } = useUser(initiative?.createdBy);

  // Get Initiative Leads for stage 4 (Site Head assigns Initiative Lead)
  const { data: initiativeLeads = [], isLoading: ilLoading, error: ilError } = useInitiativeLeadsBySite(initiative?.site || '');
  
  // Additional hooks for stage-specific functionality
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();

  // Calculate Progress Percentage - being at stage X means X/11 * 100% progress
  const progressPercentage = Math.round((initiative?.currentStage || 1) * 100 / 11);

  const actualProgress = progressData?.progressPercentage ?? progressPercentage;
  const currentStageName = currentStageData?.stageName || 
    WORKFLOW_STAGE_NAMES[initiative?.currentStage || 1] || 
    'Register Initiative';
    
  // Get pending transaction for workflow approval - match the same logic as WorkflowStageModal
  let pendingTransaction = null;
  
  // First priority: Find transaction with approveStatus 'pending' that matches user email
  if (user?.email) {
    pendingTransaction = workflowTransactions.find((t: any) => 
      t.approveStatus === 'pending' && t.pendingWith === user.email
    );
  }
  
  // Second priority: Find pending transaction by role (for backward compatibility)
  if (!pendingTransaction && workflowTransactions.length > 0) {
    // Role-specific stage mapping based on workflow definition
    if (user?.role === 'HOD') {
      // HOD approves stage 2 (Evaluation and Approval)
      pendingTransaction = workflowTransactions.find((t: any) => 
        t.stageNumber === 2 && t.approveStatus === 'pending'
      );
    }
    else if (user?.role === 'STLD') {
      // STLD can approve stage 3 (Initiative assessment) or stage 7 (Progress monitoring)
      pendingTransaction = workflowTransactions.find((t: any) => 
        (t.stageNumber === 3 || t.stageNumber === 7) && t.approveStatus === 'pending'
      );
    }
    else if (user?.role === 'SH') {
      // Site Head approves stage 4 (Define Responsibilities)
      pendingTransaction = workflowTransactions.find((t: any) => 
        t.stageNumber === 4 && t.approveStatus === 'pending'
      );
    }
    else if (user?.role === 'CTSD') {
      // Corporate TSD approves stage 8 (Periodic Status Review with CMO)
      pendingTransaction = workflowTransactions.find((t: any) => 
        t.stageNumber === 8 && t.approveStatus === 'pending'
      );
    }
    else if (user?.role === 'IL') {
      // Initiative Lead can approve stages 5, 6, 9, 11 (dynamic assignment)
      pendingTransaction = workflowTransactions.find((t: any) => 
        (t.stageNumber === 5 || t.stageNumber === 6 || t.stageNumber === 9 || t.stageNumber === 11) && 
        t.approveStatus === 'pending'
      );
    }
    else if (user?.role === 'F&A') {
      // Finance & Accounts approves stage 10 (F&A validation)
      pendingTransaction = workflowTransactions.find((t: any) => 
        t.stageNumber === 10 && t.approveStatus === 'pending'
      );
    }
    // For other roles, find any pending transaction
    else {
      pendingTransaction = workflowTransactions.find((t: any) => t.approveStatus === 'pending');
    }
  }
  
  // Hooks for F&A functionality (Stage 10) - now pendingTransaction is available
  const { data: monthlyEntries = [], isLoading: entriesLoading, refetch: refetchEntries } = useFinalizedPendingFAEntries(
    (pendingTransaction?.stageNumber === 10 && user?.role === 'F&A') ? Number(initiative?.id) : 0
  );
  const batchFAApprovalMutation = useBatchFAApproval();

  // Hook for Stage 7 Timeline Entries Progress Monitoring - now pendingTransaction is available
  const { data: timelineEntries = [], isLoading: timelineEntriesLoading } = useTimelineEntriesProgressMonitoring(
    (pendingTransaction?.stageNumber === 7 && user?.role === 'STLD') ? Number(initiative?.id) : 0
  );

  // Reset F&A selection when modal opens or entries change
  useEffect(() => {
    if (isOpen && pendingTransaction?.stageNumber === 10) {
      setSelectedEntries(new Set());
      setFaComments("");
    }
  }, [isOpen, pendingTransaction?.stageNumber]);

  useEffect(() => {
    if (Array.isArray(monthlyEntries) && monthlyEntries.length > 0) {
      setSelectedEntries(new Set());
    }
  }, [monthlyEntries]);

  // Check if all timeline entries are completed for Stage 6 validation
  useEffect(() => {
    if (isOpen && pendingTransaction?.stageNumber === 6 && initiative?.id) {
      setTimelineValidationLoading(true);
      timelineTrackerAPI.areAllTimelineEntriesCompleted(Number(initiative.id))
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
  }, [isOpen, pendingTransaction?.stageNumber, initiative?.id]);

  // Check if all monthly monitoring entries are finalized for Stage 9 validation
  useEffect(() => {
    if (isOpen && pendingTransaction?.stageNumber === 9 && initiative?.id) {
      setMonthlyValidationLoading(true);
      monthlyMonitoringAPI.areAllEntriesFinalized(Number(initiative.id))
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
  }, [isOpen, pendingTransaction?.stageNumber, initiative?.id]);
  
  // Show workflow tab if user can view it (for debugging/visibility) or has pending actions
  const canShowWorkflowActions = user?.role !== 'VIEWER' && user?.site === initiative?.site;
  const hasWorkflowActions = pendingTransaction && canUserActOnPendingTransaction(pendingTransaction);
  
  // Debug logging
  console.log('Debug Workflow Approval Enhanced:', {
    canApproveWorkflow,
    pendingTransaction,
    workflowTransactions: workflowTransactions.map(t => ({
      id: t.id,
      stageNumber: t.stageNumber,
      stageName: t.stageName,
      status: t.status,
      requiredRole: t.requiredRole,
      processedDate: t.processedDate
    })),
    userSite: user?.site,
    initiativeSite: initiative?.site,
    canShowWorkflowActions,
    userRole: user?.role,
    initiativeId: initiative?.id
  });

  // Get the creator name - priority: initiatorName (new field), then initiator (mock data), then createdByName, then fetched user data, then fallback
  const creatorName = initiative?.initiatorName || 
                      initiative?.initiator || 
                      initiative?.createdByName || 
                      createdByUser?.fullName || 
                      createdByUser?.name || 
                      'Unknown User';
  const creatorEmail = initiative?.createdByEmail || createdByUser?.email;

  // Debug logging to help identify the issue
  console.log('Modal Debug:', { 
    mode, 
    isEditing, 
    initiativeId: initiative?.id,
    modalTitle: isEditing ? 'Edit Initiative' : 'Initiative Details',
    mocCapexData: {
      requiresMoc: initiative?.requiresMoc,
      mocNumber: initiative?.mocNumber,
      requiresCapex: initiative?.requiresCapex,
      capexNumber: initiative?.capexNumber
    },
    initiativeData: {
      initiatorName: initiative?.initiatorName,
      createdByName: initiative?.createdByName,
      createdBy: initiative?.createdBy,
      fetchedUser: createdByUser
    }
  });

  const handleSave = async () => {
    if (!initiative?.id) return;
    
    // Additional safety check: prevent saving if user doesn't have edit permissions
    if (!canEdit) {
      console.warn('Save blocked: User does not have edit permissions for this initiative');
      alert('You do not have permission to edit initiatives from this site.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Convert form data to API format
      const updateData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        expectedSavings: typeof formData.expectedSavings === 'string' 
          ? parseFloat(formData.expectedSavings.replace(/[₹,]/g, '')) 
          : formData.expectedSavings,
        actualSavings: typeof formData.actualSavings === 'string' 
          ? parseFloat(formData.actualSavings.replace(/[₹,]/g, '')) 
          : formData.actualSavings,
        site: formData.site,
        discipline: formData.discipline,
        budgetType: formData.budgetType || 'NON-BUDGETED',
        startDate: formData.startDate,
        endDate: formData.endDate,
        requiresMoc: formData.requiresMoc || 'N',
        requiresCapex: formData.requiresCapex || 'N',
        mocNumber: formData.mocNumber || '',
        capexNumber: formData.capexNumber || '',
        initiatorName: formData.initiatorName || formData.initiator,
        // New fields for target & financial information
        targetOutcome: formData.targetOutcome || '',
        targetValue: formData.targetValue || 0,
        confidenceLevel: formData.confidenceLevel || 0,
        estimatedCapex: formData.estimatedCapex || 0,
        // New fields for assumptions & baseline data
        baselineData: formData.baselineData || '',
        assumption1: formData.assumption1 || '',
        assumption2: formData.assumption2 || '',
        assumption3: formData.assumption3 || ''
      };

      console.log('Updating initiative with data:', updateData);
      
      // Call API to update initiative
      await initiativeAPI.update(Number(initiative.id), updateData);
      
      // Invalidate and refetch initiatives data instead of full page reload
      await queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      if (onSave) {
        onSave(formData);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating initiative:', error);
      alert('Failed to update initiative. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(initiative || {});
    setIsEditing(false);
  };

  // Helper functions for F&A approval
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

  // F&A approval handler for stage 10
  const handleFAApproval = async () => {
    try {
      // First, approve selected monthly monitoring entries
      if (selectedEntries.size > 0) {
        const entryIds = Array.from(selectedEntries);
        await batchFAApprovalMutation.mutateAsync({
          entryIds,
          faComments: faComments || workflowComment.trim()
        });
      }

      // Then proceed with workflow approval
      const data = {
        transactionId: pendingTransaction.id,
        action: 'approved',
        remarks: workflowComment.trim()
      };

      await processStageAction.mutateAsync(data);
      
      toast({ 
        title: "F&A validation completed successfully", 
        description: "The workflow has been updated." 
      });
      
      setWorkflowComment("");
      setSelectedEntries(new Set());
      setFaComments("");
      refetchTransactions();
      
      // Auto-close modal after successful approval
      onClose();
    } catch (error: any) {
      toast({ 
        title: "Error in F&A approval", 
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive" 
      });
    }
  };

  // Check if workflow form is valid for approval
  const isWorkflowFormValid = () => {
    if (!workflowComment.trim()) return false;
    
    if (pendingTransaction?.stageNumber === 4 && !assignedUserId) return false;
    if (pendingTransaction?.stageNumber === 5) {
      // Combined MOC-CAPEX validation
      if (!mocRequired || !capexRequired) return false;
      if (mocRequired === "yes" && !mocNumber.trim()) return false;
      if (capexRequired === "yes" && !capexNumber.trim()) return false;
    }
    if (pendingTransaction?.stageNumber === 6) {
      // Stage 6 Timeline Tracker validation - all timeline entries must be completed
      return allTimelineEntriesCompleted;
    }
    if (pendingTransaction?.stageNumber === 9) {
      // Stage 9 Monthly Monitoring validation - all monthly monitoring entries must be finalized
      return allMonthlyEntriesFinalized;
    }
    if (pendingTransaction?.stageNumber === 10) {
      // F&A approval - at least one entry should be selected or no entries to approve
      return !Array.isArray(monthlyEntries) || monthlyEntries.length === 0 || selectedEntries.size > 0;
    }
    if (pendingTransaction?.stageNumber === 11) {
      // Stage 11 Initiative Closure - only comment required
      return true;
    }
    
    return true;
  };

  // Workflow approval handlers
  const handleWorkflowApprove = async () => {
    if (!pendingTransaction || !workflowComment.trim()) {
      toast({ 
        title: "Cannot process approval", 
        description: "Missing transaction ID or comments.",
        variant: "destructive" 
      });
      return;
    }
    
    setProcessingAction('approved');
    
    try {
      // Handle F&A approval for stage 10
      if (pendingTransaction.stageNumber === 10) {
        await handleFAApproval();
        return;
      }

      const data: any = {
        transactionId: pendingTransaction.id,
        action: 'approved',
        remarks: workflowComment.trim()
      };

      // Add stage-specific data
      if (pendingTransaction.stageNumber === 4 && assignedUserId) {
        data.assignedUserId = parseInt(assignedUserId);
      }
      
      if (pendingTransaction.stageNumber === 5) {
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

      await processStageAction.mutateAsync(data);
      
      toast({ 
        title: "Stage approved successfully", 
        description: "The workflow has been updated." 
      });
      
      setWorkflowComment("");
      setAssignedUserId("");
      setMocRequired("");
      setMocNumber("");
      setCapexRequired("");
      setCapexNumber("");
      refetchTransactions();
      
      // Auto-close modal after successful approval
      onClose();
    } catch (error: any) {
      toast({ 
        title: "Error processing stage", 
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive" 
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleWorkflowReject = async () => {
    if (!pendingTransaction || !workflowComment.trim()) {
      toast({ 
        title: "Cannot process rejection", 
        description: "Missing transaction ID or comments.",
        variant: "destructive" 
      });
      return;
    }
    
    setProcessingAction('rejected');
    
    try {
      const data = {
        transactionId: pendingTransaction.id,
        action: 'rejected',
        remarks: workflowComment.trim()
      };

      await processStageAction.mutateAsync(data);
      
      toast({ 
        title: "Stage rejected", 
        description: "The workflow has been updated." 
      });
      
      setWorkflowComment("");
      setAssignedUserId("");
      refetchTransactions();
      
      // Auto-close modal after successful rejection
      onClose();
    } catch (error: any) {
      toast({ 
        title: "Error processing stage", 
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive" 
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleWorkflowDrop = async () => {
    if (!pendingTransaction || !workflowComment.trim()) {
      toast({ 
        title: "Cannot process drop", 
        description: "Missing transaction ID or comments.",
        variant: "destructive" 
      });
      return;
    }
    
    setProcessingAction('dropped');
    
    try {
      const data = {
        transactionId: pendingTransaction.id,
        action: 'dropped',
        remarks: workflowComment.trim()
      };

      await processStageAction.mutateAsync(data);
      
      toast({ 
        title: "Initiative dropped to next FY", 
        description: "The workflow has been updated." 
      });
      
      setWorkflowComment("");
      refetchTransactions();
      
      // Auto-close modal after successful drop
      onClose();
    } catch (error: any) {
      toast({ 
        title: "Error processing drop", 
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive" 
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-success text-success-foreground";
      case "in progress": return "bg-primary text-primary-foreground";
      case "under review": return "bg-warning text-warning-foreground";
      case "pending decision": return "bg-warning text-warning-foreground";
      case "registered": return "bg-muted text-muted-foreground";
      case "implementation": return "bg-primary text-primary-foreground";
      case "moc review": return "bg-warning text-warning-foreground";
      case "cmo review": return "bg-primary text-primary-foreground";
      case "decision pending": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-destructive text-destructive-foreground";
      case "Medium": return "bg-warning text-warning-foreground";
      case "Low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Get stage description matching WorkflowStageModal.tsx
  const getStageDescription = (stageNumber: number) => {
    const descriptions: { [key: number]: string } = {
      1: "Initiative has been registered by any user and is ready for HOD approval.",
      2: "Head of Department (HOD) evaluation and approval of the initiative.",
      3: "Site TSD Lead assessment and approval of the initiative.",
      4: "Site Head assigns an Initiative Lead who will be responsible for driving this initiative forward.",
      5: "Initiative Lead evaluates both Management of Change (MOC) and Capital Expenditure (CAPEX) requirements.",
      6: "Initiative Lead prepares detailed timeline for initiative implementation.",
      7: "Site TSD Lead monitors progress of initiative implementation.",
      8: "Corporate TSD reviews initiative status - you can approve to continue or drop to move initiative to next FY.",
      9: "Initiative Lead monitors savings achieved after implementation (monthly monitoring period).",
      10: "Site F&A validates savings and financial accuracy.",
      11: "Initiative Lead performs final closure of the initiative."
    };
    return descriptions[stageNumber] || "Process this workflow stage.";
  };

  // Get stage-specific content for workflow approval
  const getStageSpecificWorkflowContent = () => {
    if (!pendingTransaction?.stageNumber) {
      return (
        <div className="p-4 bg-muted rounded-lg text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No pending approval found for you on this initiative</p>
          <p className="text-xs text-muted-foreground mt-1">
            The initiative may have already been processed or you may not have permission to approve the current stage.
          </p>
        </div>
      );
    }
    
    switch (pendingTransaction.stageNumber) {
      case 4: // Define Responsibilities - Site Head assigns Initiative Lead
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2.5 text-sm text-blue-800 mb-1.5">
                <MapPin className="h-4 w-4" />
                <span className="font-semibold">Site: {initiative?.site}</span>
              </div>
              <p className="text-xs text-blue-700">
                Select an Initiative Lead from users with IL role for this site
              </p>
            </div>
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
                  No Initiative Leads found for site {initiative?.site}
                </p>
              )}
            </div>
          </div>
        );

      case 5: // MOC-CAPEX Evaluation
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

      case 6: // Initiative Timeline Tracker - validates timeline completion
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

      case 7: // Progress monitoring - Show timeline entries
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

            {/* Timeline Entries Display */}
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
        </div>
        );

      case 8: // Periodic Status Review with CMO
        return (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <p className="text-blue-800 font-semibold text-sm">
                Periodic Status Review with CMO
              </p>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              You can approve to continue or drop to move initiative to next FY.
            </p>
          </div>
        );

      case 9: // Savings Monitoring (Monthly)
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

      case 10: // F&A Validation with entries
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
                      <div className="col-span-4">Saving Description</div>
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

      case 11: // Initiative Closure
        return (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-semibold text-sm">
                Initiative Closure
              </p>
            </div>
            <p className="text-xs text-red-700 mt-2">
              Final closure of initiative - This will move the initiative to the Closure Module.
            </p>
          </div>
        );

      default:
        // For other stages, show generic message
        return (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <p className="text-blue-800 font-semibold text-sm">
                {WORKFLOW_STAGE_NAMES[pendingTransaction?.stageNumber] || pendingTransaction?.stageName}
              </p>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Review and provide your decision with appropriate comments.
            </p>
          </div>
        );
    }
  };

  if (!initiative) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen max-h-screen p-0 w-screen h-screen border-none shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5 flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {isEditing ? <Edit className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {isEditing ? 'Edit Initiative' : 'Initiative Details'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {initiative?.initiativeNumber || `ID: ${initiative?.id}`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`px-3 py-1 rounded text-sm font-medium ${
                    !canEdit
                      ? isCompleted
                        ? 'bg-green-100 text-green-800'
                        : user?.role === 'VIEWER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                      : isEditing 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {!canEdit 
                      ? isCompleted
                        ? 'Completed'
                        : user?.role === 'VIEWER' 
                        ? 'Read-Only Mode' 
                        : user?.site !== initiative?.site 
                          ? `Site Restricted (${initiative?.site} only)` 
                          : 'Read-Only Mode'
                      : (isEditing ? 'Edit Mode' : 'View Mode')
                    }
                  </div>
                  {hasWorkflowActions && (
                    <div className="px-3 py-1 rounded text-sm font-medium bg-green-100 text-green-800 flex items-center gap-1">
                      <Workflow className="h-3 w-3" />
                      Approval Available
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing && mode !== 'edit' && canEdit && (
                <Button variant="outline" size="default" onClick={() => setIsEditing(true)} className="min-w-[90px] h-10 px-4">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" size="default" onClick={handleCancel} className="min-w-[100px] h-10 px-4" disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="default" onClick={handleSave} className="min-w-[120px] h-10 px-4" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className={`grid w-full h-12 flex-shrink-0 mt-6 gap-1 ${(canShowWorkflowActions || hasWorkflowActions) ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="overview" className="flex items-center gap-2 text-sm py-2 px-3">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2 text-sm py-2 px-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger value="references" className="flex items-center gap-2 text-sm py-2 px-3">
                <Files className="h-4 w-4" />
                <span className="hidden sm:inline">References</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2 text-sm py-2 px-3">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              {(canShowWorkflowActions || hasWorkflowActions) && (
                <TabsTrigger value="workflow" className="flex items-center gap-2 text-sm py-2 px-3">
                  <Workflow className="h-4 w-4" />
                  <span className="hidden sm:inline">Approval</span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-6 pb-6">
                  <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Target className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge className={`${getStatusColor(initiative?.status || '')} text-xs mt-0.5`}>
                              {initiative?.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-green-100 rounded-lg">
                            <DollarSign className="h-3 w-3 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Expected</p>
                            <p className="font-semibold text-green-600 text-sm">
                              {typeof initiative?.expectedSavings === 'number' 
                                ? `₹${initiative.expectedSavings.toLocaleString()}` 
                                : initiative?.expectedSavings}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-orange-100 rounded-lg">
                            <DollarSign className="h-3 w-3 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className="font-semibold text-orange-600 text-sm">
                              {typeof initiative?.actualSavings === 'number' 
                                ? `₹${initiative.actualSavings.toLocaleString()}` 
                                : initiative?.actualSavings || '₹0'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Clock className="h-3 w-3 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Progress</p>
                            <p className="font-semibold text-blue-600 text-sm">{actualProgress}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card> */}

                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <MapPin className="h-3 w-3 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Site</p>
                            <p className="font-semibold text-sm">{initiative?.site}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-cyan-500">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-cyan-100 rounded-lg">
                            <FileText className="h-3 w-3 text-cyan-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Budget Type</p>
                            <Badge 
                              variant={initiative?.budgetType === 'BUDGETED' ? 'default' : 'secondary'}
                              className="text-xs mt-0.5"
                            >
                              {initiative?.budgetType || 'NON-BUDGETED'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Progress and Stage Information */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Target className="h-4 w-4" />
                          Progress Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">Completion Status</span>
                            <span className="font-semibold">{actualProgress}%</span>
                          </div>
                          <Progress value={actualProgress} className="h-2" />
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Current Stage</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Stage {initiative?.currentStage || 1}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{currentStageName}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Calendar className="h-4 w-4" />
                          Timeline Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Submitted</p>
                            <p className="font-medium text-sm">{initiative?.submittedDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Last Updated</p>
                            <p className="font-medium text-sm">{initiative?.lastUpdated}</p>
                          </div>
                        </div>
                        <Separator />

                      </CardContent>
                    </Card>
                  </div>

                  {/* Initiative Summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        Initiative Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-sm leading-tight">{initiative?.title}</p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {initiative?.discipline}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {initiative?.site}
                            </Badge>
                          </div>
                        </div>
                        {initiative?.description && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs font-medium mb-1">Description</p>
                              <div className="max-h-24 overflow-y-auto">
                                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                  {initiative.description}
                                </p>
                              </div>
                            </div>
                            
                            {/* Additional Key Information */}
                            {(initiative?.targetOutcome || initiative?.estimatedCapex) && (
                              <>
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {initiative?.targetOutcome && (
                                    <div>
                                      <p className="text-xs font-medium">Target Outcome</p>
                                      <p className="text-xs text-muted-foreground">{initiative.targetOutcome}</p>
                                    </div>
                                  )}
                                  {/* Commented out Confidence Level display as requested
                                  {initiative?.confidenceLevel && (
                                    <div>
                                      <p className="text-xs font-medium">Confidence Level</p>
                                      <Badge variant="outline" className="text-xs">
                                        {initiative.confidenceLevel}%
                                      </Badge>
                                    </div>
                                  )}
                                  */}
                                  {initiative?.estimatedCapex && (
                                    <div>
                                      <p className="text-xs font-medium">Estimated CAPEX</p>
                                      <p className="text-xs text-green-600 font-medium">
                                        ₹{typeof initiative.estimatedCapex === 'number' 
                                          ? initiative.estimatedCapex.toLocaleString()
                                          : initiative.estimatedCapex}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="details" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="initiativeNumber" className="text-sm font-medium">
                            Initiative Number
                          </Label>
                          <Input
                            id="initiativeNumber"
                            value={formData.initiativeNumber || ''}
                            disabled={true} // Always non-editable as requested
                            className="mt-1 bg-muted h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="title" className="text-sm font-medium">
                            Title *
                          </Label>
                          <Input
                            id="title"
                            value={formData.title || ''}
                            disabled={!isEditing || !canEdit}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="site" className="text-sm font-medium">
                            Site *
                          </Label>
                          {isEditing && canEdit ? (
                            <Select value={formData.site} onValueChange={(value) => setFormData({ ...formData, site: value })}>
                              <SelectTrigger className="mt-1 h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NDS">NDS</SelectItem>
                                <SelectItem value="HSD1">HSD1</SelectItem>
                                <SelectItem value="HSD2">HSD2</SelectItem>
                                <SelectItem value="HSD3">HSD3</SelectItem>
                                <SelectItem value="DHJ">DHJ</SelectItem>
                                <SelectItem value="APL">APL</SelectItem>
                                <SelectItem value="TCD">TCD</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={formData.site || ''} disabled className="mt-1 h-10" />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="discipline" className="text-sm font-medium">
                            Discipline *
                          </Label>
                          {isEditing && canEdit ? (
                            <Select value={formData.discipline} onValueChange={(value) => setFormData({ ...formData, discipline: value })}>
                              <SelectTrigger className="mt-1 h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Operation">Operation</SelectItem>
                                <SelectItem value="Engineering & Utility">Engineering & Utility</SelectItem>
                                <SelectItem value="Environment">Environment</SelectItem>
                                <SelectItem value="Safety">Safety</SelectItem>
                                <SelectItem value="Quality">Quality</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={formData.discipline || ''} disabled className="mt-1 h-10" />
                          )}
                        </div>
                        {/* Commented out Priority field as requested
                        <div>
                          <Label htmlFor="priority" className="text-sm font-medium">
                            Priority *
                          </Label>
                          {isEditing && canEdit ? (
                            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                              <SelectTrigger className="mt-1 h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={formData.priority || ''} disabled className="mt-1 h-10" />
                          )}
                        </div>
                        */}
                        <div>
                          <Label htmlFor="expectedSavings" className="text-sm font-medium">
                            Expected Savings (₹)
                          </Label>
                          <Input
                            id="expectedSavings"
                            value={formData.expectedSavings || ''}
                            disabled={!isEditing || !canEdit}
                            onChange={(e) => setFormData({ ...formData, expectedSavings: e.target.value })}
                            className="mt-1 h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-sm font-medium">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description || ''}
                          disabled={!isEditing || !canEdit}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="mt-1"
                          placeholder="Provide a detailed description of the initiative..."
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="budgetType" className="text-sm font-medium">
                            Budget Type *
                          </Label>
                          {isEditing && canEdit ? (
                            <Select value={formData.budgetType || 'NON-BUDGETED'} onValueChange={(value) => setFormData({ ...formData, budgetType: value })}>
                              <SelectTrigger className="mt-1 h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BUDGETED">BUDGETED</SelectItem>
                                <SelectItem value="NON-BUDGETED">NON-BUDGETED</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1">
                              <Badge 
                                variant={formData.budgetType === 'BUDGETED' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {formData.budgetType || 'NON-BUDGETED'}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="startDate" className="text-sm font-medium">
                            Start Date
                          </Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={formData.startDate || ''}
                            disabled={!isEditing || !canEdit}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="mt-1 h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate" className="text-sm font-medium">
                            End Date
                          </Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={formData.endDate || ''}
                            disabled={!isEditing || !canEdit}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="mt-1 h-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      
                        <div>
                          <Label htmlFor="actualSavings" className="text-sm font-medium">
                            Actual Savings (₹)
                          </Label>
                          <Input
                            id="actualSavings"
                            value={formData.actualSavings || ''}
                            disabled={!isEditing || !canEdit}
                            onChange={(e) => setFormData({ ...formData, actualSavings: e.target.value })}
                            className="mt-1 h-10"
                            placeholder="Enter actual savings realized"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Target & Financial Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5" />
                        Target & Financial Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="targetOutcome" className="text-sm font-medium">
                            Target Outcome
                          </Label>
                          <Input
                            id="targetOutcome"
                            value={formData.targetOutcome || ''}
                            disabled={!isEditing || !canEdit}
                            onChange={(e) => setFormData({ ...formData, targetOutcome: e.target.value })}
                            className="mt-1 h-10"
                            placeholder="Define the target outcome"
                          />
                        </div>
                        <div>
                          <Label htmlFor="targetValue" className="text-sm font-medium">
                            Target Value (₹)
                          </Label>
                          <Input
                            id="targetValue"
                            type="number"
                            value={formData.targetValue || ''}
                            disabled={!isEditing || !canEdit}
                            onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                            className="mt-1 h-10"
                            placeholder="Enter target value"
                          />
                        </div>
                        {/* Commented out Confidence Level field as requested
                        <div>
                          <Label htmlFor="confidenceLevel" className="text-sm font-medium">
                            Confidence Level (%)
                          </Label>
                          <Input
                            id="confidenceLevel"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.confidenceLevel || ''}
                            disabled={!isEditing}
                            onChange={(e) => setFormData({ ...formData, confidenceLevel: parseInt(e.target.value) || 0 })}
                            className="mt-1 h-10"
                            placeholder="0-100"
                          />
                        </div>
                        */}
                        <div>
                          <Label htmlFor="estimatedCapex" className="text-sm font-medium">
                            Estimated CAPEX (₹)
                          </Label>
                          <Input
                            id="estimatedCapex"
                            type="number"
                            value={formData.estimatedCapex || ''}
                            disabled={!isEditing || !canEdit}
                            onChange={(e) => setFormData({ ...formData, estimatedCapex: parseFloat(e.target.value) || 0 })}
                            className="mt-1 h-10"
                            placeholder="Enter estimated CAPEX"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assumptions & Baseline Data */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        Assumptions & Baseline Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="baselineData" className="text-sm font-medium">
                          Baseline Data
                        </Label>
                        <Textarea
                          id="baselineData"
                          value={formData.baselineData || ''}
                          disabled={!isEditing || !canEdit}
                          onChange={(e) => setFormData({ ...formData, baselineData: e.target.value })}
                          rows={3}
                          className="mt-1"
                          placeholder="Provide baseline data and current state information..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="assumption1" className="text-sm font-medium">
                          Assumption 1
                        </Label>
                        <Textarea
                          id="assumption1"
                          value={formData.assumption1 || ''}
                          disabled={!isEditing || !canEdit}
                          onChange={(e) => setFormData({ ...formData, assumption1: e.target.value })}
                          rows={2}
                          className="mt-1"
                          placeholder="Enter first key assumption..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="assumption2" className="text-sm font-medium">
                          Assumption 2
                        </Label>
                        <Textarea
                          id="assumption2"
                          value={formData.assumption2 || ''}
                          disabled={!isEditing || !canEdit}
                          onChange={(e) => setFormData({ ...formData, assumption2: e.target.value })}
                          rows={2}
                          className="mt-1"
                          placeholder="Enter second key assumption..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="assumption3" className="text-sm font-medium">
                          Assumption 3
                        </Label>
                        <Textarea
                          id="assumption3"
                          value={formData.assumption3 || ''}
                          disabled={!isEditing || !canEdit}
                          onChange={(e) => setFormData({ ...formData, assumption3: e.target.value })}
                          rows={2}
                          className="mt-1"
                          placeholder="Enter third key assumption..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="references" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" />
                        Creator Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Created By</p>
                          <p className="font-medium">{creatorName}</p>
                          {creatorEmail && (
                            <p className="text-sm text-muted-foreground">{creatorEmail}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Submitted Date</p>
                          <p className="font-medium">{initiative?.submittedDate}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle2 className="h-5 w-5" />
                        Requirements & Approvals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <p className="text-base font-medium mb-4">MOC & CAPEX Requirements</p>
                          
                          {/* MOC Requirements Section */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">MOC Required</Label>
                              {isEditing && canEdit ? (
                                <Select 
                                  value={formData.requiresMoc || 'N'} 
                                  onValueChange={(value) => setFormData({ ...formData, requiresMoc: value })}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Y">Yes</SelectItem>
                                    <SelectItem value="N">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={
                                      initiative?.requiresMoc === 'Y' ? 'default' : 
                                      initiative?.requiresMoc === 'N' ? 'secondary' : 
                                      'outline'
                                    }
                                    className="flex items-center gap-1"
                                  >
                                    {initiative?.requiresMoc === 'Y' ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        Yes
                                      </>
                                    ) : initiative?.requiresMoc === 'N' ? (
                                      <>
                                        <X className="h-3 w-3" />
                                        No
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3 w-3" />
                                        Decision Pending
                                      </>
                                    )}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">MOC Number</Label>
                              <Input
                                value={formData.mocNumber || ''}
                                disabled={!isEditing || !canEdit}
                                onChange={(e) => setFormData({ ...formData, mocNumber: e.target.value })}
                                className="h-10"
                                placeholder="Enter MOC Number"
                              />
                            </div>
                          </div>

                          {/* CAPEX Requirements Section */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">CAPEX Required</Label>
                              {isEditing && canEdit ? (
                                <Select 
                                  value={formData.requiresCapex || 'N'} 
                                  onValueChange={(value) => setFormData({ ...formData, requiresCapex: value })}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Y">Yes</SelectItem>
                                    <SelectItem value="N">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={
                                      initiative?.requiresCapex === 'Y' ? 'default' : 
                                      initiative?.requiresCapex === 'N' ? 'secondary' : 
                                      'outline'
                                    }
                                    className="flex items-center gap-1"
                                  >
                                    {initiative?.requiresCapex === 'Y' ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        Yes
                                      </>
                                    ) : initiative?.requiresCapex === 'N' ? (
                                      <>
                                        <X className="h-3 w-3" />
                                        No
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3 w-3" />
                                        Decision Pending
                                      </>
                                    )}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">CAPEX Number</Label>
                              <Input
                                value={formData.capexNumber || ''}
                                disabled={!isEditing || !canEdit}
                                onChange={(e) => setFormData({ ...formData, capexNumber: e.target.value })}
                                className="h-10"
                                placeholder="Enter CAPEX Number"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium mb-3">Legacy Requirements (for reference)</p>
                          <div className="flex flex-wrap gap-2">
                            {initiative?.requiresMoc && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                MoC Required (Legacy)
                              </Badge>
                            )}
                            {initiative?.requiresCapex && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                CAPEX Required (Legacy)
                              </Badge>
                            )}
                            {!initiative?.requiresMoc && !initiative?.requiresCapex && (
                              <p className="text-sm text-muted-foreground">No legacy requirements</p>
                            )}
                          </div>
                        </div>
                      
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-6 space-y-6">
                  <UploadedDocuments initiativeId={initiative?.id} />
                </TabsContent>

                {canShowWorkflowActions && (
                  <TabsContent value="workflow" className="mt-6 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Workflow className="h-5 w-5" />
                          Workflow Approval
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Current Stage Information */}
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-medium">
                                  Stage {pendingTransaction?.stageNumber || initiative?.currentStage || 1}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {WORKFLOW_STAGE_NAMES[pendingTransaction?.stageNumber] || pendingTransaction?.stageName || currentStageName}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {pendingTransaction 
                                  ? getStageDescription(pendingTransaction.stageNumber)
                                  : "No pending approval found for you on this initiative. You may not have permission to approve the current stage."
                                }
                              </p>
                            </div>
                          </AlertDescription>
                        </Alert>

                        {/* Stage-specific content */}
                        {getStageSpecificWorkflowContent()}

                        {/* Comments Section - only show if there's a pending transaction */}
                        {pendingTransaction && (
                          <div className="space-y-2">
                            <Label htmlFor="workflowComment" className="text-sm font-medium text-red-600">
                              Comments (Required) *
                            </Label>
                            <Textarea
                              id="workflowComment"
                              value={workflowComment}
                              onChange={(e) => setWorkflowComment(e.target.value)}
                              placeholder="Please provide your comments for this stage..."
                              className="min-h-[100px] text-sm"
                              required
                            />
                          </div>
                        )}

                        {/* Action Buttons - only show if there's a pending transaction and user can act */}
                        {pendingTransaction && canApproveWorkflow && canUserActOnPendingTransaction(pendingTransaction) && (
                          <div className="pt-4 border-t">
                            {pendingTransaction.stageNumber === 11 ? (
                              <div className="flex gap-3">
                                <Button 
                                  onClick={handleWorkflowApprove}
                                  disabled={!workflowComment.trim() || (processStageAction.isPending && processingAction === 'approved')}
                                  className="bg-red-600 hover:bg-red-700 flex-1 h-9 text-xs font-medium"
                                >
                                  {(processStageAction.isPending && processingAction === 'approved') ? (
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
                              <div className="flex gap-3">
                                <Button 
                                  onClick={handleWorkflowApprove}
                                  disabled={
                                    !isWorkflowFormValid() || 
                                    (processStageAction.isPending && processingAction === 'approved') ||
                                    batchFAApprovalMutation.isPending
                                  }
                                  className="bg-green-600 hover:bg-green-700 flex-1 h-9 text-xs font-medium"
                                >
                                  {((processStageAction.isPending && processingAction === 'approved') || batchFAApprovalMutation.isPending) ? (
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
                                {(pendingTransaction.stageNumber === 2 || pendingTransaction.stageNumber === 3) && (
                                  <Button 
                                    variant="destructive"
                                    onClick={handleWorkflowReject}
                                    disabled={!workflowComment.trim() || (processStageAction.isPending && processingAction === 'rejected')}
                                    className="flex-1 h-9 text-xs font-medium"
                                  >
                                    {(processStageAction.isPending && processingAction === 'rejected') ? (
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
                                {pendingTransaction.stageNumber === 8 && (
                                  <Button 
                                    variant="outline"
                                    onClick={handleWorkflowDrop}
                                    disabled={!workflowComment.trim() || (processStageAction.isPending && processingAction === 'dropped')}
                                    className="flex-1 h-9 text-xs font-medium border-orange-300 text-orange-600 hover:bg-orange-50"
                                  >
                                    {(processStageAction.isPending && processingAction === 'dropped') ? (
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
                        )}

                        {/* Help text */}
                        {pendingTransaction && (
                          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            After processing this stage, the initiative will automatically move to the next stage in the workflow.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}