export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  source: "project" | "context" | "sentiment" | "framework";
  metadata?: Record<string, any>;
}

export interface AssembledContext {
  text: string;
  citations: Record<string, RetrievedChunk>;
  usedChunks: RetrievedChunk[];
}

/**
 * Assemble context from retrieved chunks with citations
 * Deduplicates, sorts by relevance, and formats with citation tags
 * @param chunks Array of retrieved chunks from vector search
 * @param maxChars Maximum characters in assembled context (default: 10000)
 * @returns Assembled context with citations and metadata
 */
export function assembleContext(
  chunks: RetrievedChunk[],
  maxChars: number = 10000
): AssembledContext {
  // Deduplicate by content hash (first 100 chars)
  const seen = new Set<string>();
  const unique: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    const hash = chunk.content.slice(0, 100);
    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(chunk);
    }
  }

  // Sort by score descending (most relevant first)
  unique.sort((a, b) => b.score - a.score);

  // Build context with citations
  let text = "";
  const citations: Record<string, RetrievedChunk> = {};
  const usedChunks: RetrievedChunk[] = [];

  for (const chunk of unique) {
    const citation = `[#${chunk.source}:${chunk.id} | score=${chunk.score.toFixed(3)}]`;
    const entry = `${citation}\n${chunk.content}\n\n`;

    // Stop if we would exceed max chars
    if ((text + entry).length > maxChars) break;

    text += entry;
    citations[`#${chunk.source}:${chunk.id}`] = chunk;
    usedChunks.push(chunk);
  }

  return { text, citations, usedChunks };
}
