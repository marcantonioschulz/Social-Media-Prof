import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type {
  ApprovalWorkflow,
  ApprovalAction,
  PaginatedResponse,
  PaginationParams,
} from '../types';

const APPROVALS_QUERY_KEY = 'approvals';

/**
 * Fetch all pending approvals
 */
export function usePendingApprovals(pagination?: PaginationParams) {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, 'pending', pagination],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', pagination.limit.toString());

      const response = await api.get<PaginatedResponse<ApprovalWorkflow>>(
        `/approvals/pending?${params}`
      );
      return response.data;
    },
  });
}

/**
 * Fetch approval workflow by ID
 */
export function useApprovalWorkflow(id: string) {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await api.get<ApprovalWorkflow>(`/approvals/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch approval workflow by post ID
 */
export function useApprovalByPostId(postId: string) {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, 'post', postId],
    queryFn: async () => {
      const response = await api.get<ApprovalWorkflow>(`/approvals/post/${postId}`);
      return response.data;
    },
    enabled: !!postId,
  });
}

/**
 * Approve or reject an approval step
 */
export function useProcessApproval(workflowId: string, stepId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: ApprovalAction) => {
      const response = await api.post<ApprovalWorkflow>(
        `/approvals/${workflowId}/steps/${stepId}/process`,
        action
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      const message = variables.status === 'approved'
        ? 'Post erfolgreich genehmigt!'
        : 'Post abgelehnt!';
      toast.success(message);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Verarbeiten der Genehmigung';
      toast.error(message);
    },
  });
}

/**
 * Request approval for a post
 */
export function useRequestApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post<ApprovalWorkflow>(`/approvals/request`, { postId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Genehmigung angefordert!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Fehler beim Anfordern der Genehmigung';
      toast.error(message);
    },
  });
}

/**
 * Get approval statistics
 */
export function useApprovalStats() {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, 'stats'],
    queryFn: async () => {
      const response = await api.get<{
        pending: number;
        approved: number;
        rejected: number;
      }>('/approvals/stats');
      return response.data;
    },
  });
}
