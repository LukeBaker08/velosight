import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ColorMap {
  [value: string]: string | null;
}

/**
 * Fetch value→color mappings for a dropdown category.
 * @param categoryPattern - Pattern to match category name (e.g., 'stage', 'risk')
 */
export function useDropdownColors(categoryPattern: string) {
  const [colors, setColors] = useState<ColorMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: cats, error: catError } = await supabase
        .from('dropdown_categories')
        .select('id')
        .ilike('name', `%${categoryPattern}%`)
        .limit(1);

      if (catError) {
        console.error('Error fetching category:', catError);
        setError(catError.message);
        setIsLoading(false);
        return;
      }

      if (!cats?.[0]) {
        setColors({});
        setIsLoading(false);
        return;
      }

      const { data: values, error: valError } = await supabase
        .from('dropdown_values')
        .select('value, color')
        .eq('category_id', cats[0].id);

      if (valError) {
        console.error('Error fetching values:', valError);
        setError(valError.message);
        setIsLoading(false);
        return;
      }

      const map: ColorMap = {};
      values?.forEach((v: { value: string; color: string | null }) => {
        map[v.value.toLowerCase()] = v.color;
      });
      setColors(map);
    } catch (err: any) {
      console.error('Error in useDropdownColors:', err);
      setError(err.message || 'Failed to fetch colors');
    } finally {
      setIsLoading(false);
    }
  }, [categoryPattern]);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  /**
   * Get the color for a specific value.
   * Returns null if not found or no color set.
   */
  const getColor = useCallback((value: string | null | undefined): string | null => {
    if (!value) return null;
    return colors[value.toLowerCase()] || null;
  }, [colors]);

  return { colors, getColor, isLoading, error, refetch: fetchColors };
}

/**
 * Hook to fetch both stage and risk colors in one call.
 * Convenience wrapper for components that need both.
 */
export function useProjectBadgeColors() {
  const stages = useDropdownColors('stage');
  const risks = useDropdownColors('risk');

  return {
    stageColors: stages.colors,
    riskColors: risks.colors,
    getStageColor: stages.getColor,
    getRiskColor: risks.getColor,
    isLoading: stages.isLoading || risks.isLoading,
  };
}
