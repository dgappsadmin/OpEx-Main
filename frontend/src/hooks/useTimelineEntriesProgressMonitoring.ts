import { useQuery } from '@tanstack/react-query';
import { timelineTrackerAPI } from '@/lib/api';

export interface TimelineEntryProgressMonitoring {
  id: number;
  stageName: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  responsiblePerson: string;
  remarks?: string;
  documentPath?: string;
  siteLeadApproval: string;
  initiativeLeadApproval: string;
  progressPercentage?: number;
}

export const useTimelineEntriesProgressMonitoring = (initiativeId: number) => {
  return useQuery({
    queryKey: ['timeline-entries-progress-monitoring', initiativeId],
    queryFn: async (): Promise<TimelineEntryProgressMonitoring[]> => {
      if (!initiativeId) return [];
      const result = await timelineTrackerAPI.getTimelineEntriesForProgressMonitoring(initiativeId);
      return result.data || [];
    },
    enabled: !!initiativeId,
  });
};