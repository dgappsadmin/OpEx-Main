import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowTransactionAPI } from '@/lib/api';

export const useWorkflowTransactions = (initiativeId: number) => {
  return useQuery({
    queryKey: ['workflow-transactions', initiativeId],
    queryFn: () => workflowTransactionAPI.getTransactions(initiativeId),
    enabled: !!initiativeId,
  });
};

export const useVisibleWorkflowTransactions = (initiativeId: number) => {
  return useQuery({
    queryKey: ['visible-workflow-transactions', initiativeId],
    queryFn: () => workflowTransactionAPI.getVisibleTransactions(initiativeId),
    enabled: !!initiativeId,
  });
};

export const usePendingTransactionsByRole = (roleCode: string) => {
  return useQuery({
    queryKey: ['pending-transactions', roleCode],
    queryFn: () => workflowTransactionAPI.getPendingByRole(roleCode),
    enabled: !!roleCode,
  });
};

export const usePendingTransactionsBySiteAndRole = (site: string, roleCode: string) => {
  return useQuery({
    queryKey: ['pending-transactions', site, roleCode],
    queryFn: () => workflowTransactionAPI.getPendingBySiteAndRole(site, roleCode),
    enabled: !!site && !!roleCode,
  });
};

export const useCurrentPendingStage = (initiativeId: number) => {
  return useQuery({
    queryKey: ['current-pending-stage', initiativeId],
    queryFn: () => workflowTransactionAPI.getCurrentPendingStage(initiativeId),
    enabled: !!initiativeId,
  });
};

export const useProgressPercentage = (initiativeId: number) => {
  return useQuery({
    queryKey: ['progress-percentage', initiativeId],
    queryFn: () => workflowTransactionAPI.getProgressPercentage(initiativeId),
    enabled: !!initiativeId,
  });
};

export const useProcessStageAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workflowTransactionAPI.processStageAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['visible-workflow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['current-pending-stage'] });
      queryClient.invalidateQueries({ queryKey: ['progress-percentage'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });
};

export const useInitiativesReadyForClosure = () => {
  return useQuery({
    queryKey: ['initiatives-ready-for-closure'],
    queryFn: () => workflowTransactionAPI.getInitiativesReadyForClosure(),
  });
};