-- =====================================================
-- RBAC System Migration: Two-Role Permission System
-- =====================================================
-- Implements Contributor (full access) and Viewer (read-only) roles
-- Migration Date: 2026-02-18
-- =====================================================

-- =====================================================
-- PART 1: Update Profiles Table and Role System
-- =====================================================

-- Rename existing 'admin' roles to 'contributor'
UPDATE public.profiles
SET role = 'contributor'
WHERE role = 'admin';

-- Add constraint to enforce valid roles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('contributor', 'viewer'));

-- Update the trigger to create new users as 'viewer' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'viewer');
  RETURN new;
END;
$$;

-- =====================================================
-- PART 2: Create Helper Functions
-- =====================================================

-- Function to check if current user is a contributor
CREATE OR REPLACE FUNCTION public.is_contributor()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'contributor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- PART 3: Enable RLS on Unprotected Tables
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Enable RLS on analysis_results table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analysis_results') THEN
    ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on prompts table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompts') THEN
    ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on dropdown tables
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dropdown_categories') THEN
    ALTER TABLE public.dropdown_categories ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dropdown_values') THEN
    ALTER TABLE public.dropdown_values ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- PART 4: Create RLS Policies for Profiles
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Contributors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Contributors can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Contributors can manage profiles" ON public.profiles;

-- All authenticated users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Contributors can view all profiles (for user management)
CREATE POLICY "Contributors can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_contributor());

-- Contributors can update any profile (change roles)
CREATE POLICY "Contributors can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_contributor())
WITH CHECK (public.is_contributor());

-- =====================================================
-- PART 5: Create RLS Policies for Projects
-- =====================================================

DROP POLICY IF EXISTS "Contributors can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;

-- All authenticated users can view projects
CREATE POLICY "Authenticated users can view projects"
ON public.projects FOR SELECT
TO authenticated
USING (true);

-- Contributors can insert projects
CREATE POLICY "Contributors can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (public.is_contributor());

-- Contributors can update projects
CREATE POLICY "Contributors can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (public.is_contributor())
WITH CHECK (public.is_contributor());

-- Contributors can delete projects
CREATE POLICY "Contributors can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (public.is_contributor());

-- =====================================================
-- PART 6: Create RLS Policies for Analysis Results
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analysis_results') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Authenticated users can view analysis results" ON public.analysis_results;
    DROP POLICY IF EXISTS "Contributors can manage analysis results" ON public.analysis_results;

    -- All authenticated users can view analysis results
    EXECUTE 'CREATE POLICY "Authenticated users can view analysis results"
    ON public.analysis_results FOR SELECT
    TO authenticated
    USING (true)';

    -- Contributors can insert analysis results
    EXECUTE 'CREATE POLICY "Contributors can insert analysis results"
    ON public.analysis_results FOR INSERT
    TO authenticated
    WITH CHECK (public.is_contributor())';

    -- Contributors can update analysis results
    EXECUTE 'CREATE POLICY "Contributors can update analysis results"
    ON public.analysis_results FOR UPDATE
    TO authenticated
    USING (public.is_contributor())
    WITH CHECK (public.is_contributor())';

    -- Contributors can delete analysis results
    EXECUTE 'CREATE POLICY "Contributors can delete analysis results"
    ON public.analysis_results FOR DELETE
    TO authenticated
    USING (public.is_contributor())';
  END IF;
END $$;

-- =====================================================
-- PART 7: Create RLS Policies for Prompts
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompts') THEN
    DROP POLICY IF EXISTS "Authenticated users can view prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Contributors can manage prompts" ON public.prompts;

    EXECUTE 'CREATE POLICY "Authenticated users can view prompts"
    ON public.prompts FOR SELECT
    TO authenticated
    USING (true)';

    EXECUTE 'CREATE POLICY "Contributors can insert prompts"
    ON public.prompts FOR INSERT
    TO authenticated
    WITH CHECK (public.is_contributor())';

    EXECUTE 'CREATE POLICY "Contributors can update prompts"
    ON public.prompts FOR UPDATE
    TO authenticated
    USING (public.is_contributor())
    WITH CHECK (public.is_contributor())';

    EXECUTE 'CREATE POLICY "Contributors can delete prompts"
    ON public.prompts FOR DELETE
    TO authenticated
    USING (public.is_contributor())';
  END IF;
END $$;

-- =====================================================
-- PART 8: Create RLS Policies for Dropdown Tables
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dropdown_categories') THEN
    DROP POLICY IF EXISTS "Authenticated users can view dropdown categories" ON public.dropdown_categories;
    DROP POLICY IF EXISTS "Contributors can manage dropdown categories" ON public.dropdown_categories;

    EXECUTE 'CREATE POLICY "Authenticated users can view dropdown categories"
    ON public.dropdown_categories FOR SELECT
    TO authenticated
    USING (true)';

    EXECUTE 'CREATE POLICY "Contributors can manage dropdown categories"
    ON public.dropdown_categories FOR ALL
    TO authenticated
    USING (public.is_contributor())
    WITH CHECK (public.is_contributor())';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dropdown_values') THEN
    DROP POLICY IF EXISTS "Authenticated users can view dropdown values" ON public.dropdown_values;
    DROP POLICY IF EXISTS "Contributors can manage dropdown values" ON public.dropdown_values;

    EXECUTE 'CREATE POLICY "Authenticated users can view dropdown values"
    ON public.dropdown_values FOR SELECT
    TO authenticated
    USING (true)';

    EXECUTE 'CREATE POLICY "Contributors can manage dropdown values"
    ON public.dropdown_values FOR ALL
    TO authenticated
    USING (public.is_contributor())
    WITH CHECK (public.is_contributor())';
  END IF;
END $$;

-- =====================================================
-- PART 9: Update Existing RLS Policies
-- =====================================================

-- Update documents policies
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Contributors can insert documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (public.is_contributor());

CREATE POLICY "Contributors can update documents"
ON public.documents FOR UPDATE
TO authenticated
USING (public.is_contributor())
WITH CHECK (public.is_contributor());

CREATE POLICY "Contributors can delete documents"
ON public.documents FOR DELETE
TO authenticated
USING (public.is_contributor());

-- Update framework_materials policies
DROP POLICY IF EXISTS "Authenticated users can insert framework materials" ON public.framework_materials;
DROP POLICY IF EXISTS "Users can update their own framework materials" ON public.framework_materials;
DROP POLICY IF EXISTS "Users can delete their own framework materials" ON public.framework_materials;

CREATE POLICY "Contributors can insert framework materials"
ON public.framework_materials FOR INSERT
TO authenticated
WITH CHECK (public.is_contributor());

CREATE POLICY "Contributors can update framework materials"
ON public.framework_materials FOR UPDATE
TO authenticated
USING (public.is_contributor())
WITH CHECK (public.is_contributor());

CREATE POLICY "Contributors can delete framework materials"
ON public.framework_materials FOR DELETE
TO authenticated
USING (public.is_contributor());

-- Update app_settings policies
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert settings" ON public.app_settings;

CREATE POLICY "Contributors can update settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING (public.is_contributor())
WITH CHECK (public.is_contributor());

CREATE POLICY "Contributors can insert settings"
ON public.app_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_contributor());

-- Update analysis_types policies
DROP POLICY IF EXISTS "Allow admin users to manage analysis types" ON public.analysis_types;

CREATE POLICY "Contributors can manage analysis types"
ON public.analysis_types FOR ALL
TO authenticated
USING (public.is_contributor())
WITH CHECK (public.is_contributor());

-- Update webhooks policies
DROP POLICY IF EXISTS "Admin users can manage webhooks" ON public.webhooks;

CREATE POLICY "Contributors can manage webhooks"
ON public.webhooks FOR ALL
TO authenticated
USING (public.is_contributor())
WITH CHECK (public.is_contributor());

-- =====================================================
-- PART 10: Update Storage Bucket Policies
-- =====================================================

-- Update documents bucket policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents in storage" ON storage.objects;

CREATE POLICY "Contributors can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND public.is_contributor());

CREATE POLICY "Contributors can update documents in storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND public.is_contributor())
WITH CHECK (bucket_id = 'documents' AND public.is_contributor());

CREATE POLICY "Contributors can delete documents in storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND public.is_contributor());

-- Update materials bucket policies
DROP POLICY IF EXISTS "Authenticated users can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own material files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own material files" ON storage.objects;

CREATE POLICY "Contributors can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials' AND public.is_contributor());

CREATE POLICY "Contributors can update materials in storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'materials' AND public.is_contributor())
WITH CHECK (bucket_id = 'materials' AND public.is_contributor());

CREATE POLICY "Contributors can delete materials in storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materials' AND public.is_contributor());

-- =====================================================
-- Migration Complete
-- =====================================================
-- Summary:
-- - Renamed 'admin' role to 'contributor'
-- - New users default to 'viewer' role
-- - Enabled RLS on all unprotected tables
-- - Contributors have full CRUD access
-- - Viewers have read-only access
-- - Storage buckets restricted to contributors for uploads/modifications
-- =====================================================
