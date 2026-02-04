import {
  SearchClient,
  SearchIndexClient,
  AzureKeyCredential
} from "@azure/search-documents";

// Server-side Azure Search clients (uses process.env)
function getCredential() {
  return new AzureKeyCredential(process.env.AZURE_SEARCH_ADMIN_KEY!);
}

function getEndpoint() {
  return process.env.AZURE_SEARCH_ENDPOINT!;
}

/**
 * Get a typed search client for a specific index
 */
export function getSearchClient<T = any>(indexName: string) {
  return new SearchClient<T>(getEndpoint(), indexName, getCredential());
}

/**
 * Get index management client for creating/updating indexes
 */
export function getIndexClient() {
  return new SearchIndexClient(getEndpoint(), getCredential());
}
