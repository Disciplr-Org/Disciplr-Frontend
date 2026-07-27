export function isValidStellarAddress(value: string): boolean {
  const trimmed = value?.trim?.() ?? value;
  if (!trimmed || typeof trimmed !== 'string') return false;
  if (trimmed.length !== 56) return false;

  const prefix = trimmed[0];
  if (prefix !== 'G' && prefix !== 'C') return false;

  const base32Regex = /^[A-Z2-7]+$/;
  return base32Regex.test(trimmed);
}
