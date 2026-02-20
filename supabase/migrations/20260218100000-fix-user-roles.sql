-- =====================================================
-- Fix User Roles: Ensure all users have roles
-- =====================================================

-- Step 1: Check if profiles exist for all auth.users
-- Create missing profile records
INSERT INTO public.profiles (id, role)
SELECT
  u.id,
  'contributor' as role  -- Set existing users as contributors
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Step 2: Update any profiles that have NULL roles
UPDATE public.profiles
SET role = 'contributor'
WHERE role IS NULL;

-- Step 3: Ensure the trigger exists and is correct
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to auto-create profile with viewer role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'viewer')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify all users have roles
DO $$
DECLARE
  missing_count integer;
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL;

  SELECT COUNT(*) INTO null_count
  FROM public.profiles
  WHERE role IS NULL;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Users missing profiles: %', missing_count;
  RAISE NOTICE '  - Profiles with null roles: %', null_count;

  IF missing_count > 0 OR null_count > 0 THEN
    RAISE WARNING 'Some users still have issues. Run this migration again.';
  ELSE
    RAISE NOTICE '  ✓ All users have valid roles!';
  END IF;
END $$;

-- Step 5: Display summary
SELECT
  'Summary of user roles:' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN p.role = 'contributor' THEN 1 END) as contributors,
  COUNT(CASE WHEN p.role = 'viewer' THEN 1 END) as viewers,
  COUNT(CASE WHEN p.role IS NULL THEN 1 END) as no_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id;
