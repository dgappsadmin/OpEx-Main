import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  site: string;
  discipline: string;
  role: string;
  roleName: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("opex_user");
    const storedToken = localStorage.getItem("opex_token");
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Starting login process...');
      const response = await authAPI.login(email, password);
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        const userData = {
          id: response.data.user.id ? response.data.user.id.toString() : '',
          email: response.data.user.email || '',
          fullName: response.data.user.fullName || '',
          site: response.data.user.site || '',
          discipline: response.data.user.discipline || '',
          role: response.data.user.role || '',
          roleName: response.data.user.roleName || '',
        };
        
        console.log('Setting user data:', userData);
        
        // Store data in localStorage first
        localStorage.setItem("opex_user", JSON.stringify(userData));
        localStorage.setItem("opex_token", response.data.token);
        
        // Force immediate synchronous state update
        flushSync(() => {
          setUser(userData);
        });
        console.log('User state updated successfully with flushSync, should trigger immediate re-render');
        
        return { success: true, user: userData };
      } else {
        console.log('Login failed:', response.message);
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Fallback for testing when backend is not available
      if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
        console.log('Backend not available, using mock login for testing...');
        
        // Mock successful login for testing
        if (email === 'john.lead@company.com' && password === 'password123') {
          const mockUserData = {
            id: '1',
            email: 'john.lead@company.com',
            fullName: 'John Smith',
            site: 'LAM',
            discipline: 'MECH',
            role: 'INIT_LEAD',
            roleName: 'Initiative Lead',
          };
          
          console.log('Mock login successful, setting user data:', mockUserData);
          
          // Store mock data
          localStorage.setItem("opex_user", JSON.stringify(mockUserData));
          localStorage.setItem("opex_token", 'mock-jwt-token');
          
          // Force immediate synchronous state update
          flushSync(() => {
            setUser(mockUserData);
          });
          console.log('Mock user state updated successfully with flushSync');
          
          return { success: true, user: mockUserData };
        } else {
          return { success: false, error: 'Invalid mock credentials. Use john.lead@company.com / password123' };
        }
      }
      
      let errorMessage = 'Login failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (userData: {
    fullName: string;
    email: string;
    password: string;
    site: string;
    discipline: string;
    role: string;
    roleName: string;
  }) => {
    try {
      const response = await authAPI.register(userData);
      return { success: response.success, message: response.message };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("opex_user");
    localStorage.removeItem("opex_token");
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
  };
};