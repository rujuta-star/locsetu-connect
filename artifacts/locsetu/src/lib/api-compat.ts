import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getListBuzzQueryKey,
  getGetMyWorkerProfileQueryKey,
  getListJobsQueryKey,
  getListNotificationsQueryKey,
  getListSavedWorkersQueryKey,
  getUpdateWorkerProfileMutationOptions,
  getCreateBuzzMutationOptions,
  getMarkNotificationReadMutationOptions,
  getCreateReviewMutationOptions,
  getUpdateJobMutationOptions,
} from "@workspace/api-client-react";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api${path}`, { ...options, headers: { ...getAuthHeaders(), ...(options?.headers ?? {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type MutationCallbacks = {
  onSuccess?: () => void;
  onError?: (err?: unknown) => void;
};

export function useLogout() {
  return { mutate: () => {}, isPending: false };
}

export function useGetAdminStats() {
  return useQuery({ queryKey: ["admin", "stats"], queryFn: () => apiFetch("/admin/stats") });
}

export function useListPendingVerifications() {
  return useQuery({ queryKey: ["admin", "workers", "pending"], queryFn: () => apiFetch("/admin/workers/pending") });
}

export function useListAllUsers(params?: { role?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.role) qs.set("role", params.role);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => apiFetch(`/admin/users${query ? `?${query}` : ""}`)
  });
}

export function useVerifyWorker(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: ({ workerId, status }: { workerId: number; status: string }) =>
      apiFetch(`/admin/workers/${workerId}/verify`, { method: "POST", body: JSON.stringify({ status }) }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useAcceptJob(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/jobs/${id}/accept`, { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useRejectJob(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/jobs/${id}/reject`, { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useCompleteJob(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/jobs/${id}/complete`, { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useCancelJob(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/jobs/${id}/cancel`, { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useCreateReview(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: (data: { workerId: number; jobId?: number; rating: number; comment?: string }) =>
      apiFetch("/reviews", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useMarkAllNotificationsRead(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useMarkNotificationRead(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useSaveWorker(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: ({ workerId }: { workerId: number }) =>
      apiFetch("/saved-workers", { method: "POST", body: JSON.stringify({ workerId }) }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useUnsaveWorker(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: ({ workerId }: { workerId: number }) =>
      apiFetch(`/saved-workers/${workerId}`, { method: "DELETE" }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useUpdateMyWorkerProfile(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    ...getUpdateWorkerProfileMutationOptions(),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useDeleteBuzzPost(options?: { mutation?: MutationCallbacks }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/buzz/${id}`, { method: "DELETE" }),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function getDeleteBuzzMutationOptions() {
  return {
    mutationFn: (id: number) => apiFetch(`/buzz/${id}`, { method: "DELETE" }),
  };
}

export function getCreateBuzzPostMutationOptions() {
  return getCreateBuzzMutationOptions();
}

export function getListPendingVerificationsQueryKey() {
  return ["admin", "workers", "pending"] as const;
}

export function getGetAdminStatsQueryKey() {
  return ["admin", "stats"] as const;
}

export {
  getListBuzzQueryKey,
  getGetMyWorkerProfileQueryKey,
  getListJobsQueryKey,
  getListNotificationsQueryKey,
  getListSavedWorkersQueryKey,
  getUpdateWorkerProfileMutationOptions,
  getCreateBuzzMutationOptions,
  getMarkNotificationReadMutationOptions,
  getCreateReviewMutationOptions,
  getUpdateJobMutationOptions,
};
