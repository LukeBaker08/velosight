-- =====================================================
-- Verify Contributor CRUD Permissions on All Tables
-- =====================================================
-- Run this in Supabase SQL Editor to verify RLS policies
-- =====================================================

-- Helper: Check if RLS is enabled and what policies exist
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'projects', 'analysis_results', 'documents',
    'framework_materials', 'analysis_types', 'webhooks',
    'app_settings', 'prompts', 'dropdown_categories', 'dropdown_values'
  )
ORDER BY tablename;

-- Show all RLS policies for public schema
SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    WHEN cmd = '*' THEN 'All (CRUD)'
  END as permission_type,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'projects', 'analysis_results', 'documents',
    'framework_materials', 'analysis_types', 'webhooks',
    'app_settings', 'prompts', 'dropdown_categories', 'dropdown_values'
  )
ORDER BY tablename, cmd;

-- Summary by table showing what operations contributors can do
SELECT
  tablename,
  string_agg(
    CASE
      WHEN cmd = 'SELECT' THEN 'R'
      WHEN cmd = 'INSERT' THEN 'C'
      WHEN cmd = 'UPDATE' THEN 'U'
      WHEN cmd = 'DELETE' THEN 'D'
      WHEN cmd = '*' THEN 'CRUD'
    END,
    ', ' ORDER BY cmd
  ) as operations
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'projects', 'analysis_results', 'documents',
    'framework_materials', 'analysis_types', 'webhooks',
    'app_settings', 'prompts', 'dropdown_categories', 'dropdown_values'
  )
  AND policyname ILIKE '%contributor%'
GROUP BY tablename
ORDER BY tablename;

-- Check storage bucket policies
SELECT
  bucket_id,
  name as policy_name,
  CASE
    WHEN name ILIKE '%insert%' OR name ILIKE '%upload%' THEN 'Create'
    WHEN name ILIKE '%select%' OR name ILIKE '%view%' THEN 'Read'
    WHEN name ILIKE '%update%' THEN 'Update'
    WHEN name ILIKE '%delete%' THEN 'Delete'
  END as operation
FROM storage.policies
WHERE bucket_id IN ('documents', 'materials')
  AND name ILIKE '%contributor%'
ORDER BY bucket_id, name;
