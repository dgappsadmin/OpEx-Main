import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, XCircle, Users, AlertTriangle, MapPin } from "lucide-react";
import { useUsers, useInitiativeLeadsBySite } from "@/hooks/useUsers";

interface WorkflowStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  userRole: string;
  onProcess: (data: any) => void;
  isLoading?: boolean;
}

export default function WorkflowStageModal({ 
  isOpen, 
  onClose, 
  transaction, 
  userRole, 
  onProcess,
  isLoading = false 
}: WorkflowStageModalProps) {
  const [comment, setComment] = useState("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [mocRequired, setMocRequired] = useState<string>("");
  const [mocNumber, setMocNumber] = useState("");
  const [capexRequired, setCapexRequired] = useState<string>("");
  const [capexNumber, setCapexNumber] = useState("");

  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  
  // Get Initiative Leads specifically for this site using the dedicated hook
  const { data: initiativeLeads = [], isLoading: ilLoading, error: ilError } = useInitiativeLeadsBySite(transaction?.site || '');
  
  console.log('Initiative Leads for site', transaction?.site, ':', initiativeLeads);
  console.log('IL loading:', ilLoading, 'IL Error:', ilError);

  // Early return if transaction is null
  if (!transaction) {
    return null;
  }

  const handleApprove = () => {
    const data: any = {
      transactionId: transaction.id,
      action: 'approved',
      comment: comment.trim()
    };

    // Add stage-specific data
    if (transaction.stageNumber === 3 && assignedUserId) {
      data.assignedUserId = parseInt(assignedUserId);
    }
    
    if (transaction.stageNumber === 4) {
      data.requiresMoc = mocRequired === "yes";
      if (mocRequired === "yes" && mocNumber) {
        data.mocNumber = mocNumber;
      }
    }
    
    if (transaction.stageNumber === 5) {
      data.requiresCapex = capexRequired === "yes";
      if (capexRequired === "yes" && capexNumber) {
        data.capexNumber = capexNumber;
      }
    }

    onProcess(data);
  };

  const handleReject = () => {
    onProcess({
      transactionId: transaction.id,
      action: 'rejected',
      comment: comment.trim()
    });
  };

  const isFormValid = () => {
    if (!comment.trim()) return false;
    
    if (transaction.stageNumber === 3 && !assignedUserId) return false;
    if (transaction.stageNumber === 4) {
      if (!mocRequired) return false;
      if (mocRequired === "yes" && !mocNumber.trim()) return false;
    }
    if (transaction.stageNumber === 5) {
      if (!capexRequired) return false;
      if (capexRequired === "yes" && !capexNumber.trim()) return false;
    }
    
    return true;
  };

  const getStageSpecificContent = () => {
    if (!transaction?.stageNumber) return null;
    
    switch (transaction.stageNumber) {
      case 3: // Engineering Head assigns Initiative Lead
        return (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Site: {transaction.site}</span>
              </div>
              <p className="text-sm text-blue-700">
                Select an Initiative Lead from users with IL role for this site
              </p>
            </div>
            
            <div>
              <Label htmlFor="assignedUser">Select Initiative Lead *</Label>
              <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    ilLoading ? "Loading Initiative Leads..." : 
                    initiativeLeads.length === 0 ? "No Initiative Leads available for this site" :
                    "Select an Initiative Lead"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {initiativeLeads.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.fullName} - {user.email} ({user.site})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {initiativeLeads.length === 0 && !ilLoading && (
                <p className="text-sm text-red-600 mt-1">
                  No Initiative Leads found for site {transaction.site}
                </p>
              )}
            </div>
          </div>
        );

      case 4: // MOC Stage - Initiative Lead decides if MOC is required
        return (
          <div className="space-y-4">
            <div>
              <Label>Is MOC Required? *</Label>
              <RadioGroup value={mocRequired} onValueChange={setMocRequired} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="moc-yes" />
                  <Label htmlFor="moc-yes">Yes, MOC is required</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="moc-no" />
                  <Label htmlFor="moc-no">No, MOC is not required</Label>
                </div>
              </RadioGroup>
            </div>
            
            {mocRequired === "yes" && (
              <div>
                <Label htmlFor="mocNumber">MOC Number *</Label>
                <Input
                  id="mocNumber"
                  value={mocNumber}
                  onChange={(e) => setMocNumber(e.target.value)}
                  placeholder="Enter MOC Number"
                />
              </div>
            )}
          </div>
        );

      case 5: // CAPEX Stage - Initiative Lead decides if CAPEX is required
        return (
          <div className="space-y-4">
            <div>
              <Label>Is CAPEX Required? *</Label>
              <RadioGroup value={capexRequired} onValueChange={setCapexRequired} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="capex-yes" />
                  <Label htmlFor="capex-yes">Yes, CAPEX is required</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="capex-no" />
                  <Label htmlFor="capex-no">No, CAPEX is not required</Label>
                </div>
              </RadioGroup>
            </div>
            
            {capexRequired === "yes" && (
              <div>
                <Label htmlFor="capexNumber">CAPEX Number *</Label>
                <Input
                  id="capexNumber"
                  value={capexNumber}
                  onChange={(e) => setCapexNumber(e.target.value)}
                  placeholder="Enter CAPEX Number"
                />
              </div>
            )}
          </div>
        );

      case 6: // Initiative Timeline Tracker
      case 7: // Trial Implementation & Performance Check
      case 8: // Periodic Status Review with CMO
      case 9: // Savings Monitoring (1 Month)
      case 10: // Saving Validation with F&A
        return (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <p className="text-blue-800 font-medium">
                Simple approval process - Review and provide your decision with comments.
              </p>
            </div>
          </div>
        );

      case 11: // Initiative Closure
        return (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">
                Final closure of initiative - This will move the initiative to the Closure Module.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStageDescription = () => {
    const descriptions: { [key: number]: string } = {
      1: "Initiative has been registered and is ready for approval.",
      2: "Review the initiative details and provide your approval decision.",
      3: "Assign an Initiative Lead who will be responsible for driving this initiative forward.",
      4: "Determine if Management of Change (MOC) process is required for this initiative.",
      5: "Determine if Capital Expenditure (CAPEX) approval is required for this initiative.",
      6: "Prepare detailed timeline for initiative implementation.",
      7: "Conduct trial implementation and performance checks.",
      8: "Periodic status review with Chief Marketing Officer.",
      9: "Monitor savings achieved after implementation (1 month monitoring period).",
      10: "Validate savings with Finance & Accounts department.",
      11: "Final closure of the initiative and documentation completion."
    };
    return descriptions[transaction.stageNumber] || "Process this workflow stage.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {transaction.stageNumber}
            </div>
            {transaction.stageName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stage Information */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{getStageDescription()}</p>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Required Role:</span>
                <span className="ml-2">{transaction.requiredRole}</span>
              </div>
              <div>
                <span className="font-medium">Site:</span>
                <span className="ml-2">{transaction.site}</span>
              </div>
            </div>
          </div>

          {/* Stage-specific content */}
          {getStageSpecificContent()}

          {/* Comment section */}
          <div>
            <Label htmlFor="comment" className="text-red-600">
              Comments (Required) *
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Please provide your comments for this stage..."
              className="min-h-[80px] laptop-14:min-h-[100px] mt-2"
              required
            />
          </div>

          {/* Action buttons */}
          {transaction.stageNumber === 11 ? (
            <div className="flex gap-2 laptop-14:gap-3">
              <Button 
                onClick={handleApprove}
                disabled={!comment.trim() || isLoading}
                className="bg-red-600 hover:bg-red-700 flex-1 text-sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? "Processing..." : "Close Initiative"}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={!comment.trim() || isLoading}
                className="flex-1 text-sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isLoading ? "Processing..." : "Reject"}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 laptop-14:gap-3">
              <Button 
                onClick={handleApprove}
                disabled={!isFormValid() || isLoading}
                className="bg-green-600 hover:bg-green-700 flex-1 text-sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? "Processing..." : "Approve & Continue"}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={!comment.trim() || isLoading}
                className="flex-1 text-sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isLoading ? "Processing..." : "Reject"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}