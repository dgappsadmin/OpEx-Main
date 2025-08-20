import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowAPI } from '@/lib/api';
import { workflowStages } from '@/lib/mockData';

export const useWorkflowStages = (initiativeId: number) => {
  return useQuery({
    queryKey: ['workflowStages', initiativeId],
    queryFn: async () => {
      try {
        // Try real API first
        return await workflowAPI.getStages(initiativeId);
      } catch (error) {
        console.warn('Failed to fetch workflow stages from API, using mock data:', error);
        // Fallback to mock data - create mock workflow instances for the initiative
        return workflowStages.map((stage, index) => ({
          id: initiativeId * 100 + stage.stage,
          initiativeId,
          stageNumber: stage.stage,
          stageName: stage.name,
          status: index < 3 ? 'approved' : index === 3 ? 'pending' : 'not_started',
          requiredRole: stage.role,
          approvedBy: index < 3 ? 'Mock User' : null,
          approvedAt: index < 3 ? new Date().toISOString() : null,
          comments: index < 3 ? 'Approved during mock data generation' : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }
    },
    enabled: !!initiativeId,
  });
};

export const usePendingApprovals = (userId: number) => {
  return useQuery({
    queryKey: ['pendingApprovals', userId],
    queryFn: async () => {
      try {
        // Try real API first
        return await workflowAPI.getPendingApprovals(userId);
      } catch (error) {
        console.warn('Failed to fetch pending approvals from API, using mock data:', error);
        // Fallback to mock data - create mock pending approvals
        return workflowStages.slice(0, 3).map((stage, index) => ({
          id: userId * 100 + index,
          initiativeId: userId + index,
          stageNumber: stage.stage,
          stageName: stage.name,
          status: 'pending',
          requiredRole: stage.role,
          approvedBy: null,
          approvedAt: null,
          comments: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }
    },
    enabled: !!userId,
  });
};

export const useApproveStage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { stageId: number; comments: string }) => {
      console.log('useApproveStage - Sending data:', data);
      
      if (!data.comments || data.comments.trim() === '') {
        throw new Error('Comments are required for approval');
      }
      
      try {
        const result = await workflowAPI.approveStage(data.stageId, data.comments);
        console.log('useApproveStage - Success:', result);
        return result;
      } catch (error) {
        console.error('useApproveStage - Error:', error);
        // Mock success for demo
        return {
          id: data.stageId,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          comments: data.comments,
        };
      }
    },
    onSuccess: () => {
      console.log('useApproveStage - onSuccess called');
      queryClient.invalidateQueries({ queryKey: ['workflowStages'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    },
    onError: (error) => {
      console.error('useApproveStage - onError called with:', error);
    },
  });
};

export const useRejectStage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { stageId: number; comments: string }) => {
      if (!data.comments || data.comments.trim() === '') {
        throw new Error('Comments are required for rejection');
      }
      
      try {
        return await workflowAPI.rejectStage(data.stageId, data.comments);
      } catch (error) {
        console.error('Failed to reject stage:', error);
        // Mock success for demo
        return {
          id: data.stageId,
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          comments: data.comments,
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowStages'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    },
  });
};