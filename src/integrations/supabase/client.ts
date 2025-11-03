// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Universal environment getter: works in both browser (Vite) and Node (tsx)
 */
function getEnv(key: string): string | undefined {
  // ✅ 1. Prefer Vite's build-time injected env (browser)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    /* ignore */
  }

  // ✅ 2. Fallback to process.env (Node/SSR)
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key];
  }

  return undefined;
}

// ✅ Works for both browser (VITE_*) and Node (.env)
const SUPABASE_URL =
  getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const SUPABASE_KEY =
  getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase environment variables missing.');
}

export const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_KEY!);
