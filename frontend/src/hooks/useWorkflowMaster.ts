import { useQuery } from '@tanstack/react-query';

// Function to get API base URL (same logic as main API file)
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development environment
    return 'http://localhost:9090/opexhub/api';
  } else if (hostname === 'dgapps.godeepak.com') {
    // Production environment
    return 'https://dgapps.godeepak.com/opexhub/api';
  } else if (hostname === 'dgpilotapps.godeepak.com') {
    // Pilot environment
    return 'https://dgpilotapps.godeepak.com/opexhub/api';
  } else {
    // Fallback to localhost for unknown environments
    return 'http://localhost:9090/opexhub/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

// API functions for dynamic workflow data
const workflowMasterAPI = {
  getAllStageNames: async () => {
    const response = await fetch(`${API_BASE_URL}/wf-master/all-stage-names`);
    if (!response.ok) {
      throw new Error('Failed to fetch stage names');
    }
    return response.json();
  },

  getAllRoleDescriptions: async () => {
    const response = await fetch(`${API_BASE_URL}/wf-master/all-role-descriptions`);
    if (!response.ok) {
      throw new Error('Failed to fetch role descriptions');
    }
    return response.json();
  },

  getDynamicStageName: async (stageNumber: number, site: string = 'NDS') => {
    const response = await fetch(`${API_BASE_URL}/wf-master/stage/${stageNumber}/name?site=${site}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stage name');
    }
    return response.text();
  },

  getWorkflowConfigForSite: async (site: string) => {
    const response = await fetch(`${API_BASE_URL}/wf-master/site/${site}`);
    if (!response.ok) {
      throw new Error('Failed to fetch workflow config');
    }
    return response.json();
  }
};

// Custom hooks for workflow data
export const useAllStageNames = () => {
  return useQuery({
    queryKey: ['workflow-stage-names'],
    queryFn: workflowMasterAPI.getAllStageNames,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime in v5+)
  });
};

export const useAllRoleDescriptions = () => {
  return useQuery({
    queryKey: ['workflow-role-descriptions'],
    queryFn: workflowMasterAPI.getAllRoleDescriptions,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime in v5+)
  });
};

export const useDynamicStageName = (stageNumber: number, site: string = 'NDS') => {
  return useQuery({
    queryKey: ['dynamic-stage-name', stageNumber, site],
    queryFn: () => workflowMasterAPI.getDynamicStageName(stageNumber, site),
    enabled: !!stageNumber,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime in v5+)
  });
};

export const useWorkflowConfigForSite = (site: string) => {
  return useQuery({
    queryKey: ['workflow-config', site],
    queryFn: () => workflowMasterAPI.getWorkflowConfigForSite(site),
    enabled: !!site,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (renamed from cacheTime in v5+)
  });
};