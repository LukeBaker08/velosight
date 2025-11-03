// src/integrations/analysis/llm/structured.ts
import { ZodSchema } from 'zod';

/**
 * Validates a JSON string against a Zod schema.
 * If invalid, calls `repair()` to get a corrected JSON string (up to maxAttempts).
 * Returns the parsed+validated object.
 */
export async function validateAndRepair<T>(
  raw: string,
  schema: ZodSchema<T>,
  repair: (badPayload: string) => Promise<string>,
  maxAttempts = 2
): Promise<T> {
  let attempt = 0;

  while (attempt <= maxAttempts) {
    try {
      // Some LLMs may return leading text; try to find the first JSON object/array
      const jsonText = extractFirstJson(raw);
      const parsed = JSON.parse(jsonText);
      return schema.parse(parsed);
    } catch {
      if (attempt === maxAttempts) {
        throw new Error('Unable to produce valid JSON');
      }
      // Ask the model (or stub) to repair by returning valid JSON-only
      raw = await repair(raw);
      attempt++;
    }
  }
  // Should never get here
  throw new Error('validateAndRepair: exhausted attempts');
}

/** Extracts the first top-level JSON object/array from a string (defensive) */
function extractFirstJson(s: string): string {
  const iObj = s.indexOf('{');
  const iArr = s.indexOf('[');
  const i = (iObj === -1) ? iArr : (iArr === -1 ? iObj : Math.min(iObj, iArr));
  return i > -1 ? s.slice(i) : s; // if not found, just return original (will fail and trigger repair)
}