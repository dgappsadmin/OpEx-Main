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
  IndianRupee
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { monthlyMonitoringAPI } from '@/lib/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
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

  // Filter and search initiatives
  const filteredInitiatives = approvedInitiatives.filter((initiative: Initiative) => {
    const matchesSearch = initiative.initiativeTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         initiative.initiativeNumber.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Prepare chart data
  const chartData = monitoringEntries.map((entry: MonthlyMonitoringEntry) => ({
    month: entry.monitoringMonth,
    target: entry.targetValue,
    achieved: entry.achievedValue || 0,
    deviation: entry.deviation || 0,
    deviationPercentage: entry.deviationPercentage || 0,
    kpi: entry.kpiDescription
  })).sort((a, b) => a.month.localeCompare(b.month));

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
    if (!formData.kpiDescription || !formData.targetValue || !formData.monitoringMonth) {
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
      category: formData.category || 'RMC'
    } as MonthlyMonitoringEntry;

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id!, entry: entryData });
    } else {
      createMutation.mutate(entryData);
    }
  };

  const handleEdit = (entry: MonthlyMonitoringEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsDialogOpen(true);
  };

  const canEdit = (entry: MonthlyMonitoringEntry) => {
    // VIEWER role cannot edit anything
    if (user.role === 'VIEWER') return false;
    return (user.role === 'STLD' && user.email === entry.enteredBy) || 
           user.role === 'F&A Approver' || 
           user.role === 'ADMIN';
  };

  const canApprove = () => {
    // VIEWER role cannot approve anything
    if (user.role === 'VIEWER') return false;
    return user.role === 'F&A Approver' || user.role === 'ADMIN';
  };

  const canFinalize = (entry: MonthlyMonitoringEntry) => {
    // VIEWER role cannot finalize anything
    if (user.role === 'VIEWER') return false;
    return (user.role === 'STLD' && user.email === entry.enteredBy) || user.role === 'ADMIN';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')} Lakhs`;
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
      value: `₹${summaryStats.totalSavings.toFixed(1)}L`,
      change: "+25%",
      trend: "up",
      icon: IndianRupee,
      color: "text-emerald-600",
      description: "Achieved savings"
    },
    {
      title: "Avg Achievement",
      value: `₹${summaryStats.averageAchievement.toFixed(1)}L`,
      change: "+15%",
      trend: "up",
      icon: Target,
      color: "text-purple-600",
      description: "Per entry average"
    }
  ];

  if (initiativesLoading) {
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

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-6xl">
      {/* Header - Match Dashboard style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Savings Monitoring Sheet
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Monthly monitoring and validation of savings achievements
          </p>
        </div>
        {selectedInitiativeId && user.role !== 'VIEWER' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { setEditingEntry(null); setFormData({}); }} 
                className="gap-2 shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-9 px-4 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Saving Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Edit KPI Entry' : 'Add Saving KPI Entry'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="kpiDescription">Saving Description *</Label>
                    <Input
                      id="kpiDescription"
                      value={formData.kpiDescription || ''}
                      onChange={(e) => setFormData({ ...formData, kpiDescription: e.target.value })}
                      placeholder="Enter KPI description (e.g., Monthly Cost Savings)"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="monitoringMonth">Monitoring Month *</Label>
                    <Input
                      id="monitoringMonth"
                      type="month"
                      value={formData.monitoringMonth || ''}
                      onChange={(e) => setFormData({ ...formData, monitoringMonth: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category || 'RMC'} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetValue">Target Value (₹ Lakhs) *</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
                      placeholder="Enter target value"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="achievedValue">Achieved Value (₹ Lakhs)</Label>
                    <Input
                      id="achievedValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.achievedValue || ''}
                      onChange={(e) => setFormData({ ...formData, achievedValue: parseFloat(e.target.value) })}
                      placeholder="Enter achieved value"
                    />
                  </div>
                </div>

                {formData.achievedValue && formData.targetValue && (
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Deviation:</strong> ₹{((formData.achievedValue - formData.targetValue)).toFixed(2)} Lakhs
                      ({(((formData.achievedValue - formData.targetValue) / formData.targetValue) * 100).toFixed(1)}%)
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="remarks">Remarks & Analysis</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Enter detailed remarks, analysis, and observations"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
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
      </div>

      {!selectedInitiativeId ? (
        <div>
          {/* Filters - Enhanced style */}
          <Card className="shadow-sm mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4 text-blue-600" />
                Initiative Filters
              </CardTitle>
              <CardDescription className="text-xs">
                Search and filter your assigned initiatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search initiatives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredInitiatives.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Initiatives Available</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  You currently have no initiatives where Savings Monitoring has been approved and you are assigned as Site Lead.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {paginatedInitiatives.map((initiative: Initiative) => (
                  <Card
                    key={initiative.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] shadow-sm group"
                    onClick={() => setSelectedInitiativeId(initiative.id)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold line-clamp-1 mb-2">{initiative.initiativeNumber}</CardTitle>
                          <Badge variant="outline" className="text-xs">{initiative.initiativeStatus}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 relative z-10">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{initiative.initiativeTitle}</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Site:</span>
                          <span className="font-medium">{initiative.site}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Savings:</span>
                          <span className="font-medium text-green-600">₹{initiative.expectedSavings}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
                Monitoring for: {approvedInitiatives.find((i: Initiative) => i.id === selectedInitiativeId)?.initiativeNumber}
              </h2>
              <p className="text-sm text-muted-foreground">
                {approvedInitiatives.find((i: Initiative) => i.id === selectedInitiativeId)?.initiativeTitle}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedInitiativeId(null)}>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto lg:mx-0 h-9">
              <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-1.5 text-xs">
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
                                  <TableCell className="text-xs">₹{entry.targetValue}</TableCell>
                                  <TableCell className="text-xs">
                                    {entry.achievedValue ? `₹${entry.achievedValue}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {entry.deviation ? (
                                      <div className="flex items-center space-x-1">
                                        <span className={`font-medium ${entry.deviation < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                          ₹{entry.deviation.toFixed(2)}
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
                                      {entry.faApproval === 'Y' && (
                                        <Badge variant="outline" className="text-xs bg-green-50">
                                          <Target className="h-3 w-3 mr-1" />
                                          F&A Approved
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    <div className="flex space-x-1">
                                      {canEdit(entry) && (
                                        <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      )}
                                      {canFinalize(entry) && entry.isFinalized !== 'Y' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => finalizeMutation.mutate({ id: entry.id!, isFinalized: 'Y' })}
                                        >
                                          <FileText className="h-3 w-3" />
                                        </Button>
                                      )}
                                      {canApprove() && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => faApprovalMutation.mutate({ 
                                            id: entry.id!, 
                                            faApproval: entry.faApproval === 'Y' ? 'N' : 'Y' 
                                          })}
                                        >
                                          <Target className="h-3 w-3" />
                                        </Button>
                                      )}
                                      {user.role !== 'VIEWER' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => deleteMutation.mutate(entry.id!)}
                                          className="text-red-600 hover:text-red-700"
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
                    <div className="flex items-center space-x-3">
                      <Label htmlFor="monthSelect" className="text-sm font-medium">Month:</Label>
                      <Input
                        id="monthSelect"
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-40 h-9"
                      />
                      <Badge variant="outline">
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
                                  <p className="text-lg font-bold text-blue-700">₹{entry.targetValue}</p>
                                  <p className="text-xs text-blue-500">Lakhs</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                  <Label className="text-xs font-medium text-green-600">Achieved Value</Label>
                                  <p className="text-lg font-bold text-green-700">₹{entry.achievedValue || '-'}</p>
                                  <p className="text-xs text-green-500">Lakhs</p>
                                </div>
                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                  <Label className="text-xs font-medium text-purple-600">Deviation</Label>
                                  <p className={`text-lg font-bold ${entry.deviation && entry.deviation < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {entry.deviation ? `₹${entry.deviation.toFixed(2)}` : '-'}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-4 w-4 text-blue-600" />
                      Target vs Achievement Trends
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Monthly comparison of targets and achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="target" stroke="#3b82f6" strokeWidth={2} name="Target" />
                        <Line type="monotone" dataKey="achieved" stroke="#22c55e" strokeWidth={2} name="Achieved" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                      Monthly Achievements
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Bar chart showing monthly achievement values
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₹${value} Lakhs`, 'Achievement']} />
                        <Bar dataKey="achieved" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
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
                          ₹{summaryStats.totalSavings.toFixed(2)} Lakhs
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
                        <span className="font-medium text-sm">₹{summaryStats.averageAchievement.toFixed(2)} Lakhs</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}