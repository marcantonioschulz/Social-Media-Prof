import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type {
  Post,
  CreatePostData,
  UpdatePostData,
  PaginatedResponse,
  PostFilters,
  PaginationParams,
} from '../types';

const POSTS_QUERY_KEY = 'posts';

/**
 * Fetch all posts with filters and pagination
 */
export function usePosts(filters?: PostFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: [POSTS_QUERY_KEY, filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', pagination.limit.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.platform) params.append('platform', filters.platform);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.createdBy) params.append('createdBy', filters.createdBy);

      const response = await api.get<PaginatedResponse<Post>>(`/posts?${params}`);
      return response.data;
    },
  });
}

/**
 * Fetch single post by ID
 */
export function usePost(id: string) {
  return useQuery({
    queryKey: [POSTS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await api.get<Post>(`/posts/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Create new post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const response = await api.post<Post>('/posts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
      toast.success('Post erfolgreich erstellt!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Erstellen des Posts';
      toast.error(message);
    },
  });
}

/**
 * Update existing post
 */
export function useUpdatePost(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePostData) => {
      const response = await api.put<Post>(`/posts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
      toast.success('Post erfolgreich aktualisiert!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Aktualisieren des Posts';
      toast.error(message);
    },
  });
}

/**
 * Delete post
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
      toast.success('Post erfolgreich gelöscht!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Löschen des Posts';
      toast.error(message);
    },
  });
}

/**
 * Publish post
 */
export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Post>(`/posts/${id}/publish`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
      toast.success('Post erfolgreich veröffentlicht!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Veröffentlichen des Posts';
      toast.error(message);
    },
  });
}

/**
 * Schedule post
 */
export function useSchedulePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      const response = await api.post<Post>(`/posts/${id}/schedule`, { scheduledAt });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
      toast.success('Post erfolgreich geplant!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Planen des Posts';
      toast.error(message);
    },
  });
}
