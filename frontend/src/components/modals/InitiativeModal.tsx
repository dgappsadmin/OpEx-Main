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
  Settings,
  Clock,
  User,
  CheckCircle2
} from 'lucide-react';
import { useProgressPercentage, useCurrentPendingStage } from '@/hooks/useWorkflowTransactions';
import { useUser } from '@/hooks/useUsers';
import { initiativeAPI } from '@/lib/api';

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
  startDate?: string;
  endDate?: string;
  currentStage?: number;
  requiresMoc?: boolean;
  requiresCapex?: boolean;
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
}

// Correct workflow stage names matching backend
const WORKFLOW_STAGE_NAMES: { [key: number]: string } = {
  1: 'Register Initiative',
  2: 'Approval',
  3: 'Define Responsibilities',
  4: 'MOC Stage',
  5: 'CAPEX Stage',
  6: 'Initiative Timeline Tracker',
  7: 'Trial Implementation & Performance Check',
  8: 'Periodic Status Review with CMO',
  9: 'Savings Monitoring (1 Month)',
  10: 'Saving Validation with F&A',
  11: 'Initiative Closure'
};

export default function InitiativeModal({ isOpen, onClose, initiative, mode, onSave }: InitiativeModalProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<any>(initiative || {});
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Update isEditing state when mode prop changes
  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsEditing(mode === 'edit');
      setActiveTab('overview');
    }
  }, [isOpen, mode]);

  // Update formData when initiative changes
  useEffect(() => {
    if (initiative) {
      setFormData(initiative);
    }
  }, [initiative]);

  // Get real progress and current stage data
  const { data: progressData } = useProgressPercentage(Number(initiative?.id));
  const { data: currentStageData } = useCurrentPendingStage(Number(initiative?.id));

  // Fetch user data for "Created By" information
  // Basic implementation: only check for createdBy user ID
  const { data: createdByUser } = useUser(initiative?.createdBy);

  const actualProgress = progressData?.progressPercentage ?? initiative?.progress ?? 0;
  const currentStageName = currentStageData?.stageName || 
    WORKFLOW_STAGE_NAMES[initiative?.currentStage || 1] || 
    'Register Initiative';

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
    initiativeData: {
      initiatorName: initiative?.initiatorName,
      createdByName: initiative?.createdByName,
      createdBy: initiative?.createdBy,
      fetchedUser: createdByUser
    }
  });

  const handleSave = async () => {
    if (!initiative?.id) return;
    
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
        site: formData.site,
        discipline: formData.discipline,
        startDate: formData.startDate,
        endDate: formData.endDate,
        requiresMoc: formData.requiresMoc || false,
        requiresCapex: formData.requiresCapex || false,
        initiatorName: formData.initiatorName || formData.initiator
      };

      console.log('Updating initiative with data:', updateData);
      
      // Call API to update initiative
      await initiativeAPI.update(Number(initiative.id), updateData);
      
      if (onSave) {
        onSave(formData);
      }
      setIsEditing(false);
      
      // Refresh the page to show updated data
      window.location.reload();
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

  if (!initiative) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 w-[95vw]">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {isEditing ? <Edit className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {isEditing ? 'Edit Initiative' : 'Initiative Details'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {initiative?.initiativeNumber || `ID: ${initiative?.id}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    isEditing 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isEditing ? 'Edit Mode' : 'View Mode'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing && mode !== 'edit' && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="min-w-[80px]">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel} className="min-w-[90px]" disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} className="min-w-[120px]" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={`${getStatusColor(initiative?.status || '')} mt-1`}>
                          {initiative?.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected</p>
                        <p className="font-semibold text-green-600">
                          {typeof initiative?.expectedSavings === 'number' 
                            ? `₹${initiative.expectedSavings.toLocaleString()}` 
                            : initiative?.expectedSavings}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Progress</p>
                        <p className="font-semibold text-blue-600">{actualProgress}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Site</p>
                        <p className="font-semibold">{initiative?.site}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress and Stage Information */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5" />
                      Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Completion Status</span>
                        <span className="font-semibold">{actualProgress}%</span>
                      </div>
                      <Progress value={actualProgress} className="h-3" />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Current Stage</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Stage {initiative?.currentStage || 1}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{currentStageName}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5" />
                      Timeline Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Submitted</p>
                        <p className="font-medium">{initiative?.submittedDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">{initiative?.lastUpdated}</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Priority Level</p>
                      <Badge className={`${getPriorityColor(initiative?.priority || '')} mt-1`}>
                        {initiative?.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Initiative Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Initiative Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-base leading-tight">{initiative?.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
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
                          <p className="text-sm font-medium mb-2">Description</p>
                          <div className="max-h-32 overflow-y-auto">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                              {initiative.description}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
                        className="mt-1 bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">
                        Title *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title || ''}
                        disabled={!isEditing}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="site" className="text-sm font-medium">
                        Site *
                      </Label>
                      {isEditing ? (
                        <Select value={formData.site} onValueChange={(value) => setFormData({ ...formData, site: value })}>
                          <SelectTrigger className="mt-1">
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
                        <Input value={formData.site || ''} disabled className="mt-1" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="discipline" className="text-sm font-medium">
                        Discipline *
                      </Label>
                      {isEditing ? (
                        <Select value={formData.discipline} onValueChange={(value) => setFormData({ ...formData, discipline: value })}>
                          <SelectTrigger className="mt-1">
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
                        <Input value={formData.discipline || ''} disabled className="mt-1" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="priority" className="text-sm font-medium">
                        Priority *
                      </Label>
                      {isEditing ? (
                        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={formData.priority || ''} disabled className="mt-1" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="expectedSavings" className="text-sm font-medium">
                        Expected Savings (₹)
                      </Label>
                      <Input
                        id="expectedSavings"
                        value={formData.expectedSavings || ''}
                        disabled={!isEditing}
                        onChange={(e) => setFormData({ ...formData, expectedSavings: e.target.value })}
                        className="mt-1"
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
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="mt-1"
                      placeholder="Provide a detailed description of the initiative..."
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" className="text-sm font-medium">
                        Start Date
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate || ''}
                        disabled={!isEditing}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="mt-1"
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
                        disabled={!isEditing}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{initiative?.lastUpdated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Initiative ID</p>
                      <p className="font-medium font-mono">{initiative?.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Requirements & Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-3">Special Requirements</p>
                      <div className="flex flex-wrap gap-2">
                        {initiative?.requiresMoc && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            MoC Required
                          </Badge>
                        )}
                        {initiative?.requiresCapex && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            CAPEX Required
                          </Badge>
                        )}
                        {!initiative?.requiresMoc && !initiative?.requiresCapex && (
                          <p className="text-sm text-muted-foreground">No special requirements</p>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Current Workflow Stage</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Stage {initiative?.currentStage || 1}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{currentStageName}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}