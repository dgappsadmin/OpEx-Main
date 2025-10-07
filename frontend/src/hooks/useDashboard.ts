import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/lib/api';

export const useDashboardStats = (site?: string, financialYear?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'stats', site, financialYear],
    queryFn: async () => {
      if (site) {
        return await dashboardAPI.getStatsBySite(site, financialYear);
      }
      return await dashboardAPI.getStats(financialYear);
    },
    staleTime: 5 * 60 * 1000, // Still valid
  });
};

export const useRecentInitiatives = (site?: string, financialYear?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'recent-initiatives', site, financialYear],
    queryFn: async () => {
      if (site) {
        return await dashboardAPI.getRecentInitiativesBySite(site, financialYear);
      }
      return await dashboardAPI.getRecentInitiatives(financialYear);
    },
    staleTime: 2 * 60 * 1000, // Still valid
  });
};

export const usePerformanceAnalysis = (site?: string, financialYear?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'performance-analysis', site, financialYear],
    queryFn: async () => {
      if (site) {
        return await dashboardAPI.getPerformanceAnalysisBySite(site, financialYear);
      }
      return await dashboardAPI.getPerformanceAnalysis(financialYear);
    },
    staleTime: 5 * 60 * 1000, // Still valid
  });
};

export const useDashboardSites = () => {
  return useQuery({
    queryKey: ['dashboard', 'sites'],
    queryFn: async () => {
      return await dashboardAPI.getSites();
    },
    staleTime: 10 * 60 * 1000, // Sites don't change often, cache for 10 minutes
  });
};