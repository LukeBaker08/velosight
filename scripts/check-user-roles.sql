-- Check current state of user roles
-- Run this in Supabase SQL Editor before and after the migration

SELECT
  u.email,
  p.role,
  CASE
    WHEN p.id IS NULL THEN 'Missing Profile ❌'
    WHEN p.role IS NULL THEN 'Null Role ⚠️'
    ELSE 'OK ✓'
  END as status,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
