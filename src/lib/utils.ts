import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export commonly used badge helpers for convenience
export {
  getConfidenceBadgeVariant,
  getRatingBadgeVariant,
  extractConfidencePercentage,
} from './badge-helpers';

// Re-export analysis data extraction helpers from common helpers
export {
  extractDCAData,
  extractAnalysisData,
  extractModelUsed,
} from '@/components/reports/common/helpers';
