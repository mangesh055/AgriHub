import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface User {
  id: string;
  mobile: string;
  role: 'FARMER' | 'ADMIN';
}

interface Profile {
  id: string;
  name: string;
  state: string;
  district: string;
  taluka?: string;
  village?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  hasFarm: boolean;
  primaryFarm: any | null;
  isLoading: boolean;
  login: (credentials: { mobile: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  markFarmCreated: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('agrihub_token'));
  const [hasFarm, setHasFarm] = useState<boolean>(false);
  const [primaryFarm, setPrimaryFarm] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  async function checkAuth(authToken: string) {
    try {
      localStorage.setItem('agrihub_token', authToken);
      setToken(authToken);
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
      setHasFarm(data.hasFarm);
      setPrimaryFarm(data.primaryFarm || null);
    } catch (err) {
      console.error('Auth verification failed:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('agrihub_token');
    if (savedToken) {
      checkAuth(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: { mobile: string; password: string }) => {
    setIsLoading(true);
    const res = await api.login(credentials);
    await checkAuth(res.token);
  };

  const register = async (data: any) => {
    setIsLoading(true);
    const res = await api.register(data);
    await checkAuth(res.token);
  };

  const logout = () => {
    localStorage.removeItem('agrihub_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setHasFarm(false);
    setPrimaryFarm(null);
    setIsLoading(false);
  };

  const refreshAuth = async () => {
    if (token) {
      await checkAuth(token);
    }
  };

  const markFarmCreated = () => {
    setHasFarm(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        hasFarm,
        primaryFarm,
        isLoading,
        login,
        register,
        logout,
        refreshAuth,
        markFarmCreated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
