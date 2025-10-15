// src/integrations/supabase/client.ts
// This file is generated, but adapted to use env variables for flexibility.

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// ✅ Read values from environment variables
// Vite only exposes vars prefixed with VITE_
// Ensure you have .env.local for dev and .env.production for prod

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    '❌ Supabase environment variables are missing. Check your .env.local or deployment config.'
  )
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)