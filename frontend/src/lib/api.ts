import axios from 'axios';

// Function to determine API base URL based on current location
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development environment
    return 'http://localhost:9090/opexhub/api';
  } else if (hostname === 'dgapps.godeepak.com') {
    // Production environment
    return 'https://dgapps.godeepak.com/opexhub/api';
  } else if (hostname === 'dgpilotapps.godeepak.com') {
    // Pilot environment - backend uses standard HTTPS port (443)
    // Explicitly avoid using the frontend port
    return 'https://dgpilotapps.godeepak.com/opexhub/api';
  } else {
    // Fallback to localhost for unknown environments
    return 'http://localhost:9090/opexhub/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('🔍 API Configuration Debug:');
console.log('Current hostname:', window.location.hostname);
console.log('Current port:', window.location.port);
console.log('Current full URL:', window.location.href);
console.log('Detected API_BASE_URL:', API_BASE_URL);

// Force absolute URL validation
if (!API_BASE_URL.startsWith('http')) {
  console.error('❌ API_BASE_URL is not absolute:', API_BASE_URL);
  throw new Error('Invalid API base URL configuration');
}

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
  
  // Enhanced debugging for initiative calls
  if (config.url?.includes('initiatives')) {
    console.log('🚨 INITIATIVE API DEBUG:');
    console.log('Request URL:', config.url);
    console.log('Base URL:', config.baseURL);
    console.log('Full URL:', config.baseURL + config.url);
    console.log('Method:', config.method?.toUpperCase());
    console.log('Config:', config);
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
  },

  // Email Verification APIs for Registration
  sendVerificationCode: async (userData: {
    fullName: string;
    email: string;
    password: string;
    site: string;
    discipline: string;
    role: string;
    roleName: string;
  }) => {
    const response = await api.post('/auth/send-verification-code', userData);
    return response.data;
  },

  verifyEmail: async (email: string, code: string) => {
    const response = await api.post('/auth/verify-email', { email, code });
    return response.data;
  },

  resendVerificationCode: async (email: string) => {
    const response = await api.post('/auth/resend-verification-code', { email });
    return response.data;
  },

  // Password Reset APIs
  sendResetCode: async (email: string) => {
    const response = await api.post('/auth/password-reset/send-code', { email });
    return response.data;
  },

  verifyResetCode: async (email: string, code: string) => {
    const response = await api.post('/auth/password-reset/verify-code', { email, code });
    return response.data;
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    const response = await api.post('/auth/password-reset/reset-password', { 
      email, 
      code, 
      newPassword 
    });
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
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/initiatives/${id}`);
    return response.data;
  },
  
  create: async (initiativeData: any) => {
    const response = await api.post('/initiatives', initiativeData);
    return response.data;
  },
  
  update: async (id: number, initiativeData: any) => {
    const response = await api.put(`/initiatives/${id}`, initiativeData);
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
export const dashboardAPI = {
  // Get overall dashboard statistics
  getStats: async (financialYear?: string) => {
    const params = new URLSearchParams();
    if (financialYear) {
      params.append('financialYear', financialYear);
    }
    const url = params.toString() ? `/dashboard/stats?${params.toString()}` : '/dashboard/stats';
    console.log('🔍 Dashboard API - getStats URL:', url);
    const response = await api.get(url);
    return response.data;
  },

  // Get dashboard statistics for a specific site
  getStatsBySite: async (site: string, financialYear?: string) => {
    const params = new URLSearchParams();
    if (financialYear) {
      params.append('financialYear', financialYear);
    }
    const url = params.toString() ? `/dashboard/stats/${site}?${params.toString()}` : `/dashboard/stats/${site}`;
    console.log('🔍 Dashboard API - getStatsBySite URL:', url);
    const response = await api.get(url);
    return response.data;
  },

  // Get recent initiatives (latest 5)
  getRecentInitiatives: async (financialYear?: string) => {
    const params = new URLSearchParams();
    if (financialYear) {
      params.append('financialYear', financialYear);
    }
    const url = params.toString() ? `/dashboard/recent-initiatives?${params.toString()}` : '/dashboard/recent-initiatives';
    console.log('🔍 Dashboard API - getRecentInitiatives URL:', url);
    const response = await api.get(url);
    return response.data;
  },

  // Get recent initiatives for a specific site
  getRecentInitiativesBySite: async (site: string, financialYear?: string) => {
    const params = new URLSearchParams();
    if (financialYear) {
      params.append('financialYear', financialYear);
    }
    const url = params.toString() ? `/dashboard/recent-initiatives/${site}?${params.toString()}` : `/dashboard/recent-initiatives/${site}`;
    console.log('🔍 Dashboard API - getRecentInitiativesBySite URL:', url);
    const response = await api.get(url);
    return response.data;
  },

  // Get performance analysis dashboard data
  getPerformanceAnalysis: async (financialYear?: string) => {
    const params = new URLSearchParams();
    if (financialYear) {
      params.append('financialYear', financialYear);
    }
    const url = params.toString() ? `/dashboard/performance-analysis?${params.toString()}` : '/dashboard/performance-analysis';
    console.log('🔍 Dashboard API - getPerformanceAnalysis URL:', url);
    const response = await api.get(url);
    return response.data;
  },

  // Get performance analysis dashboard data for a specific site
  getPerformanceAnalysisBySite: async (site: string, financialYear?: string) => {
    const params = new URLSearchParams();
    if (financialYear) {
      params.append('financialYear', financialYear);
    }
    const url = params.toString() ? `/dashboard/performance-analysis/${site}?${params.toString()}` : `/dashboard/performance-analysis/${site}`;
    console.log('🔍 Dashboard API - getPerformanceAnalysisBySite URL:', url);
    const response = await api.get(url);
    return response.data;
  },

  // Get available sites for dashboard filter
  getSites: async () => {
    const response = await api.get('/dashboard/sites');
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
  },

  getHodBySite: async (site: string) => {
    const response = await api.get(`/users/hod/${site}`);
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
    return response.data;
  },
  
  getTimelineEntryById: async (id: number) => {
    const response = await api.get(`/timeline-tracker/entry/${id}`);
    return response.data;
  },
  
  createTimelineEntry: async (initiativeId: number, entryData: any) => {
    const response = await api.post(`/timeline-tracker/${initiativeId}`, entryData);
    return response.data;
  },
  
  updateTimelineEntry: async (id: number, entryData: any) => {
    const response = await api.put(`/timeline-tracker/entry/${id}`, entryData);
    return response.data;
  },
  
  updateApprovals: async (id: number, siteLeadApproval?: string, initiativeLeadApproval?: string) => {
    const params = new URLSearchParams();
    if (siteLeadApproval !== undefined) params.append('siteLeadApproval', siteLeadApproval);
    if (initiativeLeadApproval !== undefined) params.append('initiativeLeadApproval', initiativeLeadApproval);
    
    const response = await api.put(`/timeline-tracker/entry/${id}/approvals?${params.toString()}`);
    return response.data;
  },
  
  updateStatus: async (id: number, status: string) => {
    const response = await api.put(`/timeline-tracker/entry/${id}/status?status=${status}`);
    return response.data;
  },
  
  deleteTimelineEntry: async (id: number) => {
    const response = await api.delete(`/timeline-tracker/entry/${id}`);
    return response.data;
  },
  
  getPendingApprovals: async (initiativeId: number) => {
    const response = await api.get(`/timeline-tracker/${initiativeId}/pending-approvals`);
    return response.data;
  },

  // New API for Stage 7 - Get timeline entries for progress monitoring modal
  getTimelineEntriesForProgressMonitoring: async (initiativeId: number) => {
    const response = await api.get(`/timeline-tracker/progress-monitoring/${initiativeId}`);
    return response.data;
  },

  // Get assigned initiatives where user is the assigned IL
  getAssignedInitiatives: async (userEmail: string) => {
    const response = await api.get(`/timeline-tracker/assigned-initiatives/${encodeURIComponent(userEmail)}`);
    return response.data;
  },

  // Check if all timeline entries are completed (for Stage 6 validation)
  areAllTimelineEntriesCompleted: async (initiativeId: number) => {
    const response = await api.get(`/timeline-tracker/validation/${initiativeId}/all-completed`);
    return response.data;
  }
};

// Workflow Transaction API
export const workflowTransactionAPI = {
  getTransactions: (initiativeId: number) => 
    api.get(`/workflow-transactions/initiative/${initiativeId}`).then(res => res.data),
  
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
    requiresMoc?: string;
    requiresCapex?: string;
  }) => {
    return api.post(`/workflow-transactions/${data.transactionId}/process`, data).then(res => res.data);
  },
  
  getInitiativesReadyForClosure: () =>
    api.get('/workflow-transactions/ready-for-closure').then(res => res.data),
};

// Monthly Monitoring API - Updated to use Y/N strings consistently
export const monthlyMonitoringAPI = {
  // Get approved initiatives for Stage 9 access
  getApprovedInitiatives: async (userEmail: string, site: string) => {
    const response = await api.get(`/monthly-monitoring/approved-initiatives/${encodeURIComponent(userEmail)}/${site}`);
    return response.data;
  },

  getMonitoringEntries: async (initiativeId: number) => {
    const response = await api.get(`/monthly-monitoring/${initiativeId}`);
    
    // Data is already in Y/N format from backend, no conversion needed
    return response.data;
  },
  
  getMonitoringEntriesByMonth: async (initiativeId: number, monthYear: string) => {
    const response = await api.get(`/monthly-monitoring/${initiativeId}/month/${monthYear}`);
    
    // Data is already in Y/N format from backend, no conversion needed
    return response.data;
  },
  
  getMonitoringEntryById: async (id: number) => {
    const response = await api.get(`/monthly-monitoring/entry/${id}`);
    
    // Data is already in Y/N format from backend, no conversion needed
    return response.data;
  },
  
  createMonitoringEntry: async (initiativeId: number, entryData: any) => {
    // Data is already in Y/N format from frontend, no conversion needed
    const response = await api.post(`/monthly-monitoring/${initiativeId}`, entryData);
    return response.data;
  },
  
  updateMonitoringEntry: async (id: number, entryData: any) => {
    // Data is already in Y/N format from frontend, no conversion needed
    const response = await api.put(`/monthly-monitoring/entry/${id}`, entryData);
    return response.data;
  },
  
  updateFinalizationStatus: async (id: number, isFinalized: string) => {
    const response = await api.put(`/monthly-monitoring/entry/${id}/finalize?isFinalized=${isFinalized}`);
    return response.data;
  },
  
  updateFAApproval: async (id: number, faApproval: string, faComments?: string) => {
    const params = new URLSearchParams();
    params.append('faApproval', faApproval);
    if (faComments) params.append('faComments', faComments);
    
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
  },

  getFinalizedPendingFAEntries: async (initiativeId: number) => {
    const response = await api.get(`/monthly-monitoring/${initiativeId}/finalized-pending-fa`);
    // Extract data from ApiResponse wrapper
    return response.data?.data || [];
  },

  batchFAApproval: async (entryIds: number[], faComments?: string) => {
    const response = await api.post('/monthly-monitoring/batch-fa-approval', {
      entryIds,
      faComments
    });
    // Extract data from ApiResponse wrapper
    return response.data?.data || [];
  },

  // Get initiatives assigned to user as Initiative Lead for Monthly Monitoring
  getAssignedInitiatives: async (userEmail: string) => {
    const response = await api.get(`/monthly-monitoring/assigned-initiatives/${encodeURIComponent(userEmail)}`);
    return response.data;
  },

  // Check if all monthly monitoring entries for an initiative are finalized
  areAllEntriesFinalized: async (initiativeId: number) => {
    const response = await api.get(`/monthly-monitoring/validation/${initiativeId}/all-finalized`);
    return response.data;
  },

  // Get monthly actual savings data for reporting
  getMonthlyActualSavings: async (params?: { 
    site?: string; 
    year?: string; 
    budgetType?: string; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.site && params.site !== 'all') {
      queryParams.append('site', params.site);
    }
    if (params?.year) {
      queryParams.append('year', params.year);
    }
    if (params?.budgetType && params.budgetType !== 'all') {
      queryParams.append('budgetType', params.budgetType);
    }
    
    const response = await api.get(`/monthly-monitoring/monthly-actual-savings?${queryParams.toString()}`);
    return response.data;
  },

  // Get monthly target vs achieved data for reporting
  getMonthlyTargetAchievedData: async (params?: { 
    site?: string; 
    year?: string; 
    budgetType?: string; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.site && params.site !== 'all') {
      queryParams.append('site', params.site);
    }
    if (params?.year) {
      queryParams.append('year', params.year);
    }
    if (params?.budgetType && params.budgetType !== 'all') {
      queryParams.append('budgetType', params.budgetType);
    }
    
    const response = await api.get(`/monthly-monitoring/monthly-target-achieved?${queryParams.toString()}`);
    return response.data;
  },

  // Get total achieved value for a particular initiative
  getTotalAchievedValue: async (initiativeId: number) => {
    const response = await api.get(`/monthly-monitoring/${initiativeId}/total-achieved-value`);
    return response.data;
  },

  // Sync Initiative's actualSavings field with total achieved value
  syncActualSavings: async (initiativeId: number) => {
    const response = await api.post(`/monthly-monitoring/${initiativeId}/sync-actual-savings`);
    return response.data;
  }
};

// MOM (Minutes of Meeting) API
export const momAPI = {
  // Get all MOM entries for an initiative
  getMomsByInitiative: async (initiativeId: number) => {
    const response = await api.get(`/initiatives/${initiativeId}/moms`);
    return response.data;
  },

  // Get MOM entries filtered by month
  getMomsByMonth: async (initiativeId: number, year: number, month: number) => {
    const response = await api.get(`/initiatives/${initiativeId}/moms/filter?year=${year}&month=${month}`);
    return response.data;
  },

  // Get available months for an initiative's MOM entries
  getAvailableMonths: async (initiativeId: number) => {
    const response = await api.get(`/initiatives/${initiativeId}/moms/months`);
    return response.data;
  },

  // Get a specific MOM entry by ID
  getMomById: async (initiativeId: number, momId: number) => {
    const response = await api.get(`/initiatives/${initiativeId}/moms/${momId}`);
    return response.data;
  },

  // Create a new MOM entry
  createMom: async (initiativeId: number, momData: any) => {
    const response = await api.post(`/initiatives/${initiativeId}/moms`, momData);
    return response.data;
  },

  // Create MOM with email notification to responsible person
  createMomWithNotification: async (initiativeId: number, momData: any) => {
    const response = await api.post(`/initiatives/${initiativeId}/moms/with-notification`, momData);
    return response.data;
  },

  // Send responsibility assignment notification email
  sendResponsibilityNotification: async (initiativeId: number, responsiblePersonEmail: string, momData: any) => {
    const response = await api.post(`/initiatives/${initiativeId}/notify-responsibility`, {
      responsiblePersonEmail,
      momData
    });
    return response.data;
  },

  // Update an existing MOM entry
  updateMom: async (initiativeId: number, momId: number, momData: any) => {
    const response = await api.put(`/initiatives/${initiativeId}/moms/${momId}`, momData);
    return response.data;
  },

  // Delete a MOM entry
  deleteMom: async (initiativeId: number, momId: number) => {
    const response = await api.delete(`/initiatives/${initiativeId}/moms/${momId}`);
    return response.data;
  }
};

// Reports API - Updated for PDF DNL Plant Initiatives Report
export const reportsAPI = {
  // Get DNL Savings Data for Chart
  getDNLSavingsData: async (params?: { site?: string; period?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.site && params.site !== 'all') {
      queryParams.append('site', params.site);
    }
    if (params?.period) {
      queryParams.append('period', params.period);
    }
    if (params?.year) {
      queryParams.append('year', params.year);
    }
    
    const response = await api.get(`/reports/dnl-savings-data?${queryParams.toString()}`);
    return response.data;
  },

  // Download DNL Chart as PDF
  downloadDNLChartPDF: async (params?: { site?: string; period?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.site && params.site !== 'all') {
      queryParams.append('site', params.site);
    }
    if (params?.period) {
      queryParams.append('period', params.period);
    }
    if (params?.year) {
      queryParams.append('year', params.year);
    }
    
    const response = await api.get(`/reports/export/dnl-chart-pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/pdf' 
    });
    const url = window.URL.createObjectURL(blob);
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'DNL_Plant_Initiatives_Chart.pdf';
    if (contentDisposition && contentDisposition.includes('filename=')) {
      filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    return filename;
  },

  // Download DNL Chart as Excel
  downloadDNLChartExcel: async (params?: { site?: string; period?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.site && params.site !== 'all') {
      queryParams.append('site', params.site);
    }
    if (params?.period) {
      queryParams.append('period', params.period);
    }
    if (params?.year) {
      queryParams.append('year', params.year);
    }
    
    const response = await api.get(`/reports/export/dnl-chart-excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'DNL_Plant_Initiatives_Chart.xlsx';
    if (contentDisposition && contentDisposition.includes('filename=')) {
      filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    return filename;
  },

  // New PDF DNL Plant Initiatives Report
  downloadDNLPlantInitiatives: async (params?: { site?: string; period?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.site && params.site !== 'all') {
      queryParams.append('site', params.site);
    }
    if (params?.period) {
      queryParams.append('period', params.period);
    }
    if (params?.year) {
      queryParams.append('year', params.year);
    }
    
    const response = await api.get(`/reports/export/dnl-plant-initiatives?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/pdf' 
    });
    const url = window.URL.createObjectURL(blob);
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'DNL_Plant_Initiatives_Report.pdf';
    if (contentDisposition && contentDisposition.includes('filename=')) {
      filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    return filename;
  },

  downloadDetailedExcel: async (params?: { site?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.site && params.site !== 'all') {
      queryParams.append('site', params.site);
    }
    if (params?.year) {
      queryParams.append('year', params.year);
    }
    
    const response = await api.get(`/reports/export/detailed-excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'detailed-report.xlsx';
    if (contentDisposition && contentDisposition.includes('filename=')) {
      filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    return filename;
  },

  downloadInitiativeForm: async (initiativeId: string) => {
    // First get initiative details to fetch the initiative number
    let initiativeNumber = initiativeId; // fallback to ID if number not available
    try {
      const initiativeResponse = await api.get(`/initiatives/${initiativeId}`);
      if (initiativeResponse.data && initiativeResponse.data.initiativeNumber) {
        initiativeNumber = initiativeResponse.data.initiativeNumber;
      }
    } catch (error) {
      console.warn('Could not fetch initiative number, using ID as fallback');
    }

    const response = await api.get(`/reports/export/initiative-form/${initiativeId}`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const url = window.URL.createObjectURL(blob);
    
    // Use initiative number for filename
    const filename = `${initiativeNumber}.docx`;
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    return filename;
  },

  // Financial Year Reporting APIs
  getFinancialYearData: async (params?: { 
    financialYear?: string; 
    site?: string; 
    budgetType?: string; 
    category?: string; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.financialYear) {
      queryParams.append('financialYear', params.financialYear);
    }
    if (params?.site && params.site !== 'all') {
      queryParams.append('site', params.site);
    }
    if (params?.budgetType && params.budgetType !== 'all') {
      queryParams.append('budgetType', params.budgetType);
    }
    if (params?.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }
    
    const response = await api.get(`/reports/financial-year-data?${queryParams.toString()}`);
    return response.data;
  },

  getAvailableFinancialYears: async () => {
    const response = await api.get('/reports/available-financial-years');
    return response.data;
  }
};

// File Upload API
export const fileAPI = {
  uploadFiles: async (initiativeId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(`/files/upload/${initiativeId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getFilesByInitiative: async (initiativeId: number) => {
    const response = await api.get(`/files/initiative/${initiativeId}`);
    return response.data;
  },

  downloadFile: async (fileId: number, fileName: string) => {
    const response = await api.get(`/files/download/${fileId}`, {
      responseType: 'blob',
    });

    // Create download link with proper blob handling
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/octet-stream' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Sanitize filename - remove or replace problematic characters for better compatibility
    const sanitizedFileName = fileName
      .replace(/[<>:"/\\|?*]/g, '_')  // Replace illegal characters with underscores
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/_{2,}/g, '_');        // Replace multiple underscores with single underscore
    
    link.download = sanitizedFileName;
    link.style.display = 'none';  // Hide the link
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  deleteFile: async (fileId: number) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  }
};

export default api;