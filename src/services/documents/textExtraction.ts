/**
 * Text extraction for pilot phase
 * Handles .txt and .md files only
 * PDF support deferred to Phase 11
 */

export async function extractTextFromFile(
  fileBuffer: ArrayBuffer,
  fileName: string
): Promise<{ text: string; pageCount: number }> {
  const extension = fileName.toLowerCase().split('.').pop();

  switch (extension) {
    case 'txt':
    case 'md':
      // Simple UTF-8 text extraction
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(fileBuffer);
      return {
        text,
        pageCount: 1 // Text files counted as single page
      };

    case 'pdf':
      throw new Error(
        'PDF support not yet implemented. Use text files (.txt, .md) for pilot phase. ' +
        'PDF processing will be added in Phase 11 with Azure Document Intelligence.'
      );

    default:
      throw new Error(
        `Unsupported file type: .${extension}. Please use .txt or .md files for pilot phase.`
      );
  }
}
