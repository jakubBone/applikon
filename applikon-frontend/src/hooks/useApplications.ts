import { useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchApplications,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  updateApplicationStage,
  updateCompanyResearch,
  addStage,
  deleteApplication,
  checkDuplicate,
  assignCVToApplication,
} from '../services/api'
import type { Application, ApplicationRequest, StageUpdateRequest } from '../types/domain'

// Query keys — central location, eliminates typos when invalidating cache
export const applicationKeys = {
  all: ['applications'] as const,
  duplicates: (company: string, position: string) =>
    ['applications', 'duplicates', company, position] as const,
}

/**
 * useApplications — fetches list of all user applications.
 *
 * useQuery automatically:
 * - manages loading/error/data state
 * - caches results (staleTime from QueryClient)
 * - refreshes data on tab return (refetchOnWindowFocus)
 */
export function useApplications() {
  return useQuery({
    queryKey: applicationKeys.all,
    queryFn: fetchApplications,
  })
}

/**
 * useCreateApplication — creates a new application.
 *
 * useMutation:
 * - onSuccess: invalidates application cache → React Query automatically
 *   refetches the list, view updates without manual setState
 */
export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ApplicationRequest) => createApplication(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplicationRequest }) =>
      updateApplication(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useUpdateStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['badgeStats'] })
    },
  })
}

export function useUpdateStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StageUpdateRequest }) =>
      updateApplicationStage(id, data),
    // Optimistic update — move the card immediately instead of waiting for the
    // server round-trip + refetch, which felt laggy on the deployed backend.
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: applicationKeys.all })
      const previous = queryClient.getQueryData<Application[]>(applicationKeys.all)
      queryClient.setQueryData<Application[]>(applicationKeys.all, (old) =>
        // Cast: StageUpdateRequest types are wider/nullable vs Application;
        // the onSettled refetch reconciles against the authoritative shape.
        old?.map(app => (app.id === id ? ({ ...app, ...data } as Application) : app))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(applicationKeys.all, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['badgeStats'] })
    },
  })
}

// Collapse rapid keystrokes in the cheat-sheet company note into one PATCH.
const COMPANY_RESEARCH_AUTOSAVE_MS = 800

/**
 * useUpdateCompanyResearch — per-application "what do you know about this company"
 * note, with a debounced autosave variant for inline editing in the cheat sheet.
 */
export function useUpdateCompanyResearch() {
  const queryClient = useQueryClient()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: ({ id, value }: { id: number; value: string }) => updateCompanyResearch(id, value),
    onSuccess: (updated) => {
      queryClient.setQueryData<Application[]>(applicationKeys.all, (old) =>
        old?.map(app => (app.id === updated.id ? updated : app))
      )
    },
  })

  const { mutate } = mutation
  const saveDebounced = useCallback((id: number, value: string) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => mutate({ id, value }), COMPANY_RESEARCH_AUTOSAVE_MS)
  }, [mutate])

  return { ...mutation, saveDebounced }
}

export function useAddStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stageName }: { id: number; stageName: string }) =>
      addStage(id, stageName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteApplication(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useAssignCV() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, cvId }: { applicationId: number; cvId: number | null }) =>
      assignCVToApplication(applicationId, cvId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useCheckDuplicate(company: string, position: string) {
  return useQuery({
    queryKey: applicationKeys.duplicates(company, position),
    queryFn: () => checkDuplicate(company, position),
    // Query only when both fields are filled
    enabled: company.length > 0 && position.length > 0,
    staleTime: 0, // Always check duplicates fresh
  })
}
