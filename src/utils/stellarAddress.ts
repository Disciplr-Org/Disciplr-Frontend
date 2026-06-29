export function isValidStellarAddress(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  if (value.length !== 56) return false;
  
  const prefix = value[0];
  if (prefix !== 'G' && prefix !== 'C') return false;

  const base32Regex = /^[A-Z2-7]+$/;
  return base32Regex.test(value);
}
