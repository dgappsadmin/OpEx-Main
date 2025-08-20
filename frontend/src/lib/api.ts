import axios from 'axios';

const API_BASE_URL = 'http://localhost:9090/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('opex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data, error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('opex_token');
      localStorage.removeItem('opex_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Utility functions for Boolean to Y/N conversion
const booleanToYN = (value: boolean | undefined | null): string => {
  return value === true ? 'Y' : 'N';
};

const ynToBoolean = (value: string | undefined | null): boolean => {
  return value === 'Y';
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/signin', { email, password });
    return response.data;
  },
  
  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    site: string;
    discipline: string;
    role: string;
    roleName: string;
  }) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  }
};

// Initiative API
export const initiativeAPI = {
  getAll: async (params?: {
    status?: string;
    site?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => {
    const response = await api.get('/initiatives', { params });
    
    // Convert Y/N back to boolean for frontend
    if (response.data && response.data.content) {
      response.data.content = response.data.content.map((initiative: any) => ({
        ...initiative,
        requiresMoc: ynToBoolean(initiative.requiresMoc),
        requiresCapex: ynToBoolean(initiative.requiresCapex),
      }));
    }
    
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/initiatives/${id}`);
    
    // Convert Y/N back to boolean for frontend
    if (response.data) {
      response.data = {
        ...response.data,
        requiresMoc: ynToBoolean(response.data.requiresMoc),
        requiresCapex: ynToBoolean(response.data.requiresCapex),
      };
    }
    
    return response.data;
  },
  
  create: async (initiativeData: {
    title: string;
    description: string;
    initiatorName: string;
    priority: string;
    expectedSavings: number;
    site: string;
    discipline: string;
    startDate: string;
    endDate: string;
    requiresMoc: boolean;
    requiresCapex: boolean;
    assumption1?: string;
    assumption2?: string;
    assumption3?: string;
    baselineData?: string;
    targetOutcome?: string;
    targetValue?: number;
    confidenceLevel?: number;
    estimatedCapex?: number;
    budgetType?: string;
  }) => {
    // Convert boolean to Y/N for backend
    const backendData = {
      ...initiativeData,
      requiresMoc: booleanToYN(initiativeData.requiresMoc),
      requiresCapex: booleanToYN(initiativeData.requiresCapex),
    };
    
    const response = await api.post('/initiatives', backendData);
    return response.data;
  },
  
  update: async (id: number, initiativeData: any) => {
    // Convert boolean to Y/N for backend if present
    const backendData = { ...initiativeData };
    if (typeof backendData.requiresMoc === 'boolean') {
      backendData.requiresMoc = booleanToYN(backendData.requiresMoc);
    }
    if (typeof backendData.requiresCapex === 'boolean') {
      backendData.requiresCapex = booleanToYN(backendData.requiresCapex);
    }
    
    const response = await api.put(`/initiatives/${id}`, backendData);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/initiatives/${id}`);
    return response.data;
  }
};

// Timeline Task API
export const timelineAPI = {
  getByInitiative: async (initiativeId: number) => {
    const response = await api.get(`/timeline-tasks/initiative/${initiativeId}`);
    return response.data;
  },
  
  create: async (taskData: any) => {
    const response = await api.post('/timeline-tasks', taskData);
    return response.data;
  },
  
  update: async (id: number, taskData: any) => {
    const response = await api.put(`/timeline-tasks/${id}`, taskData);
    return response.data;
  },
  
  updateProgress: async (id: number, progress: number) => {
    const response = await api.put(`/timeline-tasks/${id}/progress?progress=${progress}`);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/timeline-tasks/${id}`);
    return response.data;
  }
};

// Workflow API
export const workflowAPI = {
  getStages: async (initiativeId: number) => {
    const response = await api.get(`/workflow/initiative/${initiativeId}`);
    return response.data;
  },
  
  approveStage: async (stageId: number, remarks: string) => {
    const response = await api.post(`/workflow/stage/${stageId}/approve`, { remarks });
    return response.data;
  },
  
  rejectStage: async (stageId: number, remarks: string) => {
    const response = await api.post(`/workflow/stage/${stageId}/reject`, { remarks });
    return response.data;
  },
  
  getPendingApprovals: async (userId: number) => {
    const response = await api.get(`/workflow/pending/${userId}`);
    return response.data;
  }
};

// Remarks API (renamed from Comment)
export const remarksAPI = {
  getByInitiative: async (initiativeId: number) => {
    const response = await api.get(`/remarks/initiative/${initiativeId}`);
    return response.data;
  },
  
  create: async (remarksData: {
    content: string;
    initiativeId: number;
  }) => {
    const response = await api.post('/remarks', remarksData);
    return response.data;
  },
  
  update: async (id: number, content: string) => {
    const response = await api.put(`/remarks/${id}`, { content });
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/remarks/${id}`);
    return response.data;
  }
};

// Keep legacy commentAPI for backward compatibility
export const commentAPI = remarksAPI;

// User API
export const userAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  getBySite: async (site: string) => {
    const response = await api.get(`/users/site/${site}`);
    return response.data;
  },
  
  getByRole: async (role: string) => {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  },
  
  getBySiteAndRole: async (site: string, role: string) => {
    const response = await api.get(`/users/site/${site}/role/${role}`);
    return response.data;
  },
  
  getInitiativeLeadsBySite: async (site: string) => {
    const response = await api.get(`/users/initiative-leads/${site}`);
    return response.data;
  }
};

// Timeline Tracker API
export const timelineTrackerAPI = {
  // Get approved initiatives for Stage 6 access
  getApprovedInitiatives: async (userEmail: string, site: string) => {
    const response = await api.get(`/timeline-tracker/approved-initiatives/${encodeURIComponent(userEmail)}/${site}`);
    return response.data;
  },

  getTimelineEntries: async (initiativeId: number) => {
    const response = await api.get(`/timeline-tracker/${initiativeId}`);
    
    // Convert Y/N back to boolean for frontend
    if (response.data) {
      response.data = response.data.map((entry: any) => ({
        ...entry,
        siteLeadApproval: ynToBoolean(entry.siteLeadApproval),
        initiativeLeadApproval: ynToBoolean(entry.initiativeLeadApproval),
      }));
    }
    
    return response.data;
  },
  
  getTimelineEntryById: async (id: number) => {
    const response = await api.get(`/timeline-tracker/entry/${id}`);
    
    // Convert Y/N back to boolean for frontend
    if (response.data) {
      response.data = {
        ...response.data,
        siteLeadApproval: ynToBoolean(response.data.siteLeadApproval),
        initiativeLeadApproval: ynToBoolean(response.data.initiativeLeadApproval),
      };
    }
    
    return response.data;
  },
  
  createTimelineEntry: async (initiativeId: number, entryData: any) => {
    // Convert boolean to Y/N for backend
    const backendData = { ...entryData };
    if (typeof backendData.siteLeadApproval === 'boolean') {
      backendData.siteLeadApproval = booleanToYN(backendData.siteLeadApproval);
    }
    if (typeof backendData.initiativeLeadApproval === 'boolean') {
      backendData.initiativeLeadApproval = booleanToYN(backendData.initiativeLeadApproval);
    }
    
    const response = await api.post(`/timeline-tracker/${initiativeId}`, backendData);
    return response.data;
  },
  
  updateTimelineEntry: async (id: number, entryData: any) => {
    // Convert boolean to Y/N for backend
    const backendData = { ...entryData };
    if (typeof backendData.siteLeadApproval === 'boolean') {
      backendData.siteLeadApproval = booleanToYN(backendData.siteLeadApproval);
    }
    if (typeof backendData.initiativeLeadApproval === 'boolean') {
      backendData.initiativeLeadApproval = booleanToYN(backendData.initiativeLeadApproval);
    }
    
    const response = await api.put(`/timeline-tracker/entry/${id}`, backendData);
    return response.data;
  },
  
  updateApprovals: async (id: number, siteLeadApproval?: boolean, initiativeLeadApproval?: boolean) => {
    const params = new URLSearchParams();
    if (siteLeadApproval !== undefined) params.append('siteLeadApproval', siteLeadApproval.toString());
    if (initiativeLeadApproval !== undefined) params.append('initiativeLeadApproval', initiativeLeadApproval.toString());
    
    const response = await api.put(`/timeline-tracker/entry/${id}/approvals?${params.toString()}`);
    return response.data;
  },
  
  deleteTimelineEntry: async (id: number) => {
    const response = await api.delete(`/timeline-tracker/entry/${id}`);
    return response.data;
  },
  
  getPendingApprovals: async (initiativeId: number) => {
    const response = await api.get(`/timeline-tracker/${initiativeId}/pending-approvals`);
    return response.data;
  }
};

// Workflow Transaction API
export const workflowTransactionAPI = {
  getTransactions: (initiativeId: number) => 
    api.get(`/workflow-transactions/initiative/${initiativeId}`).then(res => {
      // Convert Y/N back to boolean for frontend
      if (res.data) {
        res.data = res.data.map((transaction: any) => ({
          ...transaction,
          requiresMoc: ynToBoolean(transaction.requiresMoc),
          requiresCapex: ynToBoolean(transaction.requiresCapex),
        }));
      }
      return res.data;
    }),
  
  getPendingByRole: (roleCode: string) => 
    api.get(`/workflow-transactions/pending/${roleCode}`).then(res => res.data),
  
  getPendingBySiteAndRole: (site: string, roleCode: string) => 
    api.get(`/workflow-transactions/pending/${site}/${roleCode}`).then(res => res.data),
  
  getCurrentPendingStage: (initiativeId: number) => 
    api.get(`/workflow-transactions/current-pending/${initiativeId}`).then(res => res.data),
  
  getProgressPercentage: (initiativeId: number) => 
    api.get(`/workflow-transactions/progress/${initiativeId}`).then(res => res.data),
  
  getVisibleTransactions: (initiativeId: number) =>
    api.get(`/workflow-transactions/visible/${initiativeId}`).then(res => res.data),

  processStageAction: (data: {
    transactionId: number;
    action: string;
    remarks: string;
    assignedUserId?: number;
    mocNumber?: string;
    capexNumber?: string;
    requiresMoc?: boolean;
    requiresCapex?: boolean;
  }) => {
    // Convert boolean to Y/N for backend
    const backendData = { ...data };
    if (typeof backendData.requiresMoc === 'boolean') {
      backendData.requiresMoc = booleanToYN(backendData.requiresMoc) as any;
    }
    if (typeof backendData.requiresCapex === 'boolean') {
      backendData.requiresCapex = booleanToYN(backendData.requiresCapex) as any;
    }
    
    return api.post(`/workflow-transactions/${data.transactionId}/process`, backendData).then(res => res.data);
  },
  
  getInitiativesReadyForClosure: () =>
    api.get('/workflow-transactions/ready-for-closure').then(res => res.data),
};

// Monthly Monitoring API
export const monthlyMonitoringAPI = {
  // Get approved initiatives for Stage 9 access
  getApprovedInitiatives: async (userEmail: string, site: string) => {
    const response = await api.get(`/monthly-monitoring/approved-initiatives/${encodeURIComponent(userEmail)}/${site}`);
    return response.data;
  },

  getMonitoringEntries: async (initiativeId: number) => {
    const response = await api.get(`/monthly-monitoring/${initiativeId}`);
    
    // Convert Y/N back to boolean for frontend
    if (response.data) {
      response.data = response.data.map((entry: any) => ({
        ...entry,
        isFinalized: ynToBoolean(entry.isFinalized),
        faApproval: ynToBoolean(entry.faApproval),
      }));
    }
    
    return response.data;
  },
  
  getMonitoringEntriesByMonth: async (initiativeId: number, monthYear: string) => {
    const response = await api.get(`/monthly-monitoring/${initiativeId}/month/${monthYear}`);
    
    // Convert Y/N back to boolean for frontend
    if (response.data) {
      response.data = response.data.map((entry: any) => ({
        ...entry,
        isFinalized: ynToBoolean(entry.isFinalized),
        faApproval: ynToBoolean(entry.faApproval),
      }));
    }
    
    return response.data;
  },
  
  getMonitoringEntryById: async (id: number) => {
    const response = await api.get(`/monthly-monitoring/entry/${id}`);
    
    // Convert Y/N back to boolean for frontend
    if (response.data) {
      response.data = {
        ...response.data,
        isFinalized: ynToBoolean(response.data.isFinalized),
        faApproval: ynToBoolean(response.data.faApproval),
      };
    }
    
    return response.data;
  },
  
  createMonitoringEntry: async (initiativeId: number, entryData: any) => {
    // Convert boolean to Y/N for backend
    const backendData = { ...entryData };
    if (typeof backendData.isFinalized === 'boolean') {
      backendData.isFinalized = booleanToYN(backendData.isFinalized);
    }
    if (typeof backendData.faApproval === 'boolean') {
      backendData.faApproval = booleanToYN(backendData.faApproval);
    }
    
    const response = await api.post(`/monthly-monitoring/${initiativeId}`, backendData);
    return response.data;
  },
  
  updateMonitoringEntry: async (id: number, entryData: any) => {
    // Convert boolean to Y/N for backend
    const backendData = { ...entryData };
    if (typeof backendData.isFinalized === 'boolean') {
      backendData.isFinalized = booleanToYN(backendData.isFinalized);
    }
    if (typeof backendData.faApproval === 'boolean') {
      backendData.faApproval = booleanToYN(backendData.faApproval);
    }
    
    const response = await api.put(`/monthly-monitoring/entry/${id}`, backendData);
    return response.data;
  },
  
  updateFinalizationStatus: async (id: number, isFinalized: boolean) => {
    const response = await api.put(`/monthly-monitoring/entry/${id}/finalize?isFinalized=${isFinalized}`);
    return response.data;
  },
  
  updateFAApproval: async (id: number, faApproval: boolean, faRemarks?: string) => {
    const params = new URLSearchParams();
    params.append('faApproval', faApproval.toString());
    if (faRemarks) params.append('faRemarks', faRemarks);
    
    const response = await api.put(`/monthly-monitoring/entry/${id}/fa-approval?${params.toString()}`);
    return response.data;
  },
  
  deleteMonitoringEntry: async (id: number) => {
    const response = await api.delete(`/monthly-monitoring/entry/${id}`);
    return response.data;
  },
  
  getPendingFAApprovals: async (initiativeId: number) => {
    const response = await api.get(`/monthly-monitoring/${initiativeId}/pending-fa-approvals`);
    return response.data;
  }
};

// Reports API
export const reportsAPI = {
  downloadDetailedExcel: async (params?: { site?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.site && params.site !== 'all') {
      queryParams.append('site', params.site);
    }
    if (params?.year) {
      queryParams.append('year', params.year);
    }
    
    // Use authenticated axios request to download the file
    const response = await api.get(`/reports/export/detailed-excel?${queryParams.toString()}`, {
      responseType: 'blob', // Important: Tell axios to handle binary data
    });
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'detailed-report.xlsx';
    if (contentDisposition && contentDisposition.includes('filename=')) {
      filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
    }
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    window.URL.revokeObjectURL(url);
    
    return filename; // Return the filename for confirmation
  },

  downloadInitiativeForm: async (initiativeId: string) => {
    // Use authenticated axios request to download the Word form
    const response = await api.get(`/reports/export/initiative-form/${initiativeId}`, {
      responseType: 'blob', // Important: Tell axios to handle binary data
    });
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const url = window.URL.createObjectURL(blob);
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'initiative-form.docx';
    if (contentDisposition && contentDisposition.includes('filename=')) {
      filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
    }
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    window.URL.revokeObjectURL(url);
    
    return filename; // Return the filename for confirmation
  }
};

// Export utility functions for use in components
export { booleanToYN, ynToBoolean };

export default api;