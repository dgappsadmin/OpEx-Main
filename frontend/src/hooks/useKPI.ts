// import { useQuery } from '@tanstack/react-query';
// import { dashboardAPI } from '@/lib/api';

// // Create dedicated KPI hooks similar to dashboard hooks
// export const useKPIStats = (site?: string) => {
//   return useQuery({
//     queryKey: ['kpi', 'stats', site],
//     queryFn: async () => {
//       if (site) {
//         return await dashboardAPI.getStatsBySite(site);
//       }
//       return await dashboardAPI.getStats();
//     },
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };

// export const useKPIInitiatives = (site?: string) => {
//   return useQuery({
//     queryKey: ['kpi', 'initiatives', site],
//     queryFn: async () => {
//       if (site) {
//         return await dashboardAPI.getRecentInitiativesBySite(site);
//       }
//       return await dashboardAPI.getRecentInitiatives();
//     },
//     staleTime: 2 * 60 * 1000, // 2 minutes
//   });
// };

// export const useKPIPerformance = (site?: string) => {
//   return useQuery({
//     queryKey: ['kpi', 'performance', site],
//     queryFn: async () => {
//       if (site) {
//         return await dashboardAPI.getPerformanceAnalysisBySite(site);
//       }
//       return await dashboardAPI.getPerformanceAnalysis();
//     },
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };

// export const useKPISites = () => {
//   return useQuery({
//     queryKey: ['kpi', 'sites'],
//     queryFn: async () => {
//       return await dashboardAPI.getSites();
//     },
//     staleTime: 10 * 60 * 1000, // 10 minutes
//   });
// };