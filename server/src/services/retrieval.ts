import { getSearchClient } from './azure-search.js';
import { generateEmbedding } from './azure-openai.js';

/**
 * Search result from Azure AI Search
 */
export interface SearchResult {
  id: string;
  content: string;
  score: number;
  documentId: string;
  documentName: string;
  type: string;
  chunkIndex: number;
  chunkCount: number;
}

/**
 * Structured retrieval result for triangulation
 */
export interface TriangulatedContext {
  framework_data: SearchResult[];
  context_data: SearchResult[];
  project_data: SearchResult[];
  sentiment_data: SearchResult[];
  query: string;
  projectId: string;
}

/**
 * Search project documents by category
 */
export async function searchProjectDocuments(
  projectId: string,
  query: string,
  category: 'project' | 'context' | 'sentiment',
  topK: number = 5
): Promise<SearchResult[]> {
  console.log(`[Search] Searching ${category} documents for project ${projectId}`);

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Get search client for project index
  const searchClient = getSearchClient('project-context-sentiment-vectors');

  // Vector search with category and project filter
  const searchResults = await searchClient.search(query, {
    vectorSearchOptions: {
      queries: [{
        kind: 'vector',
        vector: queryEmbedding,
        kNearestNeighborsCount: topK,
        fields: ['embedding']
      }]
    },
    filter: `project_id eq '${projectId}' and category eq '${category}'`,
    select: ['id', 'content', 'document_id', 'name', 'type', 'chunk_idx', 'chunk_count'],
    top: topK
  });

  // Collect results
  const results: SearchResult[] = [];
  for await (const result of searchResults.results) {
    results.push({
      id: result.document.id,
      content: result.document.content,
      score: result.score ?? 0,
      documentId: result.document.document_id,
      documentName: result.document.name,
      type: result.document.type,
      chunkIndex: result.document.chunk_idx,
      chunkCount: result.document.chunk_count
    });
  }

  console.log(`[Search] Found ${results.length} ${category} results`);
  return results;
}

/**
 * Search framework materials
 */
export async function searchFrameworkMaterials(
  query: string,
  topK: number = 5,
  type?: string
): Promise<SearchResult[]> {
  console.log(`[Search] Searching framework materials${type ? ` (type: ${type})` : ''}`);

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Get search client for framework index
  const searchClient = getSearchClient('framework-vectors');

  // Build filter if type specified
  const filter = type ? `type eq '${type}'` : undefined;

  // Vector search
  const searchResults = await searchClient.search(query, {
    vectorSearchOptions: {
      queries: [{
        kind: 'vector',
        vector: queryEmbedding,
        kNearestNeighborsCount: topK,
        fields: ['embedding']
      }]
    },
    filter,
    select: ['id', 'content', 'document_id', 'name', 'type', 'chunk_idx', 'chunk_count'],
    top: topK
  });

  // Collect results
  const results: SearchResult[] = [];
  for await (const result of searchResults.results) {
    results.push({
      id: result.document.id,
      content: result.document.content,
      score: result.score ?? 0,
      documentId: result.document.document_id,
      documentName: result.document.name,
      type: result.document.type,
      chunkIndex: result.document.chunk_idx,
      chunkCount: result.document.chunk_count
    });
  }

  console.log(`[Search] Found ${results.length} framework results`);
  return results;
}

/**
 * Retrieve context from all 4 sources for triangulation
 * This is the main function used by the analysis system
 */
export async function retrieveTriangulatedContext(
  projectId: string,
  query: string,
  topKPerCategory: number = 3
): Promise<TriangulatedContext> {
  console.log(`[Retrieval] Fetching triangulated context for: "${query.substring(0, 50)}..."`);

  // Search all 4 sources in parallel
  const [framework, context, project, sentiment] = await Promise.all([
    searchFrameworkMaterials(query, topKPerCategory),
    searchProjectDocuments(projectId, query, 'context', topKPerCategory),
    searchProjectDocuments(projectId, query, 'project', topKPerCategory),
    searchProjectDocuments(projectId, query, 'sentiment', topKPerCategory)
  ]);

  console.log(`[Retrieval] Complete: framework=${framework.length}, context=${context.length}, project=${project.length}, sentiment=${sentiment.length}`);

  return {
    framework_data: framework,
    context_data: context,
    project_data: project,
    sentiment_data: sentiment,
    query,
    projectId
  };
}

/**
 * Format triangulated context as markdown for LLM consumption
 */
export function formatContextForLLM(context: TriangulatedContext): string {
  const sections: string[] = [];

  // Framework section
  if (context.framework_data.length > 0) {
    sections.push('## Framework Data (Best Practices & Methodologies)\n');
    context.framework_data.forEach((r, i) => {
      sections.push(`### [F${i + 1}] ${r.documentName} (relevance: ${(r.score * 100).toFixed(1)}%)`);
      sections.push(r.content);
      sections.push('');
    });
  } else {
    sections.push('## Framework Data\n*No relevant framework materials found.*\n');
  }

  // Context section
  if (context.context_data.length > 0) {
    sections.push('## Context Data (Organisational Environment)\n');
    context.context_data.forEach((r, i) => {
      sections.push(`### [C${i + 1}] ${r.documentName} (relevance: ${(r.score * 100).toFixed(1)}%)`);
      sections.push(r.content);
      sections.push('');
    });
  } else {
    sections.push('## Context Data\n*No relevant context documents found.*\n');
  }

  // Project section
  if (context.project_data.length > 0) {
    sections.push('## Project Data (Current Project State)\n');
    context.project_data.forEach((r, i) => {
      sections.push(`### [P${i + 1}] ${r.documentName} (relevance: ${(r.score * 100).toFixed(1)}%)`);
      sections.push(r.content);
      sections.push('');
    });
  } else {
    sections.push('## Project Data\n*No relevant project documents found.*\n');
  }

  // Sentiment section
  if (context.sentiment_data.length > 0) {
    sections.push('## Sentiment Data (Meeting Insights & Discussions)\n');
    context.sentiment_data.forEach((r, i) => {
      sections.push(`### [S${i + 1}] ${r.documentName} (relevance: ${(r.score * 100).toFixed(1)}%)`);
      sections.push(r.content);
      sections.push('');
    });
  } else {
    sections.push('## Sentiment Data\n*No relevant sentiment documents found.*\n');
  }

  return sections.join('\n');
}
