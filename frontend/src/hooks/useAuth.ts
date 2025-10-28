import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials, RegisterData, AuthResponse } from '../types';

/**
 * Hook for user login
 */
export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success('Erfolgreich angemeldet!');
      navigate('/');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login fehlgeschlagen';
      toast.error(message);
    },
  });
}

/**
 * Hook for user registration
 */
export function useRegister() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post<AuthResponse>('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success('Registrierung erfolgreich!');
      navigate('/');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registrierung fehlgeschlagen';
      toast.error(message);
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      clearAuth();
      toast.success('Erfolgreich abgemeldet');
      navigate('/login');
    },
    onError: () => {
      // Clear auth even if API call fails
      clearAuth();
      navigate('/login');
    },
  });
}

/**
 * Get current user from store
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

/**
 * Check if user has specific role
 */
export function useHasRole(role: string | string[]) {
  const user = useCurrentUser();
  if (!user) return false;

  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
}
