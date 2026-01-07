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
