import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type {
  Asset,
  AssetFilters,
  PaginatedResponse,
  PaginationParams,
} from '../types';

const ASSETS_QUERY_KEY = 'assets';

/**
 * Fetch all assets with filters and pagination
 */
export function useAssets(filters?: AssetFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', pagination.limit.toString());
      if (filters?.assetType) params.append('assetType', filters.assetType);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tags) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await api.get<PaginatedResponse<Asset>>(`/assets?${params}`);
      return response.data;
    },
  });
}

/**
 * Fetch single asset by ID
 */
export function useAsset(id: string) {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await api.get<Asset>(`/assets/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Upload new asset
 */
export function useUploadAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<Asset>('/assets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      toast.success('Asset erfolgreich hochgeladen!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Hochladen des Assets';
      toast.error(message);
    },
  });
}

/**
 * Upload multiple assets
 */
export function useUploadAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post<Asset[]>('/assets/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      toast.success('Assets erfolgreich hochgeladen!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Hochladen der Assets';
      toast.error(message);
    },
  });
}

/**
 * Update asset metadata
 */
export function useUpdateAsset(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Asset>) => {
      const response = await api.put<Asset>(`/assets/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      toast.success('Asset erfolgreich aktualisiert!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Aktualisieren des Assets';
      toast.error(message);
    },
  });
}

/**
 * Delete asset
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      toast.success('Asset erfolgreich gelöscht!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Löschen des Assets';
      toast.error(message);
    },
  });
}

/**
 * Add tags to asset
 */
export function useAddAssetTags(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await api.post<Asset>(`/assets/${id}/tags`, { tags });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      toast.success('Tags erfolgreich hinzugefügt!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Hinzufügen der Tags';
      toast.error(message);
    },
  });
}
