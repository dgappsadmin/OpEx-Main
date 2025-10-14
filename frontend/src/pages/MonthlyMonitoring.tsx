import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Lock, 
  Filter, 
  RefreshCw, 
  FileText, 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  PieChart, 
  Target, 
  DollarSign, 
  Activity,
  IndianRupee,
  Search,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { monthlyMonitoringAPI, workflowTransactionAPI } from '@/lib/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  site: string;
}

interface Initiative {
  id: number;
  initiativeNumber: string;
  initiativeTitle: string;
  initiativeStatus: string;
  site: string;
  assignedUserEmail: string;
  expectedSavings: number;
  description?: string;
  stageNumber?: number;
}

interface MonthlyMonitoringEntry {
  id?: number;
  kpiDescription: string;
  monitoringMonth: string;
  targetValue: number;
  achievedValue?: number;
  deviation?: number;
  deviationPercentage?: number;
  remarks?: string;
  category?: string;
  isFinalized: string; // Changed to 'Y' or 'N'
  faApproval: string; // Changed to 'Y' or 'N'
  faComments?: string;
  enteredBy: string;
}

interface MonthlyMonitoringProps {
  user: User;
}

export default function MonthlyMonitoring({ user }: MonthlyMonitoringProps) {
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MonthlyMonitoringEntry | null>(null);
  const [formData, setFormData] = useState<Partial<MonthlyMonitoringEntry>>({});
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'assigned'>('all');
  const [viewTab, setViewTab] = useState<'overview' | 'monthly' | 'analytics' | 'summary'>('overview');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Finalized entry alert states
  const [showFinalizedAlert, setShowFinalizedAlert] = useState(false);
  const [attemptedAction, setAttemptedAction] = useState<string>('');
  
  // Finalize confirmation states
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [entryToFinalize, setEntryToFinalize] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemsPerPage = 8; // Optimized for better display

  // Fetch initiatives where Stage 8 is approved and user has access
  const { data: approvedInitiatives = [], isLoading: initiativesLoading } = useQuery({
    queryKey: ['stage8-approved-initiatives', user.email, user.site],
    queryFn: async () => {
      try {
        const response = await monthlyMonitoringAPI.getApprovedInitiatives(user.email, user.site);
        
        // Map the response to the expected format
        return response.data.map((item: any) => ({
          id: item.initiativeId,
          initiativeNumber: item.initiativeNumber,
          initiativeTitle: item.initiativeTitle,
          initiativeStatus: item.initiativeStatus,
          site: item.site,
          assignedUserEmail: item.assignedUserEmail || item.pendingWith,
          expectedSavings: item.expectedSavings || 0,
          description: item.description,
          stageNumber: item.stageNumber
        }));
      } catch (error) {
        console.error('Error fetching approved initiatives:', error);
        return [];
      }
    },
  });

  // Fetch assigned initiatives where user is the assigned IL
  const { data: assignedInitiatives = [], isLoading: assignedLoading } = useQuery({
    queryKey: ['assigned-monthly-monitoring-initiatives', user.email],
    queryFn: async () => {
      try {
        const response = await monthlyMonitoringAPI.getAssignedInitiatives(user.email);
        
        // Map the response to the expected format
        return response.data.map((item: any) => ({
          id: item.initiativeId,
          initiativeNumber: item.initiativeNumber,
          initiativeTitle: item.initiativeTitle,
          initiativeStatus: item.initiativeStatus,
          site: item.site,
          assignedUserEmail: item.assignedUserEmail || item.pendingWith,
          expectedSavings: item.expectedSavings || 0,
          description: item.description,
          stageNumber: item.stageNumber
        }));
      } catch (error) {
        console.error('Error fetching assigned monthly monitoring initiatives:', error);
        return [];
      }
    },
  });

  // Get current initiatives based on active tab
  const currentInitiatives = activeTab === 'all' ? approvedInitiatives : assignedInitiatives;
  const isCurrentlyLoading = activeTab === 'all' ? initiativesLoading : assignedLoading;

  // Filter and search initiatives
  const filteredInitiatives = currentInitiatives.filter((initiative: Initiative) => {
    // Filter out Rejected and Dropped initiatives
    if (initiative.initiativeStatus === 'Rejected' || initiative.initiativeStatus === 'Dropped') {
      return false;
    }

    // Enhanced search - include site and description in search
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchTerm || 
                         initiative.initiativeTitle.toLowerCase().includes(searchLower) ||
                         initiative.initiativeNumber.toLowerCase().includes(searchLower) ||
                         initiative.site.toLowerCase().includes(searchLower) ||
                         (initiative.description && initiative.description.toLowerCase().includes(searchLower));
    
    // Status filtering with exact match
    const matchesStatus = filterStatus === 'ALL' || initiative.initiativeStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic for initiatives
  const paginatedInitiatives = filteredInitiatives.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredInitiatives.length / itemsPerPage);

  // Fetch monitoring entries for selected initiative
  const { data: monitoringEntries = [], isLoading: entriesLoading, refetch: refetchEntries } = useQuery({
    queryKey: ['monitoring-entries', selectedInitiativeId],
    queryFn: async () => {
      if (!selectedInitiativeId) return [];
      const result = await monthlyMonitoringAPI.getMonitoringEntries(selectedInitiativeId);
      return result.data || [];
    },
    enabled: !!selectedInitiativeId,
  });

  // Fetch monitoring entries by month
  const { data: monthlyEntries = [], isLoading: monthlyLoading } = useQuery({
    queryKey: ['monitoring-entries-by-month', selectedInitiativeId, selectedMonth],
    queryFn: async () => {
      if (!selectedInitiativeId || !selectedMonth) return [];
      const result = await monthlyMonitoringAPI.getMonitoringEntriesByMonth(selectedInitiativeId, selectedMonth);
      return result.data || [];
    },
    enabled: !!selectedInitiativeId && !!selectedMonth,
  });

  // Fetch workflow transactions for selected initiative to check stage approval status
  const { data: workflowTransactions = [] } = useQuery({
    queryKey: ['workflow-transactions-monthly', selectedInitiativeId],
    queryFn: async () => {
      if (!selectedInitiativeId) return [];
      const result = await workflowTransactionAPI.getTransactions(selectedInitiativeId);
      return result || [];
    },
    enabled: !!selectedInitiativeId,
  });

  // Mutations for monitoring operations
  const createMutation = useMutation({
    mutationFn: async (entry: MonthlyMonitoringEntry) => {
      const result = await monthlyMonitoringAPI.createMonitoringEntry(selectedInitiativeId!, {
        ...entry,
        enteredBy: user.email,
        initiativeId: selectedInitiativeId
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      toast({ title: "Success", description: "Monitoring entry created successfully" });
      setIsDialogOpen(false);
      setFormData({});
      refetchEntries();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create monitoring entry", 
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, entry }: { id: number; entry: MonthlyMonitoringEntry }) => {
      const result = await monthlyMonitoringAPI.updateMonitoringEntry(id, entry);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      toast({ title: "Success", description: "Monitoring entry updated successfully" });
      setIsDialogOpen(false);
      setEditingEntry(null);
      setFormData({});
      refetchEntries();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update monitoring entry", 
        variant: "destructive" 
      });
    }
  });

  const finalizeMutation = useMutation({
    mutationFn: async ({ id, isFinalized }: { id: number; isFinalized: string }) => {
      const result = await monthlyMonitoringAPI.updateFinalizationStatus(id, isFinalized);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      toast({ title: "Success", description: "Entry finalization status updated" });
      refetchEntries();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update finalization status", 
        variant: "destructive" 
      });
    }
  });

  const faApprovalMutation = useMutation({
    mutationFn: async ({ id, faApproval, faComments }: { id: number; faApproval: string; faComments?: string }) => {
      const result = await monthlyMonitoringAPI.updateFAApproval(id, faApproval, faComments);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      toast({ title: "Success", description: "F&A approval status updated" });
      refetchEntries();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update F&A approval", 
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await monthlyMonitoringAPI.deleteMonitoringEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      toast({ title: "Success", description: "Monitoring entry deleted successfully" });
      refetchEntries();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete monitoring entry", 
        variant: "destructive" 
      });
    }
  });

  // Prepare chart data - Consolidate entries by month
  const chartData = (() => {
    const monthlyData = new Map<string, {
      month: string;
      target: number;
      achieved: number;
      entries: number;
      kpiList: string[];
    }>();

    // Aggregate entries by month
    monitoringEntries.forEach((entry: MonthlyMonitoringEntry) => {
      const month = entry.monitoringMonth;
      const existing = monthlyData.get(month);

      if (existing) {
        existing.target += entry.targetValue;
        existing.achieved += (entry.achievedValue || 0);
        existing.entries += 1;
        existing.kpiList.push(entry.kpiDescription);
      } else {
        monthlyData.set(month, {
          month,
          target: entry.targetValue,
          achieved: entry.achievedValue || 0,
          entries: 1,
          kpiList: [entry.kpiDescription]
        });
      }
    });

    // Convert to array and calculate deviation
    return Array.from(monthlyData.values()).map(data => ({
      month: data.month,
      target: data.target,
      achieved: data.achieved,
      deviation: data.achieved - data.target,
      deviationPercentage: data.target > 0 ? ((data.achieved - data.target) / data.target) * 100 : 0,
      entries: data.entries,
      kpi: data.entries > 1 ? `${data.entries} entries` : data.kpiList[0]
    })).sort((a, b) => a.month.localeCompare(b.month));
  })();

  // Calculate summary statistics
  const summaryStats = {
    totalEntries: monitoringEntries.length,
    finalizedEntries: monitoringEntries.filter((e: MonthlyMonitoringEntry) => e.isFinalized === 'Y').length,
    approvedEntries: monitoringEntries.filter((e: MonthlyMonitoringEntry) => e.faApproval === 'Y').length,
    averageAchievement: monitoringEntries.length > 0 
      ? monitoringEntries.reduce((sum: number, e: MonthlyMonitoringEntry) => 
          sum + (e.achievedValue || 0), 0) / monitoringEntries.length 
      : 0,
    totalSavings: monitoringEntries.reduce((sum: number, e: MonthlyMonitoringEntry) => 
      sum + (e.achievedValue || 0), 0)
  };

  const pieData = [
    { name: 'Finalized', value: summaryStats.finalizedEntries, color: '#10b981' },
    { name: 'Pending', value: summaryStats.totalEntries - summaryStats.finalizedEntries, color: '#f59e0b' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kpiDescription || !formData.targetValue || !formData.monitoringMonth || 
        !formData.category || !formData.achievedValue || !formData.remarks) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Validate month format
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(formData.monitoringMonth!)) {
      toast({ title: "Error", description: "Please enter a valid month in YYYY-MM format", variant: "destructive" });
      return;
    }

    const entryData = {
      ...formData,
      isFinalized: 'N', // Changed to 'N' string
      faApproval: 'N',  // Changed to 'N' string
      category: formData.category
    } as MonthlyMonitoringEntry;

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id!, entry: entryData });
    } else {
      createMutation.mutate(entryData);
    }
  };

  // Helper function to check if Stage 9 (Savings Monitoring) is approved
  const isStage9Approved = () => {
    const stage9Transaction = workflowTransactions.find((transaction: any) => transaction.stageNumber === 9);
    return stage9Transaction && stage9Transaction.approveStatus === 'approved';
  };

  const handleEdit = (entry: MonthlyMonitoringEntry) => {
    // Check if entry is finalized and show alert
    if (entry.isFinalized === 'Y') {
      setAttemptedAction('edit');
      setShowFinalizedAlert(true);
      return;
    }
    
    setEditingEntry(entry);
    setFormData(entry);
    setIsDialogOpen(true);
  };

  const handleDelete = (entry: MonthlyMonitoringEntry) => {
    // Check if entry is finalized and show alert
    if (entry.isFinalized === 'Y') {
      setAttemptedAction('delete');
      setShowFinalizedAlert(true);
      return;
    }
    
    // Proceed with normal delete
    deleteMutation.mutate(entry.id!);
  };

  const handleFinalizedAlertClose = () => {
    setShowFinalizedAlert(false);
    setAttemptedAction('');
  };

  // Finalize confirmation handlers
  const handleFinalize = (entry: MonthlyMonitoringEntry) => {
    // Show confirmation dialog instead of direct finalization
    setEntryToFinalize(entry.id!);
    setShowFinalizeConfirm(true);
  };

  const confirmFinalize = () => {
    if (!entryToFinalize) return;
    
    // Proceed with finalization
    finalizeMutation.mutate({ id: entryToFinalize, isFinalized: 'Y' });
    
    // Reset confirmation state
    setShowFinalizeConfirm(false);
    setEntryToFinalize(null);
  };

  const cancelFinalize = () => {
    setShowFinalizeConfirm(false);
    setEntryToFinalize(null);
  };

  // Role-based permission functions with stage 9 restriction
  const canEdit = (entry: MonthlyMonitoringEntry) => {
    // PRIMARY CHECK: If entry is finalized - NO ONE can edit
    if (entry.isFinalized === 'Y') {
      return false; // Entry is finalized - cannot be edited
    }

    // Get selected initiative to check stage status SECOND
    const selectedInitiative = currentInitiatives.find((i: Initiative) => i.id === selectedInitiativeId);
    if (!selectedInitiative) return false;
    
    // SECONDARY CHECK: If stage 9 has been approved - NO ONE can edit (applies to ALL users)
    if (isStage9Approved() || selectedInitiative.initiativeStatus === 'Completed') {
      console.log('DEBUG - Monthly Monitoring CUD Operations BLOCKED - Stage 9 approved or Initiative completed');
      return false; // Stage 9 has been approved - READ ONLY for ALL users
    }
    
    // TERTIARY CHECK: Role-based permissions (only after stage and finalization checks pass)
    if (user.role !== 'IL') return false;
    
    // For assigned initiatives tab, user can edit
    if (activeTab === 'assigned') return true;
    
    // For all initiatives tab, check if user is assigned to this specific initiative
    return selectedInitiative && selectedInitiative.assignedUserEmail === user.email;
  };

  const canApprove = () => {
    // Get selected initiative to check stage status FIRST
    const selectedInitiative = currentInitiatives.find((i: Initiative) => i.id === selectedInitiativeId);
    if (!selectedInitiative) return false;
    
    // PRIMARY CHECK: If stage 9 has been approved - NO ONE can approve (applies to ALL users)
    if (isStage9Approved() || selectedInitiative.initiativeStatus === 'Completed') {
      return false; // Stage 9 has been approved - READ ONLY for ALL users
    }
    
    // SECONDARY CHECK: Role-based permissions (only after stage check passes)
    if (user.role !== 'IL') return false;
    
    // For assigned initiatives tab, user can approve
    if (activeTab === 'assigned') return true;
    
    // For all initiatives tab, check if user is assigned to this specific initiative
    return selectedInitiative && selectedInitiative.assignedUserEmail === user.email;
  };

  const canFinalize = (entry: MonthlyMonitoringEntry) => {
    // Get selected initiative to check stage status FIRST
    const selectedInitiative = currentInitiatives.find((i: Initiative) => i.id === selectedInitiativeId);
    if (!selectedInitiative) return false;
    
    // PRIMARY CHECK: If stage 9 has been approved - NO ONE can finalize (applies to ALL users)
    if (isStage9Approved() || selectedInitiative.initiativeStatus === 'Completed') {
      return false; // Stage 9 has been approved - READ ONLY for ALL users
    }
    
    // SECONDARY CHECK: Role-based permissions (only after stage check passes)
    if (user.role !== 'IL') return false;
    
    // For assigned initiatives tab, user can finalize
    if (activeTab === 'assigned') return true;
    
    // For all initiatives tab, check if user is assigned to this specific initiative
    return selectedInitiative && selectedInitiative.assignedUserEmail === user.email;
  };

  const canCreate = () => {
    // Get selected initiative to check stage status FIRST
    const selectedInitiative = currentInitiatives.find((i: Initiative) => i.id === selectedInitiativeId);
    if (!selectedInitiative) return false;
    
    // PRIMARY CHECK: If stage 9 has been approved - NO ONE can create (applies to ALL users)
    if (isStage9Approved() || selectedInitiative.initiativeStatus === 'Completed') {
      return false; // Stage 9 has been approved - READ ONLY for ALL users
    }
    
    // SECONDARY CHECK: Role-based permissions (only after stage check passes)
    if (user.role !== 'IL') return false;
    
    // For assigned initiatives tab, user can create
    if (activeTab === 'assigned') return true;
    
    // For all initiatives tab, check if user is assigned to this specific initiative
    return selectedInitiative && selectedInitiative.assignedUserEmail === user.email;
  };

  const canDelete = (entry: MonthlyMonitoringEntry) => {
    // PRIMARY CHECK: If entry is finalized - NO ONE can delete
    if (entry.isFinalized === 'Y') {
      return false; // Entry is finalized - cannot be deleted
    }

    // Get selected initiative to check stage status
    const selectedInitiative = currentInitiatives.find((i: Initiative) => i.id === selectedInitiativeId);
    if (!selectedInitiative) return false;
    
    // SECONDARY CHECK: If stage 9 has been approved - NO ONE can delete (applies to ALL users)
    if (isStage9Approved() || selectedInitiative.initiativeStatus === 'Completed') {
      return false; // Stage 9 has been approved - READ ONLY for ALL users
    }
    
    // TERTIARY CHECK: Role-based permissions (only after stage and finalization checks pass)
    if (user.role !== 'IL') return false;
    
    // For assigned initiatives tab, user can delete
    if (activeTab === 'assigned') return true;
    
    // For all initiatives tab, check if user is assigned to this specific initiative
    return selectedInitiative && selectedInitiative.assignedUserEmail === user.email;
  };

  // Smart currency formatting that handles all amounts automatically and removes trailing zeros
  const formatCurrency = (amount: number): string => {
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

  // Summary stats for consistent design
  const overviewStats = [
    {
      title: "Total Entries",
      value: summaryStats.totalEntries.toString(),
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-blue-600",
      description: `${summaryStats.finalizedEntries} finalized`
    },
    {
      title: "Approved Entries",
      value: summaryStats.approvedEntries.toString(),
      change: "+8%",
      trend: "up",
      icon: CheckCircle,
      color: "text-green-600",
      description: "F&A approved"
    },
    {
      title: "Total Savings",
      value: formatCurrency(summaryStats.totalSavings),
      change: "+25%",
      trend: "up",
      icon: IndianRupee,
      color: "text-emerald-600",
      description: "Achieved savings"
    },
    {
      title: "Avg Achievement",
      value: formatCurrency(summaryStats.averageAchievement),
      change: "+15%",
      trend: "up",
      icon: Target,
      color: "text-purple-600",
      description: "Per entry average"
    }
  ];

  if (isCurrentlyLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading Monthly Monitoring...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle global clicks to prevent unwanted initiative selections
  const handleGlobalClick = (e: React.MouseEvent) => {
    // Only allow initiative selection through explicit card clicks, but don't interfere with dialog triggers
    const target = e.target as HTMLElement;
    if (!target.closest('.initiative-card') && !target.closest('[role="dialog"]') && !target.closest('[data-radix-collection-item]')) {
      e.stopPropagation();
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-6xl" onClick={handleGlobalClick}>
      {/* Header - Match Dashboard style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Savings Monitoring Sheet
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {(() => {
              if (selectedInitiativeId) {
                const selectedInitiative = currentInitiatives.find((i: Initiative) => i.id === selectedInitiativeId);
                if (selectedInitiative && (isStage9Approved() || selectedInitiative.initiativeStatus === 'Completed')) {
                  return 'View monthly monitoring entries';
                }
              }
              return user.role === 'IL' 
                ? 'Monthly monitoring and validation of savings achievements' 
                : 'View monthly monitoring entries';
            })()}
          </p>
        </div>
        {selectedInitiativeId && canCreate() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingEntry(null); 
                  setFormData({});
                  setIsDialogOpen(true); // Explicitly open dialog
                }} 
                className="gap-2 shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-9 px-4 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Saving Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg font-semibold">
                  {editingEntry ? 'Edit Saving Entry' : 'Add Saving Entry'}
                </DialogTitle>
              </DialogHeader>
              <form 
                onSubmit={(e) => {
                  e.stopPropagation();
                  handleSubmit(e);
                }} 
                className="space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="kpiDescription" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Saving Description *
                    </Label>
                    <Input
                      id="kpiDescription"
                      value={formData.kpiDescription || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, kpiDescription: e.target.value });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      placeholder="Enter KPI description (e.g., Monthly Cost Savings)"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="monitoringMonth" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Monitoring Month *
                    </Label>
                    <Input
                      id="monitoringMonth"
                      type="month"
                      value={formData.monitoringMonth || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, monitoringMonth: e.target.value });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Category *
                    </Label>
                    <Select 
                      value={formData.category || ''} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger className="h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RMC">RMC (Raw Material Cost)</SelectItem>
                        <SelectItem value="Spent Acid">Spent Acid</SelectItem>
                        <SelectItem value="Environment">Environment</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Target Value *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
                      placeholder="Enter target value"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="achievedValue" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Achieved Value *
                    </Label>
                    <Input
                      id="achievedValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.achievedValue || ''}
                      onChange={(e) => setFormData({ ...formData, achievedValue: parseFloat(e.target.value) })}
                      placeholder="Enter achieved value"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {formData.achievedValue && formData.targetValue && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Deviation:</strong> {formatCurrency((formData.achievedValue - formData.targetValue))}
                      ({(((formData.achievedValue - formData.targetValue) / formData.targetValue) * 100).toFixed(1)}%)
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="remarks" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Remarks & Analysis *
                  </Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Enter detailed remarks, analysis, and observations"
                    className="min-h-[80px] border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDialogOpen(false);
                    }}
                    className="h-9 px-4 border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {editingEntry ? 'Update' : 'Create'} Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
        {/* {selectedInitiativeId && (() => {
          const selectedInitiative = currentInitiatives.find((i: Initiative) => i.id === selectedInitiativeId);
          return selectedInitiative && ((selectedInitiative.stageNumber && selectedInitiative.stageNumber > 9) || 
                 selectedInitiative.initiativeStatus === 'Completed');
        })() && (
          <Alert className="bg-amber-50 border-amber-200">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Read-Only Access:</strong> This initiative has moved beyond stage 9 (Monthly Monitoring) or has been completed. All monitoring entries are now read-only and no modifications are allowed for any user.
            </AlertDescription>
          </Alert>
        )} */}
      </div>

      {!selectedInitiativeId ? (
        <div>
          {/* Tabs for All vs Assigned Initiatives */}
          <div className="mb-4">
            <Tabs value={activeTab} onValueChange={(value: string) => {
              setActiveTab(value as 'all' | 'assigned');
              setCurrentPage(1); // Reset pagination when switching tabs
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  All Initiatives
                </TabsTrigger>
                <TabsTrigger value="assigned" className="flex items-center gap-1.5 text-xs">
                  <Target className="h-3.5 w-3.5" />
                  Your Assigned Initiatives
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filters - Enhanced style */}
          <Card className="shadow-sm mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4 text-blue-600" />
                Initiative Filters
              </CardTitle>
              <CardDescription className="text-xs">
                {activeTab === 'assigned' 
                  ? 'Search and filter initiatives assigned to you' 
                  : `Search and filter all initiatives${user.site === 'CORP' ? ' (all sites)' : ` for ${user.site} site`}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="Search by title, number, site, or description..."
                    value={searchTerm}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSearchTerm(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm('');
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Select value={filterStatus} onValueChange={(value) => {
                    setFilterStatus(value);
                  }}>
                    <SelectTrigger className="sm:w-40 h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent onClick={(e) => e.stopPropagation()}>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Results counter */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="text-sm text-muted-foreground">
                  {filteredInitiatives.length === currentInitiatives.length ? (
                    `Showing all ${currentInitiatives.length} initiatives`
                  ) : (
                    `Showing ${filteredInitiatives.length} of ${currentInitiatives.length} initiatives`
                  )}
                  {searchTerm && (
                    <span className="ml-2 text-blue-600">
                      matching "{searchTerm}"
                    </span>
                  )}
                  {filterStatus !== 'ALL' && (
                    <span className="ml-2 text-green-600">
                      with status "{filterStatus}"
                    </span>
                  )}
                </div>
                {(searchTerm || filterStatus !== 'ALL') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                      setFilterStatus('ALL');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {filteredInitiatives.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="text-center py-12">
                {currentInitiatives.length === 0 ? (
                  <>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {activeTab === 'assigned' ? 'No Assigned Initiatives' : 'No Initiatives Available'}
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      {activeTab === 'assigned' 
                        ? 'You currently have no initiatives assigned to you as Initiative Lead where Monthly Monitoring is available.'
                        : 'You currently have no initiatives where Stage 9 (Monthly Monitoring) has been approved.'}
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Matching Initiatives</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
                      No initiatives found matching your current search criteria.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {searchTerm && (
                        <p>• Try different search terms or check spelling</p>
                      )}
                      {filterStatus !== 'ALL' && (
                        <p>• Try changing the status filter</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm('');
                        setFilterStatus('ALL');
                      }}
                      className="mt-4"
                    >
                      Clear All Filters
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {paginatedInitiatives.map((initiative: Initiative) => (
                  <Card
                    key={initiative.id}
                    className="initiative-card cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] shadow-sm group relative"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedInitiativeId(initiative.id);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
                    <CardHeader 
                      className="pb-3 relative z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedInitiativeId(initiative.id);
                      }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle 
                            className="text-sm font-semibold line-clamp-1 mb-2 pointer-events-none"
                          >
                            {initiative.initiativeNumber}
                          </CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`text-xs pointer-events-none ${
                              initiative.initiativeStatus === 'Completed' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : initiative.initiativeStatus === 'In Progress'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {initiative.initiativeStatus}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent 
                      className="pt-0 relative z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedInitiativeId(initiative.id);
                      }}
                    >
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 pointer-events-none">
                        {initiative.initiativeTitle}
                      </p>
                      <div className="space-y-2 text-xs pointer-events-none">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Site:</span>
                          <span className="font-medium">{initiative.site}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Savings:</span>
                          <span className="font-medium text-green-600">{formatCurrency(initiative.expectedSavings)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                    }}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm pointer-events-none">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                Monitoring for: {currentInitiatives.find((i: Initiative) => i.id === selectedInitiativeId)?.initiativeNumber}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentInitiatives.find((i: Initiative) => i.id === selectedInitiativeId)?.initiativeTitle}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedInitiativeId(null);
              }}
            >
              Back to Initiatives
            </Button>
          </div>

          {/* Summary Stats Cards - Dashboard pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {overviewStats.map((stat) => (
              <Card key={stat.title} className="relative overflow-hidden group hover:shadow-md transition-all duration-200 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 pt-3 px-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="pb-3 relative z-10 px-3">
                  <div className="text-xl font-bold break-words mb-1">
                    {stat.value}
                  </div>
                  <p className="text-2xs text-muted-foreground mb-1">
                    {stat.description}
                  </p>
                  <p className={`text-2xs flex items-center gap-1 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-2.5 w-2.5" />
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tab Navigation - Match Dashboard style */}
          <Tabs value={viewTab} onValueChange={(value) => setViewTab(value as 'overview' | 'monthly' | 'analytics' | 'summary')} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto lg:mx-0 h-9" onClick={(e) => e.stopPropagation()}>
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-1.5 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="monthly" 
                className="flex items-center gap-1.5 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Calendar className="h-3.5 w-3.5" />
                Monthly
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-1.5 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Activity className="h-3.5 w-3.5" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="summary" 
                className="flex items-center gap-1.5 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <PieChart className="h-3.5 w-3.5" />
                Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              {entriesLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Loading monitoring entries...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {monitoringEntries.length === 0 ? (
                    <Card className="shadow-sm">
                      <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Monitoring Entries</h3>
                        <p className="text-muted-foreground text-sm">No monitoring entries found for this initiative.</p>
                        <p className="text-sm text-muted-foreground mt-2">Click "Add Saving Entry" to get started.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Monitoring Entries
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Track and manage savings monitoring entries
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Month</TableHead>
                                <TableHead className="text-xs">KPI Description</TableHead>
                                <TableHead className="text-xs">Category</TableHead>
                                <TableHead className="text-xs">Target</TableHead>
                                <TableHead className="text-xs">Achieved</TableHead>
                                <TableHead className="text-xs">Deviation</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                                <TableHead className="text-xs">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monitoringEntries.map((entry: MonthlyMonitoringEntry) => (
                                <TableRow key={entry.id} className="hover:bg-muted/50">
                                  <TableCell className="font-medium text-xs">{entry.monitoringMonth}</TableCell>
                                  <TableCell className="text-xs">
                                    <div>
                                      <p className="font-medium">{entry.kpiDescription}</p>
                                      {entry.remarks && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">{entry.remarks}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    <Badge variant="outline" className="text-xs">
                                      {entry.category || 'General'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs">{formatCurrency(entry.targetValue)}</TableCell>
                                  <TableCell className="text-xs">
                                    {entry.achievedValue ? formatCurrency(entry.achievedValue) : '-'}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {entry.deviation ? (
                                      <div className="flex items-center space-x-1">
                                        <span className={`font-medium ${entry.deviation < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                          {entry.deviation >= 0 ? '+' : ''}{formatCurrency(Math.abs(entry.deviation))}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          ({entry.deviationPercentage?.toFixed(1)}%)
                                        </span>
                                      </div>
                                    ) : '-'}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    <div className="flex flex-wrap gap-1">
                                      {entry.isFinalized === 'Y' && (
                                        <Badge variant="outline" className="text-xs bg-blue-50">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Finalized
                                        </Badge>
                                      )}
                                      {/* {entry.faApproval === 'Y' && (
                                        <Badge variant="outline" className="text-xs bg-green-50">
                                          <Target className="h-3 w-3 mr-1" />
                                          F&A Approved
                                        </Badge>
                                      )} */}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                                      {(canEdit(entry) || entry.isFinalized === 'Y') && (
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleEdit(entry);
                                          }}
                                          disabled={entry.isFinalized === 'Y'}
                                          className={entry.isFinalized === 'Y' ? 'opacity-50 cursor-not-allowed' : ''}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      )}
                                      {canFinalize(entry) && entry.isFinalized !== 'Y' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleFinalize(entry);
                                          }}
                                        >
                                          <FileText className="h-3 w-3" />
                                        </Button>
                                      )}
                                      {/* {canApprove() && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            faApprovalMutation.mutate({ 
                                              id: entry.id!, 
                                              faApproval: entry.faApproval === 'Y' ? 'N' : 'Y' 
                                            });
                                          }}
                                        >
                                          <Target className="h-3 w-3" />
                                        </Button>
                                      )} */}
                                      {(canDelete(entry) || entry.isFinalized === 'Y') && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(entry);
                                          }}
                                          disabled={entry.isFinalized === 'Y'}
                                          className={entry.isFinalized === 'Y' ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="monthly" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Monthly View
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Filter entries by specific month
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                      <Label htmlFor="monthSelect" className="text-sm font-medium text-gray-700 whitespace-nowrap">Month:</Label>
                      <Input
                        id="monthSelect"
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedMonth(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-40 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                      <Badge variant="outline" className="whitespace-nowrap pointer-events-none">
                        {monthlyEntries.length} entries
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {monthlyLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Loading monthly entries...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {monthlyEntries.length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No entries found for {selectedMonth}.</p>
                        </div>
                      ) : (
                        monthlyEntries.map((entry: MonthlyMonitoringEntry) => (
                          <Card key={entry.id} className="shadow-sm">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base">{entry.kpiDescription}</CardTitle>
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {entry.category || 'General'}
                                  </Badge>
                                </div>
                                <div className="flex space-x-2">
                                  {entry.isFinalized === 'Y' && <Badge variant="outline" className="text-xs">Finalized</Badge>}
                                  {entry.faApproval === 'Y' && <Badge variant="outline" className="text-xs">F&A Approved</Badge>}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                  <Label className="text-xs font-medium text-blue-600">Target Value</Label>
                                  <p className="text-lg font-bold text-blue-700">{formatCurrency(entry.targetValue)}</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                  <Label className="text-xs font-medium text-green-600">Achieved Value</Label>
                                  <p className="text-lg font-bold text-green-700">{entry.achievedValue ? formatCurrency(entry.achievedValue) : '-'}</p>
                                </div>
                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                  <Label className="text-xs font-medium text-purple-600">Deviation</Label>
                                  <p className={`text-lg font-bold ${entry.deviation && entry.deviation < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {entry.deviation ? `${entry.deviation >= 0 ? '+' : ''}${formatCurrency(Math.abs(entry.deviation))}` : '-'}
                                  </p>
                                  <p className="text-xs text-purple-500">
                                    {entry.deviationPercentage ? `${entry.deviationPercentage.toFixed(1)}%` : ''}
                                  </p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <Label className="text-xs font-medium text-gray-600">Status</Label>
                                  <div className="flex flex-col space-y-1 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {entry.isFinalized === 'Y' ? '✓ Finalized' : '○ Draft'}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {entry.faApproval === 'Y' ? '✓ F&A Approved' : '○ Pending'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              {entry.remarks && (
                                <div className="mt-4 p-3 bg-muted rounded-lg">
                                  <Label className="text-sm font-medium">Remarks & Analysis</Label>
                                  <p className="text-sm mt-1">{entry.remarks}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              {chartData.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Data for Analytics</h3>
                    <p className="text-muted-foreground text-sm">Add monitoring entries to see analytics and trends.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Total Months</p>
                            <p className="text-2xl font-bold text-blue-600">{chartData.length}</p>
                          </div>
                          <Calendar className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Total Entries</p>
                            <p className="text-2xl font-bold text-green-600">
                              {chartData.reduce((sum, data) => sum + data.entries, 0)}
                            </p>
                          </div>
                          <FileText className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Avg Monthly Achievement</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {formatCurrency(chartData.length > 0 ? (chartData.reduce((sum, data) => sum + data.achieved, 0) / chartData.length) : 0)}
                            </p>
                          </div>
                          <Target className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Activity className="h-4 w-4 text-blue-600" />
                          Target vs Achievement Trends
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Monthly targets and achievements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [
                                formatCurrency(Number(value)), 
                                name === 'target' ? 'Target Total' : 'Achieved Total'
                              ]}
                              labelFormatter={(month) => {
                                const monthData = chartData.find(d => d.month === month);
                                return `${month} (${monthData?.entries || 1} ${monthData?.entries === 1 ? 'entry' : 'entries'})`;
                              }}
                            />
                            <Line type="monotone" dataKey="target" stroke="#3b82f6" strokeWidth={2} name="target" />
                            <Line type="monotone" dataKey="achieved" stroke="#22c55e" strokeWidth={2} name="achieved" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <BarChart3 className="h-4 w-4 text-green-600" />
                          Monthly Total Achievements
                        </CardTitle>
                        <CardDescription className="text-xs">
                         Monthly achievement values
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(Number(value)), 'Total Achievement']}
                              labelFormatter={(month) => {
                                const monthData = chartData.find(d => d.month === month);
                                return `${month} (${monthData?.entries || 1} ${monthData?.entries === 1 ? 'entry' : 'entries'})`;
                              }}
                            />
                            <Bar dataKey="achieved" fill="#22c55e" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Month Breakdown */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        Monthly Breakdown
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Detailed view of monthly data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {chartData.map((data) => (
                          <div key={data.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{data.month}</h4>
                              <p className="text-xs text-muted-foreground">
                                {data.entries} {data.entries === 1 ? 'entry' : 'entries'} Total
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-xs font-medium text-blue-600">Target</p>
                                <p className="text-sm font-semibold">{formatCurrency(data.target)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-green-600">Achieved</p>
                                <p className="text-sm font-semibold">{formatCurrency(data.achieved)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-purple-600">Deviation</p>
                                <p className={`text-sm font-semibold ${data.deviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {data.deviation >= 0 ? '+' : ''}{formatCurrency(Math.abs(data.deviation))}
                                </p>
                                <p className={`text-xs ${data.deviationPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ({data.deviationPercentage >= 0 ? '+' : ''}{data.deviationPercentage.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PieChart className="h-4 w-4 text-purple-600" />
                      Finalization Status
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Distribution of finalized vs pending entries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4 text-blue-600" />
                      Summary Statistics
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Key performance indicators and achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{summaryStats.totalEntries}</div>
                        <div className="text-xs text-muted-foreground">Total Entries</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{summaryStats.approvedEntries}</div>
                        <div className="text-xs text-muted-foreground">F&A Approved</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Savings</span>
                        <span className="font-medium text-sm text-green-600">
                          {formatCurrency(summaryStats.totalSavings)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Finalization Rate</span>
                        <span className="font-medium text-sm">
                          {summaryStats.totalEntries > 0 
                            ? ((summaryStats.finalizedEntries / summaryStats.totalEntries) * 100).toFixed(1) 
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Average Achievement</span>
                        <span className="font-medium text-sm">{formatCurrency(summaryStats.averageAchievement)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Finalized Entry Alert Modal - Clean modal without backdrop */}
      {showFinalizedAlert && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-amber-200 p-6 max-w-md w-full mx-4 pointer-events-auto transform animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              {/* Icon and Header */}
              <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Entry is Finalized
                </h3>
                <p className="text-sm text-amber-600 font-medium mb-3">
                  Action not allowed
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  This monitoring entry has been finalized and cannot be {attemptedAction === 'edit' ? 'edited' : 'deleted'}. 
                  Finalized entries are locked to maintain data integrity and audit trail.
                </p>
              </div>
              
              {/* Action Button */}
              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleFinalizedAlertClose}
                  className="px-6 py-2 min-w-[100px] bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Understood
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Confirmation Modal */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-6 max-w-md w-full mx-4 pointer-events-auto transform animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              {/* Icon and Header */}
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Finalize Entry?
                </h3>
                <p className="text-sm text-blue-600 font-medium mb-3">
                  This action cannot be undone
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Are you sure you want to finalize this monitoring entry? 
                  Once finalized, the entry will be locked and cannot be edited or deleted.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={cancelFinalize}
                  className="px-6 py-2 min-w-[100px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmFinalize}
                  className="px-6 py-2 min-w-[100px] bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Finalize
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}