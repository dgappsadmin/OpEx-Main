import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Circle, User, Calendar, MessageSquare, ArrowRight, Activity, Workflow } from 'lucide-react';
import { useVisibleWorkflowTransactions, useProcessStageAction } from '@/hooks/useWorkflowTransactions';
import WorkflowStageModal from './WorkflowStageModal';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { handlePostApprovalRedirect } from '@/lib/workflowUtils';

interface DynamicWorkflowTrackerProps {
  initiativeId: number;
}

interface WorkflowTransactionDetail {
  id: number;
  initiativeId: number;
  stageNumber: number;
  stageName: string;
  site: string;
  approveStatus: string;
  comment?: string;
  actionBy?: string;
  actionDate?: string;
  pendingWith?: string;
  requiredRole: string;
  assignedUserId?: number;
  assignedUserName?: string;
  nextStageName?: string;
  nextUser?: string;
  nextUserEmail?: string;
  createdAt: string;
  updatedAt: string;
  isVisible: boolean;
}

export const DynamicWorkflowTracker: React.FC<DynamicWorkflowTrackerProps> = ({ initiativeId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] = useState<WorkflowTransactionDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: transactions = [], isLoading, refetch } = useVisibleWorkflowTransactions(initiativeId);
  const processStageAction = useProcessStageAction();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'rejected':
        return <Circle className="h-5 w-5 text-destructive" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const canUserActOnStage = (transaction: WorkflowTransactionDetail) => {
    if (!user || transaction.approveStatus !== 'pending') return false;
    
    // Only the specific user whose email is in pendingWith can approve this stage
    return transaction.pendingWith === user.email;
  };

  const handleStageAction = (transaction: WorkflowTransactionDetail) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleProcessStage = async (data: {
    action: string;
    comment: string;
    assignedUserId?: number;
    mocRequired?: boolean;
    mocNumber?: string;
    capexRequired?: boolean;
    capexNumber?: string;
  }) => {
    if (!selectedTransaction) return;

    try {
      await processStageAction.mutateAsync({
        transactionId: selectedTransaction.id,
        action: data.action as 'approved' | 'rejected',
        remarks: data.comment,
        assignedUserId: data.assignedUserId,
      });

      toast.success(`Stage ${selectedTransaction.stageNumber} ${data.action === 'approved' ? 'approved' : 'rejected'} successfully`);
      setIsModalOpen(false);
      setSelectedTransaction(null);
      refetch();
      
      // Handle post-approval redirection for approved actions only
      if (data.action === 'approved' && user) {
        handlePostApprovalRedirect(
          selectedTransaction.stageNumber,
          user.role,
          navigate
        );
      }
    } catch (error) {
      toast.error(`Failed to ${data.action} stage: ${error}`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground text-sm">Loading workflow...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <Workflow className="h-5 w-5 text-primary" />
            Dynamic Workflow Tracker
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Sequential workflow stages - only visible after previous stage approval
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-muted">
                <Activity className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No workflow stages available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <div key={transaction.id} className="relative">
                  {/* Stage Card - Compact */}
                  <Card className={`transition-all duration-200 shadow-sm ${
                    transaction.approveStatus === 'pending' ? 'ring-2 ring-primary/20 shadow-md' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Status Icon */}
                          <div className="mt-0.5">
                            {getStatusIcon(transaction.approveStatus)}
                          </div>
                          
                          {/* Stage Information */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs font-medium">
                                Stage {transaction.stageNumber}
                              </Badge>
                              <Badge className={`text-xs font-medium ${getStatusColor(transaction.approveStatus)}`}>
                                {transaction.approveStatus.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <h4 className="font-semibold text-sm mb-2">{transaction.stageName}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <User className="h-3 w-3" />
                                <span>
                                  {transaction.actionBy || transaction.pendingWith || 'Unassigned'}
                                </span>
                              </div>
                              
                              {transaction.actionDate && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(transaction.actionDate)}</span>
                                </div>
                              )}
                              
                              {transaction.assignedUserName && (
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3 w-3" />
                                  <span>Assigned IL: {transaction.assignedUserName}</span>
                                </div>
                              )}
                              
                              {transaction.nextUser && (
                                <div className="flex items-center gap-1.5">
                                  <ArrowRight className="h-3 w-3" />
                                  <span>Next: {transaction.nextUser}</span>
                                </div>
                              )}
                            </div>
                            
                            {transaction.comment && (
                              <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                                <div className="flex items-start gap-1.5">
                                  <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium mb-1">Comments:</p>
                                    <p className="text-muted-foreground">{transaction.comment}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Button - Compact */}
                        {canUserActOnStage(transaction) && (
                          <Button
                            size="sm"
                            onClick={() => handleStageAction(transaction)}
                            className="ml-4 shrink-0 px-4 py-2 text-xs"
                          >
                            Process Stage
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Connection Line to Next Stage */}
                  {index < transactions.length - 1 && (
                    <div className="flex justify-center my-3">
                      <div className="w-px h-6 bg-border"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage Processing Modal */}
      {selectedTransaction && (
        <WorkflowStageModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          userRole={user?.role || ''}
          onProcess={handleProcessStage}
        />
      )}
    </div>
  );
};