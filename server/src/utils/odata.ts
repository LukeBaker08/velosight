/**
 * OData filter utilities for Azure AI Search.
 * Provides safe escaping to prevent OData filter injection attacks.
 */

/**
 * Escape a string value for use in OData filters.
 * In OData, single quotes are escaped by doubling them.
 *
 * @example
 * escapeODataString("O'Brien") // returns "O''Brien"
 * escapeODataString("normal") // returns "normal"
 */
export function escapeODataString(value: string): string {
  if (!value) return value;
  // Escape single quotes by doubling them
  return value.replace(/'/g, "''");
}

/**
 * Create a safe OData string literal for use in filters.
 * Wraps the escaped value in single quotes.
 *
 * @example
 * odataString("O'Brien") // returns "'O''Brien'"
 * odataString("normal") // returns "'normal'"
 */
export function odataString(value: string): string {
  return `'${escapeODataString(value)}'`;
}

/**
 * Validate that a value is a valid UUID format.
 * This provides defense in depth for ID parameters.
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Build a safe equality filter expression.
 *
 * @example
 * eqFilter("project_id", "abc-123") // returns "project_id eq 'abc-123'"
 * eqFilter("name", "O'Brien") // returns "name eq 'O''Brien'"
 */
export function eqFilter(field: string, value: string): string {
  return `${field} eq ${odataString(value)}`;
}

/**
 * Build a safe AND filter expression from multiple conditions.
 *
 * @example
 * andFilter(["project_id eq 'abc'", "category eq 'context'"])
 * // returns "project_id eq 'abc' and category eq 'context'"
 */
export function andFilter(conditions: string[]): string {
  return conditions.filter(Boolean).join(' and ');
}
