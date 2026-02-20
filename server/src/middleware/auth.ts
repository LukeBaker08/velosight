/**
 * Supabase JWT authentication middleware for Express.
 * Verifies the JWT token from the Authorization header and attaches
 * the authenticated user to the request object.
 */

import { Request, Response, NextFunction } from 'express';
import { createClient, User } from '@supabase/supabase-js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Lazy initialize Supabase client
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseAdmin) {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url) {
      throw new Error('VITE_SUPABASE_URL environment variable is required');
    }

    // Prefer service role key for server-side auth verification
    // Fall back to anon key if service role not available
    const key = serviceKey || anonKey;
    if (!key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY is required');
    }

    supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdmin;
}

/**
 * Extract JWT token from Authorization header.
 * Supports "Bearer <token>" format.
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Authentication middleware that verifies Supabase JWTs.
 * Rejects requests without valid authentication.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
      return;
    }

    const supabase = getSupabase();

    // Verify the JWT and get user info
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.warn('[Auth] Token verification failed:', error?.message || 'No user returned');
      res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token.',
      });
      return;
    }

    // Attach user to request for use in route handlers
    req.user = data.user;

    // Log authenticated request (without sensitive data)
    console.log(`[Auth] Authenticated request from user: ${data.user.email || data.user.id}`);

    next();
  } catch (error: any) {
    console.error('[Auth] Middleware error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Authentication service error.',
    });
  }
}

/**
 * Optional authentication middleware.
 * Attaches user if token is valid, but allows request to proceed regardless.
 * Useful for endpoints that behave differently for authenticated vs anonymous users.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req.headers.authorization);

    if (token) {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getUser(token);

      if (!error && data.user) {
        req.user = data.user;
      }
    }

    next();
  } catch (error) {
    // Don't fail the request, just proceed without user
    next();
  }
}
