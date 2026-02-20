/**
 * Barrel exports for all custom hooks.
 */

export { useToast, toast } from './useToast';
export { useIsMobile } from './useMobile';
export { useDropdownValues } from './useDropdownValues';
export { useDropdownColors, useProjectBadgeColors } from './useDropdownColors';
export { useAllDropdownCategories } from './useAllDropdownCategories';
export { useUsers } from './useUsers';

// React Query hooks for server state
export {
  useProjects,
  useRecentProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  projectKeys,
} from './useProjects';
