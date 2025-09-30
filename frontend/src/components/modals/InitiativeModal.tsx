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
  Clock,
  User,
  CheckCircle2,
  Files,
  FolderOpen
} from 'lucide-react';
import { useProgressPercentage, useCurrentPendingStage } from '@/hooks/useWorkflowTransactions';
import { useUser } from '@/hooks/useUsers';
import UploadedDocuments from '@/components/UploadedDocuments';
import { initiativeAPI } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

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

// Correct workflow stage names matching backend (10 stages total)
const WORKFLOW_STAGE_NAMES: { [key: number]: string } = {
  1: 'Register Initiative',
  2: 'Approval',
  3: 'Define Responsibilities',
  4: 'MOC-CAPEX Evaluation',
  5: 'Initiative Timeline Tracker',
  6: 'Trial Implementation & Performance Check',
  7: 'Periodic Status Review with CMO',
  8: 'Savings Monitoring (1 Month)',
  9: 'Saving Validation with F&A',
  10: 'Initiative Closure'
};

export default function InitiativeModal({ isOpen, onClose, initiative, mode, onSave, user }: InitiativeModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<any>(initiative || {});
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Check if user can edit this initiative (role + site restrictions)
  const canEdit = user?.role !== 'VIEWER' && user?.site === initiative?.site;

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

  // Fetch user data for "Created By" information
  // Basic implementation: only check for createdBy user ID
  const { data: createdByUser } = useUser(initiative?.createdBy);

  // Calculate Progress Percentage - being at stage X means X/10 * 100% progress
  const progressPercentage = Math.round((initiative?.currentStage || 1) * 100 / 10);

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
                      ? user?.role === 'VIEWER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                      : isEditing 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {!canEdit 
                      ? user?.role === 'VIEWER' 
                        ? 'Read-Only Mode' 
                        : user?.site !== initiative?.site 
                          ? `Site Restricted (${initiative?.site} only)` 
                          : 'Read-Only Mode'
                      : (isEditing ? 'Edit Mode' : 'View Mode')
                    }
                  </div>
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
            <TabsList className="grid w-full grid-cols-4 h-12 flex-shrink-0 mt-6 gap-1">
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
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}