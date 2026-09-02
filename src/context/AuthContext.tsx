import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { StudentPrivate } from '../shared/types.js';

interface AuthContextType {
  user: StudentPrivate | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  isCreatePostModalOpen: boolean;
  openCreatePostModal: () => void;
  closeCreatePostModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  // Fetch current session
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['session'],
    queryFn: () => api.getSession(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const user = data?.user || null;

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (res) => {
      queryClient.setQueryData(['session'], { user: res.user });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setIsAuthModalOpen(false);
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: (res) => {
      queryClient.setQueryData(['session'], { user: res.user });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setIsAuthModalOpen(false);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.setQueryData(['session'], { user: null });
      queryClient.invalidateQueries();
    },
  });

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openCreatePostModal = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsCreatePostModalOpen(true);
  };

  const closeCreatePostModal = () => {
    setIsCreatePostModalOpen(false);
  };

  const login = async (credentials: { email: string; password: string }) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (payload: { email: string; password: string; role: string }) => {
    await registerMutation.mutateAsync(payload);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
        setAuthModalMode,
        isCreatePostModalOpen,
        openCreatePostModal,
        closeCreatePostModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
