import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timelineAPI } from '@/lib/api';
import { mockInitiatives } from '@/lib/mockData';

export const useTimelineTasks = (initiativeId: number) => {
  return useQuery({
    queryKey: ['timelineTasks', initiativeId],
    queryFn: async () => {
      try {
        // Try real API first
        return await timelineAPI.getByInitiative(initiativeId);
      } catch (error) {
        console.warn('Failed to fetch timeline tasks from API, using mock data:', error);
        // Fallback to mock data
        const initiative = mockInitiatives.find(i => Number(i.id) === initiativeId);
        return initiative?.timeline || [];
      }
    },
    enabled: !!initiativeId,
  });
};

export const useCreateTimelineTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      console.log('useCreateTimelineTask - Sending data:', data);
      try {
        const result = await timelineAPI.create(data);
        console.log('useCreateTimelineTask - Success:', result);
        return result;
      } catch (error) {
        console.error('useCreateTimelineTask - Error:', error);
        // Mock success for demo
        return {
          id: Date.now(),
          ...data,
          createdAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: (data, variables) => {
      console.log('useCreateTimelineTask - onSuccess called with:', data);
      queryClient.invalidateQueries({ queryKey: ['timelineTasks', variables.initiativeId] });
    },
    onError: (error) => {
      console.error('useCreateTimelineTask - onError called with:', error);
    },
  });
};

export const useUpdateTimelineTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: number; taskData: any }) => {
      try {
        return await timelineAPI.update(data.id, data.taskData);
      } catch (error) {
        console.error('Failed to update timeline task:', error);
        // Mock success for demo
        return { ...data.taskData, id: data.id, updatedAt: new Date().toISOString() };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelineTasks'] });
    },
  });
};

export const useUpdateTaskProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: number; progress: number }) => {
      console.log('useUpdateTaskProgress - Sending data:', data);
      try {
        const result = await timelineAPI.updateProgress(data.id, data.progress);
        console.log('useUpdateTaskProgress - Success:', result);
        return result;
      } catch (error) {
        console.error('useUpdateTaskProgress - Error:', error);
        // Mock success for demo
        return {
          id: data.id,
          progress: data.progress,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: () => {
      console.log('useUpdateTaskProgress - onSuccess called');
      queryClient.invalidateQueries({ queryKey: ['timelineTasks'] });
    },
    onError: (error) => {
      console.error('useUpdateTaskProgress - onError called with:', error);
    },
  });
};

export const useDeleteTimelineTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await timelineAPI.delete(id);
      } catch (error) {
        console.error('Failed to delete timeline task:', error);
        // Mock success for demo
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelineTasks'] });
    },
  });
};