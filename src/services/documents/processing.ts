import { supabase } from "@/integrations/supabase/client";
import { extractTextFromFile } from "./textExtraction";
import { generateEmbedding } from "../azure/openai";
import { getSearchClient } from "../azure/search";
import { chunkText } from "../rag/chunking";

export interface ProcessDocumentParams {
  projectId: string;
  documentId: string;
  category: "project" | "context" | "sentiment" | "framework";
  type: string;
  name: string;
  filePath: string;
  bucket?: string;
}

/**
 * FREE TIER APPROACH: Map category to index name
 *
 * - project/context/sentiment → project-context-sentiment-vectors (with category field)
 * - framework → framework-vectors (no category field)
 */
function getIndexForCategory(category: string): string {
  if (category === "framework") {
    return "framework-vectors";
  }
  // project, context, sentiment all go to same index
  return "project-context-sentiment-vectors";
}

/**
 * Process and vectorize a document
 * Downloads from Supabase Storage, extracts text, chunks, embeds, and uploads to Azure AI Search
 */
export async function processDocument(params: ProcessDocumentParams) {
  const {
    projectId,
    documentId,
    category,
    type,
    name,
    filePath,
    bucket = "documents"
  } = params;

  console.log(`[Processing] ${name} (category: ${category})`);

  // Step 1: Download file from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (downloadError) {
    throw new Error(`Failed to download file: ${downloadError.message}`);
  }

  // Step 2: Extract text (text files only for pilot)
  const arrayBuffer = await fileData.arrayBuffer();
  const { text, pageCount } = await extractTextFromFile(arrayBuffer, name);

  console.log(`[Extracted] ${text.length} characters, ${pageCount} page(s)`);

  // Step 3: Chunk text
  const chunks = chunkText(text, 1000, 150);
  console.log(`[Chunked] ${chunks.length} chunks`);

  // Step 4: Determine target index based on category
  const indexName = getIndexForCategory(category);
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
      doc.category = category; // ⭐ CRITICAL: Include category field for FREE TIER
    }

    documents.push(doc);
  }

  // Step 6: Upload to appropriate Azure AI Search index
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
}

/**
 * Delete all chunks for a document from both indexes
 * Searches both indexes since we don't always know the category at deletion time
 */
export async function deleteDocument(documentId: string) {
  console.log(`[Deleting] Searching for document ${documentId} in all indexes...`);

  const indexes = ["project-context-sentiment-vectors", "framework-vectors"];
  let totalDeleted = 0;
  let deletedFrom = "";

  for (const indexName of indexes) {
    const searchClient = getSearchClient(indexName);

    // Find all chunks for this document in this index
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
