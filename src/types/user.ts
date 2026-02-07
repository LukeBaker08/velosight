/**
 * Type definitions for user-related data structures.
 * Mirrors the shape returned by the list-users edge function.
 */

export interface AppUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}
