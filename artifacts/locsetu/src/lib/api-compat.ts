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
  saveWorker,
  unsaveWorker,
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

export function useVerifyWorker(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: ({ workerId, status }: { workerId: number; status: string }) =>
      apiFetch(`/admin/workers/${workerId}/verify`, { method: "POST", body: JSON.stringify({ status }) }),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useAcceptJob(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/jobs/${id}/accept`, { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useRejectJob(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/jobs/${id}/reject`, { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useCompleteJob(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/jobs/${id}/complete`, { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useCancelJob(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/jobs/${id}/cancel`, { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useCreateReview(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: (data: { workerId: number; rating: number; comment?: string }) =>
      apiFetch("/reviews", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useMarkAllNotificationsRead(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "POST" }),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useMarkNotificationRead(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useSaveWorker(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: ({ workerId }: { workerId: number }) => saveWorker(workerId),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useUnsaveWorker(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: ({ workerId }: { workerId: number }) => unsaveWorker(workerId),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useUpdateMyWorkerProfile(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    ...getUpdateWorkerProfileMutationOptions(),
    onSuccess: options?.mutation?.onSuccess,
  });
}

export function useDeleteBuzzPost(options?: { mutation?: { onSuccess?: () => void } }) {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/buzz/${id}`, { method: "DELETE" }),
    onSuccess: options?.mutation?.onSuccess,
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
