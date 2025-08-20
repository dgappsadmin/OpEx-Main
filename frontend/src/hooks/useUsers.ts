import { useQuery } from '@tanstack/react-query';
import { userAPI } from '@/lib/api';
import { mockUsers } from '@/lib/mockData';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // Try real API first
        return await userAPI.getAll();
      } catch (error) {
        console.warn('Failed to fetch users from API, using mock data:', error);
        // Fallback to mock data
        return mockUsers;
      }
    },
  });
};

export const useUser = (userId: number | string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      try {
        // Try real API first
        return await userAPI.getById(Number(userId));
      } catch (error) {
        console.warn('Failed to fetch user by ID from API, using mock data:', error);
        // Fallback to mock data - convert both to strings for comparison since mockUsers.id is string
        return mockUsers.find(user => user.id === String(userId));
      }
    },
    enabled: !!userId,
  });
};

export const useUsersBySite = (site: string) => {
  return useQuery({
    queryKey: ['users', 'site', site],
    queryFn: async () => {
      try {
        // Try real API first
        return await userAPI.getBySite(site);
      } catch (error) {
        console.warn('Failed to fetch users by site from API, using mock data:', error);
        // Fallback to mock data
        return mockUsers.filter(user => user.site === site);
      }
    },
    enabled: !!site,
  });
};

export const useUsersByRole = (role: string) => {
  return useQuery({
    queryKey: ['users', 'role', role],
    queryFn: async () => {
      try {
        // Try real API first
        return await userAPI.getByRole(role);
      } catch (error) {
        console.warn('Failed to fetch users by role from API, using mock data:', error);
        // Fallback to mock data
        return mockUsers.filter(user => user.role === role);
      }
    },
    enabled: !!role,
  });
};

export const useUsersBySiteAndRole = (site: string, role: string) => {
  return useQuery({
    queryKey: ['users', 'site', site, 'role', role],
    queryFn: async () => {
      try {
        // Try real API first
        return await userAPI.getBySiteAndRole(site, role);
      } catch (error) {
        console.warn('Failed to fetch users by site and role from API, using mock data:', error);
        // Fallback to mock data
        return mockUsers.filter(user => user.site === site && user.role === role);
      }
    },
    enabled: !!site && !!role,
  });
};

export const useInitiativeLeadsBySite = (site: string) => {
  return useQuery({
    queryKey: ['users', 'initiative-leads', site],
    queryFn: async () => {
      try {
        // Use dedicated endpoint for Initiative Leads
        return await userAPI.getInitiativeLeadsBySite(site);
      } catch (error) {
        console.warn('Failed to fetch Initiative Leads from API, using mock data:', error);
        // Fallback to mock data
        return mockUsers.filter(user => user.site === site && user.role === 'IL');
      }
    },
    enabled: !!site,
  });
};