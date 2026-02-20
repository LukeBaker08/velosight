import { useAuth } from '@/context/AuthContext';

/**
 * Hook to check user permissions based on role
 * Returns boolean flags for various permissions
 */
export const usePermissions = () => {
  const { role, isContributor, isViewer, canEdit } = useAuth();

  return {
    // Project permissions
    canCreateProject: isContributor,
    canEditProject: isContributor,
    canDeleteProject: isContributor,
    canViewProject: true, // All authenticated users can view

    // Document permissions
    canUploadDocuments: isContributor,
    canEditDocuments: isContributor,
    canDeleteDocuments: isContributor,
    canViewDocuments: true,

    // Material permissions
    canUploadMaterials: isContributor,
    canEditMaterials: isContributor,
    canDeleteMaterials: isContributor,
    canViewMaterials: true,

    // Analysis permissions
    canRunAnalysis: isContributor,
    canViewAnalysis: true,
    canDeleteAnalysis: isContributor,

    // Settings permissions
    canManageSettings: isContributor,
    canManageUsers: isContributor,
    canManageWebhooks: isContributor,
    canManageAnalysisTypes: isContributor,

    // General permissions
    canEdit,
    isReadOnly: isViewer,
    role,
  };
};
