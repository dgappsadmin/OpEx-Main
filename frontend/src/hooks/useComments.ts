import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentAPI } from '@/lib/api';
import { mockInitiatives } from '@/lib/mockData';

export const useComments = (initiativeId: number) => {
  return useQuery({
    queryKey: ['comments', initiativeId],
    queryFn: async () => {
      try {
        // Try real API first
        return await commentAPI.getByInitiative(initiativeId);
      } catch (error) {
        console.warn('Failed to fetch comments from API, using mock data:', error);
        // Fallback to mock data
        const initiative = mockInitiatives.find(i => Number(i.id) === initiativeId);
        return initiative?.comments || [];
      }
    },
    enabled: !!initiativeId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { content: string; initiativeId: number }) => {
      console.log('useCreateComment - Sending data:', data);
      try {
        const result = await commentAPI.create(data);
        console.log('useCreateComment - Success:', result);
        return result;
      } catch (error) {
        console.error('useCreateComment - Error:', error);
        // For mock data, we'll just return a success response
        return {
          id: Date.now(),
          content: data.content,
          user: { fullName: 'Current User' },
          createdAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: (data, variables) => {
      console.log('useCreateComment - onSuccess called with:', data);
      queryClient.invalidateQueries({ queryKey: ['comments', variables.initiativeId] });
    },
    onError: (error) => {
      console.error('useCreateComment - onError called with:', error);
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: number; content: string }) => {
      try {
        return await commentAPI.update(data.id, data.content);
      } catch (error) {
        console.error('Failed to update comment:', error);
        // Mock success for demo
        return { ...data, updatedAt: new Date().toISOString() };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await commentAPI.delete(id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
        // Mock success for demo
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
};