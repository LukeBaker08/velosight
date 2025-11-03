import { matchProject, matchFramework } from './supabase';
import type { RetrievalParams, RetrievedChunk } from '../type';
import { embed } from '../utils/textkit'; // must return 384-dim vectors

export async function retrieveAll(
  params: RetrievalParams,
  perSourceK: Record<'project' | 'context' | 'sentiment' | 'framework', number>
): Promise<Record<'project'|'context'|'sentiment'|'framework', RetrievedChunk[]>> {
  const queryEmbedding = await embed(params.query); // ← your llama embedding (384 length)

  const [project, context, sentiment, framework] = await Promise.all([
    matchProject({ queryEmbedding, k: perSourceK.project ?? 4, category: 'project',  projectId: params.filters?.projectId }),
    matchProject({ queryEmbedding, k: perSourceK.context ?? 3, category: 'context',  projectId: params.filters?.projectId }),
    matchProject({ queryEmbedding, k: perSourceK.sentiment ?? 2, category: 'sentiment', projectId: params.filters?.projectId }),
    matchFramework({ queryEmbedding, k: perSourceK.framework ?? 6 }),
  ]);

  return { project, context, sentiment, framework };
}
