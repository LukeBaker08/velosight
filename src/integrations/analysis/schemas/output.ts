import { z } from 'zod';

/**
 * Replace this with your real JSON spec later.
 * Keep it minimal for Phase 0 so we can prove the path works.
 */
export const DEFAULT_OUTPUT_SCHEMA = z.object({
  status: z.string(),
  explanation: z.string().optional(),
});

export type DefaultOutput = z.infer<typeof DEFAULT_OUTPUT_SCHEMA>;
