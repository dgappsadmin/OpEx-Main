import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored user session on mount
    const checkStoredAuth = () => {
      try {
        const storedUser = localStorage.getItem("opex_user");
        const storedToken = localStorage.getItem("opex_token");
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          console.log('Found stored user data:', userData);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem("opex_user");
        localStorage.removeItem("opex_token");
      }
      setIsLoading(false);
    };

    checkStoredAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting login process...');
      const response = await authAPI.login(email, password);
      console.log('AuthContext: API Response:', response);
      
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
        
        console.log('AuthContext: Setting user data:', userData);
        
        // Store data in localStorage
        localStorage.setItem("opex_user", JSON.stringify(userData));
        localStorage.setItem("opex_token", response.data.token);
        
        // Update state
        setUser(userData);
        console.log('AuthContext: User state updated successfully');
        
        // Navigate to dashboard immediately
        console.log('AuthContext: Navigating to dashboard...');
        navigate('/', { replace: true });
        
        return { success: true };
      } else {
        console.log('AuthContext: Login failed:', response.message);
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      
      
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
    console.log('AuthContext: Logging out...');
    setUser(null);
    localStorage.removeItem("opex_user");
    localStorage.removeItem("opex_token");
    navigate('/auth', { replace: true });
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};