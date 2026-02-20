export interface Chunk {
  text: string;
  index: number;
  total: number;
}

/**
 * Split text into overlapping chunks for embedding
 * @param text Text to chunk
 * @param maxChars Maximum characters per chunk (default: 1000)
 * @param overlap Character overlap between chunks (default: 150)
 * @returns Array of chunks with metadata
 */
export function chunkText(
  text: string,
  maxChars: number = 1000,
  overlap: number = 150
): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    const chunkText = text.slice(start, end);

    chunks.push({
      text: chunkText,
      index,
      total: 0 // Will update after all chunks created
    });

    start += maxChars - overlap;
    index++;
  }

  // Update total count in all chunks
  chunks.forEach(chunk => chunk.total = chunks.length);

  return chunks;
}
