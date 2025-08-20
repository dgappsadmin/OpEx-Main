import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remarksAPI } from '@/lib/api';

export interface RemarksEntry {
  id?: number;
  content: string;
  type?: string;
  stageNumber?: number;
  createdAt?: string;
  initiativeId: number;
  user?: {
    id: number;
    fullName: string;
    email: string;
  };
}

// Keep backward compatibility
export interface CommentEntry extends RemarksEntry {}

const mockRemarks: RemarksEntry[] = [
  {
    id: 1,
    content: "Initial assessment shows promising potential for energy savings.",
    type: "general",
    stageNumber: 1,
    createdAt: "2024-01-15T10:30:00Z",
    initiativeId: 1,
    user: {
      id: 1,
      fullName: "John Doe",
      email: "john.doe@company.com"
    }
  },
  {
    id: 2,
    content: "Approved for implementation phase. Good baseline data provided.",
    type: "approval",
    stageNumber: 2,
    createdAt: "2024-01-20T14:15:00Z",
    initiativeId: 1,
    user: {
      id: 2,
      fullName: "Jane Smith",
      email: "jane.smith@company.com"
    }
  }
];

export const useRemarks = (initiativeId: number) => {
  return useQuery({
    queryKey: ['remarks', initiativeId],
    queryFn: async () => {
      try {
        return await remarksAPI.getByInitiative(initiativeId);
      } catch (error) {
        console.warn('Failed to fetch remarks from API, using mock data:', error);
        return mockRemarks.filter(remark => remark.initiativeId === initiativeId);
      }
    },
    enabled: !!initiativeId,
  });
};

export const useCreateRemarks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { content: string; initiativeId: number }) => {
      try {
        return await remarksAPI.create(data);
      } catch (error) {
        console.error('Failed to create remarks:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['remarks', variables.initiativeId] });
    },
  });
};

export const useUpdateRemarks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      try {
        return await remarksAPI.update(id, content);
      } catch (error) {
        console.error('Failed to update remarks:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remarks'] });
    },
  });
};

export const useDeleteRemarks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await remarksAPI.delete(id);
      } catch (error) {
        console.error('Failed to delete remarks:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remarks'] });
    },
  });
};

// Backward compatibility aliases
export const useComments = useRemarks;
export const useCreateComment = useCreateRemarks;
export const useUpdateComment = useUpdateRemarks;
export const useDeleteComment = useDeleteRemarks;