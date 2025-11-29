import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role?: 'super_admin' | 'group_admin' | 'group_user' | 'member';
  group_id?: number;
  group?: {
    id: number;
    name: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasRole: (roles: string[]) => boolean;
  canAccessGroup: (groupId: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('maisha_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(email, password);
      if (response && response.user) {
        const userData = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          group_id: response.user.group_id,
          group: response.user.group,
        };
        setUser(userData);
        localStorage.setItem('maisha_user', JSON.stringify(userData));
        // Store the auth token
        if (response.token) {
          localStorage.setItem('maisha_token', response.token);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.register({ name, email, password });
      if (response && response.user) {
        const userData = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          group_id: response.user.group_id,
        };
        setUser(userData);
        localStorage.setItem('maisha_user', JSON.stringify(userData));
        // Store the auth token
        if (response.token) {
          localStorage.setItem('maisha_token', response.token);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('maisha_user');
    localStorage.removeItem('maisha_token');
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  const canAccessGroup = (groupId: number): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.role === 'group_admin' || user.role === 'group_user') {
      return user.group_id === groupId;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, hasRole, canAccessGroup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
