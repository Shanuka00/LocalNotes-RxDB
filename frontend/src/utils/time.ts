export function nowIso(): string {
  // We store timestamps as ISO strings so they compare lexicographically and
  // serialize cleanly for sync payloads.
  return new Date().toISOString();
}
