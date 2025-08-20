import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle, Lock, Filter, RefreshCw, FileText, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { timelineTrackerAPI } from '@/lib/api';

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

interface TimelineEntry {
  id?: number;
  stageName: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  responsiblePerson: string;
  remarks?: string;
  documentPath?: string;
  siteLeadApproval: boolean;
  initiativeLeadApproval: boolean;
  progressPercentage?: number;
  milestones?: string[];
}

interface TimelineTrackerProps {
  user: User;
}

export default function TimelineTracker({ user }: TimelineTrackerProps) {
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [formData, setFormData] = useState<Partial<TimelineEntry>>({});
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemsPerPage = 6;

  // Fetch initiatives where Stage 6 is approved and user has access
  const { data: approvedInitiatives = [], isLoading: initiativesLoading } = useQuery({
    queryKey: ['stage6-approved-initiatives', user.email, user.site],
    queryFn: async () => {
      try {
        const response = await timelineTrackerAPI.getApprovedInitiatives(user.email, user.site);
        
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

  // Fetch timeline entries for selected initiative
  const { data: timelineEntries = [], isLoading: entriesLoading, refetch: refetchEntries } = useQuery({
    queryKey: ['timeline-entries', selectedInitiativeId],
    queryFn: async () => {
      if (!selectedInitiativeId) return [];
      const result = await timelineTrackerAPI.getTimelineEntries(selectedInitiativeId);
      return result.data || [];
    },
    enabled: !!selectedInitiativeId,
  });

  // Mutations for timeline operations
  const createMutation = useMutation({
    mutationFn: async (entry: TimelineEntry) => {
      const result = await timelineTrackerAPI.createTimelineEntry(selectedInitiativeId!, {
        ...entry,
        enteredBy: user.email,
        initiativeId: selectedInitiativeId
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-entries'] });
      toast({ title: "Success", description: "Timeline entry created successfully" });
      setIsDialogOpen(false);
      setFormData({});
      refetchEntries();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create timeline entry", 
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, entry }: { id: number; entry: TimelineEntry }) => {
      const result = await timelineTrackerAPI.updateTimelineEntry(id, {
        ...entry,
        updatedBy: user.email
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-entries'] });
      toast({ title: "Success", description: "Timeline entry updated successfully" });
      setIsDialogOpen(false);
      setEditingEntry(null);
      setFormData({});
      refetchEntries();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update timeline entry", 
        variant: "destructive" 
      });
    }
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ id, siteLeadApproval, initiativeLeadApproval }: {
      id: number;
      siteLeadApproval?: boolean;
      initiativeLeadApproval?: boolean;
    }) => {
      const result = await timelineTrackerAPI.updateApprovals(id, siteLeadApproval, initiativeLeadApproval);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-entries'] });
      toast({ title: "Success", description: "Approval status updated" });
      refetchEntries();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update approval", 
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await timelineTrackerAPI.deleteTimelineEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-entries'] });
      toast({ title: "Success", description: "Timeline entry deleted successfully" });
      refetchEntries();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete timeline entry", 
        variant: "destructive" 
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'IN_PROGRESS': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DELAYED': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-green-500';
      case 'DELAYED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateProgress = (entry: TimelineEntry) => {
    if (entry.status === 'COMPLETED') return 100;
    if (entry.status === 'PENDING') return 0;
    
    const plannedStart = new Date(entry.plannedStartDate);
    const plannedEnd = new Date(entry.plannedEndDate);
    const now = new Date();
    
    if (now < plannedStart) return 0;
    if (now > plannedEnd) return 100;
    
    const totalDuration = plannedEnd.getTime() - plannedStart.getTime();
    const elapsed = now.getTime() - plannedStart.getTime();
    
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stageName || !formData.plannedStartDate || !formData.plannedEndDate || !formData.responsiblePerson) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Validate dates
    if (new Date(formData.plannedEndDate!) < new Date(formData.plannedStartDate!)) {
      toast({ title: "Error", description: "End date must be after start date", variant: "destructive" });
      return;
    }

    const entryData = {
      ...formData,
      siteLeadApproval: false,
      initiativeLeadApproval: false,
      status: formData.status || 'PENDING',
      progressPercentage: 0
    } as TimelineEntry;

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id!, entry: entryData });
    } else {
      createMutation.mutate(entryData);
    }
  };

  const handleEdit = (entry: TimelineEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsDialogOpen(true);
  };

  const DatePicker = ({ 
    date, 
    onDateChange, 
    placeholder 
  }: { 
    date?: string; 
    onDateChange: (date: string) => void; 
    placeholder: string; 
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(new Date(date), "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date ? new Date(date) : undefined}
          onSelect={(selectedDate) => selectedDate && onDateChange(selectedDate.toISOString().split('T')[0])}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );

  if (initiativesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        Loading Timeline Tracker...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Initiative Timeline Tracker</h1>
          <p className="text-muted-foreground mt-1">Stage 6: Manage and track initiative timelines</p>
        </div>
        {selectedInitiativeId && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { setEditingEntry(null); setFormData({}); }}
                className="shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Timeline Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Edit Timeline Entry' : 'Add Timeline Entry'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="stageName">Stage/Activity Name *</Label>
                    <Input
                      id="stageName"
                      value={formData.stageName || ''}
                      onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                      placeholder="Enter stage or activity name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="responsiblePerson">Responsible Person *</Label>
                    <Input
                      id="responsiblePerson"
                      value={formData.responsiblePerson || ''}
                      onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                      placeholder="Enter responsible person name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status || 'PENDING'} 
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="DELAYED">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Planned Start Date *</Label>
                    <DatePicker
                      date={formData.plannedStartDate}
                      onDateChange={(date) => setFormData({ ...formData, plannedStartDate: date })}
                      placeholder="Select planned start date"
                    />
                  </div>
                  <div>
                    <Label>Planned End Date *</Label>
                    <DatePicker
                      date={formData.plannedEndDate}
                      onDateChange={(date) => setFormData({ ...formData, plannedEndDate: date })}
                      placeholder="Select planned end date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Actual Start Date</Label>
                    <DatePicker
                      date={formData.actualStartDate}
                      onDateChange={(date) => setFormData({ ...formData, actualStartDate: date })}
                      placeholder="Select actual start date"
                    />
                  </div>
                  <div>
                    <Label>Actual End Date</Label>
                    <DatePicker
                      date={formData.actualEndDate}
                      onDateChange={(date) => setFormData({ ...formData, actualEndDate: date })}
                      placeholder="Select actual end date"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="remarks">Remarks & Notes</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Enter any remarks, notes, or additional information"
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Assigned Initiatives (Stage 6 Approved)</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <Input
                  placeholder="Search initiatives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
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
          </div>

          {filteredInitiatives.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Initiatives Available</h3>
                <p className="text-muted-foreground">
                  You currently have no initiatives where Stage 6 (Timeline Tracker) has been approved and you are assigned as Initiative Lead.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paginatedInitiatives.map((initiative: Initiative) => (
                  <Card
                    key={initiative.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => setSelectedInitiativeId(initiative.id)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg line-clamp-2">{initiative.initiativeNumber}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{initiative.initiativeTitle}</p>
                        </div>
                        <Badge variant="outline">{initiative.initiativeStatus}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <span className="w-16">Site:</span>
                          <span className="font-medium">{initiative.site}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-16">Lead:</span>
                          <span className="font-medium">{initiative.assignedUserEmail}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-16">Savings:</span>
                          <span className="font-medium text-green-600">₹{initiative.expectedSavings} Lakhs</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-16">Stage:</span>
                          <Badge variant="secondary" className="text-xs">Stage {initiative.stageNumber || 6}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
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
              <h2 className="text-xl font-semibold">
                Timeline for: {approvedInitiatives.find((i: Initiative) => i.id === selectedInitiativeId)?.initiativeNumber}
              </h2>
              <p className="text-sm text-muted-foreground">
                {approvedInitiatives.find((i: Initiative) => i.id === selectedInitiativeId)?.initiativeTitle}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSelectedInitiativeId(null)}>
              Back to Initiatives
            </Button>
          </div>

          <Tabs defaultValue="timeline" className="space-y-4">
            <TabsList>
              <TabsTrigger value="timeline">
                <FileText className="h-4 w-4 mr-2" />
                Timeline Entries
              </TabsTrigger>
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              {entriesLoading ? (
                <div className="flex justify-center items-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  Loading timeline entries...
                </div>
              ) : (
                <div className="space-y-4">
                  {timelineEntries.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No timeline entries found for this initiative.</p>
                        <p className="text-sm text-muted-foreground mt-2">Click "Add Timeline Entry" to get started.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {timelineEntries.map((entry: TimelineEntry) => (
                        <Card key={entry.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {getStatusIcon(entry.status)}
                                <div>
                                  <CardTitle className="text-lg">{entry.stageName}</CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    Responsible: {entry.responsiblePerson}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{entry.status}</Badge>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteMutation.mutate(entry.id!)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label className="text-sm font-medium">Planned Duration</Label>
                                <p className="text-sm">
                                  {format(new Date(entry.plannedStartDate), 'PPP')} - {format(new Date(entry.plannedEndDate), 'PPP')}
                                </p>
                              </div>
                              {entry.actualStartDate && (
                                <div>
                                  <Label className="text-sm font-medium">Actual Duration</Label>
                                  <p className="text-sm">
                                    {format(new Date(entry.actualStartDate), 'PPP')}
                                    {entry.actualEndDate && ` - ${format(new Date(entry.actualEndDate), 'PPP')}`}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{calculateProgress(entry)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${getStatusColor(entry.status)}`}
                                  style={{ width: `${calculateProgress(entry)}%` }}
                                ></div>
                              </div>
                            </div>

                            {entry.remarks && (
                              <div className="mb-4 p-3 bg-muted rounded-lg">
                                <Label className="text-sm font-medium">Remarks</Label>
                                <p className="text-sm mt-1">{entry.remarks}</p>
                              </div>
                            )}

                            <div className="flex space-x-2 pt-3 border-t">
                              <div className="flex items-center space-x-2">
                                <Badge variant={entry.siteLeadApproval ? "default" : "outline"} className="text-xs">
                                  {entry.siteLeadApproval ? "✓ Site Lead" : "○ Site Lead"}
                                </Badge>
                                <Badge variant={entry.initiativeLeadApproval ? "default" : "outline"} className="text-xs">
                                  {entry.initiativeLeadApproval ? "✓ Initiative Lead" : "○ Initiative Lead"}
                                </Badge>
                              </div>
                              <div className="flex space-x-1 ml-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => approvalMutation.mutate({ 
                                    id: entry.id!, 
                                    siteLeadApproval: !entry.siteLeadApproval 
                                  })}
                                  disabled={user.role !== 'STLD'}
                                >
                                  Site Lead
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => approvalMutation.mutate({ 
                                    id: entry.id!, 
                                    initiativeLeadApproval: !entry.initiativeLeadApproval 
                                  })}
                                  disabled={user.role !== 'IL'}
                                >
                                  IL Approve
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <h3 className="text-2xl font-bold text-blue-600">{timelineEntries.length}</h3>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <h3 className="text-2xl font-bold text-green-600">
                      {timelineEntries.filter((e: TimelineEntry) => e.status === 'COMPLETED').length}
                    </h3>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                    <h3 className="text-2xl font-bold text-yellow-600">
                      {timelineEntries.filter((e: TimelineEntry) => e.status === 'IN_PROGRESS').length}
                    </h3>
                    <p className="text-sm text-muted-foreground">In Progress</p>
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