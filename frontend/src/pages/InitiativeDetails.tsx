import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  ArrowLeft,
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
  RotateCcw,
  MessageSquare,
  Plus,
  Trash2,
  Filter
} from 'lucide-react';
import { useProgressPercentage, useCurrentPendingStage, useProcessStageAction, useWorkflowTransactions } from '@/hooks/useWorkflowTransactions';
import { useUser, useInitiativeLeadsBySite, useUsers } from '@/hooks/useUsers';
import { useFinalizedPendingFAEntries, useBatchFAApproval, MonthlyMonitoringEntry } from '@/hooks/useMonthlyMonitoring';
import { useTimelineEntriesProgressMonitoring } from '@/hooks/useTimelineEntriesProgressMonitoring';
import UploadedDocuments from '@/components/UploadedDocuments';
import { initiativeAPI, timelineTrackerAPI, monthlyMonitoringAPI, momAPI, userAPI } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useInitiatives } from '@/hooks/useInitiatives';

// Smart currency formatting function (copied from PerformanceAnalysis.tsx)
const formatCurrencyInLakhs = (amount: number): string => {
  if (amount === 0) return "₹0";
  
  // Helper function to remove trailing zeros and unnecessary decimal points
  const cleanNumber = (num: number, decimals: number): string => {
    return parseFloat(num.toFixed(decimals)).toString();
  };
  
  if (amount >= 1000000000000) {
    // >= 1 Trillion: show in Trillion
    const trillions = amount / 1000000000000;
    return `₹${cleanNumber(trillions, 2)}T`;
  } else if (amount >= 10000000000) {
    // >= 1000 Crores: show in Thousand Crores
    const thousandCrores = amount / 10000000000;
    return `₹${cleanNumber(thousandCrores, 2)}TCr`;
  } else if (amount >= 10000000) {
    // >= 1 Crore: show in Crores
    const crores = amount / 10000000;
    return `₹${cleanNumber(crores, 2)}Cr`;
  } else if (amount >= 100000) {
    // >= 1 Lakh: show in Lakhs
    const lakhs = amount / 100000;
    return `₹${cleanNumber(lakhs, 2)}L`;
  } else if (amount >= 1000) {
    // >= 1 Thousand: show in Thousands
    const thousands = amount / 1000;
    return `₹${cleanNumber(thousands, 2)}K`;
  } else if (amount >= 1) {
    // >= 1 Rupee: show in Rupees without decimals for whole numbers
    return amount % 1 === 0 ? `₹${amount}` : `₹${cleanNumber(amount, 2)}`;
  } else {
    // < 1 Rupee: show in paisa with appropriate decimals
    return `₹${cleanNumber(amount, 2)}`;
  }
};

// Helper function to parse formatted currency back to number for editing
const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove currency symbol and suffixes, then parse
  const cleanValue = value.replace(/[₹,TCrLK]/g, '').trim();
  const numericValue = parseFloat(cleanValue);
  
  if (value.includes('TCr')) return numericValue * 10000000000; // Thousand Crores
  if (value.includes('Cr')) return numericValue * 10000000;     // Crores
  if (value.includes('L')) return numericValue * 100000;        // Lakhs
  if (value.includes('K')) return numericValue * 1000;          // Thousands
  if (value.includes('T')) return numericValue * 1000000000000; // Trillions
  
  return numericValue || 0;
};

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

interface InitiativeDetailsProps {
  user?: { role?: string; site?: string; email?: string; [key: string]: any };
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

export default function InitiativeDetails({ user }: InitiativeDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get the "from" location from navigation state
  const fromPath = (location.state as any)?.from || '/initiatives';
  
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [formData, setFormData] = useState<any>({});
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

  // MOM states
  const [momEntries, setMomEntries] = useState<any[]>([]);
  const [momLoading, setMomLoading] = useState(false);
  const [showMomForm, setShowMomForm] = useState(false);
  const [editingMom, setEditingMom] = useState<any>(null);
  const [momFilter, setMomFilter] = useState<{year?: number, month?: number}>({});
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  const [momFormData, setMomFormData] = useState({
    meetingTitle: '',
    meetingDate: '',
    responsiblePerson: '',
    responsiblePersonEmail: '', // Add email field
    content: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    meetingType: 'MONTHLY_REVIEW',
    dueDate: '',
    attendees: ''
  });
  
  // User search state for responsible person dropdown
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [momToDelete, setMomToDelete] = useState<number | null>(null);

  // Fetch initiatives to find the specific one
  const { data: initiativesData, isLoading, error } = useInitiatives();

  // Get initiative data
  useEffect(() => {
    if (!id || !initiativesData) return;
    
    let foundInitiative = null;
    
    if (initiativesData?.content) {
      foundInitiative = initiativesData.content.find((item: any) => item.id?.toString() === id);
      if (foundInitiative) {
        // Debug: Log the original budget type from API
        console.log('Original budgetType from API:', foundInitiative.budgetType);
        
        // Transform API data to match interface
        foundInitiative = {
          id: foundInitiative.id?.toString() || foundInitiative.id,
          title: foundInitiative.title || '',
          initiativeNumber: foundInitiative.initiativeNumber || '',
          site: foundInitiative.site || '',
          status: foundInitiative.status || '',
          priority: foundInitiative.priority || '',
          expectedSavings: typeof foundInitiative.expectedSavings === 'number' 
            ? formatCurrencyInLakhs(foundInitiative.expectedSavings)
            : foundInitiative.expectedSavings || '₹0',
          progress: foundInitiative.progressPercentage || foundInitiative.progress || 0,
          lastUpdated: foundInitiative.updatedAt 
            ? new Date(foundInitiative.updatedAt).toLocaleDateString() 
            : foundInitiative.lastUpdated || new Date().toLocaleDateString(),
          discipline: foundInitiative.discipline || '',
          submittedDate: foundInitiative.createdAt 
            ? new Date(foundInitiative.createdAt).toLocaleDateString() 
            : foundInitiative.submittedDate || new Date().toLocaleDateString(),
          description: foundInitiative.description,
          budgetType: (foundInitiative.budgetType?.toString().toUpperCase() === 'BUDGETED') 
            ? 'BUDGETED' 
            : 'NON-BUDGETED',
          startDate: foundInitiative.startDate,
          endDate: foundInitiative.endDate,
          currentStage: Math.min(foundInitiative.currentStage || 1, 11),
          // Prioritize currentStageName from API for instant display
          currentStageName: foundInitiative.status?.toLowerCase() === 'completed' 
            ? 'Initiative Closure' 
            : (foundInitiative.currentStageName || WORKFLOW_STAGE_NAMES[Math.min(foundInitiative.currentStage || 1, 11)] || `Stage ${Math.min(foundInitiative.currentStage || 1, 11)}`),
          requiresMoc: foundInitiative.requiresMoc,
          requiresCapex: foundInitiative.requiresCapex,
          mocNumber: foundInitiative.mocNumber,
          capexNumber: foundInitiative.capexNumber,
          createdByName: foundInitiative.createdBy?.fullName || foundInitiative.createdByName,
          createdByEmail: foundInitiative.createdBy?.email || foundInitiative.createdByEmail,
          initiatorName: foundInitiative.initiatorName,
          createdBy: foundInitiative.createdBy?.id || foundInitiative.createdBy,
          // Keep original date fields for sorting
          createdAt: foundInitiative.createdAt,
          createdDate: foundInitiative.createdDate,
          // Add missing fields for Target & Financial Information
          targetOutcome: foundInitiative.targetOutcome,
          targetValue: foundInitiative.targetValue,
          confidenceLevel: foundInitiative.confidenceLevel,
          estimatedCapex: foundInitiative.estimatedCapex,
        //   budgetType: foundInitiative.budgetType,
          // Add missing fields for Assumptions & Baseline Data
          assumption1: foundInitiative.assumption1,
          assumption2: foundInitiative.assumption2,
          assumption3: foundInitiative.assumption3,
          baselineData: foundInitiative.baselineData,
          // Add actualSavings field if needed
          actualSavings: typeof foundInitiative.actualSavings === 'number' 
            ? formatCurrencyInLakhs(foundInitiative.actualSavings)
            : foundInitiative.actualSavings,
        };
        
        // Debug: Log the transformed budget type
        console.log('Transformed budgetType:', foundInitiative.budgetType);
      }
    }

    if (foundInitiative) {
      setInitiative(foundInitiative);
      setFormData(foundInitiative);
    }
  }, [id, initiativesData]);

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
      setIsEditing(searchParams.get('edit') === 'true');
    }
  }, [searchParams, user, canEdit]);

  // Reset state when page loads
  useEffect(() => {
    // Only allow editing if user has proper role and site access
    if (!canEdit) {
      setIsEditing(false);
    } else {
      setIsEditing(searchParams.get('edit') === 'true');
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
  }, [canEdit, searchParams]);

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

  // Reset F&A selection when entries change
  useEffect(() => {
    if (pendingTransaction?.stageNumber === 10) {
      setSelectedEntries(new Set());
      setFaComments("");
    }
  }, [pendingTransaction?.stageNumber]);

  useEffect(() => {
    if (Array.isArray(monthlyEntries) && monthlyEntries.length > 0) {
      setSelectedEntries(new Set());
    }
  }, [monthlyEntries]);

  // Check if all timeline entries are completed for Stage 6 validation
  useEffect(() => {
    if (pendingTransaction?.stageNumber === 6 && initiative?.id) {
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
  }, [pendingTransaction?.stageNumber, initiative?.id]);

  // Check if all monthly monitoring entries are finalized for Stage 9 validation
  useEffect(() => {
    if (pendingTransaction?.stageNumber === 9 && initiative?.id) {
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
  }, [pendingTransaction?.stageNumber, initiative?.id]);
  
  // Load MOM entries when initiative changes
  useEffect(() => {
    if (initiative?.id) {
      fetchMomEntries();
      fetchAvailableMonths();
    }
  }, [initiative?.id]);

  // Fetch all users for responsible person dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const users = await userAPI.getAll();
        setAllUsers(users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users for dropdown",
          variant: "destructive",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // MOM Functions
  const fetchMomEntries = async () => {
    if (!initiative?.id) return;
    try {
      setMomLoading(true);
      const data = await momAPI.getMomsByInitiative(Number(initiative.id));
      setMomEntries(data);
    } catch (error) {
      console.error('Error fetching MOM entries:', error);
      toast({
        title: "Error loading MOM entries",
        description: "Failed to load meeting records.",
        variant: "destructive"
      });
    } finally {
      setMomLoading(false);
    }
  };

  const fetchMomEntriesByMonth = async (year: number, month: number) => {
    if (!initiative?.id) return;
    try {
      setMomLoading(true);
      const data = await momAPI.getMomsByMonth(Number(initiative.id), year, month);
      setMomEntries(data);
    } catch (error) {
      console.error('Error fetching MOM entries by month:', error);
      toast({
        title: "Error filtering MOM entries",
        description: "Failed to load filtered meeting records.",
        variant: "destructive"
      });
    } finally {
      setMomLoading(false);
    }
  };

  const fetchAvailableMonths = async () => {
    if (!initiative?.id) return;
    try {
      const data = await momAPI.getAvailableMonths(Number(initiative.id));
      setAvailableMonths(data);
    } catch (error) {
      console.error('Error fetching available months:', error);
    }
  };

  const handleSaveMom = async () => {
    if (!initiative?.id || !momFormData.meetingTitle || !momFormData.meetingDate || 
        !momFormData.responsiblePerson || !momFormData.content) {
      return;
    }

    try {
      const momData = {
        meetingTitle: momFormData.meetingTitle,
        meetingDate: momFormData.meetingDate,
        responsiblePerson: momFormData.responsiblePerson,
        content: momFormData.content,
        status: momFormData.status,
        priority: momFormData.priority,
        meetingType: momFormData.meetingType,
        dueDate: momFormData.dueDate || null,
        attendees: momFormData.attendees || null
      };

      if (editingMom) {
        await momAPI.updateMom(Number(initiative.id), editingMom.id, momData);
        toast({
          title: "MOM entry updated",
          description: "Meeting record has been updated successfully."
        });
      } else {
        // Create MOM and send notification email if responsible person email is available
        if (momFormData.responsiblePersonEmail) {
          try {
            await momAPI.createMomWithNotification(Number(initiative.id), {
              ...momData,
              responsiblePersonEmail: momFormData.responsiblePersonEmail
            });
            toast({
              title: "MOM entry created with notification",
              description: `Meeting record created and notification sent to ${momFormData.responsiblePerson}.`
            });
          } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Still create MOM even if email fails
            await momAPI.createMom(Number(initiative.id), momData);
            toast({
              title: "MOM entry created",
              description: "Meeting record created successfully, but notification email failed."
            });
          }
        } else {
          await momAPI.createMom(Number(initiative.id), momData);
          toast({
            title: "MOM entry created",
            description: "Meeting record has been created successfully."
          });
        }
      }

      setShowMomForm(false);
      setEditingMom(null);
      setMomFormData({
        meetingTitle: '',
        meetingDate: '',
        responsiblePerson: '',
        responsiblePersonEmail: '',
        content: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        meetingType: 'MONTHLY_REVIEW',
        dueDate: '',
        attendees: ''
      });
      
      // Refresh MOM entries and available months
      fetchMomEntries();
      fetchAvailableMonths();
    } catch (error: any) {
      console.error('Error saving MOM entry:', error);
      toast({
        title: "Error saving MOM entry",
        description: error.response?.data?.message || "Failed to save meeting record.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMom = async (momId: number) => {
    // Show confirmation dialog instead of direct deletion
    setMomToDelete(momId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMom = async () => {
    if (!initiative?.id || !momToDelete) {
      return;
    }

    try {
      await momAPI.deleteMom(Number(initiative.id), momToDelete);
      toast({
        title: "MOM entry deleted",
        description: "Meeting record has been deleted successfully."
      });
      
      // Refresh MOM entries and available months
      fetchMomEntries();
      fetchAvailableMonths();
    } catch (error: any) {
      console.error('Error deleting MOM entry:', error);
      toast({
        title: "Error deleting MOM entry",
        description: error.response?.data?.message || "Failed to delete meeting record.",
        variant: "destructive"
      });
    } finally {
      // Reset confirmation state
      setShowDeleteConfirm(false);
      setMomToDelete(null);
    }
  };

  const cancelDeleteMom = () => {
    setShowDeleteConfirm(false);
    setMomToDelete(null);
  };
  
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
  console.log('Page Debug:', { 
    isEditing, 
    initiativeId: initiative?.id,
    pageTitle: isEditing ? 'Edit Initiative' : 'Initiative Details',
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
      toast({
        title: "Permission denied",
        description: "You do not have permission to edit initiatives from this site.",
        variant: "destructive"
      });
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
          ? parseCurrency(formData.expectedSavings)
          : formData.expectedSavings,
        // actualSavings is auto-calculated from monthly monitoring - not included in manual updates
        // Site and Discipline are required fields, include existing values
        site: formData.site || initiative?.site,
        discipline: formData.discipline || initiative?.discipline,
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
        targetValue: typeof formData.targetValue === 'string' 
          ? parseCurrency(formData.targetValue)
          : formData.targetValue || 0,
        confidenceLevel: formData.confidenceLevel || 0,
        estimatedCapex: typeof formData.estimatedCapex === 'string' 
          ? parseCurrency(formData.estimatedCapex)
          : formData.estimatedCapex || 0,
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
      
      toast({
        title: "Initiative updated successfully",
        description: "Changes have been saved.",
      });
      
      setIsEditing(false);
      
      // Update URL to remove edit parameter
      navigate(`/initiatives/${initiative.id}`, { replace: true });
    } catch (error) {
      console.error('Error updating initiative:', error);
      toast({
        title: "Error updating initiative",
        description: "Failed to update initiative. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(initiative || {});
    setIsEditing(false);
    // Remove edit parameter from URL
    navigate(`/initiatives/${initiative?.id}`, { replace: true });
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
                Select an Initiative Lead for this site
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
                  <div className="bg-muted px-3 py-2 border-b">
                    <div className="grid grid-cols-10 gap-2 text-xs font-semibold">
                      <div className="col-span-3">Activity Name</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-3">Planned Duration</div>
                      <div className="col-span-2">Responsible Person</div>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {Array.isArray(timelineEntries) && timelineEntries.map((entry: any) => (
                      <div key={entry.id} className="px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50">
                        <div className="grid grid-cols-10 gap-2 items-center text-xs">
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
                              className={`text-xs px-1.5 py-0.5 text-center font-medium whitespace-nowrap ${
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
                          <div className="mt-1.5 text-xs text-muted-foreground bg-muted p-1.5 rounded">
                            <strong>Remarks:</strong> 
                            <span className="ml-1 break-words">{entry.remarks}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {Array.isArray(timelineEntries) && timelineEntries.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Total {timelineEntries.length} timeline entries found for progress monitoring review
              </div>
            )}

            {Array.isArray(timelineEntries) && timelineEntries.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Total {timelineEntries.length} timeline entries found for progress monitoring review
              </div>
            )}
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
                          <div className="col-span-2 font-mono font-bold text-blue-600">
                            {entry.targetValue ? formatCurrencyInLakhs(entry.targetValue) : '₹0'}
                          </div>
                          <div className="col-span-2 font-mono font-bold text-green-600">
                            {entry.achievedValue ? formatCurrencyInLakhs(entry.achievedValue) : '₹0'}
                          </div>
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

  // Loading state
  if (isLoading || !initiative) {
    return (
      <div className="container mx-auto p-4 space-y-4 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !initiative) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center py-12">
          <p className="text-destructive text-lg">Initiative not found or error loading data</p>
          <Button onClick={() => navigate(fromPath)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 space-y-3 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(fromPath)}
            className="flex items-center gap-1.5 h-8 px-3"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isEditing ? 'Edit Initiative' : 'Initiative Details'}
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              {initiative?.initiativeNumber || `ID: ${initiative?.id}`}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`px-2 py-1 rounded text-xs font-medium ${
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
                <div className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                  <Workflow className="h-3 w-3" />
                  Approval Available
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && canEdit && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="min-w-[70px] h-8 px-3">
              <Edit className="h-3 w-3 mr-1.5" />
              Edit
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} className="min-w-[80px] h-8 px-3" disabled={isSaving}>
                <X className="h-3 w-3 mr-1.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="min-w-[90px] h-8 px-3" disabled={isSaving}>
                <Save className="h-3 w-3 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full h-10 gap-1 ${(canShowWorkflowActions || hasWorkflowActions) ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs py-1.5 px-2">
              <Target className="h-3 w-3" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-1.5 text-xs py-1.5 px-2">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="references" className="flex items-center gap-1.5 text-xs py-1.5 px-2">
              <Files className="h-3 w-3" />
              <span className="hidden sm:inline">References</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1.5 text-xs py-1.5 px-2">
              <FolderOpen className="h-3 w-3" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="mom" className="flex items-center gap-1.5 text-xs py-1.5 px-2">
              <MessageSquare className="h-3 w-3" />
              <span className="hidden sm:inline">MOM</span>
            </TabsTrigger>
            {(canShowWorkflowActions || hasWorkflowActions) && (
              <TabsTrigger value="workflow" className="flex items-center gap-1.5 text-xs py-1.5 px-2">
                <Workflow className="h-3 w-3" />
                <span className="hidden sm:inline">Approval</span>
              </TabsTrigger>
            )}
          </TabsList>

          <div className="mt-4">
            <TabsContent value="overview" className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-primary/10 rounded">
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
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-green-100 rounded">
                        <DollarSign className="h-3 w-3 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expected</p>
                        <p className="font-semibold text-green-600 text-sm">
                          {typeof initiative?.expectedSavings === 'number' 
                            ? formatCurrencyInLakhs(initiative.expectedSavings)
                            : initiative?.expectedSavings}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-orange-100 rounded">
                        <DollarSign className="h-3 w-3 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Actual</p>
                        <p className="font-semibold text-orange-600 text-sm">
                          {typeof initiative?.actualSavings === 'number' 
                            ? formatCurrencyInLakhs(initiative.actualSavings)
                            : initiative?.actualSavings || '₹0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-purple-100 rounded">
                        <MapPin className="h-3 w-3 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Site</p>
                        <p className="font-semibold text-xs">{initiative?.site}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border-l-4 ${initiative?.budgetType === 'BUDGETED' ? 'border-l-green-500' : 'border-l-orange-500'}`}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${initiative?.budgetType === 'BUDGETED' ? 'bg-green-100' : 'bg-orange-100'}`}>
                          <DollarSign className={`h-4 w-4 ${initiative?.budgetType === 'BUDGETED' ? 'text-green-600' : 'text-orange-600'}`} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Budget Type</p>
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            initiative?.budgetType === 'BUDGETED' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-orange-100 text-orange-800 border border-orange-200'
                          }`}>
                            {initiative?.budgetType === 'BUDGETED' ? 'BUDGETED' : 'NON-BUDGETED'}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {initiative?.budgetType === 'BUDGETED' 
                          ? 'Allocated in annual budget' 
                          : 'Additional investment required'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress and Stage Information */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      Workflow Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Stage</span>
                        <span className="font-medium">{initiative?.currentStage}/11</span>
                      </div>
                      <Progress value={actualProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {currentStageName}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Discipline</span>
                        <Badge variant="outline" className="text-xs">
                          {initiative?.discipline}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600" />
                      Initiative Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground">Created by</span>
                        <div className="text-right">
                          <p className="text-sm font-medium">{creatorName}</p>
                          {creatorEmail && (
                            <p className="text-xs text-muted-foreground">{creatorEmail}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Submitted</span>
                        <span className="text-sm">{initiative?.submittedDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                        <span className="text-sm">{initiative?.lastUpdated}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    {isEditing ? 'Edit Initiative Details' : 'Initiative Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="title" className="text-xs font-medium text-gray-700">Initiative Title *</Label>
                      {isEditing ? (
                        <Input
                          id="title"
                          value={formData.title || ''}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="text-xs h-8 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                          placeholder="Enter initiative title"
                        />
                      ) : (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-2 min-h-[32px] flex items-center">
                          <p className="text-xs font-medium text-gray-800 leading-tight break-words overflow-hidden w-full">
                            <span className="block truncate" title={initiative?.title || 'Untitled Initiative'}>
                              {initiative?.title || 'Untitled Initiative'}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="initiativeNumber" className="text-xs font-medium text-gray-700">Initiative Number</Label>
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-md p-2">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs font-mono font-bold text-emerald-800 tracking-wide">
                            {initiative?.initiativeNumber || 'AUTO-GENERATED'}
                          </span>
                        </div>
                        <p className="text-2xs text-emerald-600 mt-0.5">Initiative Reference Number</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="site" className="text-xs font-medium text-gray-700">Site</Label>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-md p-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-800">
                            {initiative?.site || 'Not Specified'}
                          </span>
                        </div>
                        <p className="text-2xs text-blue-600 mt-0.5">Location/Plant</p>
                      </div>
                    </div>

                    
                    <div className="space-y-1">
                      <Label htmlFor="expectedSavings" className="text-xs font-medium text-gray-700">Expected Savings (₹)</Label>
                      {isEditing ? (
                        <Input
                          id="expectedSavings"
                          type="number"
                          value={typeof formData.expectedSavings === 'string' 
                            ? parseCurrency(formData.expectedSavings)
                            : formData.expectedSavings || ''}
                          onChange={(e) => setFormData({ ...formData, expectedSavings: parseFloat(e.target.value) || 0 })}
                          className="text-xs h-8"
                          placeholder="Enter expected savings in rupees"
                        />
                      ) : (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md p-2">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-sm font-bold text-green-700">
                              {typeof initiative?.expectedSavings === 'number' 
                                ? formatCurrencyInLakhs(initiative.expectedSavings)
                                : initiative?.expectedSavings || '₹0'}
                            </span>
                          </div>
                          <p className="text-2xs text-green-600 mt-0.5">Projected Financial Impact</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="discipline" className="text-xs font-medium text-gray-700">Discipline</Label>
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-md p-2">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-purple-600" />
                          <span className="text-xs font-medium text-purple-800">
                            {initiative?.discipline || 'Not Specified'}
                          </span>
                        </div>
                        <p className="text-2xs text-purple-600 mt-0.5">Department/Function</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-xs font-medium text-gray-700">Description</Label>
                    {isEditing ? (
                      <Textarea
                        id="description"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="min-h-[80px] text-xs"
                        placeholder="Provide a detailed description of the initiative"
                      />
                    ) : (
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-md p-2 min-h-[80px]">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {initiative?.description && initiative.description.length > 300 
                            ? `${initiative.description.substring(0, 300)}...` 
                            : initiative?.description || 'No description provided'}
                        </p>
                        {initiative?.description && initiative.description.length > 300 && (
                          <p className="text-2xs text-blue-600 mt-1 cursor-pointer hover:underline">
                            Click to view full description
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {isEditing ? 'Edit Initiative Details' : 'Initiative Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Timeline Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-blue-600" />
                      Timeline Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="startDate" className="text-xs font-medium text-gray-700">Start Date</Label>
                        {isEditing ? (
                          <Input
                            id="startDate"
                            type="date"
                            value={formData.startDate || ''}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="text-xs h-8 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        ) : (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-2">
                            <p className="text-xs font-medium text-gray-800">{initiative?.startDate || 'Not set'}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="endDate" className="text-xs font-medium text-gray-700">End Date</Label>
                        {isEditing ? (
                          <Input
                            id="endDate"
                            type="date"
                            value={formData.endDate || ''}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="text-xs h-8 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        ) : (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-2">
                            <p className="text-xs font-medium text-gray-800">{initiative?.endDate || 'Not set'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Financial Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      Financial Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="budgetType" className="text-xs font-medium text-gray-700">Budget Type</Label>
                        {isEditing ? (
                          <Select value={formData.budgetType || 'NON-BUDGETED'} onValueChange={(value) => setFormData({ ...formData, budgetType: value })}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BUDGETED" className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>Budgeted</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="NON-BUDGETED" className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span>Non-Budgeted</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className={`bg-gradient-to-r ${
                            initiative?.budgetType === 'BUDGETED'
                              ? 'from-green-50 to-emerald-50 border-green-200'
                              : 'from-orange-50 to-amber-50 border-orange-200'
                          } border rounded-md p-2`}>
                            <div className="flex items-center gap-1.5">
                              <div className={`p-0.5 rounded-full ${
                                initiative?.budgetType === 'BUDGETED' ? 'bg-green-100' : 'bg-orange-100'
                              }`}>
                                <DollarSign className={`h-2.5 w-2.5 ${
                                  initiative?.budgetType === 'BUDGETED' ? 'text-green-600' : 'text-orange-600'
                                }`} />
                              </div>
                              <span className={`text-xs font-semibold ${
                                initiative?.budgetType === 'BUDGETED' ? 'text-green-800' : 'text-orange-800'
                              }`}>
                                {initiative?.budgetType === 'BUDGETED' ? 'BUDGETED' : 'NON-BUDGETED'}
                              </span>
                            </div>
                            <p className={`text-xs mt-0.5 ${
                              initiative?.budgetType === 'BUDGETED' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {initiative?.budgetType === 'BUDGETED' 
                                ? 'Allocated in annual budget' 
                                : 'Additional investment required'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="actualSavings" className="text-xs font-medium text-gray-700">Actual Savings (₹)</Label>
                        <Input
                          id="actualSavings"
                          value={typeof initiative?.actualSavings === 'number' 
                            ? formatCurrencyInLakhs(initiative.actualSavings)
                            : initiative?.actualSavings || '₹0'}
                          disabled={true}
                          readOnly={true}
                          className="bg-muted cursor-not-allowed text-xs h-8"
                          placeholder="Auto-calculated from monthly monitoring"
                          title="This value is auto-calculated from the sum of achieved values in monthly monitoring entries"
                        />
                        <p className="text-xs text-muted-foreground">
                          Auto-calculated from monthly monitoring entries
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="targetValue" className="text-xs font-medium text-gray-700">Target Value (₹)</Label>
                        {isEditing ? (
                          <Input
                            id="targetValue"
                            type="number"
                            value={formData.targetValue || ''}
                            onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                            placeholder="Enter target value"
                            className="text-xs h-8 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        ) : (
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-md p-2">
                            <div className="flex items-center gap-1.5">
                              <Target className="h-3 w-3 text-indigo-600" />
                              <span className="text-xs font-bold text-indigo-800">
                                {initiative?.targetValue ? formatCurrencyInLakhs(initiative.targetValue) : '₹0'}
                              </span>
                            </div>
                            <p className="text-xs text-indigo-600 mt-0.5">Expected Achievement</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="estimatedCapex" className="text-xs font-medium text-gray-700">Estimated CAPEX (₹)</Label>
                        {isEditing ? (
                          <Input
                            id="estimatedCapex"
                            type="number"
                            value={formData.estimatedCapex || ''}
                            onChange={(e) => setFormData({ ...formData, estimatedCapex: parseFloat(e.target.value) || 0 })}
                            placeholder="Enter estimated CAPEX"
                            className="text-xs h-8 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        ) : (
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-md p-2">
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3 w-3 text-red-600" />
                              <span className="text-xs font-bold text-red-800">
                                {initiative?.estimatedCapex ? formatCurrencyInLakhs(initiative.estimatedCapex) : '₹0'}
                              </span>
                            </div>
                            <p className="text-xs text-red-600 mt-0.5">Capital Investment</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="targetOutcome" className="text-xs font-medium text-gray-700">Target Outcome</Label>
                        {isEditing ? (
                          <Input
                            id="targetOutcome"
                            value={formData.targetOutcome || ''}
                            onChange={(e) => setFormData({ ...formData, targetOutcome: e.target.value })}
                            placeholder="Describe the expected outcome"
                            className="text-xs h-8 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        ) : (
                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-md p-2">
                            <div className="flex items-center gap-1.5">
                              <Target className="h-3 w-3 text-amber-600" />
                              <span className="text-xs font-bold text-amber-800">
                                {initiative?.targetOutcome || 'Not specified'}
                              </span>
                            </div>
                            <p className="text-xs text-amber-600 mt-0.5">Expected Result</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="references" className="space-y-4">
              {/* MOC & CAPEX Requirements Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MOC Requirements Card */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      </div>
                      MOC Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">MOC Required</Label>
                      {isEditing ? (
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
                            className="flex items-center gap-1.5 px-3 py-1"
                          >
                            {initiative?.requiresMoc === 'Y' ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                Yes, Required
                              </>
                            ) : initiative?.requiresMoc === 'N' ? (
                              <>
                                <X className="h-3.5 w-3.5" />
                                Not Required
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                Decision Pending
                              </>
                            )}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">MOC Number</Label>
                      {isEditing ? (
                        <Input
                          value={formData.mocNumber || ''}
                          onChange={(e) => setFormData({ ...formData, mocNumber: e.target.value })}
                          className="h-10"
                          placeholder="Enter MOC Number"
                        />
                      ) : (
                        <div className="bg-muted/50 border rounded-lg p-3">
                          <p className="text-sm font-mono text-foreground">
                            {initiative?.mocNumber || (
                              <span className="text-muted-foreground italic">No MOC number provided</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* CAPEX Requirements Card */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      CAPEX Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">CAPEX Required</Label>
                      {isEditing ? (
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
                            className="flex items-center gap-1.5 px-3 py-1"
                          >
                            {initiative?.requiresCapex === 'Y' ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                Yes, Required
                              </>
                            ) : initiative?.requiresCapex === 'N' ? (
                              <>
                                <X className="h-3.5 w-3.5" />
                                Not Required
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                Decision Pending
                              </>
                            )}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">CAPEX Number</Label>
                      {isEditing ? (
                        <Input
                          value={formData.capexNumber || ''}
                          onChange={(e) => setFormData({ ...formData, capexNumber: e.target.value })}
                          className="h-10"
                          placeholder="Enter CAPEX Number"
                        />
                      ) : (
                        <div className="bg-muted/50 border rounded-lg p-3">
                          <p className="text-sm font-mono text-foreground">
                            {initiative?.capexNumber || (
                              <span className="text-muted-foreground italic">No CAPEX number provided</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assumptions & Baseline Data */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    Assumptions & Baseline Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Baseline Data */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-orange-100 rounded">
                        <Target className="h-3.5 w-3.5 text-orange-600" />
                      </div>
                      <Label className="text-sm font-semibold">Baseline Data</Label>
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={formData.baselineData || ''}
                        onChange={(e) => setFormData({ ...formData, baselineData: e.target.value })}
                        rows={3}
                        placeholder="Enter baseline data information..."
                        className="resize-none"
                      />
                    ) : (
                      <div className="bg-muted/30 border rounded-lg p-4">
                        <p className="text-sm leading-relaxed">
                          {initiative?.baselineData || (
                            <span className="text-muted-foreground italic">No baseline data provided</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Assumptions */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1 bg-blue-100 rounded">
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-semibold">Key Assumptions</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Assumption 1 */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Assumption 1
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.assumption1 || ''}
                            onChange={(e) => setFormData({ ...formData, assumption1: e.target.value })}
                            rows={2}
                            placeholder="Enter first assumption..."
                            className="resize-none text-sm"
                          />
                        ) : (
                          <div className="bg-gradient-to-r from-blue-50 to-transparent border-l-2 border-l-blue-300 pl-4 py-2">
                            <p className="text-sm leading-relaxed">
                              {initiative?.assumption1 || (
                                <span className="text-muted-foreground italic">No assumption provided</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Assumption 2 */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Assumption 2
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.assumption2 || ''}
                            onChange={(e) => setFormData({ ...formData, assumption2: e.target.value })}
                            rows={2}
                            placeholder="Enter second assumption..."
                            className="resize-none text-sm"
                          />
                        ) : (
                          <div className="bg-gradient-to-r from-green-50 to-transparent border-l-2 border-l-green-300 pl-4 py-2">
                            <p className="text-sm leading-relaxed">
                              {initiative?.assumption2 || (
                                <span className="text-muted-foreground italic">No assumption provided</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Assumption 3 */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Assumption 3
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.assumption3 || ''}
                            onChange={(e) => setFormData({ ...formData, assumption3: e.target.value })}
                            rows={2}
                            placeholder="Enter third assumption..."
                            className="resize-none text-sm"
                          />
                        ) : (
                          <div className="bg-gradient-to-r from-purple-50 to-transparent border-l-2 border-l-purple-300 pl-4 py-2">
                            <p className="text-sm leading-relaxed">
                              {initiative?.assumption3 || (
                                <span className="text-muted-foreground italic">No assumption provided</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderOpen className="h-4 w-4" />
                    Uploaded Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {initiative?.id && (
                    <UploadedDocuments
                      initiativeId={Number(initiative.id)}
                      canUpload={canEdit}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* MOM Tab */}
            <TabsContent value="mom" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4" />
                      Minutes of Meeting (MOM)
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Month Filter */}
                      <Select 
                        value={momFilter.year && momFilter.month ? `${momFilter.year}-${momFilter.month}` : 'all'} 
                        onValueChange={(value) => {
                          if (value === 'all') {
                            setMomFilter({});
                            fetchMomEntries();
                          } else {
                            const [year, month] = value.split('-').map(Number);
                            setMomFilter({year, month});
                            fetchMomEntriesByMonth(year, month);
                          }
                        }}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue placeholder="Filter by month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Months</SelectItem>
                          {availableMonths.map((month: any) => (
                            <SelectItem key={`${month.year}-${month.month}`} value={`${month.year}-${month.month}`}>
                              {new Date(month.year, month.month - 1).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long' 
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Add MOM Button - Only for IL */}
                      {user?.role === 'IL' && user?.site === initiative?.site && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setEditingMom(null);
                            setMomFormData({
                              meetingTitle: '',
                              meetingDate: '',
                              responsiblePerson: '',
                              responsiblePersonEmail: '',
                              content: '',
                              status: 'OPEN',
                              priority: 'MEDIUM',
                              meetingType: 'MONTHLY_REVIEW',
                              dueDate: '',
                              attendees: ''
                            });
                            setShowMomForm(true);
                          }}
                          className="h-8 px-3"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add MOM
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {showMomForm && (
                    <Card className="border-2 border-dashed border-primary/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          {editingMom ? 'Edit MOM Entry' : 'Add New MOM Entry'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="meetingTitle" className="text-xs font-semibold">Meeting Title *</Label>
                            <Input
                              id="meetingTitle"
                              value={momFormData.meetingTitle}
                              onChange={(e) => setMomFormData({...momFormData, meetingTitle: e.target.value})}
                              placeholder="Enter meeting title"
                              className="h-9 text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="meetingDate" className="text-xs font-semibold">Meeting Date *</Label>
                            <Input
                              id="meetingDate"
                              type="date"
                              value={momFormData.meetingDate}
                              onChange={(e) => setMomFormData({...momFormData, meetingDate: e.target.value})}
                              className="h-9 text-xs mt-1"
                            />
                          </div>
                          <div className="relative" ref={userDropdownRef}>
                            <Label htmlFor="responsiblePerson" className="text-xs font-semibold">Responsible Person *</Label>
                            <div className="relative">
                              <Input
                                id="responsiblePerson"
                                value={userSearchQuery || momFormData.responsiblePerson}
                                onChange={(e) => {
                                  setUserSearchQuery(e.target.value);
                                  setShowUserDropdown(true);
                                  // Clear selection if user types
                                  if (e.target.value !== momFormData.responsiblePerson) {
                                    setMomFormData({
                                      ...momFormData, 
                                      responsiblePerson: '', 
                                      responsiblePersonEmail: ''
                                    });
                                  }
                                }}
                                onFocus={() => setShowUserDropdown(true)}
                                placeholder="Search and select responsible person..."
                                className="h-9 text-xs mt-1"
                                autoComplete="off"
                              />
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                {isLoadingUsers ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                ) : (
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            
                            {/* User Dropdown */}
                            {showUserDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                {allUsers
                                  .filter(user => 
                                    user.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                    user.site?.toLowerCase().includes(userSearchQuery.toLowerCase())
                                  )
                                  .slice(0, 10) // Limit to 10 results
                                  .map((user) => (
                                    <div
                                      key={user.id}
                                      className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                      onClick={() => {
                                        setMomFormData({
                                          ...momFormData, 
                                          responsiblePerson: user.fullName, 
                                          responsiblePersonEmail: user.email
                                        });
                                        setUserSearchQuery(user.fullName);
                                        setShowUserDropdown(false);
                                      }}
                                    >
                                      <div className="font-semibold text-gray-900">{user.fullName}</div>
                                      <div className="text-gray-600">{user.email}</div>
                                      <div className="text-gray-500">{user.site} • {user.role}</div>
                                    </div>
                                  ))
                                }
                                {allUsers.filter(user => 
                                    user.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                    user.site?.toLowerCase().includes(userSearchQuery.toLowerCase())
                                  ).length === 0 && (
                                  <div className="px-3 py-2 text-xs text-gray-500">
                                    No users found matching "{userSearchQuery}"
                                  </div>
                                )}
                                <div 
                                  className="px-3 py-1 text-xs bg-gray-50 border-t cursor-pointer hover:bg-gray-100"
                                  onClick={() => setShowUserDropdown(false)}
                                >
                                  Close
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="dueDate" className="text-xs font-semibold">Due Date</Label>
                            <Input
                              id="dueDate"
                              type="date"
                              value={momFormData.dueDate}
                              onChange={(e) => setMomFormData({...momFormData, dueDate: e.target.value})}
                              className="h-9 text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="status" className="text-xs font-semibold">Status</Label>
                            <Select value={momFormData.status} onValueChange={(value) => setMomFormData({...momFormData, status: value})}>
                              <SelectTrigger className="h-9 text-xs mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="priority" className="text-xs font-semibold">Priority</Label>
                            <Select value={momFormData.priority} onValueChange={(value) => setMomFormData({...momFormData, priority: value})}>
                              <SelectTrigger className="h-9 text-xs mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="meetingType" className="text-xs font-semibold">Meeting Type</Label>
                            <Select value={momFormData.meetingType} onValueChange={(value) => setMomFormData({...momFormData, meetingType: value})}>
                              <SelectTrigger className="h-9 text-xs mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MONTHLY_REVIEW">Monthly Review</SelectItem>
                                <SelectItem value="AD_HOC">Ad-hoc</SelectItem>
                                <SelectItem value="PLANNING">Planning</SelectItem>
                                <SelectItem value="PROGRESS_REVIEW">Progress Review</SelectItem>
                                <SelectItem value="CLOSURE">Closure</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="content" className="text-xs font-semibold">Discussion Points / Content *</Label>
                          <Textarea
                            id="content"
                            value={momFormData.content}
                            onChange={(e) => setMomFormData({...momFormData, content: e.target.value})}
                            placeholder="Enter detailed discussion points, decisions made, action items..."
                            className="min-h-[100px] text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="attendees" className="text-xs font-semibold">Attendees</Label>
                          <Textarea
                            id="attendees"
                            value={momFormData.attendees}
                            onChange={(e) => setMomFormData({...momFormData, attendees: e.target.value})}
                            placeholder="List meeting attendees (optional)"
                            className="min-h-[60px] text-xs mt-1"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button 
                            onClick={handleSaveMom}
                            disabled={!momFormData.meetingTitle || !momFormData.meetingDate || !momFormData.responsiblePerson || !momFormData.content}
                            size="sm"
                            className="h-8"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {editingMom ? 'Update' : 'Save'} MOM
                          </Button>
                          <Button variant="outline" onClick={() => setShowMomForm(false)} size="sm" className="h-8">
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* MOM Entries List */}
                  <div className="space-y-3">
                    {momLoading ? (
                      <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-sm">Loading MOM entries...</span>
                      </div>
                    ) : momEntries.length === 0 ? (
                      <div className="p-8 bg-muted rounded-lg text-center">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No MOM entries found</p>
                        {user?.role === 'IL' && user?.site === initiative?.site && (
                          <p className="text-xs text-muted-foreground mt-1">Click "Add MOM" to create your first meeting record</p>
                        )}
                      </div>
                    ) : (
                      momEntries.map((mom: any) => (
                        <Card key={mom.id} className="border-l-4 border-l-blue-400">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-sm">{mom.meetingTitle}</h4>
                                  <div className="flex items-center gap-1">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        mom.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-300' :
                                        mom.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                        'bg-yellow-100 text-yellow-800 border-yellow-300'
                                      }`}
                                    >
                                      {mom.status?.replace('_', ' ')}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        mom.priority === 'HIGH' ? 'bg-red-100 text-red-800 border-red-300' :
                                        mom.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                        'bg-gray-100 text-gray-800 border-gray-300'
                                      }`}
                                    >
                                      {mom.priority}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mb-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(mom.meetingDate).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {mom.responsiblePerson}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" />
                                    {mom.meetingType?.replace('_', ' ')}
                                  </div>
                                  {mom.dueDate && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Due: {new Date(mom.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {user?.role === 'IL' && user?.site === initiative?.site && (
                                <div className="flex items-center gap-1 ml-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      setEditingMom(mom);
                                      setMomFormData({
                                        meetingTitle: mom.meetingTitle || '',
                                        meetingDate: mom.meetingDate || '',
                                        responsiblePerson: mom.responsiblePerson || '',
                                        responsiblePersonEmail: '', // Reset email when editing existing MOM
                                        content: mom.content || '',
                                        status: mom.status || 'OPEN',
                                        priority: mom.priority || 'MEDIUM',
                                        meetingType: mom.meetingType || 'MONTHLY_REVIEW',
                                        dueDate: mom.dueDate || '',
                                        attendees: mom.attendees || ''
                                      });
                                      setShowMomForm(true);
                                    }}
                                    className="h-7 px-2"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDeleteMom(mom.id)}
                                    className="h-7 px-2 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Discussion Points:</p>
                                <div className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">
                                  {mom.content}
                                </div>
                              </div>
                              
                              {mom.attendees && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Attendees:</p>
                                  <div className="text-sm bg-muted/30 p-2 rounded">
                                    {mom.attendees}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                <span>Created by {mom.createdBy}</span>
                                <span>{new Date(mom.createdAt).toLocaleDateString()} {new Date(mom.createdAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delete Confirmation Dialog moved to end of component for proper backdrop coverage */}
            </TabsContent>

            {(canShowWorkflowActions || hasWorkflowActions) && (
              <TabsContent value="workflow" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Workflow className="h-4 w-4" />
                      Workflow Approval
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {!pendingTransaction ? (
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">No pending approval found for you on this initiative</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          The initiative may have already been processed or you may not have permission to approve the current stage.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Stage-specific content */}
                        <div className="space-y-4">
                          {getStageSpecificWorkflowContent()}
                        </div>

                        {/* General workflow comment section */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="workflowComment">Comments *</Label>
                            <Textarea
                              id="workflowComment"
                              value={workflowComment}
                              onChange={(e) => setWorkflowComment(e.target.value)}
                              placeholder="Provide your comments for this approval..."
                              rows={3}
                              className="mt-2 border-[1px] border-border focus-visible:ring-1"
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={handleWorkflowApprove}
                              disabled={!isWorkflowFormValid() || !!processingAction}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingAction === 'approved' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            
                            <Button
                              variant="destructive"
                              onClick={handleWorkflowReject}
                              disabled={!workflowComment.trim() || !!processingAction}
                            >
                              {processingAction === 'rejected' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>

                            {pendingTransaction.stageNumber === 8 && (
                              <Button
                                variant="outline"
                                onClick={handleWorkflowDrop}
                                disabled={!workflowComment.trim() || !!processingAction}
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                              >
                                {processingAction === 'dropped' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Drop to Next FY
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog - Clean modal without backdrop */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-red-200 p-6 max-w-md w-full mx-4 pointer-events-auto transform animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              {/* Icon and Header */}
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Delete MOM Entry?
                </h3>
                <p className="text-sm text-red-600 font-medium mb-3">
                  This action cannot be undone
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Are you sure you want to delete this Minutes of Meeting entry? 
                  All associated information will be permanently removed from the system.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={cancelDeleteMom}
                  className="px-6 py-2 min-w-[100px]"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteMom}
                  className="px-6 py-2 min-w-[100px] bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}