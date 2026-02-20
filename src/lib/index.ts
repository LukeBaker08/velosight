/**
 * Barrel exports for library utilities.
 */

// Core utilities
export { cn } from './utils';

// Error handling
export { handleError, getErrorMessage, NetworkError, ValidationError } from './errors';

// Validation
export { validateProject, sanitizeInput, isValidUUID } from './validators';

// Project operations
export * from './project-service';

// Badge styling
export {
  getBadgeColorClasses,
  getConfidenceBadgeVariant,
  getRatingBadgeVariant,
  getRiskRatingBadgeVariant,
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
  getAssessmentRatingBadgeVariant,
  extractConfidencePercentage,
  type BadgeVariant,
  type BadgeColor,
} from './badge-helpers';

// Analysis utilities
export { getAnalysisRoute, formatAnalysisType } from './analysis';

// Constants
export * from './constants';

// File operations
export { downloadFile, getFileExtension } from './file-operations';

// Webhooks
export { triggerWebhook } from './webhooks';
