import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monthlyMonitoringAPI } from '@/lib/api';
import { toast } from 'sonner';

// Mock data for Monthly Monitoring
const mockMonitoringEntries = [
  {
    id: 1,
    kpiDescription: "Energy consumption reduction",
    monitoringMonth: "2025-01",
    targetValue: 500,
    achievedValue: 450,
    deviation: -50,
    isFinalized: false,
    faApproval: false,
    enteredBy: "Site TSO"
  },
  {
    id: 2,
    kpiDescription: "Waste reduction percentage",
    monitoringMonth: "2025-01",
    targetValue: 20,
    achievedValue: 25,
    deviation: 5,
    isFinalized: true,
    faApproval: true,
    enteredBy: "Corp TSO"
  }
];

export const useMonitoringEntries = (initiativeId: number) => {
  return useQuery({
    queryKey: ['monitoring-entries', initiativeId],
    queryFn: async () => {
      try {
        return await monthlyMonitoringAPI.getMonitoringEntries(initiativeId);
      } catch (error) {
        console.warn('API call failed, using mock data:', error);
        return mockMonitoringEntries;
      }
    },
    enabled: !!initiativeId,
  });
};

export const useMonitoringEntriesByMonth = (initiativeId: number, monthYear: string) => {
  return useQuery({
    queryKey: ['monitoring-entries', initiativeId, monthYear],
    queryFn: () => monthlyMonitoringAPI.getMonitoringEntriesByMonth(initiativeId, monthYear),
    enabled: !!initiativeId && !!monthYear,
  });
};

export const useMonitoringEntry = (id: number) => {
  return useQuery({
    queryKey: ['monitoring-entry', id],
    queryFn: () => monthlyMonitoringAPI.getMonitoringEntryById(id),
    enabled: !!id,
  });
};

export const useCreateMonitoringEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ initiativeId, entryData }: { initiativeId: number; entryData: any }) => 
      monthlyMonitoringAPI.createMonitoringEntry(initiativeId, entryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      toast.success('Monitoring entry created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create monitoring entry');
    },
  });
};

export const useUpdateMonitoringEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, entryData }: { id: number; entryData: any }) => 
      monthlyMonitoringAPI.updateMonitoringEntry(id, entryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring-entry'] });
      toast.success('Monitoring entry updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update monitoring entry');
    },
  });
};

export const useUpdateFinalizationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isFinalized }: { id: number; isFinalized: boolean }) => 
      monthlyMonitoringAPI.updateFinalizationStatus(id, isFinalized),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring-entry'] });
      toast.success('Finalization status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update finalization status');
    },
  });
};

export const useUpdateFAApproval = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, faApproval, faComments }: { 
      id: number; 
      faApproval: boolean; 
      faComments?: string; 
    }) => monthlyMonitoringAPI.updateFAApproval(id, faApproval, faComments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring-entry'] });
      toast.success('F&A approval updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update F&A approval');
    },
  });
};

export const useDeleteMonitoringEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => monthlyMonitoringAPI.deleteMonitoringEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-entries'] });
      toast.success('Monitoring entry deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete monitoring entry');
    },
  });
};

export const usePendingFAApprovals = (initiativeId: number) => {
  return useQuery({
    queryKey: ['pending-fa-approvals', initiativeId],
    queryFn: () => monthlyMonitoringAPI.getPendingFAApprovals(initiativeId),
    enabled: !!initiativeId,
  });
};