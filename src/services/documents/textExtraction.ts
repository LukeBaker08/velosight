/**
 * Text extraction for document processing pipeline.
 * Supports: .txt, .md, .pdf, .docx, .xlsx, .xls, .pptx
 */
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface ExtractionResult {
  text: string;
  pageCount: number;
}

/**
 * Extract text content from a file buffer.
 * @param fileBuffer - Raw file data as ArrayBuffer
 * @param fileName - File name or path (used for extension detection)
 */
export async function extractTextFromFile(
  fileBuffer: ArrayBuffer,
  fileName: string
): Promise<ExtractionResult> {
  const extension = fileName.toLowerCase().split('.').pop();

  let result: ExtractionResult;

  switch (extension) {
    case 'txt':
    case 'md':
      result = extractPlainText(fileBuffer);
      break;

    case 'pdf':
      try {
        result = await extractPdf(fileBuffer);
      } catch (err: any) {
        throw new Error(`Failed to extract text from PDF "${fileName}": ${err.message}`);
      }
      break;

    case 'docx':
      try {
        result = await extractDocx(fileBuffer);
      } catch (err: any) {
        throw new Error(`Failed to extract text from DOCX "${fileName}": ${err.message}`);
      }
      break;

    case 'xlsx':
    case 'xls':
      try {
        result = extractSpreadsheet(fileBuffer);
      } catch (err: any) {
        throw new Error(`Failed to extract text from spreadsheet "${fileName}": ${err.message}`);
      }
      break;

    case 'pptx':
      try {
        result = await extractPptx(fileBuffer);
      } catch (err: any) {
        throw new Error(`Failed to extract text from PPTX "${fileName}": ${err.message}`);
      }
      break;

    case 'doc':
      throw new Error(
        'Legacy .doc format is not supported. Please convert to .docx and re-upload.'
      );

    default:
      throw new Error(
        `Unsupported file type: .${extension}. ` +
        `Supported formats: .txt, .md, .pdf, .docx, .xlsx, .xls, .pptx`
      );
  }

  // Quality guard: reject empty extractions
  if (result.text.trim().length === 0) {
    throw new Error(
      `No text could be extracted from "${fileName}". ` +
      `The file may be empty, image-only (scanned), or corrupted.`
    );
  }

  return result;
}

// ── Plain text (.txt, .md) ──────────────────────────────────────────

function extractPlainText(buffer: ArrayBuffer): ExtractionResult {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(buffer);
  return { text, pageCount: 1 };
}

// ── PDF (.pdf) ──────────────────────────────────────────────────────

async function extractPdf(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return {
      text: result.text,
      pageCount: result.total,
    };
  } finally {
    await parser.destroy();
  }
}

// ── DOCX (.docx) ───────────────────────────────────────────────────

async function extractDocx(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const nodeBuffer = Buffer.from(buffer);
  const result = await mammoth.extractRawText({ buffer: nodeBuffer });
  const text = result.value;
  // Estimate page count: ~3000 characters per page
  const estimatedPages = Math.max(1, Math.ceil(text.length / 3000));
  return { text, pageCount: estimatedPages };
}

// ── XLSX / XLS (.xlsx, .xls) ────────────────────────────────────────

function extractSpreadsheet(buffer: ArrayBuffer): ExtractionResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const textParts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const sheetText = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (sheetText.trim()) {
      textParts.push(`--- Sheet: ${sheetName} ---\n${sheetText}`);
    }
  }

  const text = textParts.join('\n\n');
  return {
    text,
    pageCount: workbook.SheetNames.length,
  };
}

// ── PPTX (.pptx) ───────────────────────────────────────────────────

async function extractPptx(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const zip = await JSZip.loadAsync(buffer);
  const textParts: string[] = [];

  // PPTX slides are stored as ppt/slides/slide1.xml, slide2.xml, etc.
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    const slideXml = await zip.file(slidePath)?.async('text');
    if (slideXml) {
      const texts = extractTextFromXml(slideXml);
      if (texts.trim()) {
        const slideNum = slidePath.match(/slide(\d+)/)?.[1] || '?';
        textParts.push(`--- Slide ${slideNum} ---\n${texts}`);
      }
    }
  }

  const text = textParts.join('\n\n');
  return {
    text,
    pageCount: slideFiles.length,
  };
}

/**
 * Extract all text content from OOXML by finding <a:t> elements.
 * Uses regex rather than a full XML parser to keep dependencies minimal.
 */
function extractTextFromXml(xml: string): string {
  const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
  if (!matches) return '';

  return matches
    .map(m => {
      const textMatch = m.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
      return textMatch?.[1] || '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
