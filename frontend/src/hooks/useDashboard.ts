import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/lib/api';

export const useDashboardStats = (site?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'stats', site],
    queryFn: async () => {
      if (site) {
        return await dashboardAPI.getStatsBySite(site);
      }
      return await dashboardAPI.getStats();
    },
    staleTime: 5 * 60 * 1000, // Still valid
  });
};

export const useRecentInitiatives = (site?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'recent-initiatives', site],
    queryFn: async () => {
      if (site) {
        return await dashboardAPI.getRecentInitiativesBySite(site);
      }
      return await dashboardAPI.getRecentInitiatives();
    },
    staleTime: 2 * 60 * 1000, // Still valid
  });
};

export const usePerformanceAnalysis = () => {
  return useQuery({
    queryKey: ['dashboard', 'performance-analysis'],
    queryFn: async () => {
      return await dashboardAPI.getPerformanceAnalysis();
    },
    staleTime: 5 * 60 * 1000, // Still valid
  });
};
