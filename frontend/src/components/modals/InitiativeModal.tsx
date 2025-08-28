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
  requiresMoc?: boolean | string; // Legacy field (boolean) for backward compatibility
  requiresCapex?: boolean | string; // Legacy field (boolean) for backward compatibility
  mocNumber?: string; // New field - MOC Number from OPEX_INITIATIVES table
  capexNumber?: string; // New field - CAPEX Number from OPEX_INITIATIVES table
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
  user?: { role?: string; [key: string]: any }; // Add user prop
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

export default function InitiativeModal({ isOpen, onClose, initiative, mode, onSave, user }: InitiativeModalProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<any>(initiative || {});
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Update isEditing state when mode prop changes
  useEffect(() => {
    // VIEWER role cannot edit - force view mode
    if (user?.role === 'VIEWER') {
      setIsEditing(false);
    } else {
      setIsEditing(mode === 'edit');
    }
  }, [mode, user]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // VIEWER role cannot edit - force view mode
      if (user?.role === 'VIEWER') {
        setIsEditing(false);
      } else {
        setIsEditing(mode === 'edit');
      }
      setActiveTab('overview');
    }
  }, [isOpen, mode, user]);

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

  // Calculate Progress Percentage using NewWorkflow.tsx logic
  const progressPercentage = Math.round(((initiative?.currentStage || 1) - 1) * 100 / 10);

  const actualProgress = progressData?.progressPercentage ?? progressPercentage;
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
        requiresMoc: formData.requiresMoc || 'N',
        requiresCapex: formData.requiresCapex || 'N',
        mocNumber: formData.mocNumber || '',
        capexNumber: formData.capexNumber || '',
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
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 w-[95vw] h-[95vh]">
        <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5 flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                {isEditing ? <Edit className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-primary" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {isEditing ? 'Edit Initiative' : 'Initiative Details'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {initiative?.initiativeNumber || `ID: ${initiative?.id}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                    user?.role === 'VIEWER'
                      ? 'bg-blue-100 text-blue-800' 
                      : isEditing 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user?.role === 'VIEWER' ? 'Read-Only Mode' : (isEditing ? 'Edit Mode' : 'View Mode')}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && mode !== 'edit' && user?.role !== 'VIEWER' && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="min-w-[70px] h-8">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel} className="min-w-[80px] h-8" disabled={isSaving}>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} className="min-w-[100px] h-8" disabled={isSaving}>
                    <Save className="h-3 w-3 mr-1" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 h-9 flex-shrink-0 mx-4 mt-4">
              <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
                <Target className="h-3 w-3" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-1 text-xs">
                <FileText className="h-3 w-3" />
                Details
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 text-xs">
                <Settings className="h-3 w-3" />
                Settings
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-4">
                <TabsContent value="overview" className="mt-4 space-y-4 px-1">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
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

                    <Card className="border-l-4 border-l-blue-500">
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
                    </Card>

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
                        <div>
                          <p className="text-xs text-muted-foreground">Priority Level</p>
                          <Badge className={`${getPriorityColor(initiative?.priority || '')} text-xs mt-0.5`}>
                            {initiative?.priority}
                          </Badge>
                        </div>
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
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="details" className="mt-6 space-y-6 px-1">
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
                            disabled={!isEditing}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="site" className="text-sm font-medium">
                            Site *
                          </Label>
                          {isEditing ? (
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
                          {isEditing ? (
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
                        <div>
                          <Label htmlFor="priority" className="text-sm font-medium">
                            Priority *
                          </Label>
                          {isEditing ? (
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
                        <div>
                          <Label htmlFor="expectedSavings" className="text-sm font-medium">
                            Expected Savings (₹)
                          </Label>
                          <Input
                            id="expectedSavings"
                            value={formData.expectedSavings || ''}
                            disabled={!isEditing}
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
                            disabled={!isEditing}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="mt-1 h-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6 space-y-6 px-1">
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
                                disabled={!isEditing}
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
                                disabled={!isEditing}
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
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}