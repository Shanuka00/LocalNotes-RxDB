/**
 * Get current timestamp as ISO string
 * 
 * ISO strings:
 * - Compare correctly lexicographically
 * - Serialize cleanly for API requests
 * - Standard format for timestamps
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Get an ISO string for a date N days ago
 * Used for cleanup queries (e.g., find items older than 7 days)
 * 
 * @param days - Number of days to subtract from now (e.g., 7 for 7 days ago)
 * @returns ISO string timestamp for the past date
 */
export function isoMinusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
