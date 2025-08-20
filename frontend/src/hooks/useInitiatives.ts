import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { initiativeAPI } from '@/lib/api';
import { mockInitiatives } from '@/lib/mockData';

export const useInitiatives = (filters?: {
  status?: string;
  site?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['initiatives', filters],
    queryFn: async () => {
      try {
        // Try real API first
        return await initiativeAPI.getAll(filters);
      } catch (error) {
        console.warn('Failed to fetch from API, using mock data:', error);
        // Fallback to mock data
        let filtered = mockInitiatives;
        if (filters?.status) {
          filtered = filtered.filter(i => i.status === filters.status);
        }
        if (filters?.site) {
          filtered = filtered.filter(i => i.site === filters.site);
        }
        if (filters?.search) {
          filtered = filtered.filter(i => 
            i.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
            i.description.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }
        return { content: filtered, totalElements: filtered.length };
      }
    },
  });
};

export const useInitiative = (id: number) => {
  return useQuery({
    queryKey: ['initiative', id],
    queryFn: async () => {
      try {
        return await initiativeAPI.getById(id);
      } catch (error) {
        console.warn('Failed to fetch initiative from API, using mock data:', error);
        return mockInitiatives.find(i => Number(i.id) === id);
      }
    },
    enabled: !!id,
  });
};

export const useCreateInitiative = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      console.log('useCreateInitiative - Sending data:', data);
      try {
        const result = await initiativeAPI.create(data);
        console.log('useCreateInitiative - Success:', result);
        return result;
      } catch (error) {
        console.error('useCreateInitiative - Error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('useCreateInitiative - onSuccess called with:', data);
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
    onError: (error) => {
      console.error('useCreateInitiative - onError called with:', error);
    },
  });
};