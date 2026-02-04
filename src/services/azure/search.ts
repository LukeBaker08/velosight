import {
  SearchClient,
  SearchIndexClient,
  AzureKeyCredential,
  VectorizedQuery
} from "@azure/search-documents";

// Lazy initialization to allow dotenv to load first
function getCredential() {
  return new AzureKeyCredential(import.meta.env.VITE_AZURE_SEARCH_ADMIN_KEY!);
}

function getEndpoint() {
  return import.meta.env.VITE_AZURE_SEARCH_ENDPOINT!;
}

/**
 * Get a typed search client for a specific index
 */
export function getSearchClient<T>(indexName: string) {
  return new SearchClient<T>(getEndpoint(), indexName, getCredential());
}

/**
 * Get index management client for creating/updating indexes
 */
export function getIndexClient() {
  return new SearchIndexClient(getEndpoint(), getCredential());
}

/**
 * FREE TIER APPROACH - 2 Indexes
 *
 * Physical Indexes:
 *   1. project-context-sentiment-vectors (category field distinguishes type)
 *   2. framework-vectors
 *
 * Logical Types (via category field):
 *   - ProjectVectorDocument (category: "project")
 *   - ContextVectorDocument (category: "context")
 *   - SentimentVectorDocument (category: "sentiment")
 *   - FrameworkVectorDocument (separate index)
 */

// Combined document type for project-context-sentiment-vectors index
export interface ProjectContextSentimentDocument {
  id: string;
  content: string;
  embedding: number[];
  project_id: string;
  document_id: string;
  category: "project" | "context" | "sentiment";
  type: string;
  name: string;
  chunk_idx: number;
  chunk_count: number;
}

// Individual type aliases for clarity (all use same structure)
export type ProjectVectorDocument = ProjectContextSentimentDocument;
export type ContextVectorDocument = ProjectContextSentimentDocument;
export type SentimentVectorDocument = ProjectContextSentimentDocument;

// Framework documents in separate index (no project_id or category)
export interface FrameworkVectorDocument {
  id: string;
  content: string;
  embedding: number[];
  document_id: string;
  type: string;
  name: string;
}

/**
 * Perform vector similarity search on a specific index
 * @param indexName Name of the Azure AI Search index
 * @param queryVector Embedding vector to search with
 * @param top Number of results to return
 * @param filter Optional OData filter expression
 * @returns Array of search results with scores
 */
export async function vectorSearch(
  indexName: string,
  queryVector: number[],
  top: number,
  filter?: string
) {
  const client = getSearchClient(indexName);

  const vectorQuery: VectorizedQuery = {
    kind: "vector",
    vector: queryVector,
    kNearestNeighborsCount: top,
    fields: ["embedding"]
  };

  const results = await client.search("*", {
    vectorQueries: [vectorQuery],
    select: ["id", "content", "project_id", "document_id", "type", "name"],
    filter,
    top
  });

  const documents = [];
  for await (const result of results.results) {
    documents.push({
      ...result.document,
      score: result.score
    });
  }

  return documents;
}
