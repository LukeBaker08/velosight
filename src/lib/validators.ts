/**
 * Input validation utilities
 */

import { DOCUMENT_CONFIG, PROJECT_STAGES, RISK_LEVELS } from './constants';
import { ValidationError } from './errors';

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain both uppercase and lowercase letters' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true };
};

/**
 * Validate file upload
 */
export const validateFile = (file: File): void => {
  if (!file) {
    throw new ValidationError('No file selected');
  }
  
  if (file.size > DOCUMENT_CONFIG.MAX_FILE_SIZE) {
    throw new ValidationError(`File size must be less than ${DOCUMENT_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !DOCUMENT_CONFIG.ALLOWED_TYPES.includes(extension as any)) {
    throw new ValidationError(`File type not supported. Allowed types: ${DOCUMENT_CONFIG.ALLOWED_TYPES.join(', ')}`);
  }
};

/**
 * Validate project data
 */
export const validateProject = (data: {
  name: string;
  client: string;
  stage?: string;
  riskLevel?: string;
}): void => {
  if (!data.name?.trim()) {
    throw new ValidationError('Project name is required', 'name');
  }
  
  if (!data.client?.trim()) {
    throw new ValidationError('Client name is required', 'client');
  }
  
  if (data.stage && !PROJECT_STAGES.includes(data.stage as any)) {
    throw new ValidationError('Invalid project stage', 'stage');
  }
  
  if (data.riskLevel && !RISK_LEVELS.includes(data.riskLevel as any)) {
    throw new ValidationError('Invalid risk level', 'riskLevel');
  }
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};