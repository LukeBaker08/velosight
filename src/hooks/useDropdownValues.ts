import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches dropdown values for a named category from the
 * `dropdown_categories` / `dropdown_values` tables.
 *
 * Returns an empty array until the DB responds. If the category
 * doesn't exist or has no values, the array stays empty.
 *
 * @param categoryPattern - case-insensitive ILIKE pattern matched against the
 *   category `name` column (e.g. `"%stage%"`, `"%Risk%"`).
 */
export function useDropdownValues(
  categoryPattern: string,
): { values: string[]; isLoading: boolean } {
  const [values, setValues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data: cats, error: catErr } = await supabase
          .from('dropdown_categories')
          .select('id, name')
          .ilike('name', categoryPattern)
          .limit(1);

        if (catErr) {
          console.error(`Error fetching dropdown category "${categoryPattern}":`, catErr);
          return;
        }

        const categoryId = cats?.[0]?.id;
        if (!categoryId) return;

        const { data: rows, error: valErr } = await supabase
          .from('dropdown_values')
          .select('value')
          .eq('category_id', categoryId)
          .order('sort_order', { ascending: true });

        if (valErr) {
          console.error(`Error fetching dropdown values for "${categoryPattern}":`, valErr);
          return;
        }

        if (mounted && rows) {
          setValues(rows.map(r => r.value as string));
        }
      } catch (err) {
        console.warn(`Failed to load dropdown values for "${categoryPattern}"`, err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [categoryPattern]);

  return { values, isLoading };
}
