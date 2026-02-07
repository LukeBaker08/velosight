/**
 * Centralized badge color and variant helpers.
 *
 * Two types of badge coloring:
 * 1. Dropdown-based (stages, risk levels) — use getBadgeColorClasses with DB color
 * 2. Semantic/Analysis-based (confidence, risk ratings from LLM) — use variant helpers
 */

/** Available Tailwind colors for badge styling */
export const BADGE_COLORS = [
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'orange',
  'indigo',
  'gray',
] as const;

export type BadgeColor = typeof BADGE_COLORS[number];

/** Tailwind color name → CSS classes mapping */
const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
};

/**
 * Get Tailwind CSS classes for a color name.
 * Use this for dropdown-based badges where color comes from DB.
 */
export function getBadgeColorClasses(color: string | null | undefined): string {
  if (!color) return '';
  return COLOR_CLASSES[color.toLowerCase()] || '';
}

/**
 * Semantic confidence badge variant (for LLM outputs).
 * Maps strings like "High", "Medium", "Low" to badge variants.
 */
export function getConfidenceBadgeVariant(confidence: string | number | null | undefined): string {
  if (!confidence) return 'outline';
  const str = String(confidence).toLowerCase();
  if (str.includes('high') || str.includes('good') || str.includes('excellent')) return 'confidence-high';
  if (str.includes('medium') || str.includes('satisfactory') || str.includes('moderate')) return 'confidence-medium';
  if (str.includes('low') || str.includes('poor')) return 'confidence-low';
  return 'outline';
}

/**
 * Semantic risk rating badge variant (for LLM outputs).
 * Maps strings like "Critical", "High", "Medium", "Low" to badge variants.
 */
export function getRiskRatingBadgeVariant(risk: string | null | undefined): string {
  if (!risk) return 'outline';
  const str = risk.toLowerCase();
  if (str.includes('critical')) return 'risk-critical';
  if (str.includes('high')) return 'risk-high';
  if (str.includes('medium') || str.includes('moderate')) return 'risk-medium';
  if (str.includes('low')) return 'risk-low';
  return 'outline';
}

/**
 * Analysis status badge variant.
 */
export function getStatusBadgeVariant(status: string | null | undefined): string {
  if (!status) return 'outline';
  if (status === 'final') return 'default';
  return 'secondary';
}

/**
 * Priority badge variant (for recommendations).
 */
export function getPriorityBadgeVariant(priority: string | null | undefined): string {
  if (!priority) return 'outline';
  const str = priority.toLowerCase();
  if (str.includes('high') || str.includes('critical') || str.includes('urgent')) return 'risk-high';
  if (str.includes('medium') || str.includes('moderate')) return 'risk-medium';
  if (str.includes('low')) return 'risk-low';
  return 'outline';
}

/**
 * Assessment rating badge variant (for gateway reviews).
 */
export function getAssessmentRatingBadgeVariant(rating: string | null | undefined): string {
  if (!rating) return 'outline';
  const str = rating.toLowerCase();
  if (str.includes('green') || str.includes('good') || str.includes('on track')) return 'confidence-high';
  if (str.includes('amber') || str.includes('yellow') || str.includes('at risk')) return 'confidence-medium';
  if (str.includes('red') || str.includes('off track') || str.includes('critical')) return 'confidence-low';
  return 'outline';
}

/**
 * Extract confidence percentage from a string or number.
 */
export function extractConfidencePercentage(confidence: string | number | null | undefined): number {
  if (confidence === null || confidence === undefined) return 50;

  if (typeof confidence === 'number') {
    return Math.min(confidence, 100);
  }

  const percentMatch = confidence.match(/(\d+)%/);
  if (percentMatch?.[1]) {
    return parseInt(percentMatch[1], 10);
  }

  const str = confidence.toLowerCase();
  if (str.includes('very high') || str.includes('excellent')) return 95;
  if (str.includes('high') || str.includes('good')) return 80;
  if (str.includes('medium') || str.includes('moderate')) return 60;
  if (str.includes('low')) return 40;
  if (str.includes('very low') || str.includes('poor')) return 20;

  return 50;
}
