import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extractTextFromFile } from '../../../src/services/documents/textExtraction.js';
import { chunkText } from '../../../src/services/rag/chunking.js';
import { generateEmbedding } from './azure-openai.js';
import { getSearchClient } from './azure-search.js';

/**
 * Storage configuration for each document category
 * Maps category → { bucket, index, requiresProjectId }
 */
const CATEGORY_CONFIG = {
  project:   { bucket: 'documents',  index: 'project-context-sentiment-vectors', requiresProjectId: true },
  context:   { bucket: 'documents',  index: 'project-context-sentiment-vectors', requiresProjectId: true },
  sentiment: { bucket: 'documents',  index: 'project-context-sentiment-vectors', requiresProjectId: true },
  framework: { bucket: 'materials',  index: 'framework-vectors',                 requiresProjectId: false },
} as const;

type DocumentCategory = keyof typeof CATEGORY_CONFIG;

// Lazy initialize Supabase client to ensure env vars are loaded
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('Missing Supabase credentials:', { url: !!url, key: !!key });
      throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export interface ProcessDocumentParams {
  projectId: string;
  documentId: string;
  category: DocumentCategory;
  type: string;
  name: string;
  filePath: string;
}

/**
 * Process and vectorize a document (SERVER-SIDE)
 */
export async function processDocument(params: ProcessDocumentParams) {
  const { projectId, documentId, category, type, name, filePath } = params;

  // Get storage config for this category
  const config = CATEGORY_CONFIG[category];
  const { bucket, index: indexName, requiresProjectId } = config;

  // Validate projectId if required
  if (requiresProjectId && !projectId) {
    throw new Error(`Category '${category}' requires a projectId`);
  }

  console.log(`[Processing] ${name} (category: ${category}, bucket: ${bucket})`);
  console.log(`[Debug] Attempting download:`, { bucket, filePath, projectId, documentId });

  // Step 1: Download file from Supabase Storage
  const supabase = getSupabase();
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  console.log(`[Debug] File public URL:`, urlData.publicUrl);

  // Fetch the file using public URL
  try {
    const response = await fetch(urlData.publicUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const fileData = await response.blob();
    console.log(`[Success] Downloaded ${fileData.size} bytes via public URL`);

    // Step 2: Extract text (use filePath for extension detection, name may lack it)
    const arrayBuffer = await fileData.arrayBuffer();
    const { text, pageCount } = await extractTextFromFile(arrayBuffer, filePath);

    console.log(`[Extracted] ${text.length} characters, ${pageCount} page(s)`);

    // Step 3: Chunk text
    const chunks = chunkText(text, 1000, 150);
    console.log(`[Chunked] ${chunks.length} chunks`);

    // Step 4: Get search client for the target index
    const searchClient = getSearchClient(indexName);

    // Step 5: Generate embeddings and prepare documents
    const documents = [];

    for (const chunk of chunks) {
      console.log(`[Embedding] Chunk ${chunk.index + 1}/${chunks.length}...`);
      const embedding = await generateEmbedding(chunk.text);

      const doc: any = {
        id: `${documentId}-${chunk.index}`,
        content: chunk.text,
        embedding,
        document_id: documentId,
        type,
        name,
        chunk_idx: chunk.index,
        chunk_count: chunk.total
      };

      // Add project_id and category for non-framework documents
      if (category !== 'framework') {
        doc.project_id = projectId;
        doc.category = category;
      }

      documents.push(doc);
    }

    // Step 6: Upload to Azure AI Search
    console.log(`[Uploading] ${documents.length} documents to ${indexName}...`);
    await searchClient.uploadDocuments(documents);

    console.log(`[Success] Uploaded to ${indexName}`);

    return {
      status: "ok",
      inserted: documents.length,
      chunks: documents.length,
      pages: pageCount,
      index: indexName
    };
  } catch (fetchError: any) {
    console.error('[Fetch Error]:', fetchError);
    throw new Error(`Failed to process document: ${fetchError.message}`);
  }
}

/**
 * Delete all chunks for a document from both indexes (SERVER-SIDE)
 */
export async function deleteDocument(documentId: string) {
  console.log(`[Deleting] Searching for document ${documentId} in all indexes...`);

  const indexes = ["project-context-sentiment-vectors", "framework-vectors"];
  let totalDeleted = 0;
  let deletedFrom = "";

  for (const indexName of indexes) {
    const searchClient = getSearchClient(indexName);

    // Find all chunks for this document
    const results = await searchClient.search("*", {
      filter: `document_id eq '${documentId}'`,
      select: ["id"]
    });

    const ids: string[] = [];
    for await (const result of results.results) {
      ids.push(result.document.id);
    }

    // Delete chunks if found
    if (ids.length > 0) {
      await searchClient.deleteDocuments(ids.map(id => ({ id })));
      console.log(`[Deleted] ${ids.length} chunks from ${indexName}`);
      totalDeleted += ids.length;
      deletedFrom = indexName;
    }
  }

  if (totalDeleted === 0) {
    console.log(`[Warning] No chunks found for document ${documentId}`);
  }

  return {
    status: "ok",
    deleted: totalDeleted,
    index: deletedFrom || "none"
  };
}
