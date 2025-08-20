import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, FileText, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useTimelineTracker, useCreateTimelineEntry, useUpdateTimelineEntry, useDeleteTimelineEntry, useApprovedInitiatives, TimelineEntry } from '@/hooks/useTimelineTracker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User as UserType } from '@/lib/mockData';

interface TimelineTrackerProps {
  user: UserType;
}

export default function TimelineTracker({ user }: TimelineTrackerProps) {
  const [selectedInitiative, setSelectedInitiative] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [formData, setFormData] = useState({
    stageName: '',
    plannedStartDate: '',
    plannedEndDate: '',
    actualStartDate: '',
    actualEndDate: '',
    responsiblePerson: '',
    remarks: '',
    status: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    siteLeadApproval: false,
    initiativeLeadApproval: false,
    documentPath: ''
  });

  const { toast } = useToast();

  // Fetch approved initiatives for this user
  const { data: approvedInitiatives = [], isLoading: isLoadingInitiatives } = useApprovedInitiatives(user.email, user.site);
  
  // Fetch timeline entries for selected initiative
  const { data: timelineEntries = [], isLoading: isLoadingEntries } = useTimelineTracker(selectedInitiative || 0);
  
  const createEntryMutation = useCreateTimelineEntry(selectedInitiative || 0);
  const updateEntryMutation = useUpdateTimelineEntry();
  const deleteEntryMutation = useDeleteTimelineEntry();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInitiative) {
      toast({
        title: "Error",
        description: "Please select an initiative first",
        variant: "destructive"
      });
      return;
    }

    const entryData = {
      ...formData,
      initiativeId: selectedInitiative
    };

    if (editingEntry) {
      updateEntryMutation.mutate({
        id: editingEntry.id!,
        entryData: entryData
      }, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Timeline entry updated successfully"
          });
          setIsEditDialogOpen(false);
          setEditingEntry(null);
          resetForm();
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to update timeline entry",
            variant: "destructive"
          });
        }
      });
    } else {
      createEntryMutation.mutate(entryData, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Timeline entry created successfully"
          });
          setIsCreateDialogOpen(false);
          resetForm();
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to create timeline entry",
            variant: "destructive"
          });
        }
      });
    }
  };

  const handleEdit = (entry: TimelineEntry) => {
    setEditingEntry(entry);
    setFormData({
      stageName: entry.stageName,
      plannedStartDate: entry.plannedStartDate,
      plannedEndDate: entry.plannedEndDate,
      actualStartDate: entry.actualStartDate || '',
      actualEndDate: entry.actualEndDate || '',
      responsiblePerson: entry.responsiblePerson,
      remarks: entry.remarks || '',
      status: entry.status,
      siteLeadApproval: entry.siteLeadApproval,
      initiativeLeadApproval: entry.initiativeLeadApproval,
      documentPath: entry.documentPath || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteEntryMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Timeline entry deleted successfully"
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to delete timeline entry",
          variant: "destructive"
        });
      }
    });
  };

  const resetForm = () => {
    setFormData({
      stageName: '',
      plannedStartDate: '',
      plannedEndDate: '',
      actualStartDate: '',
      actualEndDate: '',
      responsiblePerson: '',
      remarks: '',
      status: 'PENDING',
      siteLeadApproval: false,
      initiativeLeadApproval: false,
      documentPath: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': 'default',
      'IN_PROGRESS': 'secondary',
      'PENDING': 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Check permissions
  const canManageTimeline = user.role === 'IL' || user.role === 'STLD';

  if (!canManageTimeline) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access Timeline Tracker.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Required roles: Initiative Lead (IL) or Site TSD Lead (STLD)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingInitiatives) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Timeline Tracker</h1>
            <p className="text-muted-foreground">Loading approved initiatives...</p>
          </div>
        </div>
      </div>
    );
  }

  if (approvedInitiatives.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Timeline Tracker</h1>
            <p className="text-muted-foreground">Track and manage initiative timelines</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Approved Initiatives</h3>
            <p className="text-muted-foreground">
              You don't have any approved initiatives to track timelines for.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Initiatives must be approved (Stage 6) before timeline tracking is available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timeline Tracker</h1>
          <p className="text-muted-foreground">Track and manage initiative timelines</p>
        </div>
      </div>

      {/* Initiative Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Initiative</CardTitle>
          <CardDescription>Choose an approved initiative to track its timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedInitiative?.toString() || ''} onValueChange={(value) => setSelectedInitiative(Number(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an initiative" />
            </SelectTrigger>
            <SelectContent>
              {approvedInitiatives.map((initiative: any) => (
                <SelectItem key={initiative.id} value={initiative.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{initiative.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {initiative.site} • {initiative.discipline} • {initiative.status}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Timeline Entries */}
      {selectedInitiative && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Timeline Entries</CardTitle>
                <CardDescription>Track progress stages and milestones</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add Timeline Entry</DialogTitle>
                    <DialogDescription>
                      Create a new timeline entry for this initiative
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stageName">Stage Name</Label>
                          <Input
                            id="stageName"
                            value={formData.stageName}
                            onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                            placeholder="e.g., Planning Phase"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="responsiblePerson">Responsible Person</Label>
                          <Input
                            id="responsiblePerson"
                            value={formData.responsiblePerson}
                            onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                            placeholder="Name of responsible person"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="plannedStartDate">Planned Start Date</Label>
                          <Input
                            id="plannedStartDate"
                            type="date"
                            value={formData.plannedStartDate}
                            onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plannedEndDate">Planned End Date</Label>
                          <Input
                            id="plannedEndDate"
                            type="date"
                            value={formData.plannedEndDate}
                            onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="actualStartDate">Actual Start Date</Label>
                          <Input
                            id="actualStartDate"
                            type="date"
                            value={formData.actualStartDate}
                            onChange={(e) => setFormData({ ...formData, actualStartDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="actualEndDate">Actual End Date</Label>
                          <Input
                            id="actualEndDate"
                            type="date"
                            value={formData.actualEndDate}
                            onChange={(e) => setFormData({ ...formData, actualEndDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                          id="remarks"
                          value={formData.remarks}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                          placeholder="Additional remarks or notes"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="documentPath">Document Path (Optional)</Label>
                        <Input
                          id="documentPath"
                          value={formData.documentPath}
                          onChange={(e) => setFormData({ ...formData, documentPath: e.target.value })}
                          placeholder="Path to supporting documents"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createEntryMutation.isPending}>
                        {createEntryMutation.isPending ? 'Creating...' : 'Create Entry'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEntries ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading timeline entries...</p>
              </div>
            ) : timelineEntries.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Timeline Entries</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking progress by adding your first timeline entry.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {timelineEntries.map((entry) => (
                  <Card key={entry.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(entry.status)}
                            <h3 className="font-semibold">{entry.stageName}</h3>
                            {getStatusBadge(entry.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Planned: {format(new Date(entry.plannedStartDate), 'MMM dd')} - {format(new Date(entry.plannedEndDate), 'MMM dd')}</span>
                            </div>
                            {entry.actualStartDate && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Actual: {format(new Date(entry.actualStartDate), 'MMM dd')} - {entry.actualEndDate ? format(new Date(entry.actualEndDate), 'MMM dd') : 'Ongoing'}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Responsible: {entry.responsiblePerson}</span>
                            </div>
                            {entry.documentPath && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>Documents Available</span>
                              </div>
                            )}
                          </div>

                          {entry.remarks && (
                            <div className="text-sm text-muted-foreground mb-3 p-2 bg-muted rounded">
                              <strong>Remarks:</strong> {entry.remarks}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Badge variant={entry.siteLeadApproval ? "default" : "outline"}>
                              Site Lead: {entry.siteLeadApproval ? "Approved" : "Pending"}
                            </Badge>
                            <Badge variant={entry.initiativeLeadApproval ? "default" : "outline"}>
                              Initiative Lead: {entry.initiativeLeadApproval ? "Approved" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Timeline Entry</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this timeline entry? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(entry.id!)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Timeline Entry</DialogTitle>
            <DialogDescription>
              Update the timeline entry details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-stageName">Stage Name</Label>
                  <Input
                    id="edit-stageName"
                    value={formData.stageName}
                    onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-responsiblePerson">Responsible Person</Label>
                  <Input
                    id="edit-responsiblePerson"
                    value={formData.responsiblePerson}
                    onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-plannedStartDate">Planned Start Date</Label>
                  <Input
                    id="edit-plannedStartDate"
                    type="date"
                    value={formData.plannedStartDate}
                    onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-plannedEndDate">Planned End Date</Label>
                  <Input
                    id="edit-plannedEndDate"
                    type="date"
                    value={formData.plannedEndDate}
                    onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-actualStartDate">Actual Start Date</Label>
                  <Input
                    id="edit-actualStartDate"
                    type="date"
                    value={formData.actualStartDate}
                    onChange={(e) => setFormData({ ...formData, actualStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-actualEndDate">Actual End Date</Label>
                  <Input
                    id="edit-actualEndDate"
                    type="date"
                    value={formData.actualEndDate}
                    onChange={(e) => setFormData({ ...formData, actualEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-remarks">Remarks</Label>
                <Textarea
                  id="edit-remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-documentPath">Document Path (Optional)</Label>
                <Input
                  id="edit-documentPath"
                  value={formData.documentPath}
                  onChange={(e) => setFormData({ ...formData, documentPath: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {setIsEditDialogOpen(false); setEditingEntry(null); resetForm();}}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateEntryMutation.isPending}>
                {updateEntryMutation.isPending ? 'Updating...' : 'Update Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}