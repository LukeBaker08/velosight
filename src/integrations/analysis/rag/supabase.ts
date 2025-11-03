import { supabase } from '../../supabase/client';
import type { RetrievedChunk } from '../type';

type ProjectCategory = 'project' | 'context' | 'sentiment';

export async function matchProject({
  queryEmbedding,
  k,
  category,
  projectId
}: {
  queryEmbedding: number[];
  k: number;
  category?: ProjectCategory;
  projectId?: string;
}): Promise<RetrievedChunk[]> {
  const { data, error } = await supabase.rpc('match_project_chunks', {
    query_embedding: queryEmbedding,
    match_count: k,
    category_filter: category ?? null,
    project_id: projectId ?? null,
  });

  if (error) throw new Error(`match_project_chunks failed: ${error.message}`);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    content: r.content,
    metadata: r.metadata ?? {},
    score: r.similarity,
    source: (category ?? 'project') as any,
  }));
}

export async function matchFramework({
  queryEmbedding,
  k,
  materialCategory
}: {
  queryEmbedding: number[];
  k: number;
  materialCategory?: string;
}): Promise<RetrievedChunk[]> {
  const { data, error } = await supabase.rpc('match_framework_chunks', {
    query_embedding: queryEmbedding,
    match_count: k,
    material_filter: materialCategory ?? null,
  });

  if (error) throw new Error(`match_framework_chunks failed: ${error.message}`);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    content: r.content,
    metadata: r.metadata ?? {},
    score: r.similarity,
    source: 'framework',
  }));
}