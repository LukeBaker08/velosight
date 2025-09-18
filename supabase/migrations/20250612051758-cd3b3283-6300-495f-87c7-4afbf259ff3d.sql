
-- Add a new column to store analysis sub-type (like gateway type)
ALTER TABLE public.analysis_results 
ADD COLUMN analysis_subtype text;

-- Add a comment to explain the purpose of this column
COMMENT ON COLUMN public.analysis_results.analysis_subtype IS 'Stores the sub-type of analysis, such as the specific gateway type for Gateway Reviews (e.g., "Gate 1 – Business Case")';
