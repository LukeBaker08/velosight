/**
 * Enhanced project service with better error handling and typing
 */

import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/project';
import { handleError, NetworkError } from './errors';
import { validateProject, isValidUUID } from './validators';

/**
 * Transform database project to frontend Project type
 */
const transformProject = (dbProject: any): Project => {
  // Create object with getters for backward compatibility
  const project = {
    ...dbProject,
    get riskLevel() { return this.risk_level; },
    get lastUpdated() { return this.updated_at; },
    get documentsCount() { return this.documents_count; }
  };
  return project as Project;
};

/**
 * Get all projects with proper error handling
 */
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new NetworkError(`Failed to fetch projects: ${error.message}`);
    }

    return (data || []).map(transformProject);
  } catch (error) {
    handleError(error, 'Fetch all projects');
    throw error;
  }
};

/**
 * Get recent projects (last 5)
 */
export const getRecentProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new NetworkError(`Failed to fetch recent projects: ${error.message}`);
    }

    return (data || []).map(transformProject);
  } catch (error) {
    handleError(error, 'Fetch recent projects');
    throw error;
  }
};

/**
 * Get project by ID with validation
 */
export const getProjectById = async (id: string): Promise<Project | null> => {
  try {
    if (!isValidUUID(id)) {
      throw new NetworkError('Invalid project ID format');
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Project not found
      }
      throw new NetworkError(`Failed to fetch project: ${error.message}`);
    }

    return transformProject(data);
  } catch (error) {
    handleError(error, 'Fetch project by ID');
    throw error;
  }
};

/**
 * Create new project with validation
 */
export const createProject = async (projectData: {
  name: string;
  client: string;
  description?: string;
  risk_level?: string;
  stage?: string;
}): Promise<Project> => {
  try {
    validateProject(projectData);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        documents_count: 0
      })
      .select()
      .single();

    if (error) {
      throw new NetworkError(`Failed to create project: ${error.message}`);
    }

    return transformProject(data);
  } catch (error) {
    handleError(error, 'Create project');
    throw error;
  }
};

/**
 * Update project with validation
 */
export const updateProject = async (
  id: string, 
  updates: Partial<Project>
): Promise<Project> => {
  try {
    if (!isValidUUID(id)) {
      throw new NetworkError('Invalid project ID format');
    }

    // Validate updates if they include core fields
    if (updates.name || updates.client) {
      validateProject({
        name: updates.name || '',
        client: updates.client || '',
        stage: updates.stage,
        riskLevel: updates.risk_level
      });
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new NetworkError(`Failed to update project: ${error.message}`);
    }

    return transformProject(data);
  } catch (error) {
    handleError(error, 'Update project');
    throw error;
  }
};

/**
 * Delete project with cascade handling
 */
export const deleteProject = async (id: string): Promise<void> => {
  try {
    if (!isValidUUID(id)) {
      throw new NetworkError('Invalid project ID format');
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw new NetworkError(`Failed to delete project: ${error.message}`);
    }
  } catch (error) {
    handleError(error, 'Delete project');
    throw error;
  }
};

/**
 * Update project document count
 */
export const updateProjectDocumentCount = async (projectId: string): Promise<void> => {
  try {
    if (!isValidUUID(projectId)) {
      throw new NetworkError('Invalid project ID format');
    }

    // Get actual document count
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (countError) {
      throw new NetworkError(`Failed to count documents: ${countError.message}`);
    }

    // Update project with new count
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        documents_count: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      throw new NetworkError(`Failed to update document count: ${updateError.message}`);
    }
  } catch (error) {
    handleError(error, 'Update project document count');
    throw error;
  }
};