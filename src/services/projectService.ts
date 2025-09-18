
/**
 * Service for managing project data operations including CRUD operations and transformations.
 * Handles communication with Supabase database and provides standardized project data access.
 */
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/project';

/**
 * Fetches all projects from the database and transforms them to frontend format
 * @returns Promise resolving to array of projects with getter properties for compatibility
 * @throws {Error} Database error if query fails
 */
export const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.from('projects').select('*');
  
  if (error) throw error;
  
  return data.map(project => ({
    id: project.id,
    name: project.name,
    client: project.client,
    description: project.description,
    stage: project.stage,
    risk_level: project.risk_level,
    created_at: project.created_at,
    last_updated: project.last_updated,
    documents_count: project.documents_count,
    get riskLevel() { return this.risk_level; },
    get lastUpdated() { return this.last_updated; },
    get documentsCount() { return this.documents_count; }
  }));
};

/**
 * Wrapper function for fetchProjects to maintain API consistency
 * @returns Promise resolving to all projects
 */
export const getAllProjects = async (): Promise<Project[]> => {
  return await fetchProjects();
};

/**
 * Fetches the most recently updated projects with specified limit
 * @param limit - Maximum number of projects to return (default: 5)
 * @returns Promise resolving to array of recent projects ordered by last_updated desc
 * @throws {Error} Database error if query fails
 */
export const getRecentProjects = async (limit: number = 5): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('last_updated', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data.map(project => ({
    id: project.id,
    name: project.name,
    client: project.client,
    description: project.description,
    stage: project.stage,
    risk_level: project.risk_level,
    created_at: project.created_at,
    last_updated: project.last_updated,
    documents_count: project.documents_count,
    get riskLevel() { return this.risk_level; },
    get lastUpdated() { return this.last_updated; },
    get documentsCount() { return this.documents_count; }
  }));
};

/**
 * Fetches a single project by its ID
 * @param id - Project UUID to fetch
 * @returns Promise resolving to project object or null if not found
 * @throws {Error} Database error if query fails
 */
export const getProjectById = async (id: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  
  if (!data) return null;
  
  return {
    id: data.id,
    name: data.name,
    client: data.client,
    description: data.description,
    stage: data.stage,
    risk_level: data.risk_level,
    created_at: data.created_at,
    last_updated: data.last_updated,
    documents_count: data.documents_count,
    get riskLevel() { return this.risk_level; },
    get lastUpdated() { return this.last_updated; },
    get documentsCount() { return this.documents_count; }
  };
};
