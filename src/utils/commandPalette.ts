export function fuzzyMatch(query: string, value: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  let queryIndex = 0;
  const normalizedValue = value.toLowerCase();

  for (const char of normalizedValue) {
    if (char === normalizedQuery[queryIndex]) {
      queryIndex += 1;
      if (queryIndex === normalizedQuery.length) return true;
    }
  }

  return false;
}
