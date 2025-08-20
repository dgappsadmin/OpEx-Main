import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { sites, disciplines } from '@/lib/mockData';
import { useCreateInitiative, useUpdateInitiative } from '@/hooks/useInitiatives';

interface Initiative {
  id?: number;
  title: string;
  description: string;
  priority: string;
  expectedSavings: number;
  actualSavings?: number;
  site: string;
  discipline: string;
  status?: string;
  startDate: string;
  endDate: string;
  requiresMoc: boolean;
  requiresCapex: boolean;
  progressPercentage?: number;
  currentStage?: number;
  initiativeNumber?: string;
  initiatorName: string;
  assumption1?: string;
  assumption2?: string;
  assumption3?: string;
  baselineData?: string;
  targetOutcome?: string;
  targetValue?: number;
  confidenceLevel?: number;
  estimatedCapex?: number;
  budgetType?: string;
}

interface InitiativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiative?: Initiative;
  mode?: 'create' | 'edit' | 'view';
}

export default function InitiativeModal({
  isOpen,
  onClose,
  initiative,
  mode = 'create'
}: InitiativeModalProps) {
  const [formData, setFormData] = useState<Partial<Initiative>>({
    title: '',
    description: '',
    priority: 'Medium',
    expectedSavings: 0,
    site: '',
    discipline: '',
    requiresMoc: false,
    requiresCapex: false,
    initiatorName: '',
    budgetType: 'budgeted',
    confidenceLevel: 80,
    estimatedCapex: 0,
    assumption1: '',
    assumption2: '',
    assumption3: '',
    baselineData: '',
    targetOutcome: '',
    targetValue: 0
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  
  const { toast } = useToast();
  const createMutation = useCreateInitiative();
  const updateMutation = useUpdateInitiative();

  // Populate form when initiative prop changes
  useEffect(() => {
    if (initiative) {
      setFormData({
        ...initiative,
        // Ensure boolean values are properly handled from backend Y/N conversion
        requiresMoc: Boolean(initiative.requiresMoc),
        requiresCapex: Boolean(initiative.requiresCapex)
      });
      if (initiative.startDate) {
        setStartDate(parseISO(initiative.startDate));
      }
      if (initiative.endDate) {
        setEndDate(parseISO(initiative.endDate));
      }
    } else {
      // Reset form for new initiative
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        expectedSavings: 0,
        site: '',
        discipline: '',
        requiresMoc: false,
        requiresCapex: false,
        initiatorName: '',
        budgetType: 'budgeted',
        confidenceLevel: 80,
        estimatedCapex: 0,
        assumption1: '',
        assumption2: '',
        assumption3: '',
        baselineData: '',
        targetOutcome: '',
        targetValue: 0
      });
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [initiative]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.site || 
        !formData.discipline || !formData.initiatorName || !startDate || !endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const initiativeData = {
      ...formData,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      // Boolean values will be converted to Y/N in the API layer
      requiresMoc: formData.requiresMoc || false,
      requiresCapex: formData.requiresCapex || false,
    } as Initiative;

    if (mode === 'edit' && initiative?.id) {
      updateMutation.mutate({ id: initiative.id, data: initiativeData }, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Initiative updated successfully"
          });
          onClose();
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to update initiative",
            variant: "destructive"
          });
        }
      });
    } else {
      createMutation.mutate(initiativeData, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Initiative created successfully"
          });
          onClose();
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to create initiative",
            variant: "destructive"
          });
        }
      });
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            {mode === 'create' ? 'Create New Initiative' : 
             mode === 'edit' ? 'Edit Initiative' : 'View Initiative'}
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Initiative Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter initiative title"
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div>
                <Label htmlFor="initiatorName">Initiator Name *</Label>
                <Input
                  id="initiatorName"
                  value={formData.initiatorName || ''}
                  onChange={(e) => setFormData({ ...formData, initiatorName: e.target.value })}
                  placeholder="Enter initiator name"
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="site">Site *</Label>
                <Select 
                  value={formData.site} 
                  onValueChange={(value) => setFormData({ ...formData, site: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.code} value={site.code}>
                        {site.code} - {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discipline">Discipline *</Label>
                <Select 
                  value={formData.discipline} 
                  onValueChange={(value) => setFormData({ ...formData, discipline: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((discipline) => (
                      <SelectItem key={discipline.code} value={discipline.code}>
                        {discipline.name} ({discipline.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the initiative"
                disabled={isReadOnly}
                rows={3}
                required
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      disabled={isReadOnly}
                    >
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      disabled={isReadOnly}
                    >
                      {endDate ? (
                        format(endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < (startDate || new Date("1900-01-01"))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expectedSavings">Expected Savings (₹ Lakhs) *</Label>
                <Input
                  id="expectedSavings"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.expectedSavings || ''}
                  onChange={(e) => setFormData({ ...formData, expectedSavings: parseFloat(e.target.value) || 0 })}
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimatedCapex">Estimated CAPEX (₹ Lakhs)</Label>
                <Input
                  id="estimatedCapex"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimatedCapex || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedCapex: parseFloat(e.target.value) || 0 })}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="budgetType">Budget Type</Label>
                <Select 
                  value={formData.budgetType || 'budgeted'} 
                  onValueChange={(value) => setFormData({ ...formData, budgetType: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budgeted">Budgeted</SelectItem>
                    <SelectItem value="non-budgeted">Non-Budgeted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetValue || ''}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="confidenceLevel">Confidence Level (%)</Label>
                <Input
                  id="confidenceLevel"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.confidenceLevel || ''}
                  onChange={(e) => setFormData({ ...formData, confidenceLevel: parseInt(e.target.value) || 0 })}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Requirements</h3>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresMoc"
                  checked={formData.requiresMoc || false}
                  onChange={(e) => setFormData({ ...formData, requiresMoc: e.target.checked })}
                  disabled={isReadOnly}
                />
                <Label htmlFor="requiresMoc">Requires MOC</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresCapex"
                  checked={formData.requiresCapex || false}
                  onChange={(e) => setFormData({ ...formData, requiresCapex: e.target.checked })}
                  disabled={isReadOnly}
                />
                <Label htmlFor="requiresCapex">Requires CAPEX</Label>
              </div>
            </div>
          </div>

          {/* Assumptions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Key Assumptions</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="assumption1">Assumption 1</Label>
                <Input
                  id="assumption1"
                  value={formData.assumption1 || ''}
                  onChange={(e) => setFormData({ ...formData, assumption1: e.target.value })}
                  placeholder="First key assumption"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="assumption2">Assumption 2</Label>
                <Input
                  id="assumption2"
                  value={formData.assumption2 || ''}
                  onChange={(e) => setFormData({ ...formData, assumption2: e.target.value })}
                  placeholder="Second key assumption"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="assumption3">Assumption 3</Label>
                <Input
                  id="assumption3"
                  value={formData.assumption3 || ''}
                  onChange={(e) => setFormData({ ...formData, assumption3: e.target.value })}
                  placeholder="Third key assumption"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <div>
              <Label htmlFor="baselineData">Baseline Data</Label>
              <Textarea
                id="baselineData"
                value={formData.baselineData || ''}
                onChange={(e) => setFormData({ ...formData, baselineData: e.target.value })}
                placeholder="12-month historical baseline data"
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="targetOutcome">Target Outcome</Label>
              <Input
                id="targetOutcome"
                value={formData.targetOutcome || ''}
                onChange={(e) => setFormData({ ...formData, targetOutcome: e.target.value })}
                placeholder="Expected outcome description"
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Status Information (for edit/view mode) */}
          {mode !== 'create' && initiative && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Current Status</Label>
                  <Badge variant="outline" className="mt-1">
                    {initiative.status || 'Pending'}
                  </Badge>
                </div>
                <div>
                  <Label>Progress</Label>
                  <div className="mt-1">
                    {initiative.progressPercentage || 0}%
                  </div>
                </div>
                <div>
                  <Label>Current Stage</Label>
                  <div className="mt-1">
                    Stage {initiative.currentStage || 1}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isReadOnly && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 
                 mode === 'create' ? 'Create Initiative' : 'Update Initiative'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}