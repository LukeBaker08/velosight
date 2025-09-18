
-- Rename the assurance_materials table to framework_materials
ALTER TABLE public.assurance_materials RENAME TO framework_materials;

-- Update any RLS policies to reference the new table name
DROP POLICY IF EXISTS "Authenticated users can view all materials" ON public.framework_materials;
DROP POLICY IF EXISTS "Authenticated users can insert materials" ON public.framework_materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON public.framework_materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON public.framework_materials;

CREATE POLICY "Authenticated users can view all framework materials" 
ON public.framework_materials FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert framework materials" 
ON public.framework_materials FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can update their own framework materials" 
ON public.framework_materials FOR UPDATE 
TO authenticated 
USING (auth.uid() = uploader_id);

CREATE POLICY "Users can delete their own framework materials" 
ON public.framework_materials FOR DELETE 
TO authenticated 
USING (auth.uid() = uploader_id);
