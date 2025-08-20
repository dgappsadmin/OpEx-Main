import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timelineAPI } from '@/lib/api';

export const useTimelineTasks = (initiativeId: number) => {
  return useQuery({
    queryKey: ['timeline-tasks', initiativeId],
    queryFn: () => timelineAPI.getByInitiative(initiativeId),
    enabled: !!initiativeId,
  });
};

export const useCreateTimelineTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: timelineAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
    },
  });
};

export const useUpdateTimelineTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, taskData }: { id: number; taskData: any }) => 
      timelineAPI.update(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
    },
  });
};

export const useUpdateTaskProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, progress }: { id: number; progress: number }) => 
      timelineAPI.updateProgress(id, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
    },
  });
};