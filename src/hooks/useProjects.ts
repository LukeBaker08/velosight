/**
 * React Query hooks for project data fetching.
 * Demonstrates the pattern for migrating from manual useState/useEffect to React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllProjects,
  getProjectById,
  getRecentProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/project-service';
import { Project } from '@/types/project';

/** Query keys for project-related queries */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: string) => [...projectKeys.lists(), filters] as const,
  recent: (limit?: number) => [...projectKeys.all, 'recent', limit] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

/**
 * Fetch all projects with React Query.
 * Replaces manual useState + useEffect pattern.
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: getAllProjects,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}

/**
 * Fetch recent projects with React Query.
 */
export function useRecentProjects(limit: number = 5) {
  return useQuery({
    queryKey: projectKeys.recent(limit),
    queryFn: () => getRecentProjects(limit),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch a single project by ID.
 */
export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn: () => getProjectById(id!),
    enabled: !!id, // Only run query if id is provided
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create a new project mutation.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      // Invalidate and refetch project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.recent() });

      // Optionally add the new project to the cache immediately
      queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);
    },
  });
}

/**
 * Update a project mutation.
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
      updateProject(id, updates),
    onSuccess: (updatedProject) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);

      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.recent() });
    },
  });
}

/**
 * Delete a project mutation.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.recent() });
    },
  });
}
