import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timelineTrackerAPI } from '@/lib/api';

export interface TimelineEntry {
  id?: number;
  initiativeId?: number;
  stageName: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  responsiblePerson: string;
  remarks?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  siteLeadApproval: boolean;
  initiativeLeadApproval: boolean;
  documentPath?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Mock data for testing with Oracle-compatible boolean values
const mockTimelineEntries: TimelineEntry[] = [
  {
    id: 1,
    stageName: "Planning Phase",
    plannedStartDate: "2024-01-01",
    plannedEndDate: "2024-01-31",
    actualStartDate: "2024-01-01",
    actualEndDate: "2024-01-28",
    responsiblePerson: "John Doe",
    remarks: "Planning completed ahead of schedule",
    status: "COMPLETED",
    siteLeadApproval: true,
    initiativeLeadApproval: true
  },
  {
    id: 2,
    stageName: "Implementation Phase",
    plannedStartDate: "2024-02-01",
    plannedEndDate: "2024-03-31",
    actualStartDate: "2024-02-01",
    responsiblePerson: "Jane Smith",
    remarks: "Implementation in progress",
    status: "IN_PROGRESS",
    siteLeadApproval: false,
    initiativeLeadApproval: false
  }
];

export const useTimelineTracker = (initiativeId: number) => {
  return useQuery({
    queryKey: ['timelineTracker', initiativeId],
    queryFn: async () => {
      try {
        return await timelineTrackerAPI.getTimelineEntries(initiativeId);
      } catch (error) {
        console.warn('Failed to fetch timeline entries from API, using mock data:', error);
        return mockTimelineEntries;
      }
    },
    enabled: !!initiativeId,
  });
};

export const useTimelineEntry = (id: number) => {
  return useQuery({
    queryKey: ['timelineEntry', id],
    queryFn: async () => {
      try {
        return await timelineTrackerAPI.getTimelineEntryById(id);
      } catch (error) {
        console.warn('Failed to fetch timeline entry from API, using mock data:', error);
        return mockTimelineEntries.find(entry => entry.id === id);
      }
    },
    enabled: !!id,
  });
};

export const useCreateTimelineEntry = (initiativeId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entryData: Omit<TimelineEntry, 'id' | 'initiativeId'>) => {
      try {
        return await timelineTrackerAPI.createTimelineEntry(initiativeId, entryData);
      } catch (error) {
        console.error('Failed to create timeline entry:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelineTracker', initiativeId] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};

export const useUpdateTimelineEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, entryData }: { id: number; entryData: Partial<TimelineEntry> }) => {
      try {
        return await timelineTrackerAPI.updateTimelineEntry(id, entryData);
      } catch (error) {
        console.error('Failed to update timeline entry:', error);
        throw error;
      }
    },
    onSuccess: (_, { entryData }) => {
      if (entryData.initiativeId) {
        queryClient.invalidateQueries({ queryKey: ['timelineTracker', entryData.initiativeId] });
      }
      queryClient.invalidateQueries({ queryKey: ['timelineEntry'] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};

export const useUpdateApprovals = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, siteLeadApproval, initiativeLeadApproval }: { 
      id: number; 
      siteLeadApproval?: boolean; 
      initiativeLeadApproval?: boolean;
    }) => {
      try {
        return await timelineTrackerAPI.updateApprovals(id, siteLeadApproval, initiativeLeadApproval);
      } catch (error) {
        console.error('Failed to update approvals:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelineTracker'] });
      queryClient.invalidateQueries({ queryKey: ['timelineEntry'] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};

export const useDeleteTimelineEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await timelineTrackerAPI.deleteTimelineEntry(id);
      } catch (error) {
        console.error('Failed to delete timeline entry:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelineTracker'] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};

export const useApprovedInitiatives = (userEmail: string, site: string) => {
  return useQuery({
    queryKey: ['approvedInitiatives', userEmail, site],
    queryFn: async () => {
      try {
        return await timelineTrackerAPI.getApprovedInitiatives(userEmail, site);
      } catch (error) {
        console.warn('Failed to fetch approved initiatives from API:', error);
        return [];
      }
    },
    enabled: !!userEmail && !!site,
  });
};