-- Add color column to dropdown_values for dynamic badge styling
-- Stores Tailwind color names (e.g., blue, green, red, purple, orange, indigo, yellow)

ALTER TABLE public.dropdown_values
ADD COLUMN IF NOT EXISTS color text;

COMMENT ON COLUMN public.dropdown_values.color
IS 'Tailwind color name for badge display (e.g., blue, green, red, purple, orange, indigo, yellow)';

-- Seed colors for existing Project Stages
UPDATE public.dropdown_values
SET color = CASE LOWER(value)
  WHEN 'planning' THEN 'blue'
  WHEN 'prioritisation' THEN 'purple'
  WHEN 'contestability' THEN 'orange'
  WHEN 'implementation' THEN 'indigo'
  WHEN 'closure' THEN 'green'
  ELSE NULL
END
WHERE category_id IN (SELECT id FROM public.dropdown_categories WHERE name ILIKE '%stage%');

-- Seed colors for existing Risk Levels
UPDATE public.dropdown_values
SET color = CASE LOWER(value)
  WHEN 'low' THEN 'green'
  WHEN 'medium' THEN 'yellow'
  WHEN 'high' THEN 'red'
  WHEN 'critical' THEN 'red'
  ELSE NULL
END
WHERE category_id IN (SELECT id FROM public.dropdown_categories WHERE name ILIKE '%risk%');
