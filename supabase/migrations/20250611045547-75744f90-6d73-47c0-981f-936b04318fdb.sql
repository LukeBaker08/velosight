
-- Add status field to analysis_results table
ALTER TABLE public.analysis_results 
ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' 
CHECK (status IN ('draft', 'final'));

-- Update existing records to have draft status
UPDATE public.analysis_results SET status = 'draft' WHERE status IS NULL;
