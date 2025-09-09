import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monthlyMonitoringAPI } from '@/lib/api';

export interface MonthlyMonitoringEntry {
  id?: number;
  initiativeId: number;
  monitoringMonth: string; // YYYY-MM format
  kpiDescription: string;
  targetValue: number;
  achievedValue?: number;
  deviation?: number;
  deviationPercentage?: number;
  remarks?: string;
  category?: string;
  isFinalized: string; // Changed to 'Y' or 'N'
  faApproval: string; // Changed to 'Y' or 'N'
  faRemarks?: string;
  enteredBy: string;
  createdAt?: string;
  updatedAt?: string;
}

// Mock data for testing with Y/N string values
const mockMonitoringEntries: MonthlyMonitoringEntry[] = [
  {
    id: 1,
    initiativeId: 1,
    monitoringMonth: "2024-01",
    kpiDescription: "Energy Efficiency Improvement",
    targetValue: 15.0,
    achievedValue: 12.5,
    deviation: -2.5,
    deviationPercentage: -16.67,
    remarks: "Slightly below target due to equipment maintenance",
    category: "Energy",
    isFinalized: "N",
    faApproval: "N",
    enteredBy: "johndoe@company.com"
  },
  {
    id: 2,
    initiativeId: 1,
    monitoringMonth: "2024-02",
    kpiDescription: "Energy Efficiency Improvement",
    targetValue: 15.0,
    achievedValue: 18.2,
    deviation: 3.2,
    deviationPercentage: 21.33,
    remarks: "Exceeded target after equipment optimization",
    category: "Energy",
    isFinalized: "Y",
    faApproval: "Y",
    faRemarks: "Excellent performance",
    enteredBy: "johndoe@company.com"
  }
];

export const useMonthlyMonitoring = (initiativeId: number) => {
  return useQuery({
    queryKey: ['monthlyMonitoring', initiativeId],
    queryFn: async () => {
      try {
        return await monthlyMonitoringAPI.getMonitoringEntries(initiativeId);
      } catch (error) {
        console.warn('Failed to fetch monthly monitoring entries from API, using mock data:', error);
        return mockMonitoringEntries.filter(entry => entry.initiativeId === initiativeId);
      }
    },
    enabled: !!initiativeId,
  });
};

export const useMonthlyMonitoringByMonth = (initiativeId: number, monthYear: string) => {
  return useQuery({
    queryKey: ['monthlyMonitoring', initiativeId, monthYear],
    queryFn: async () => {
      try {
        return await monthlyMonitoringAPI.getMonitoringEntriesByMonth(initiativeId, monthYear);
      } catch (error) {
        console.warn('Failed to fetch monthly monitoring entries from API, using mock data:', error);
        return mockMonitoringEntries.filter(
          entry => entry.initiativeId === initiativeId && entry.monitoringMonth === monthYear
        );
      }
    },
    enabled: !!initiativeId && !!monthYear,
  });
};

export const useMonitoringEntry = (id: number) => {
  return useQuery({
    queryKey: ['monitoringEntry', id],
    queryFn: async () => {
      try {
        return await monthlyMonitoringAPI.getMonitoringEntryById(id);
      } catch (error) {
        console.warn('Failed to fetch monitoring entry from API, using mock data:', error);
        return mockMonitoringEntries.find(entry => entry.id === id);
      }
    },
    enabled: !!id,
  });
};

export const useCreateMonitoringEntry = (initiativeId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<MonthlyMonitoringEntry, 'id' | 'initiativeId'>) => {
      try {
        return await monthlyMonitoringAPI.createMonitoringEntry(initiativeId, data);
      } catch (error) {
        console.error('Failed to create monitoring entry:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyMonitoring', initiativeId] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};

export const useUpdateMonitoringEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MonthlyMonitoringEntry> }) => {
      try {
        return await monthlyMonitoringAPI.updateMonitoringEntry(id, data);
      } catch (error) {
        console.error('Failed to update monitoring entry:', error);
        throw error;
      }
    },
    onSuccess: (_, { data }) => {
      if (data.initiativeId) {
        queryClient.invalidateQueries({ queryKey: ['monthlyMonitoring', data.initiativeId] });
      }
      queryClient.invalidateQueries({ queryKey: ['monitoringEntry'] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};

export const useUpdateFinalizationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isFinalized }: { id: number; isFinalized: string }) => {
      try {
        return await monthlyMonitoringAPI.updateFinalizationStatus(id, isFinalized);
      } catch (error) {
        console.error('Failed to update finalization status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyMonitoring'] });
      queryClient.invalidateQueries({ queryKey: ['monitoringEntry'] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};

export const useUpdateFAApproval = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, faApproval, faComments }: { 
      id: number; 
      faApproval: string; 
      faComments?: string;
    }) => {
      try {
        return await monthlyMonitoringAPI.updateFAApproval(id, faApproval, faComments);
      } catch (error) {
        console.error('Failed to update FA approval:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyMonitoring'] });
      queryClient.invalidateQueries({ queryKey: ['monitoringEntry'] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};

export const useDeleteMonitoringEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await monthlyMonitoringAPI.deleteMonitoringEntry(id);
      } catch (error) {
        console.error('Failed to delete monitoring entry:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyMonitoring'] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};

export const useApprovedInitiativesForMonitoring = (userEmail: string, site: string) => {
  return useQuery({
    queryKey: ['approvedInitiativesForMonitoring', userEmail, site],
    queryFn: async () => {
      try {
        return await monthlyMonitoringAPI.getApprovedInitiatives(userEmail, site);
      } catch (error) {
        console.warn('Failed to fetch approved initiatives from API:', error);
        return [];
      }
    },
    enabled: !!userEmail && !!site,
  });
};

export const useFinalizedPendingFAEntries = (initiativeId: number) => {
  return useQuery({
    queryKey: ['finalizedPendingFA', initiativeId],
    queryFn: async () => {
      try {
        return await monthlyMonitoringAPI.getFinalizedPendingFAEntries(initiativeId);
      } catch (error) {
        console.warn('Failed to fetch finalized pending F&A entries from API:', error);
        return [];
      }
    },
    enabled: !!initiativeId,
  });
};

export const useBatchFAApproval = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entryIds, faComments }: { 
      entryIds: number[]; 
      faComments?: string;
    }) => {
      try {
        return await monthlyMonitoringAPI.batchFAApproval(entryIds, faComments);
      } catch (error) {
        console.error('Failed to process batch F&A approval:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyMonitoring'] });
      queryClient.invalidateQueries({ queryKey: ['finalizedPendingFA'] });
      queryClient.invalidateQueries({ queryKey: ['approvedInitiatives'] });
    },
  });
};